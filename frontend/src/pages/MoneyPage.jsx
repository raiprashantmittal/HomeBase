import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './ListPages.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMoney(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

const CATEGORY_LABELS = {
  education_loan: 'Education loan',
  medical: 'Medical',
  home_help: 'Home help',
  travel: 'Travel',
  other: 'Other'
};

export default function MoneyPage() {
  const { activeFamily } = useOutletContext();
  const { bumpDataVersion } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: 'education_loan',
    title: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly'
  });

  const load = () => {
    api.getLoanItems(activeFamily._id).then(setItems).catch((e) => setError(e.message));
    api.getLoanSummary(activeFamily._id).then(setSummary).catch(() => {});
  };

  useEffect(() => {
    if (activeFamily) load();
  }, [activeFamily]);

  const submit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    await api.createLoanItem({ ...form, amount: Number(form.amount), familyId: activeFamily._id });
    setForm({ category: 'education_loan', title: '', amount: '', dueDate: '', frequency: 'monthly' });
    setShowForm(false);
    load();
    bumpDataVersion(); // ADD THIS LINE
  } catch (err) {
    setError(err.message);
  }
};

const markPaid = async (id) => {
  await api.updateLoanItem(id, { status: 'paid' });
  load();
  bumpDataVersion(); // ADD THIS LINE
};

  return (
    <div className="list-page">
      <header className="list-header">
        <div>
          <h1>Money</h1>
          <p className="dash-sub">Education loan EMIs and parent-care costs, in one ledger</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add expense'}
        </button>
      </header>

      {summary && (
        <div className="summary-bar">
          <div className="summary-total">
            <span className="muted">Monthly total</span>
            <span className="big-number small">{formatMoney(summary.totalMonthly)}</span>
          </div>
          <div className="summary-breakdown">
            {summary.byCategory.map((c) => (
              <div key={c._id} className="summary-chip">
                <span>{CATEGORY_LABELS[c._id] || c._id}</span>
                <strong>{formatMoney(c.total)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <form className="inline-form" onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="one_time">One-time</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Title</label>
            <input
              placeholder="e.g. Education loan EMI"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label>Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Next due date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </form>
      )}

      {error && <p className="auth-error">{error}</p>}

      <div className="record-list">
        {items.length === 0 ? (
          <p className="muted">No expenses tracked yet.</p>
        ) : (
          items.map((item) => (
            <div key={item._id} className={`record-row ${item.status === 'paid' ? 'done' : ''}`}>
              <div className="record-main">
                <span className="record-date">{formatDate(item.dueDate)}</span>
                <span className="tag money-tag">{CATEGORY_LABELS[item.category]}</span>
                <span className="record-title">{item.title}</span>
                <span className="record-amount">{formatMoney(item.amount)}</span>
              </div>
              {item.status !== 'paid' && (
                <button className="btn btn-ghost small" onClick={() => markPaid(item._id)}>
                  Mark paid
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
