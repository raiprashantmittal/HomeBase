import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Load profile
  useEffect(() => {
    api.getProfile().then((p) => {
      setProfile(p);

      setForm({
        name: p.name,
        email: p.email,
        phone: p.phone || '',
        currentPassword: '',
        newPassword: ''
      });
    });
  }, []);

  // Update form field
  const update = (field) => (e) => {
    setForm({
      ...form,
      [field]: e.target.value
    });
  };

  // Start editing
  const startEditing = () => {
    setEditing(true);
    setSuccess('');
    setError('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditing(false);

    setForm({
      ...form,
      currentPassword: '',
      newPassword: ''
    });

    setError('');
  };

  // Save profile
  const save = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        currentPassword: form.currentPassword,
        name: form.name,
        email: form.email,
        phone: form.phone
      };

      if (form.newPassword) {
        payload.newPassword = form.newPassword;
      }

      const updated = await api.updateProfile(payload);

      // Update local profile state
      setProfile(updated);

      // Update AuthContext user state immediately
      updateUser({
        name: updated.name,
        email: updated.email,
        phone: updated.phone
      });

      // Clear password fields
      setForm({
        ...form,
        currentPassword: '',
        newPassword: ''
      });

      setEditing(false);
      setSuccess('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async (e) => {
    e.preventDefault();

    setDeleteError('');

    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Type DELETE (all caps) to confirm.');
      return;
    }

    setDeleting(true);

    try {
      await api.deleteAccount({
        currentPassword: deletePassword
      });

      logout();
      navigate('/login');
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  // Loading state
  if (!profile) {
    return (
      <p
        className="muted"
        style={{ padding: 40 }}
      >
        Loading…
      </p>
    );
  }

  return (
    <div
      className="content"
      style={{
        maxWidth: 480,
        margin: '50px auto'
      }}
    >
      {/* Back button */}
      <button
        className="btn btn-ghost small"
        onClick={() => navigate('/')}
        style={{ marginBottom: 20 }}
      >
        ← Back to dashboard
      </button>

      {/* ============================= */}
      {/* PROFILE CARD */}
      {/* ============================= */}

      <div className="profile-card">
        <h1>Your profile</h1>

        {!editing ? (
          <>
            {/* NAME */}
            <div className="profile-row">
              <span className="muted">
                Name
              </span>

              <span>
                {profile.name}
              </span>
            </div>

            {/* EMAIL */}
            <div className="profile-row">
              <span className="muted">
                Email
              </span>

              <span>
                {profile.email}
              </span>
            </div>

            {/* PHONE */}
            <div className="profile-row">
              <span className="muted">
                Phone
              </span>

              <span>
                {profile.phone || '—'}
              </span>
            </div>

            {/* SUCCESS MESSAGE */}
            {success && (
              <p
                className="auth-success"
                style={{ marginTop: 16 }}
              >
                {success}
              </p>
            )}

            {/* EDIT BUTTON */}
            <button
              className="btn btn-primary"
              onClick={startEditing}
              style={{ marginTop: 20 }}
            >
              Edit profile
            </button>
          </>
        ) : (
          /* ============================= */
          /* EDIT PROFILE FORM */
          /* ============================= */

          <form
            onSubmit={save}
            style={{ marginTop: 20 }}
          >
            {/* NAME */}
            <div className="field">
              <label>
                Name
              </label>

              <input
                value={form.name}
                onChange={update('name')}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="field">
              <label>
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                required
              />
            </div>

            {/* PHONE */}
            <div className="field">
              <label>
                Phone
              </label>

              <input
                value={form.phone}
                onChange={update('phone')}
              />
            </div>

            {/* NEW PASSWORD */}
            <div className="field">
              <label>
                New password (optional — leave blank to keep current)
              </label>

              <input
                type="password"
                value={form.newPassword}
                onChange={update('newPassword')}
              />
            </div>

            {/* CURRENT PASSWORD */}
            <div className="password-confirm">
              <div
                className="field"
                style={{ marginBottom: 0 }}
              >
                <label>
                  Current password (required to save any change)
                </label>

                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={update('currentPassword')}
                  required
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <p
                className="auth-error"
                style={{ marginTop: 12 }}
              >
                {error}
              </p>
            )}

            {/* BUTTONS */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 18
              }}
            >
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Saving…'
                  : 'Save changes'}
              </button>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ============================= */}
      {/* DELETE ACCOUNT */}
      {/* ============================= */}

      <div
        className="profile-card danger-zone"
        style={{ marginTop: 20 }}
      >
        <h3 style={{ marginBottom: 6 }}>
          Delete account
        </h3>

        <p
          className="muted"
          style={{ marginBottom: 14 }}
        >
          This permanently deletes your account. If you're the sole
          owner of a family, that family and all its data are deleted
          too. If others share it with you, ownership passes to one
          of them.
        </p>

        {!showDeleteForm ? (
          <button
            className="btn btn-ghost small danger-btn"
            onClick={() => setShowDeleteForm(true)}
          >
            Delete my account
          </button>
        ) : (
          <form onSubmit={deleteAccount}>
            {/* DELETE PASSWORD */}
            <div className="field">
              <label>
                Current password
              </label>

              <input
                type="password"
                value={deletePassword}
                onChange={(e) =>
                  setDeletePassword(e.target.value)
                }
                required
              />
            </div>

            {/* DELETE CONFIRMATION */}
            <div className="field">
              <label>
                Type DELETE to confirm
              </label>

              <input
                value={deleteConfirmText}
                onChange={(e) =>
                  setDeleteConfirmText(e.target.value)
                }
                required
              />
            </div>

            {/* DELETE ERROR */}
            {deleteError && (
              <p className="auth-error">
                {deleteError}
              </p>
            )}

            {/* DELETE BUTTONS */}
            <div
              style={{
                display: 'flex',
                gap: 10
              }}
            >
              <button
                className="btn btn-primary danger-confirm"
                type="submit"
                disabled={deleting}
              >
                {deleting
                  ? 'Deleting…'
                  : 'Permanently delete my account'}
              </button>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setShowDeleteForm(false);
                  setDeleteError('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
