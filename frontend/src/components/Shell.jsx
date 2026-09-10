import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Shell.css';

const NAV_ITEMS = [
  { to: '/', label: 'This week', icon: '◐', end: true },
  { to: '/care', label: 'Care', icon: '♥' },
  { to: '/money', label: 'Money', icon: '₹' },
  { to: '/family', label: 'Family & tasks', icon: '◈' }
];

export default function Shell() {
  const { user, logout, families, activeFamilyId, setActiveFamilyId, activeFamily } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    if (!activeFamily) return;
    navigator.clipboard.writeText(activeFamily.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">Homebase</span>
        </div>

        <div className="family-switcher">
          <label>Family</label>
          {families.length > 0 ? (
            <select
              value={activeFamilyId || ''}
              onChange={(e) => setActiveFamilyId(e.target.value)}
            >
              {families.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          ) : (
            <button className="btn btn-ghost small" onClick={() => navigate('/setup')}>
              + Create a family
            </button>
          )}

          {activeFamily && (
            <div className="quick-invite">
              <div className="invite-code-chip" onClick={copyInvite} title="Click to copy">
                <span className="muted-light">Invite code</span>
                <code>{activeFamily.inviteCode}</code>
                {copied && <span className="copied-tag">Copied</span>}
              </div>
              <button className="btn btn-ghost small" onClick={() => navigate('/setup')}>
                + Join another family
              </button>
            </div>
          )}
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="user-chip" onClick={() => navigate('/profile')}>
            <span className="user-name">{user?.name}</span>
            <span className="muted-light">View profile</span>
          </button>
          <button className="btn btn-ghost small" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        {activeFamily ? (
          <Outlet context={{ activeFamily }} />
        ) : (
          <div className="empty-state">
            <h2>No family set up yet</h2>
            <p>Create a family space to start tracking care, money, and tasks together.</p>
            <button className="btn btn-primary" onClick={() => navigate('/setup')}>
              Create a family
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
