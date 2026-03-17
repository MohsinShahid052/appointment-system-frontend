import React, { useState, useEffect } from 'react';
import { serviceAPI } from '../apis/serviceAPI';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Confirmation = ({ appointment, onClose }) => {
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

  // Currency helper function
  const getCurrencySymbol = () => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      TRY: '₺'
    };
    return currencySymbols[barbershopCurrency] || '€';
  };

  // Fetch barbershop currency
  const fetchBarbershopCurrency = async () => {
    try {
      console.log('Fetching barbershop currency for:', user?.barbershopId);
      
      if (!user?.barbershopId) {
        console.log('No barbershopId found in user context');
        setLoading(false);
        return;
      }

      const response = await serviceAPI.getBarbershop(user.barbershopId);
      console.log('Fetched barbershop data:', response.data);
      
      if (response.data?.currency) {
        setBarbershopCurrency(response.data.currency);
        console.log('Barbershop currency set to:', response.data.currency);
      } else {
        console.log('No currency found in barbershop response');
      }
    } catch (err) {
      console.error('Failed to fetch barbershop currency:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.barbershopId) {
      fetchBarbershopCurrency();
    } else {
      console.log('Waiting for user context to load...');
      setLoading(false);
    }
  }, [user]); // Depend on user instead of barbershopId

  if (!appointment) return null;

  if (loading) {
    return (
      <div className="widget-step">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-center text-gray-600">{t.booking.loadingConfirmation}</p>
      </div>
    );
  }

  // Extract values safely
  const service = appointment.service || {};
  const employee = appointment.employee || {};

  return (
    <div className="widget-step">
      {/* Header */}
      <div className="confirmation-header">
        <div className="confirmation-icon">✓</div>
        <h2 className="step-title">{t.booking.bookingConfirmed}</h2>
        <p className="step-description">
          {t.booking.bookingConfirmedDesc}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {t.booking.allPricesIn} {barbershopCurrency} ({getCurrencySymbol()})
        </p>
      </div>

      {/* Details */}
      <div className="confirmation-details">
    

        <div className="confirmation-item">
          <strong>{t.booking.service}:</strong> {service.name || '—'}
        </div>

        <div className="confirmation-item">
          <strong>{t.booking.barber}:</strong> {employee.name || '—'}
        </div>

        <div className="confirmation-item">
          <strong>{t.booking.dateTime}:</strong> {appointment.startLocal}
        </div>

        <div className="confirmation-item">
          <strong>{t.booking.duration}:</strong> {service.duration ? `${service.duration} ${t.booking.minutes}` : '—'}
        </div>

        <div className="confirmation-item">
          <strong>{t.booking.total}:</strong> {service.price ? `${getCurrencySymbol()}${service.price}` : '—'}
        </div>
      </div>

      {/* Notes */}
      <div className="confirmation-notes">
        <p>
          {t.booking.confirmationEmail}
        </p>
        <p>
          {t.booking.reminderEmail}
        </p>
        <p>
          {t.booking.checkSpam}
        </p>
      </div>

      {/* Actions */}
      <div className="step-actions">
        <button onClick={onClose} className="btn-primary">
          {t.booking.viewAllAppointments}
        </button>
      </div>
    </div>
  );
};

export default Confirmation;