import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientAPI } from '../apis/clientAPI';
import { appointmentAPI } from '../apis/appointmentAPI';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
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

      const clientData = await clientAPI.getClient(id);
      setClient(clientData);

      const appointmentsData = await appointmentAPI.getAppointments(
        user.barbershopId,
        null,
        null,
        id
      );

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
      return date.toLocaleDateString(undefined, {
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
      return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      scheduled: t.appointments.scheduled,
      completed: t.appointments.completed,
      cancelled: t.appointments.cancelled,
      'no-show': t.appointments.noShow,
    };
    return map[status] || status;
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner"></div>
          <p className="text-gray-600">{t.clientDetail.loadingClient}</p>
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="dashboard-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/clients')} className="btn-secondary">
          {t.clientDetail.backToClientsBtn}
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <button onClick={() => navigate('/clients')} className="btn-secondary client-back-btn">
            {t.clientDetail.backToClients}
          </button>
          <h1 className="dash-title">{client?.name || t.clients.clientDetails}</h1>
          <p className="dash-welcome">{t.clientDetail.clientInformation}</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {client && (
        <div className="card-surface client-detail-card">
          <h2 className="form-section-title">{t.clientDetail.clientInformation}</h2>
          <div className="client-detail-grid">
            <div className="client-detail-item">
              <span className="client-detail-label">{t.common.name}</span>
              <span className="client-detail-value">{client.name || 'N/A'}</span>
            </div>
            <div className="client-detail-item">
              <span className="client-detail-label">{t.common.email}</span>
              <span className="client-detail-value">{client.email || '—'}</span>
            </div>
            <div className="client-detail-item">
              <span className="client-detail-label">{t.common.phone}</span>
              <span className="client-detail-value">{client.phone || '—'}</span>
            </div>
            {client.notes && (
              <div className="client-detail-item client-detail-item-full">
                <span className="client-detail-label">{t.common.notes}</span>
                <span className="client-detail-value">{client.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-surface client-appointments-card">
        <h2 className="form-section-title">
          {t.clientDetail.appointmentHistory}
          {appointments.length > 0 && <span className="appointment-count">({appointments.length})</span>}
        </h2>

        {appointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3 className="empty-title">{t.clients.noAppointments}</h3>
            <p className="empty-description">
              {t.clientDetail.noAppointments}
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
                    {getStatusLabel(appointment.status)}
                  </span>
                </div>
                <div className="appointment-details">
                  <div className="appointment-detail-row">
                    <span className="appointment-detail-label">{t.clientDetail.barber}:</span>
                    <span className="appointment-detail-value">{appointment.employee?.name || 'N/A'}</span>
                  </div>
                  <div className="appointment-detail-row">
                    <span className="appointment-detail-label">{t.clientDetail.service}:</span>
                    <span className="appointment-detail-value">{appointment.service?.name || 'N/A'}</span>
                  </div>
                  <div className="appointment-detail-row">
                    <span className="appointment-detail-label">{t.clientDetail.duration}:</span>
                    <span className="appointment-detail-value">{appointment.service?.duration || 'N/A'} {t.clientDetail.minutes}</span>
                  </div>
                  {appointment.service?.price && (
                    <div className="appointment-detail-row">
                      <span className="appointment-detail-label">{t.clientDetail.price}:</span>
                      <span className="appointment-detail-value">€{appointment.service.price}</span>
                    </div>
                  )}
                </div>
                <div className="appointment-actions">
                  <button
                    onClick={() => navigate(`/appointments/edit/${appointment._id}`)}
                    className="btn-secondary btn-view-appointment"
                  >
                    {t.clientDetail.viewDetails}
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
