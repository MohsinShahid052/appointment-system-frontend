import React, { useState } from 'react';
import ServiceSelection from './ServiceSelection';
import BarberSelection from './BarberSelection';
import TimeSlotSelection from './TimeSlotSelection';
import ClientForm from './ClientForm';
import Confirmation from './Confirmation';
import { useAuth } from '../contexts/AuthContext';

const BookingWidget = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [appointmentData, setAppointmentData] = useState({
    service: null,
    barber: null,
    slot: null,
    date: null
  });
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const { user } = useAuth();

  const handleServiceSelect = (service) => {
    setAppointmentData(prev => ({ ...prev, service }));
  };

  const handleBarberSelect = (barber) => {
    setAppointmentData(prev => ({ ...prev, barber }));
  };

  // UPDATED: accept both slot and date (date is shop-local YYYY-MM-DD)
  const handleTimeSelect = (slot, date) => {
    setAppointmentData(prev => ({ ...prev, slot, date }));
  };

  const handleAppointmentCreated = (appointment) => {
    setCreatedAppointment(appointment);
    setCurrentStep(5);
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  const steps = [
    {
      component: (
        <ServiceSelection
          barbershopId={user.barbershopId}
          onServiceSelect={handleServiceSelect}
          onNext={nextStep}
        />
      )
    },
    {
      component: (
        <BarberSelection
          barbershopId={user.barbershopId}
          selectedService={appointmentData.service}
          onBarberSelect={handleBarberSelect}
          onNext={nextStep}
          onBack={prevStep}
        />
      )
    },
    {
      component: (
        <TimeSlotSelection
          barbershopId={user.barbershopId}
          selectedService={appointmentData.service}
          selectedBarber={appointmentData.barber}
          onTimeSelect={handleTimeSelect} // now receives (slot, date)
          onNext={nextStep}
          onBack={prevStep}
        />
      )
    },
    {
      component: (
        <ClientForm
          barbershopId={user.barbershopId}
          appointmentDetails={appointmentData}
          onAppointmentCreated={handleAppointmentCreated}
          onBack={prevStep}
        />
      )
    },
    {
      component: (
        <Confirmation
          appointment={createdAppointment}
          onClose={() => window.location.href = '/appointments'}
        />
      )
    }
  ];

  return (
    <div className="booking-widget">
      <div className="widget-header">
        <h2 className="widget-title">Book Appointment</h2>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        {['Service', 'Barber', 'Time', 'Details', 'Confirm'].map((step, index) => (
          <div key={step} className="progress-step">
            <div className={`step-indicator ${currentStep > index + 1 ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}>
              {currentStep > index + 1 ? '✓' : index + 1}
            </div>
            <span className="step-label">{step}</span>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="widget-content">
        {steps[currentStep - 1].component}
      </div>
    </div>
  );
};

export default BookingWidget;
