import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMoney(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function DashboardPage() {
  const { activeFamily } = useOutletContext();
  const { dataVersion } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeFamily) return;
    api
      .getDashboard(activeFamily._id)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [activeFamily, dataVersion]);

  if (error) return <p className="auth-error">{error}</p>;
  if (!data) return <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>;

  const { dueThisWeek, openTasks, monthlyOutflow } = data;
  const hasNothingDue = dueThisWeek.care.length === 0 && dueThisWeek.loans.length === 0;

  return (
    <div className="dashboard">
      <header className="dash-header">
        <h1>This week</h1>
        <p className="dash-sub">{activeFamily.name}</p>
      </header>

      <div className="dash-grid">
        <section className="dash-card due-card">
          <h2>Due this week</h2>
          {hasNothingDue ? (
            <p className="muted">Nothing due in the next 7 days.</p>
          ) : (
            <ul className="due-list">
              {dueThisWeek.care.map((item) => (
                <li key={item._id} className="due-row">
                  <span className="due-date">{formatDate(item.scheduledDate)}</span>
                  <span className="due-type care-tag">care</span>
                  <span className="due-title">{item.title}</span>
                </li>
              ))}
              {dueThisWeek.loans.map((item) => (
                <li key={item._id} className="due-row">
                  <span className="due-date">{formatDate(item.dueDate)}</span>
                  <span className="due-type money-tag">money</span>
                  <span className="due-title">{item.title}</span>
                  <span className="due-amount">{formatMoney(item.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="dash-card money-card">
          <h2>Monthly outflow</h2>
          <p className="big-number">{formatMoney(monthlyOutflow)}</p>
          <p className="muted">Loan EMIs + recurring care costs, combined</p>
        </section>

        <section className="dash-card tasks-card">
          <h2>Open tasks</h2>
          {openTasks.length === 0 ? (
            <p className="muted">All caught up — no open tasks.</p>
          ) : (
            <ul className="task-list">
              {openTasks.map((task) => (
                <li key={task._id} className="task-row">
                  <span className="task-title">{task.title}</span>
                  <span className="task-owner">{task.assignedTo?.name || 'Unassigned'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}