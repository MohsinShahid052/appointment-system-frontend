import api from './authApi';

export const dashboardAPI = {
  getDailyStats: async (barbershopId, date) => {
    const res = await api.get('/dashboard/daily-stats', {
      params: { date }
    });
    return res.data;
  },

  getWeeklyRevenue: async (barbershopId, start) => {
    const res = await api.get('/dashboard/weekly-revenue', {
      params: { start }
    });
    return res.data;
  }
};
