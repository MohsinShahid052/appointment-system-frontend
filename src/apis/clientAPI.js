// apis/clientAPI.js
import api from './authApi';

export const clientAPI = {
  // Create or update client (used in appointment booking)
  createClient: async (clientData) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  // Get all clients
  getClients: async () => {
    const response = await api.get('/clients/all');
    return response.data;
  },  // Get client by ID
  getClient: async (clientId) => {
    const response = await api.get(`/clients/${clientId}`);

    return response.data;
  },
};
