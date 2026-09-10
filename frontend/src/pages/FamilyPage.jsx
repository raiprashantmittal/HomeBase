import { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './ListPages.css';

const RELATION_TYPES = [
  'Father', 'Mother', 'Husband', 'Wife', 'Son', 'Daughter',
  'Brother', 'Sister', 'Grandfather', 'Grandmother', 'In-law', 'Other'
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function FamilyPage() {
  const { activeFamily } = useOutletContext();
  const { refreshFamilies, setActiveFamilyId } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [relatives, setRelatives] = useState(activeFamily.relatives || []);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showRelativeForm, setShowRelativeForm] = useState(false);
  const [relativeDraft, setRelativeDraft] = useState({ name: '', relation: 'Father' });
  const [editingRelativeId, setEditingRelativeId] = useState(null);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const [remindingId, setRemindingId] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', assignedTo: '', reminderAt: '' });

  const isPrimaryEarner = activeFamily.myRole === 'primary_earner';

  const load = () => {
    api.getTasks(activeFamily._id).then(setTasks).catch((e) => setError(e.message));
    api.getFamilyMembers(activeFamily._id).then(setMembers).catch(() => {});
  };

  useEffect(() => {
    if (activeFamily) load();
    setRelatives(activeFamily.relatives || []);
  }, [activeFamily]);

  const submitRelative = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let family;
      if (editingRelativeId) {
        family = await api.updateRelative(activeFamily._id, editingRelativeId, relativeDraft);
      } else {
        family = await api.addRelative(activeFamily._id, relativeDraft);
      }
      setRelatives(family.relatives);
      setRelativeDraft({ name: '', relation: 'Father' });
      setEditingRelativeId(null);
      setShowRelativeForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const editRelative = (r) => {
    setRelativeDraft({ name: r.name, relation: r.relation });
    setEditingRelativeId(r._id);
    setShowRelativeForm(true);
  };

  const removeRelative = async (relativeId) => {
    try {
      const family = await api.removeRelative(activeFamily._id, relativeId);
      setRelatives(family.relatives);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createTask({ ...taskForm, familyId: activeFamily._id });
      setTaskForm({ title: '', dueDate: '', assignedTo: '', reminderAt: '' });
      setShowTaskForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const markDone = async (id) => {
    await api.updateTask(id, { status: 'done' });
    load();
  };

  const sendReminder = async (id) => {
    setRemindingId(id);
    try {
      await api.remindTask(id);
    } catch (err) {
      setError(err.message);
    } finally {
      setRemindingId(null);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(activeFamily.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submitInvite = async (e) => {
    e.preventDefault();
    setInviteStatus('');
    setError('');
    try {
      const res = await api.inviteToFamily(activeFamily._id, { email: inviteEmail });
      setInviteStatus(
        res.emailSent
          ? `Invite sent to ${inviteEmail}.`
          : `Couldn't send an email (email isn't configured) — share the code below instead.`
      );
      setInviteEmail('');
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteFamily = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteFamily(activeFamily._id);
      setActiveFamilyId(null);
      await refreshFamilies();
      navigate('/setup');
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="list-page">
      <header className="list-header">
        <div>
          <h1>Family & tasks</h1>
          <p className="dash-sub">Who's handling what — and who to add next</p>
        </div>
      </header>

      <section className="dash-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 10 }}>Add a family member</h3>
        <p className="muted" style={{ marginBottom: 12 }}>Invite by email, or share the code directly.</p>

        <div className="invite-row" style={{ marginBottom: 14 }}>
          <code>{activeFamily.inviteCode}</code>
          <button className="btn btn-ghost small" onClick={copyInvite}>{copied ? 'Copied' : 'Copy code'}</button>
          <button className="btn btn-ghost small" onClick={() => setShowInviteForm((s) => !s)}>
            {showInviteForm ? 'Cancel' : 'Invite by email'}
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={submitInvite} style={{ maxWidth: 340 }}>
            <div className="field">
              <label>Email address</label>
              <input type="email" placeholder="sibling@example.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary small" type="submit">Send invite</button>
          </form>
        )}
        {inviteStatus && <p className="auth-success" style={{ marginTop: 10 }}>{inviteStatus}</p>}
      </section>

      <section className="dash-card" style={{ marginBottom: 20 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3>Family members (Father, Mother, Sister, Wife, etc.)</h3>
          <button
            className="btn btn-ghost small"
            onClick={() => {
              setShowRelativeForm((s) => !s);
              setEditingRelativeId(null);
              setRelativeDraft({ name: '', relation: 'Father' });
            }}
          >
            {showRelativeForm ? 'Cancel' : '+ Add member'}
          </button>
        </header>

        {showRelativeForm && (
          <form onSubmit={submitRelative} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <input
              placeholder="Name"
              value={relativeDraft.name}
              onChange={(e) => setRelativeDraft({ ...relativeDraft, name: e.target.value })}
              style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 7, padding: '9px 11px' }}
              required
            />
            <select
              value={relativeDraft.relation}
              onChange={(e) => setRelativeDraft({ ...relativeDraft, relation: e.target.value })}
              style={{ border: '1px solid var(--line)', borderRadius: 7, padding: '9px 11px' }}
            >
              {RELATION_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn btn-primary small" type="submit">{editingRelativeId ? 'Update' : 'Add'}</button>
          </form>
        )}

        {relatives.length > 0 ? (
          <ul className="parent-list">
            {relatives.map((r) => (
              <li key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{r.name} <span className="muted">— {r.relation}</span></span>
                <span style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost small" onClick={() => editRelative(r)}>Edit</button>
                  <button className="btn btn-ghost small" onClick={() => removeRelative(r._id)}>Remove</button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No family members added yet.</p>
        )}
      </section>

      <section className="dash-card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 10 }}>App users in this family (siblings/spouse who've signed up)</h3>
        <ul className="parent-list">
          {members.map((m) => (
            <li key={m.userId}>{m.name} <span className="muted">— {m.role.replace('_', ' ')}</span></li>
          ))}
        </ul>
      </section>

      <header className="list-header" style={{ marginBottom: 14 }}>
        <h2>Tasks</h2>
        <button className="btn btn-primary" onClick={() => setShowTaskForm((s) => !s)}>
          {showTaskForm ? 'Cancel' : '+ Add task'}
        </button>
      </header>

      {showTaskForm && (
        <form className="inline-form" onSubmit={submitTask}>
          <div className="field">
            <label>Task</label>
            <input
              placeholder="e.g. Book Dad's cardiology follow-up"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Assign to</label>
              <select value={taskForm.assignedTo} onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map((m) => <option key={m.userId} value={m.userId}>{m.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Due date (optional)</label>
              <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Send a reminder email at (optional)</label>
            <input type="datetime-local" value={taskForm.reminderAt} onChange={(e) => setTaskForm({ ...taskForm, reminderAt: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      )}

      {error && <p className="auth-error">{error}</p>}

      <div className="record-list">
        {tasks.length === 0 ? (
          <p className="muted">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className={`record-row ${task.status === 'done' ? 'done' : ''}`}>
              <div className="record-main">
                <span className="record-date">{formatDate(task.dueDate)}</span>
                <span className="record-title">{task.title}</span>
                <span className="muted">{task.assignedTo?.name || 'Unassigned'}</span>
                {task.reminderAt && !task.reminderSent && <span className="tag money-tag">reminder set</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {task.status !== 'done' && (
                  <>
                    <button className="btn btn-ghost small" onClick={() => sendReminder(task._id)} disabled={remindingId === task._id}>
                      {remindingId === task._id ? 'Sending…' : 'Remind'}
                    </button>
                    <button className="btn btn-ghost small" onClick={() => markDone(task._id)}>Mark done</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isPrimaryEarner && (
        <section className="dash-card danger-zone" style={{ marginTop: 32 }}>
          <h3 style={{ marginBottom: 6 }}>Danger zone</h3>
          <p className="muted" style={{ marginBottom: 14 }}>
            Permanently delete this family, including all care items, expenses, and tasks. This can't be undone.
          </p>
          {!confirmingDelete ? (
            <button className="btn btn-ghost small danger-btn" onClick={() => setConfirmingDelete(true)}>Delete this family</button>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 14 }}>Are you sure? This deletes everything.</span>
              <button className="btn btn-primary small danger-confirm" onClick={deleteFamily} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
              <button className="btn btn-ghost small" onClick={() => setConfirmingDelete(false)}>Cancel</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}