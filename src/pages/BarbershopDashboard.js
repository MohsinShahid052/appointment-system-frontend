import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../apis/authApi';
import { serviceAPI } from '../apis/serviceAPI';
import { useLanguage } from '../contexts/LanguageContext';
const BarbershopDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const roleLabel = t.common[user?.role] || user?.role;

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

  if (loading) return <div className="dashboard-container"><p>{t.common.loading}</p></div>;

  return (
    <div className="dashboard-container fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">{t.dashboard.barbershopTitle}</h1>
          <p className="dash-welcome">
            {t.dashboard.welcomeBack}{user?.email ? `, ${user.email}` : ''}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {t.common.currency}: {barbershopCurrency} ({getCurrencySymbol()})
          </p>
        </div>
        <div className="role-badge">
          <div className="role-label">{t.common.currentRole}</div>
          <div className="role-value">{roleLabel}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          title={t.dashboard.todaysAppointments}
          value={dailyStats?.totals?.totalAppointments || 0}
          subtitle={`${dailyStats?.totals?.completed || 0} ${t.dashboard.completed}`}
          color="blue"
        />

        <StatCard
          title={t.dashboard.activeEmployees}
          value={dailyStats?.employees?.activeEmployees || 0}
          subtitle={`Avg: ${dailyStats?.employees?.avgAppointmentsPerEmployee || 0} ${t.dashboard.avgPerBarber}`}
          color="green"
          onClick={() => navigate('/employees')}
        />

        <StatCard
          title={t.dashboard.dailyRevenue}
          value={`${getCurrencySymbol()}${dailyStats?.revenue?.revenueGenerated || 0}`}
          subtitle={t.dashboard.completedSalesToday}
          color="purple"
        />

        <StatCard
          title={t.dashboard.newCustomers}
          value={dailyStats?.newClients || 0}
          subtitle={t.dashboard.joinedToday}
          color="orange"
        />
      </div>

      {/* Weekly */}
      <div className="card-surface">
        <h2 className="section-title">{t.dashboard.weeklyPerformance}</h2>
        <div className="text-sm text-gray-500 mb-3">
          {t.dashboard.revenueIn} {barbershopCurrency} ({getCurrencySymbol()})
        </div>

        <div className="weekly-stats">
          <p><strong>{t.dashboard.totalRevenue}:</strong> {getCurrencySymbol()}{weeklyStats?.totalRevenueGenerated || 0}</p>
          <p><strong>{t.dashboard.averagePerDay}:</strong> {getCurrencySymbol()}{weeklyStats?.averageRevenuePerDay || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-surface">
        <h2 className="section-title">{t.dashboard.quickActions}</h2>
        <div className="qa-grid">
          <QuickAction
            title={t.dashboard.manageEmployees}
            description={t.dashboard.manageEmployeesDesc}
            onClick={() => navigate('/employees')}
            color="blue"
          />
          <QuickAction
            title={t.dashboard.myBarbershop}
            description={t.dashboard.myBarbershopDesc}
            onClick={() => navigate(`/barbershop/edit/${user.barbershopId}`)}
            color="green"
          />
          <QuickAction
            title={t.dashboard.viewSchedule}
            description={t.dashboard.viewScheduleDesc}
            onClick={() => navigate('/agenda')}
            color="purple"
          />
          <QuickAction
            title={t.dashboard.timeOffRequests}
            description={t.dashboard.timeOffRequestsDesc}
            onClick={() => navigate('/timeoff')}
            color="orange"
          />
          <QuickAction
            title={t.dashboard.manageServices}
            description={t.dashboard.manageServicesDesc}
            onClick={() => navigate('/services')}
            color="blue"
          />
          <QuickAction
            title={t.dashboard.testBookingFlow}
            description={t.dashboard.testBookingFlowDesc}
            onClick={() => navigate('/book-now')}
            color="blue"
          />
          <QuickAction
            title={t.dashboard.viewAppointments}
            description={t.dashboard.viewAppointmentsDesc}
            onClick={() => navigate('/appointments')}
            color="green"
          />
        </div>
      </div>

   
    </div>
  );
};

export default BarbershopDashboard;
