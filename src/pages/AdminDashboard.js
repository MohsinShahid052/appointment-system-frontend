import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const QuickAction = ({ title, description, onClick, color }) => (
    <div className="quick-action" onClick={onClick}>
      <div className={`qa-icon qa-${color}`}>
        <div className="qa-dot" />
      </div>
      <h3 className="qa-title">{title}</h3>
      <p className="qa-desc">{description}</p>
    </div>
  );

  return (
    <div className="dashboard-container fade-in">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">{t.dashboard.adminTitle}</h1>
          <p className="dash-welcome">
            {t.dashboard.adminSubtitle}
          </p>
        </div>

        <div className="role-badge">
          <div className="role-label">{t.common.currentRole}</div>
          <div className="role-value">{user?.role}</div>
        </div>
      </div>

      {/* Quick Actions Only */}
      <div className="card-surface">
        <h2 className="section-title">{t.dashboard.managementActions}</h2>

        <div className="qa-grid">
          <QuickAction
            title={t.dashboard.manageBarbershops}
            description={t.dashboard.manageBarbershopsDesc}
            onClick={() => navigate('/barbershops')}
            color="blue"
          />
          <QuickAction
            title={t.dashboard.changePassword}
            description={t.dashboard.changePasswordDesc}
            onClick={() => navigate('/change-password')}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
