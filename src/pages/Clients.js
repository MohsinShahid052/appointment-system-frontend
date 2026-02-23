import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI } from '../apis/clientAPI';
import { useAuth } from '../contexts/AuthContext';

const Clients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.barbershopId) {
      loadClients();
    }
  }, [user?.barbershopId]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await clientAPI.getClients();
      setClients(data || []);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      client.name?.toLowerCase().includes(search) ||
      client.email?.toLowerCase().includes(search) ||
      client.phone?.includes(search)
    );
  });

  const handleClientClick = (clientId) => {
    // Ensure clientId is a string
    const id = String(clientId);
    navigate(`/clients/${id}`);
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Clients</h1>
          <p className="dash-welcome">View and manage your clients</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="card-surface search-card">
        <div className="form-group">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-full"
          />
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* CLIENTS LIST */}
      <div className="card-surface">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-title">No Clients Found</h3>
            <p className="empty-description">
              {searchTerm 
                ? 'No clients match your search criteria.'
                : 'You don\'t have any clients yet. Clients will appear here after they book appointments.'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(client => (
                    <tr 
                      key={client._id}
                      onClick={() => handleClientClick(client._id)}
                      className="table-row-hover"
                    >
                      <td>
                        <div className="table-cell-bold">
                          {client.name || 'N/A'}
                        </div>
                      </td>
                      <td>{client.email || '—'}</td>
                      <td>{client.phone || '—'}</td>
                      <td>
                        <span className="table-cell-notes">
                          {client.notes || '—'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClientClick(client._id);
                          }}
                          className="btn-secondary btn-small"
                        >
                          View History
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              Showing {filteredClients.length} of {clients.length} client{clients.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Clients;
