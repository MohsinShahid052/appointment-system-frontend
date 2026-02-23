import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
          <h1 className="dash-title">Admin Dashboard</h1>
          <p className="dash-welcome">
            System overview and management
          </p>
        </div>

        <div className="role-badge">
          <div className="role-label">Current Role</div>
          <div className="role-value">{user?.role}</div>
        </div>
      </div>

      {/* Quick Actions Only */}
      <div className="card-surface">
        <h2 className="section-title">Management Actions</h2>

        <div className="qa-grid">
          <QuickAction
            title="Manage Barbershops"
            description="View and manage all barbershops"
            onClick={() => navigate('/barbershops')}
            color="blue"
          />
          <QuickAction
            title="Change Password"
            description="Update your account password"
            onClick={() => navigate('/change-password')}
            color="purple"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
