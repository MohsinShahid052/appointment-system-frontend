import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../apis/authApi';
import { useToast } from '../components/Toast';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/global.css';

const ForgotPassword = () => {
  const toast = useToast();
  const { t } = useLanguage();
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
      setError(err.userMessage || err.message || 'Failed to send reset email');
      toast.error(err.userMessage || err.message || 'Failed to send reset email');
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
          {t.auth.forgotPasswordTitle}
        </h2>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 16
          }}
        >
          {t.auth.forgotPasswordSubtitle}
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
              placeholder={t.auth.emailAddress}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            <button className="btn-primary" disabled={loading}>
              {loading ? t.auth.sending : t.auth.sendResetLink}
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
              {t.auth.backToLogin}
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
            ← {t.auth.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
