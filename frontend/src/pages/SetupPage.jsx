import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const RELATION_TYPES = [
  'Father', 'Mother', 'Husband', 'Wife', 'Son', 'Daughter',
  'Brother', 'Sister', 'Grandfather', 'Grandmother', 'In-law', 'Other'
];

const EMPTY_DRAFT = { name: '', relation: 'Father', email: '' };

export default function SetupPage() {
  const [name, setName] = useState('');
  const [relatives, setRelatives] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingIndex, setEditingIndex] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');

  const { refreshFamilies, setActiveFamilyId } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setInviteCode(code);
  }, [searchParams]);

  const resetDraft = () => {
    setDraft(EMPTY_DRAFT);
    setEditingIndex(null);
  };

  const addOrUpdateRelative = () => {
    if (!draft.name.trim()) return;

    const relative = {
      name: draft.name.trim(),
      relation: draft.relation,
      email: draft.email.trim()
    };

    if (editingIndex !== null) {
      setRelatives(prev =>
        prev.map((item, i) => i === editingIndex ? relative : item)
      );
    } else {
      setRelatives(prev => [...prev, relative]);
    }

    resetDraft();
  };

  const editRelative = (index) => {
    setDraft({
      name: relatives[index].name || '',
      relation: relatives[index].relation || 'Father',
      email: relatives[index].email || ''
    });
    setEditingIndex(index);
  };

  const removeRelative = (index) => {
    setRelatives(prev => prev.filter((_, i) => i !== index));

    if (editingIndex === index) {
      resetDraft();
    } else if (editingIndex > index) {
      setEditingIndex(prev => prev - 1);
    }
  };

  const createFamily = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const family = await api.createFamily({ name, relatives });
      await refreshFamilies();
      setActiveFamilyId(family._id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const joinFamily = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const family = await api.joinFamily({ inviteCode });
      await refreshFamilies();
      setActiveFamilyId(family._id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="content" style={{ maxWidth: 520, margin: '60px auto' }}>
      <h1>Set up your family space</h1>

      <p style={{ color: 'var(--ink-soft)', margin: '8px 0 28px' }}>
        Create a new one, or join a sibling's using their invite code.
      </p>

      {/* Create Family */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: 24,
          marginBottom: 20
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Create a new family</h3>

        <form onSubmit={createFamily}>
          <div className="field">
            <label>Family name</label>
            <input
              placeholder="e.g. Mom & Dad's care"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16
            }}
          >
            <label style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 500 }}>
              Add family members (Father, Mother, Sister, Wife, Son, Daughter — add as many as you need)
            </label>

            {relatives.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
                {relatives.map((r, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: 'var(--surface)',
                      border: '1px solid var(--line)',
                      borderRadius: 6,
                      marginBottom: 6,
                      fontSize: 14,
                      gap: 10
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      {r.name}
                      <span className="muted">
                        {' '}— {r.relation}{r.email && ` · ${r.email}`}
                      </span>
                    </span>

                    <span style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-ghost small"
                        onClick={() => editRelative(i)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-ghost small"
                        onClick={() => removeRelative(i)}
                      >
                        Remove
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Name + Relation */}
            <div style={{
              display: 'flex',
              gap: 8,
              marginTop: relatives.length ? 0 : 12
            }}>
              <input
                placeholder="Name"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid var(--line)',
                  borderRadius: 7,
                  padding: '9px 11px'
                }}
              />

              <select
                value={draft.relation}
                onChange={e => setDraft({ ...draft, relation: e.target.value })}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 7,
                  padding: '9px 11px'
                }}
              >
                {RELATION_TYPES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Email + Add */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="email"
                placeholder="Email (optional — needed if they'll handle care items)"
                value={draft.email}
                onChange={e => setDraft({ ...draft, email: e.target.value })}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid var(--line)',
                  borderRadius: 7,
                  padding: '9px 11px'
                }}
              />

              <button
                type="button"
                className="btn btn-ghost small"
                onClick={addOrUpdateRelative}
              >
                {editingIndex !== null ? 'Update' : '+ Add'}
              </button>
            </div>

            {editingIndex !== null && (
              <button
                type="button"
                className="btn btn-ghost small"
                onClick={resetDraft}
                style={{ marginTop: 8 }}
              >
                Cancel edit
              </button>
            )}
          </div>

          <button className="btn btn-primary" type="submit">
            Create family
          </button>
        </form>
      </div>

      {/* Join Family */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius)',
          padding: 24
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Join with an invite code</h3>

        <form onSubmit={joinFamily}>
          <div className="field">
            <label>Invite code</label>
            <input
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-ghost" type="submit">
            Join family
          </button>
        </form>
      </div>

      {error && (
        <p style={{ color: 'var(--rust)', marginTop: 16 }}>
          {error}
        </p>
      )}
    </div>
  );
}
