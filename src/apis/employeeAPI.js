import api from './authApi';

export const employeeAPI = {
  // Get all employees for a barbershop
  getEmployees: async (barbershopId, active = null) => {
    const params = { barbershopId };
    if (active !== null) {
      params.active = active.toString();
    }
    const response = await api.get('/employees', { params });
    return response.data;
  },

  // Create employee
  createEmployee: async (employeeData) => {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  // Get employee by ID
  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    const response = await api.patch(`/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete employee (soft delete)
  deleteEmployee: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  // Restore employee
  restoreEmployee: async (id) => {
    const response = await api.patch(`/employees/${id}/restore`);
    return response.data;
  }
};