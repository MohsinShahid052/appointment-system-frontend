import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../apis/authApi';
import { useToast } from '../components/Toast';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/global.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { t } = useLanguage();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t.auth.invalidResetToken || 'Invalid reset token. Please request a new password reset.');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t.auth.invalidResetToken || 'Invalid reset token');
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      setError(t.common.required || 'All fields are required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError(t.auth.passwordTooShort || 'Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, formData.newPassword);
      setSuccess(true);
      toast.success(t.auth.passwordUpdated);
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = err.userMessage || err.message || 'Failed to reset password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
            {t.auth.resetPasswordTitle}
          </h2>

          <p
            style={{
              textAlign: 'center',
              fontSize: 13,
              color: '#9ca3af',
              marginBottom: 16
            }}
          >
            {t.auth.passwordUpdated}. {t.auth.redirectingToLogin || 'Redirecting to login...'}
          </p>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/login"
              className="btn-primary"
              style={{ display: 'inline-block', textDecoration: 'none' }}
            >
              {t.auth.backToLogin}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          {t.auth.resetPasswordTitle}
        </h2>

        <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 16
          }}
        >
          {t.auth.resetPasswordSubtitle}
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="password"
            name="newPassword"
            className="input"
            placeholder={t.auth.newPassword}
            value={formData.newPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            minLength={6}
            disabled={loading || !token}
          />

          <input
            type="password"
            name="confirmPassword"
            className="input"
            placeholder={t.auth.confirmPassword}
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            disabled={loading || !token}
          />

          <button className="btn-primary" disabled={loading || !token}>
            {loading ? t.auth.resetting : t.auth.resetPasswordBtn}
          </button>
        </form>

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

export default ResetPassword;
