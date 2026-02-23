import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const StatCard = ({ title, value, subtitle, trend, color, onClick }) => (
    <div className={`stat-card border-${color}`} onClick={onClick}>
      <div className="stat-content">
        <div>
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
          <p className="stat-sub">{subtitle}</p>
        </div>

        {typeof trend === 'number' && (
          <span className={`trend-badge ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
            {trend > 0 ? '+' : ''}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );

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
          <h1 className="dash-title">Dashboard Overview</h1>
          <p className="dash-welcome">
            Welcome back{user?.email ? `, ${user.email}` : ''}.
          </p>
        </div>

        <div className="role-badge">
          <div className="role-label">Current Role</div>
          <div className="role-value">{user?.role || 'user'}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title="Total Appointments"
          value="24"
          subtitle="This week"
          trend={12}
          color="blue"
        />
        <StatCard
          title="New Customers"
          value="8"
          subtitle="Last 7 days"
          trend={5}
          color="green"
        />
        <StatCard
          title="Revenue"
          value="$1,247"
          subtitle="This month"
          trend={8}
          color="purple"
        />
        <StatCard
          title="Rating"
          value="4.8"
          subtitle="Average score"
          trend={2}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="card-surface" style={{ marginBottom: 20 }}>
        <h2 className="section-title">Quick Actions</h2>
        <div className="qa-grid">
          {user?.role === 'admin' && (
            <QuickAction
              title="Manage Barbershops"
              description="View and manage all barbershops"
              onClick={() => navigate('/barbershops')}
              color="blue"
            />
          )}

          {user?.barbershopId && (
            <QuickAction
              title="My Barbershop"
              description="Edit barbershop information"
              onClick={() => navigate(`/barbershop/edit/${user.barbershopId}`)}
              color="green"
            />
          )}

          <QuickAction
            title="Employees"
            description="Manage team and services"
            onClick={() => navigate('/employees')}
            color="purple"
          />

          <QuickAction
            title="Schedule"
            description="View appointments"
            onClick={() => {}}
            color="orange"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card-surface">
        <h2 className="section-title">Recent Activity</h2>
        <div className="activity-list">
          {[
            { action: 'New appointment booked', time: '10 minutes ago', user: 'John Smith' },
            { action: 'Barbershop information updated', time: '1 hour ago', user: 'System' },
            { action: 'New employee added', time: '2 hours ago', user: 'Mustafa' },
          ].map((item, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" />
              <div>
                <p className="activity-action">{item.action}</p>
                <p className="activity-meta">
                  {item.time} • by {item.user}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
