import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../apis/authApi';
import { useToast } from '../components/Toast';
import '../styles/global.css';

const ForgotPassword = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await authAPI.requestPasswordReset(email);
      setSuccess(true);
      toast.success('If that email exists, a password reset link has been sent.');
    } catch (err) {
      const message = err.userMessage || err.message || 'Failed to send reset email';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-screen fade-in">
      <div className="card">
        <h2
          style={{
            textAlign: 'center',
            marginBottom: 8,
            color: '#e5e7eb',
            fontWeight: 600,
            letterSpacing: '-0.03em'
          }}
        >
          Forgot Password
        </h2>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 16
          }}
        >
          Enter your email address and we'll send you a link to reset your password
        </p>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              padding: '10px',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '14px',
              marginBottom: 12
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: '#d1fae5',
              padding: '10px',
              borderRadius: '8px',
              color: '#065f46',
              fontSize: '14px',
              marginBottom: 12
            }}
          >
            If that email exists, a password reset link has been sent. Please check your email.
          </div>
        )}

        {!success ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="email"
              className="input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            <button className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
              Check your email for the password reset link.
            </p>
            <Link
              to="/login"
              style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Back to Login
            </Link>
          </div>
        )}

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              color: '#9ca3af',
              textDecoration: 'none',
              fontSize: '13px'
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
