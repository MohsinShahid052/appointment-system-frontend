// src/apis/timeoffAPI.js
import api from './authApi';

export const timeoffAPI = {
  // Create time-off
  createTimeOff: async (timeoffData) => {
    const response = await api.post('/timeoffs', timeoffData);
    return response.data;
  },

  // NEW: Create a holiday for all employees in the barbershop
  createHolidayForAll: async (holidayData) => {
    // { date: 'YYYY-MM-DD', reason?: string }
    const response = await api.post('/timeoffs/holiday-all', holidayData);
    return response.data;
  },

  // Get ALL time-offs for current barbershop
  getAllTimeOffs: async () => {
    const response = await api.get('/timeoffs');
    return response.data;
  },

  // Get time-off for an employee
  getTimeOffForEmployee: async (employeeId) => {
    const response = await api.get(`/timeoffs/employee/${employeeId}`);
    return response.data;
  },

  // Delete time-off
  deleteTimeOff: async (id) => {
    const response = await api.delete(`/timeoffs/${id}`);
    return response.data;
  }
};
