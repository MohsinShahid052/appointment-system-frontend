import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../apis/authApi';
import { useToast } from '../components/Toast';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/global.css';

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

    // Validation
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('New password must be different from old password');
      return;
    }

    setLoading(true);

    try {
      if (user?.role === 'admin') {
        await authAPI.adminChangePassword(formData.oldPassword, formData.newPassword);
      } else {
        await authAPI.changeOwnPassword(formData.oldPassword, formData.newPassword);
      }
      
      toast.success('Password changed successfully');
      navigate('/dashboard');
    } catch (err) {
      setError(err.userMessage || err.message || 'Failed to change password');
      toast.error(err.userMessage || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">{t.auth.changePassword}</h1>
          <p className="dash-welcome">{t.dashboard.changePasswordDesc}</p>
        </div>
      </div>

      <div className="card-surface" style={{ maxWidth: '500px' }}>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fee2e2',
              padding: '12px',
              borderRadius: '8px',
              color: '#b91c1c',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t.auth.oldPassword} *</label>
            <input
              type="password"
              name="oldPassword"
              className="input"
              value={formData.oldPassword}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t.auth.newPassword} *</label>
            <input
              type="password"
              name="newPassword"
              className="input"
              value={formData.newPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              minLength={6}
            />
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
              Must be at least 6 characters long
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">{t.auth.confirmPassword} *</label>
            <input
              type="password"
              name="confirmPassword"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn-secondary"
              disabled={loading}
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? t.auth.updating : t.auth.changePassword}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
