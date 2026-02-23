
import api from './authApi';

export const appointmentAPI = {
  // Get available slots for a service and employee
  getAvailableSlots: async (barbershopId, employeeId, serviceId, date) => {
    const response = await api.get('/appointments/slots', {
      params: { employeeId, serviceId, date }
    });
    return response.data.slots;
  },

  // Create new appointment with automatic notification
  createAppointment: async (appointmentData) => {
    const response = await api.post('/appointments', appointmentData);
    return response.data;
  },

  // Get appointments for barbershop
  getAppointments: async (barbershopId, date = null, employeeId = null, clientId = null) => {
    const response = await api.get('/appointments', {
      params: { date, employeeId, clientId }
    });
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId) => {
    const response = await api.put(`/appointments/${appointmentId}/cancel`);
    return response.data;
  },

  // Get appointment by ID
  getAppointmentById: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Resend confirmation email
  resendConfirmation: async (appointmentId) => {
    const response = await api.post(`/appointments/${appointmentId}/resend-confirmation`);
    return response.data;
  },
  markAppointmentCompleted: async (appointmentId) => {
    const response = await api.patch(`/appointments/${appointmentId}/complete`);
    return response.data;
  },
  
  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status) => {
    const response = await api.patch(`/appointments/${appointmentId}/status`, { status });
    return response.data;
  },
  
  // Delete appointment
  deleteAppointment: async (appointmentId) => {
    const response = await api.delete(`/appointments/${appointmentId}`);
    return response.data;
  },
  
  // Update appointment
  updateAppointment: async (appointmentId, updates) => {
    const response = await api.put(`/appointments/${appointmentId}`, updates);
    return response.data;
  },
};