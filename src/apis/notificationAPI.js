import api from './authApi';

export const notificationAPI = {
  // Send confirmation email
  sendConfirmation: async (appointmentId) => {
    const response = await api.post('/notifications/send-confirmation', { appointmentId });
    return response.data;
  },

  // Send reminder emails (usually called by cron job)
  sendReminders: async () => {
    const response = await api.post('/notifications/reminders');
    return response.data;
  },

};