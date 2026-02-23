import React, { useState } from 'react';
import { appointmentAPI } from '../apis/appointmentAPI';
import { notificationAPI } from '../apis/notificationAPI';
import { clientAPI } from '../apis/clientAPI';
import { useToast } from '../components/Toast';

const ClientForm = ({ 
  barbershopId, 
  appointmentDetails, 
  onAppointmentCreated, 
  onBack,
  initialClient
}) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: initialClient?.name || '',
    email: initialClient?.email || '',
    phone: initialClient?.phone || '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Extract raw date without timezone conversion ("YYYY-MM-DD")
  const extractDateFromSlotISO = (slotISO) => {
    if (!slotISO) return '';
    return slotISO.substring(0, 10);
  };

  // Extract raw time from ISO ("HH:mm")
  const extractTimeFromSlotISO = (slotISO) => {
    if (!slotISO) return '';
    return slotISO.substring(11, 16);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone || formData.phone.trim().length < 5) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldErrors({});

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const slotISO = appointmentDetails?.slot?.startLocalISO;

      if (!slotISO) {
        throw new Error('No time slot selected. Please go back and select a time.');
      }

      const date = extractDateFromSlotISO(slotISO);
      const startTime = extractTimeFromSlotISO(slotISO);

      if (!date || !startTime) {
        throw new Error('Failed to extract date/time from selected slot');
      }

      // Create or find client first
      const client = await clientAPI.createClient({
        barbershopId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim()
      });

      // Create appointment
      const appointmentPayload = {
        barbershopId,
        clientId: client._id,
        employeeId: appointmentDetails.barber._id,
        serviceId: appointmentDetails.service._id,
        date,
        startTime,
        notes: formData.notes.trim()
      };

      const appointment = await appointmentAPI.createAppointment(appointmentPayload);

      // Try sending confirmation
      try {
        await notificationAPI.sendConfirmation(appointment._id);
      } catch (emailErr) {
        console.warn('Confirmation email failed:', emailErr);
        // Don't fail the appointment creation if email fails
      }

      toast.success('Appointment created successfully!');
      onAppointmentCreated(appointment);

    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || err.message || 'Failed to create appointment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const slotISO = appointmentDetails?.slot?.startLocalISO || '';
  const rawDate = extractDateFromSlotISO(slotISO);
  const rawTime = extractTimeFromSlotISO(slotISO);

  return (
    <div className="widget-step">
      <div className="step-header">
        <h2 className="step-title">Your Information</h2>
        <p className="step-description">Please provide your contact details to complete the booking</p>
      </div>

      <div className="appointment-summary">
        <h4 className="summary-title">Appointment Summary</h4>
        <div className="summary-details">
          <div className="summary-item">
            <span className="summary-label">Service:</span>
            <span className="summary-value">{appointmentDetails?.service?.name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Barber:</span>
            <span className="summary-value">{appointmentDetails?.barber?.name}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Date & Time:</span>
            <span className="summary-value">
              {rawDate && rawTime ? `${rawDate} at ${rawTime}` : 'Not selected'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="client-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label required">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={(e) => {
                handleInputChange(e);
                if (fieldErrors.name) {
                  setFieldErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              required
              className={`input ${fieldErrors.name ? 'input-error' : ''}`}
              placeholder="Enter your full name"
            />
            {fieldErrors.name && <div className="error-text">{fieldErrors.name}</div>}
          </div>

          <div className="form-group">
            <label className="form-label required">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => {
                handleInputChange(e);
                if (fieldErrors.email) {
                  setFieldErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              required
              className={`input ${fieldErrors.email ? 'input-error' : ''}`}
              placeholder="your.email@example.com"
            />
            {fieldErrors.email && <div className="error-text">{fieldErrors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label required">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                handleInputChange(e);
                if (fieldErrors.phone) {
                  setFieldErrors(prev => ({ ...prev, phone: '' }));
                }
              }}
              required
              className={`input ${fieldErrors.phone ? 'input-error' : ''}`}
              placeholder="+1 234 567 8900"
            />
            {fieldErrors.phone && <div className="error-text">{fieldErrors.phone}</div>}
          </div>

          <div className="form-group full-width">
            <label className="form-label">Additional Notes (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="input"
              rows="3"
            />
          </div>
        </div>

        <div className="step-actions">
          <button 
            type="button" 
            onClick={onBack} 
            className="btn-secondary"
            disabled={loading}
          >
            Back
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
