import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../apis/authApi';
import { serviceAPI } from '../apis/serviceAPI';
const BarbershopDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dailyStats, setDailyStats] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR'); // Default to EUR as in backend
  const [loading, setLoading] = useState(true);

  // Currency helper function
  const getCurrencySymbol = () => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      TRY: '₺'
    };
    return currencySymbols[barbershopCurrency] || '€';
  };

  // Fetch barbershop data to get currency
  const fetchBarbershopData = async () => {
     try {
       const response = await serviceAPI.getBarbershop(user.barbershopId);
       console.log('Fetched barbershop data:', response.data);
 
       if (response.data?.currency) {
         console.log('Barbershop currency found:', response.data.currency);
         setBarbershopCurrency(response.data.currency);
         console.log('Loaded currency from barbershop:', response.data.currency);
       } else {
         console.log('No currency found in barbershop, using default EUR');
       }
     } catch (err) {
       console.error('Failed to fetch barbershop currency:', err);

     }
   };

  // Format today date YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadStats = async () => {
      try {
        // STEP 1: First get the barbershop currency
        const shopCurrency = await fetchBarbershopData();
        console.log('Loading dashboard data with currency:', shopCurrency);

        // STEP 2: Then fetch dashboard stats
        const [dayRes, weekRes] = await Promise.all([
          api.get(`/dashboard/daily-stats?date=${today}`),
          api.get(`/dashboard/weekly-revenue?start=${today}`)
        ]);

        setDailyStats(dayRes.data);
        setWeeklyStats(weekRes.data);
        
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [today, user]);

  const StatCard = ({ title, value, subtitle, color, onClick }) => (
    <div className={`stat-card border-${color}`} onClick={onClick}>
      <div className="stat-content">
        <div>
          <p className="stat-title">{title}</p>
          <p className="stat-value">{value}</p>
          <p className="stat-sub">{subtitle}</p>
        </div>
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

  if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;

  return (
    <div className="dashboard-container fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Barbershop Dashboard</h1>
          <p className="dash-welcome">
            Welcome back{user?.email ? `, ${user.email}` : ''}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Currency: {barbershopCurrency} ({getCurrencySymbol()})
          </p>
        </div>
        <div className="role-badge">
          <div className="role-label">Current Role</div>
          <div className="role-value">{user?.role}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title="Today's Appointments"
          value={dailyStats?.totals?.totalAppointments || 0}
          subtitle={`${dailyStats?.totals?.completed || 0} completed`}
          color="blue"
        />

        <StatCard
          title="Active Employees"
          value={dailyStats?.employees?.activeEmployees || 0}
          subtitle={`Avg: ${dailyStats?.employees?.avgAppointmentsPerEmployee || 0}/per barber`}
          color="green"
          onClick={() => navigate('/employees')}
        />

        <StatCard
          title="Daily Revenue"
          value={`${getCurrencySymbol()}${dailyStats?.revenue?.revenueGenerated || 0}`}
          subtitle="Completed sales today"
          color="purple"
        />

        <StatCard
          title="New Customers"
          value={dailyStats?.newClients || 0}
          subtitle="Joined today"
          color="orange"
        />
      </div>

      {/* Weekly */}
      <div className="card-surface">
        <h2 className="section-title">Weekly Performance</h2>
        <div className="text-sm text-gray-500 mb-3">
          Revenue in {barbershopCurrency} ({getCurrencySymbol()})
        </div>

        <div className="weekly-stats">
          <p><strong>Total Revenue:</strong> {getCurrencySymbol()}{weeklyStats?.totalRevenueGenerated || 0}</p>
          <p><strong>Average Per Day:</strong> {getCurrencySymbol()}{weeklyStats?.averageRevenuePerDay || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-surface">
        <h2 className="section-title">Quick Actions</h2>
        <div className="qa-grid">
          <QuickAction
            title="Manage Employees"
            description="Add and manage your team"
            onClick={() => navigate('/employees')}
            color="blue"
          />
          <QuickAction
            title="My Barbershop"
            description="Edit shop information"
            onClick={() => navigate(`/barbershop/edit/${user.barbershopId}`)}
            color="green"
          />
          <QuickAction
            title="View Schedule"
            description="Check appointments"
            onClick={() => navigate('/agenda')}
            color="purple"
          />
          <QuickAction
            title="Time Off Requests"
            description="Manage employee availability"
            onClick={() => navigate('/timeoff')}
            color="orange"
          />
          <QuickAction
            title="Manage Services"
            description="Set up services and pricing"
            onClick={() => navigate('/services')}
            color="blue"
          />
          <QuickAction
            title="Test Booking Flow"
            description="Simulate booking"
            onClick={() => navigate('/book-now')}
            color="blue"
          />
          <QuickAction
            title="View Appointments"
            description="Check and manage bookings"
            onClick={() => navigate('/appointments')}
            color="green"
          />
        </div>
      </div>

   
    </div>
  );
};

export default BarbershopDashboard;