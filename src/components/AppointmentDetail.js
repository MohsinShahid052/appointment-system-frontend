import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../apis/appointmentAPI';
import { useNavigate } from 'react-router-dom';
import '../styles/global.css';

const AppointmentDetail = ({ appointment, onClose, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigate = useNavigate();

  // Helper function to extract time from ISO string (same as Agenda.js)
  const extractTime = (isoString) => {
    if (!isoString) return '';
    const timePart = isoString.split('T')[1] || '';
    const [h, m] = timePart.split(':');
    if (!h || !m) return '';
    return `${h}:${m}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = extractTime(isoString);
    return `${dateStr}, ${timeStr}`;
  };

  const formatTime = (isoString) => {
    return extractTime(isoString);
  };

  const handleMarkNoShow = async () => {
    if (!window.confirm('Mark this appointment as "No Show"?')) return;
    
    try {
      setLoading(true);
      setError('');
      await appointmentAPI.updateAppointmentStatus(appointment._id, 'no-show');
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark as no show');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete this appointment?`)) return;
    
    try {
      setLoading(true);
      setError('');
      await appointmentAPI.deleteAppointment(appointment._id);
      if (onDelete) onDelete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    onClose();
    navigate(`/appointments/edit/${appointment._id}`);
  };

  const handleCopy = () => {
    // Copy appointment details to clipboard or create duplicate
    const details = `Client: ${appointment.client?.name}\nService: ${appointment.service?.name}\nEmployee: ${appointment.employee?.name}\nTime: ${formatDateTime(appointment.startLocal)}`;
    navigator.clipboard.writeText(details);
    alert('Appointment details copied to clipboard');
  };

  const isNewCustomer = appointment.client && !appointment.client.phone && !appointment.client.email;

  return (
    <div className="appointment-detail-overlay" onClick={onClose}>
      <div className="appointment-detail-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="appointment-detail-header">
          <h2 className="appointment-detail-title">Appointment</h2>
          <button onClick={onClose} className="appointment-detail-close">×</button>
        </div>

        {error && (
          <div className="appointment-detail-error">
            <div className="appointment-detail-error-text">{error}</div>
          </div>
        )}

        {/* Client Info */}
        <div className="appointment-detail-section">
          <div className="appointment-detail-client">
            <div className="barbershop-avatar">
              {appointment.client?.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="flex-1">
              <h3 className="stat-value text-lg mb-1">{appointment.client?.name || 'Unknown Client'}</h3>
              <div className="barbershop-info">
                <div className="info-item">
                  <span className="info-dot" />
                  <span>{appointment.client?.phone || 'No phone number'}</span>
                </div>
                <div className="info-item">
                  <span className="info-dot" />
                  <span>{appointment.client?.email || 'No email'}</span>
                </div>
              </div>
              {isNewCustomer && (
                <span className="preset-badge" style={{ background: '#fef3c7', color: '#92400e', marginTop: '8px', display: 'inline-block' }}>
                  🎉 New customer!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="appointment-detail-section">
          <div className="appointment-detail-info-grid">
            <div className="appointment-detail-info-item">
              <div className="info-item">
                <span className="info-dot" />
                <span>{formatDateTime(appointment.startLocal)}</span>
              </div>
            </div>
            <div className="appointment-detail-info-item">
              <div className="info-item">
                <span className="info-dot" />
                <span>{formatTime(appointment.startLocal)} - {formatTime(appointment.endLocal)}</span>
              </div>
            </div>
            <div className="appointment-detail-info-item">
              <div className="info-item">
                <span className="info-dot" />
                <span>✂️ {appointment.service?.name || 'Service'}</span>
              </div>
            </div>
            <div className="appointment-detail-info-item">
              <div className="info-item">
                <span className="info-dot" />
                <div className="appointment-employee-info">
                  {appointment.employee?.photo ? (
                    <img 
                      src={appointment.employee.photo} 
                      alt={appointment.employee.name}
                      className="appointment-employee-photo"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  {!appointment.employee?.photo && (
                    <div className="appointment-employee-avatar">
                      {appointment.employee?.name?.charAt(0).toUpperCase() || 'E'}
                    </div>
                  )}
                  <span>{appointment.employee?.name || 'Employee'}</span>
                </div>
              </div>
            </div>
            <div className="appointment-detail-info-item">
              <div className="info-item">
                <span className="info-dot" />
                <span>🕐 {appointment.service?.duration || 30} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="appointment-detail-actions">
          <div className="appointment-detail-action-list">
            <button 
              className="appointment-detail-action-item"
              onClick={handleMarkNoShow}
              disabled={loading || appointment.status === 'no-show'}
            >
              <svg className="appointment-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as no show
            </button>
            <button 
              className="appointment-detail-action-item"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
            >
              <svg className="appointment-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
              More
            </button>
          </div>

          {showMoreMenu && (
            <div className="appointment-detail-more-menu">
              <button 
                className="appointment-detail-action-item highlight"
                onClick={handleEdit}
              >
                <svg className="appointment-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button 
                className="appointment-detail-action-item"
                onClick={handleCopy}
              >
                <svg className="appointment-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </button>
              <button 
                className="appointment-detail-action-item"
                onClick={handleDelete}
                disabled={loading}
              >
                <svg className="appointment-action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;

