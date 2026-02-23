// apis/serviceAPI.js
import api from './authApi';

export const serviceAPI = {
  // Services
  getServices: (barbershopId, activeOnly = true) => 
    api.get('/services', { 
      params: { 
        barbershopId,
        active: activeOnly 
      } 
    }),

  getServiceById: (id) => 
    api.get(`/services/${id}`),

  createService: (data) => 
    api.post('/services', data),

  updateService: (id, data) => 
    api.patch(`/services/${id}`, data),

  deleteService: (id) => 
    api.delete(`/services/${id}`),

  restoreService: (id) => 
    api.patch(`/services/${id}/restore`),

  // Categories
  getCategories: (barbershopId, activeOnly = true) => 
    api.get('/categories', { 
      params: { 
        barbershopId,
        active: activeOnly 
      } 
    }),

  getCategoryById: (id) => 
    api.get(`/categories/${id}`),

  createCategory: (data) => 
    api.post('/categories', data),

  updateCategory: (id, data) => 
    api.patch(`/categories/${id}`, data),

  deleteCategory: (id) => 
    api.delete(`/categories/${id}`),

  restoreCategory: (id) => 
    api.patch(`/categories/${id}/restore`),

  // Employee Service Assignment
  assignServicesToEmployee: (employeeId, serviceIds) =>
    api.post(`/employees/${employeeId}/services`, { serviceIds }),

  getEmployeeServices: (employeeId) =>
    api.get(`/employees/${employeeId}/services`),
  // Add this to your serviceAPI.js
 getBarbershop: async (id) => {
    const response = await api.get(`/auth/barbershop/${id}`);
    return response;
  },
};