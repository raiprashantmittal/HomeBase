import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [mode, setMode] = useState('old_password'); // 'old_password' | 'otp'
  const [otpStep, setOtpStep] = useState('request'); // 'request' | 'verify'
  const [form, setForm] = useState({ email: '', oldPassword: '', otp: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const resetWithOldPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.resetWithOldPassword({
        email: form.email,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.requestOtp({ email: form.email });
      setMessage(res.message);
      setOtpStep('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.resetWithOtp({
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword
      });
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Reset your password</h1>
        <p className="auth-tagline">Choose whichever's easier — you don't need both.</p>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'old_password' ? 'active' : ''}
            onClick={() => {
              setMode('old_password');
              setMessage('');
              setError('');
            }}
          >
            I know my old password
          </button>
          <button
            type="button"
            className={mode === 'otp' ? 'active' : ''}
            onClick={() => {
              setMode('otp');
              setMessage('');
              setError('');
            }}
          >
            Email me a code
          </button>
        </div>

        {mode === 'old_password' && (
          <form onSubmit={resetWithOldPassword}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="field">
              <label>Old password</label>
              <input
                type="password"
                value={form.oldPassword}
                onChange={update('oldPassword')}
                required
              />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={update('newPassword')}
                required
              />
            </div>
            {message && <p className="auth-success">{message}</p>}
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Please wait…' : 'Reset password'}
            </button>
          </form>
        )}

        {mode === 'otp' && otpStep === 'request' && (
          <form onSubmit={requestOtp}>
            <div className="field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')} required />
            </div>
            {message && <p className="auth-success">{message}</p>}
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}

        {mode === 'otp' && otpStep === 'verify' && (
          <form onSubmit={verifyOtp}>
            <p className="muted" style={{ marginBottom: 14 }}>
              Enter the 6-digit code sent to {form.email}
            </p>
            <div className="field">
              <label>Code</label>
              <input value={form.otp} onChange={update('otp')} maxLength={6} required />
            </div>
            <div className="field">
              <label>New password</label>
              <input
                type="password"
                value={form.newPassword}
                onChange={update('newPassword')}
                required
              />
            </div>
            {message && <p className="auth-success">{message}</p>}
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Please wait…' : 'Reset password'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ width: '100%', marginTop: 8 }}
              onClick={() => setOtpStep('request')}
            >
              Use a different email
            </button>
          </form>
        )}

        <p style={{ marginTop: 18, fontSize: 13 }}>
          <Link to="/login" style={{ color: 'var(--pine)' }}>
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
