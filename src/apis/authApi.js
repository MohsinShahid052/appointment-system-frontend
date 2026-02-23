import axios from 'axios';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API_URL =', API_URL); // <-- TEMP: to verify in browser console

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for refresh token cookie
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401 responses and improve error messages
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Enhance error object with better messages
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      
      // Create user-friendly error messages
      let userMessage = data?.message || data?.error || 'An error occurred';
      
      switch (status) {
        case 400:
          userMessage = data?.message || 'Invalid request. Please check your input.';
          break;
        case 403:
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = data?.message || 'The requested resource was not found.';
          break;
        case 409:
          userMessage = data?.message || 'This action conflicts with existing data.';
          break;
        case 422:
          userMessage = data?.message || 'Validation failed. Please check your input.';
          break;
        case 500:
          userMessage = 'Server error. Please try again later.';
          break;
        case 503:
          userMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          userMessage = data?.message || `Error: ${status}`;
      }
      
      // Attach user-friendly message to error
      error.userMessage = userMessage;
    } else if (error.request) {
      // Request was made but no response received
      error.userMessage = 'Network error. Please check your internet connection.';
    } else {
      // Something else happened
      error.userMessage = error.message || 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Login for admin & barbershop user
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  // Get logged-in user's profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Refresh access token
  refreshToken: async () => {
    const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
      withCredentials: true
    });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Admin creates a Barbershop + owner user
  createBarbershop: async (barbershopData) => {
    const response = await api.post('/auth/barbershop/create', barbershopData);
    return response.data;
  },

  // List available barbershop presets (admin)
  getBarbershopPresets: async () => {
    const response = await api.get('/auth/barbershop-presets');
    return response.data;
  },

  // Create a new barbershop preset (admin)
  createBarbershopPreset: async (preset) => {
    const response = await api.post('/auth/barbershop-presets', preset);
    return response.data;
  },

  // Get single preset by key (admin)
  getBarbershopPreset: async (key) => {
    const response = await api.get(`/auth/barbershop-presets/${key}`);
    return response.data;
  },

  // Update barbershop preset (admin)
  updateBarbershopPreset: async (key, preset) => {
    const response = await api.put(`/auth/barbershop-presets/${key}`, preset);
    return response.data;
  },

  // Update Barbershop Info
  updateBarbershop: async (id, updates) => {
    const response = await api.put(`/auth/barbershop/${id}`, updates);
    return response.data;
  },

  // List all barbershops (Admin only)
  listBarbershops: async () => {
    const response = await api.get('/auth/barbershops');
    return response.data;
  },

  // Register Admin (run once)
  adminRegister: async (email, password) => {
    const response = await api.post('/auth/admin/register', { email, password });
    return response.data;
  },
   getBarbershop: async (id) => {
    const response = await api.get(`/auth/barbershop/${id}`);
    console.log('getBarbershop response:', response.data.currency);  
    return response.data;
  },
    deleteBarbershop: async (id) => {
    const response = await api.delete(`/auth/barbershop/${id}`);
    return response.data;
  },
restoreBarbershop: async (id) => {
    const response = await api.post(`/auth/barbershop/${id}/restore`);
    return response.data;
  },
  updateCurrency: async (barbershopId, currency) => {
    const response = await api.put(`/auth/barbershop/${barbershopId}/currency`, { currency });
    return response.data;
  },
 // Admin resets password of barbershop
  adminResetPassword: async (barbershopId, newPassword) => {
    const response = await api.put(`/auth/admin/reset-password/${barbershopId}`, {
      newPassword,
    });
    return response.data;
  },

  // Barbershop changes its own password
  changeOwnPassword: async (oldPassword, newPassword) => {
    const response = await api.put(`/auth/barbershop/change-password`, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Admin changes their own password
  adminChangePassword: async (oldPassword, newPassword) => {
    const response = await api.put(`/auth/admin/change-password`, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Request password reset (forget password)
  requestPasswordReset: async (email) => {
    const response = await api.post(`/auth/forgot-password`, { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await api.post(`/auth/reset-password`, { token, newPassword });
    return response.data;
  },

  loginAsBarbershop: async (barbershopId) => {
  const response = await api.post(`/auth/admin/login-as/${barbershopId}`);
  return response.data;
},

};


export default api;