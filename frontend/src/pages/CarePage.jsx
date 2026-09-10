import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './ListPages.css';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
  });
}

export default function CarePage() {
  const { activeFamily } = useOutletContext();
  const { bumpDataVersion } = useAuth();
  const [items, setItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    relativeId: '', type: 'appointment', title: '', details: '', scheduledDate: '', handlerEmail: ''
  });

  const relatives = activeFamily.relatives || [];

  const handlers = useMemo(() => {
    const list = [
      ...members.map((m) => ({ name: m.name, email: m.email })),
      ...relatives.filter((r) => r.email).map((r) => ({ name: r.name, email: r.email }))
    ];
    const seen = new Set();
    return list.filter((h) => {
      if (seen.has(h.email)) return false;
      seen.add(h.email);
      return true;
    });
  }, [members, relatives]);

  const load = () => {
    api.getCareItems(activeFamily._id).then(setItems).catch((e) => setError(e.message));
    api.getFamilyMembers(activeFamily._id).then(setMembers).catch(() => {});
  };

  useEffect(() => {
    if (activeFamily) load();
  }, [activeFamily]);

  const resetForm = () =>
    setForm({ relativeId: '', type: 'appointment', title: '', details: '', scheduledDate: '', handlerEmail: '' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const handler = handlers.find((h) => h.email === form.handlerEmail);
      await api.createCareItem({
        familyId: activeFamily._id,
        relativeId: form.relativeId,
        type: form.type,
        title: form.title,
        details: form.details,
        scheduledDate: form.scheduledDate,
        assignedTo: handler ? { name: handler.name, email: handler.email } : undefined
      });
      resetForm();
      setShowForm(false);
      load();
      bumpDataVersion();
    } catch (err) {
      setError(err.message);
    }
  };

  const markDone = async (id) => {
    await api.updateCareItem(id, { status: 'done' });
    load();
    bumpDataVersion();
  };

  return (
    <div className="list-page">
      <header className="list-header">
        <div>
          <h1>Care</h1>
          <p className="dash-sub">Medications, appointments, and status notes for your family</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add care item'}
        </button>
      </header>

      {showForm && (
        <form className="inline-form" onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label>Family member</label>
              <select value={form.relativeId} onChange={(e) => setForm({ ...form, relativeId: e.target.value })} required>
                <option value="">Select…</option>
                {relatives.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="appointment">Appointment</option>
                <option value="medication">Medication</option>
                <option value="checkup">Checkup</option>
                <option value="status_note">Status note</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Title</label>
            <input
              placeholder="e.g. Cardiology follow-up"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Date & time</label>
              <input
                type="datetime-local"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Who's handling it (optional)</label>
              <select value={form.handlerEmail} onChange={(e) => setForm({ ...form, handlerEmail: e.target.value })}>
                <option value="">Unassigned</option>
                {handlers.map((h) => <option key={h.email} value={h.email}>{h.name}</option>)}
              </select>
              {handlers.length === 0 && (
                <p className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                  No one to assign yet — add an email when adding a family member on the Family page.
                </p>
              )}
            </div>
          </div>

          {form.scheduledDate && (
            <p className="muted" style={{ marginBottom: 14 }}>
              A reminder email will go out ~30 minutes before this, to whoever it's assigned to
              and to you, since you're adding it.
            </p>
          )}

          <div className="field">
            <label>Details (optional)</label>
            <input value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      )}

      {error && <p className="auth-error">{error}</p>}

      {relatives.length === 0 && (
        <p className="muted" style={{ marginBottom: 16 }}>
          No family members added to this family yet — add one from the Family page first.
        </p>
      )}

      <div className="record-list">
        {items.length === 0 ? (
          <p className="muted">No care items yet.</p>
        ) : (
          items.map((item) => (
            <div key={item._id} className={`record-row ${item.status === 'done' ? 'done' : ''}`}>
              <div className="record-main">
                <span className="record-date">{formatDateTime(item.scheduledDate)}</span>
                <span className="tag care-tag">{item.type.replace('_', ' ')}</span>
                <span className="record-title">{item.title}</span>
                {item.assignedTo?.name && <span className="muted">— {item.assignedTo.name}</span>}
                {item.scheduledDate && !item.reminderSent && (
                  <span className="tag money-tag">reminder 30 min before</span>
                )}
              </div>
              {item.status !== 'done' && (
                <button className="btn btn-ghost small" onClick={() => markDone(item._id)}>Mark done</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}