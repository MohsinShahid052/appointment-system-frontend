// components/AppointmentsList.js
import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../apis/appointmentAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import AppointmentDetail from '../components/AppointmentDetail';
import BookingWidget from './BookingWidget';

const AppointmentsList = () => {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBookingWidget, setShowBookingWidget] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); // ⭐ NEW
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.getAppointments(user.barbershopId, selectedDate);
      setAppointments(data);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId, clientName) => {
    if (!window.confirm(`Are you sure you want to cancel ${clientName}'s appointment?`)) return;

    try {
      await appointmentAPI.cancelAppointment(appointmentId);
      setAppointments(prev =>
        prev.map(apt =>
          apt._id === appointmentId ? { ...apt, status: 'cancelled' } : apt
        )
      );
      toast.success(`Appointment for ${clientName} has been cancelled`);
    } catch (err) {
      const errorMessage = err.userMessage || 'Failed to cancel appointment';
      toast.error(errorMessage);
    }
  };

  const handleCompleteAppointment = async (appointmentId) => {
    if (!window.confirm(`Mark this appointment as completed?`)) return;

    try {
      await appointmentAPI.markAppointmentCompleted(appointmentId);
      setAppointments(prev =>
        prev.map(apt =>
          apt._id === appointmentId
            ? { ...apt, status: 'completed', completedAt: new Date().toISOString() }
            : apt
        )
      );
    } catch {
      alert('Failed to complete appointment.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { class: 'status-active', text: 'Scheduled' },
      completed: { class: 'status-completed', text: 'Completed' },
      cancelled: { class: 'status-inactive', text: 'Cancelled' },
      'no-show': { class: 'status-warning', text: 'No Show' }
    };
    const config = statusConfig[status] || statusConfig.scheduled;
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  // ⭐ FILTERED LISTS
  const activeAppointments = appointments.filter(
    a => a.status !== 'cancelled'
  );

  const cancelledAppointments = appointments.filter(
    a => a.status === 'cancelled'
  );

  const displayedAppointments =
    activeTab === 'active' ? activeAppointments : cancelledAppointments;

  if (loading) {
    return (
      <div className="center-screen">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Appointments</h1>
          <p className="dash-welcome">Manage today's schedule</p>
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input"
            style={{ maxWidth: '200px' }}
          />
          <button
            onClick={() => setShowBookingWidget(true)}
            className="btn-primary"
            style={{ maxWidth: '200px' }}
          >
            New Appointment
          </button>
        </div>
      </div>

      {/* ⭐ TABS */}
      <div className="flex gap-4 mb-6">
        <button
          className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('active')}
        >
          Active Appointments
        </button>

        <button
          className={`btn ${activeTab === 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled Appointments
        </button>
      </div>

      {/* Booking Widget */}
      {showBookingWidget && (
        <div className="card-surface fade-in mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">New Appointment</h3>
            <button
              onClick={() => {
                setShowBookingWidget(false);
                loadAppointments();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>
          <BookingWidget />
        </div>
      )}

      {/* APPOINTMENTS LIST */}
      <div className="appointments-list">
        {displayedAppointments.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-title">No appointments</h3>
            <p className="empty-description">
              No {activeTab} appointments for this date.
            </p>
          </div>
        ) : (
          displayedAppointments.map(appointment => (
            <div key={appointment._id} className="appointment-card">
              <div className="appointment-header">
                <div className="appointment-client">
                  <div className="client-avatar">
                    {appointment.client?.name?.charAt(0) || 'C'}
                  </div>
                  <div className="client-info">
                    <h4 className="client-name">
                      {appointment.client?.name || 'Unknown Client'}
                    </h4>
                    <p className="client-contact">
                      {appointment.client?.phone} • {appointment.client?.email}
                    </p>
                  </div>
                </div>
                {getStatusBadge(appointment.status)}
              </div>

              <div className="appointment-details">
                <div><strong>Service:</strong> {appointment.service?.name}</div>
                <div><strong>Barber:</strong> {appointment.employee?.name}</div>
                <div><strong>Time:</strong> {appointment.startLocal}</div>
                {appointment.notes && (
                  <div><strong>Notes:</strong> {appointment.notes}</div>
                )}
              </div>

              <div className="appointment-actions">
                {activeTab === 'active' && appointment.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() =>
                        handleCancelAppointment(
                          appointment._id,
                          appointment.client?.name
                        )
                      }
                      className="action-btn action-secondary"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => handleCompleteAppointment(appointment._id)}
                      className="action-btn action-success"
                    >
                      Mark Completed
                    </button>
                  </>
                )}

                <button
                  className="action-btn action-primary"
                  onClick={() => setSelectedAppointment(appointment)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedAppointment && (
        <AppointmentDetail
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={loadAppointments}
          onDelete={loadAppointments}
        />
      )}
    </div>
  );
};

export default AppointmentsList;
