import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientAPI } from '../apis/clientAPI';
import { appointmentAPI } from '../apis/appointmentAPI';
import { useAuth } from '../contexts/AuthContext';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && user?.barbershopId) {
      loadData();
    }
  }, [id, user?.barbershopId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load client
      console.log(id)

      const clientData = await clientAPI.getClient(id);
      console.log(clientData)
      setClient(clientData);

      // Load appointments for this client
      const appointmentsData = await appointmentAPI.getAppointments(
        user.barbershopId,
        null,
        null,
        id
      );

      // Sort by date (newest first)
      const sorted = (appointmentsData || []).sort((a, b) => {
        const dateA = new Date(a.startTime || a.startLocal || 0);
        const dateB = new Date(b.startTime || b.startLocal || 0);
        return dateB - dateA;
      });

      setAppointments(sorted);
    } catch (err) {
      console.error('Error loading client detail:', err);
      setError(err.response?.data?.message || 'Failed to load client information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner"></div>
          <p className="text-gray-600">Loading client information...</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/clients')} className="btn-secondary">
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <button onClick={() => navigate('/clients')} className="btn-secondary client-back-btn">
            ← Back to Clients
          </button>
          <h1 className="dash-title">{client?.name || 'Client Details'}</h1>
          <p className="dash-welcome">View client information and appointment history</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {client && (
        <div className="card-surface client-detail-card">
          <h2 className="form-section-title">Client Information</h2>
          <div className="client-detail-grid">
            <div className="client-detail-item">
              <span className="client-detail-label">Name</span>
              <span className="client-detail-value">{client.name || 'N/A'}</span>
            </div>
            <div className="client-detail-item">
              <span className="client-detail-label">Email</span>
              <span className="client-detail-value">{client.email || '—'}</span>
            </div>
            <div className="client-detail-item">
              <span className="client-detail-label">Phone</span>
              <span className="client-detail-value">{client.phone || '—'}</span>
            </div>
            {client.notes && (
              <div className="client-detail-item client-detail-item-full">
                <span className="client-detail-label">Notes</span>
                <span className="client-detail-value">{client.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-surface client-appointments-card">
        <h2 className="form-section-title">
          Appointment History
          {appointments.length > 0 && <span className="appointment-count">({appointments.length})</span>}
        </h2>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="empty-title">No Appointments</h3>
            <p className="empty-description">
              This client hasn't booked any appointments yet.
            </p>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="appointment-item">
                <div className="appointment-header">
                  <div className="appointment-date-time">
                    <span className="appointment-date">
                      {formatDate(appointment.startLocal || appointment.startTime)}
                    </span>
                    <span className="appointment-time">
                      {formatTime(appointment.startLocal || appointment.startTime)} - {formatTime(appointment.endLocal || appointment.endTime)}
                    </span>
                  </div>
                  <span className={`appointment-status appointment-status-${appointment.status}`}>
                    {appointment.status === 'scheduled' ? 'Scheduled' :
                     appointment.status === 'completed' ? 'Completed' :
                     appointment.status === 'cancelled' ? 'Cancelled' :
                     appointment.status === 'no-show' ? 'No Show' : appointment.status}
                  </span>
                </div>
                <div className="appointment-details">
                  <div className="appointment-detail-row">
                    <span className="appointment-detail-label">Barber:</span>
                    <span className="appointment-detail-value">{appointment.employee?.name || 'N/A'}</span>
                  </div>
                  <div className="appointment-detail-row">
                    <span className="appointment-detail-label">Service:</span>
                    <span className="appointment-detail-value">{appointment.service?.name || 'N/A'}</span>
                  </div>
                  <div className="appointment-detail-row">
                    <span className="appointment-detail-label">Duration:</span>
                    <span className="appointment-detail-value">{appointment.service?.duration || 'N/A'} minutes</span>
                  </div>
                  {appointment.service?.price && (
                    <div className="appointment-detail-row">
                      <span className="appointment-detail-label">Price:</span>
                      <span className="appointment-detail-value">€{appointment.service.price}</span>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  <button
                    onClick={() => navigate(`/appointments/edit/${appointment._id}`)}
                    className="btn-secondary btn-view-appointment"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetail;
