import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../apis/appointmentAPI';
import { employeeAPI } from '../apis/employeeAPI';
import { serviceAPI } from '../apis/serviceAPI';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import ServiceSelection from './ServiceSelection';
import BarberSelection from './BarberSelection';
import TimeSlotSelection from './TimeSlotSelection';
import ClientForm from './ClientForm';
import '../styles/global.css';

const EditAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [appointment, setAppointment] = useState(null);
  
  const [appointmentData, setAppointmentData] = useState({
    service: null,
    barber: null,
    slot: null,
    date: null,
    clientId: null,
    clientData: null
  });

  useEffect(() => {
    loadAppointment();
  }, [id]);

  // Initialize client form data when appointment loads
  useEffect(() => {
    if (appointment && appointmentData.clientData && currentStep === 4) {
      // ClientForm will use appointmentData.clientData
    }
  }, [appointment, appointmentData.clientData, currentStep]);

  // Pre-select barber when on step 1 (but don't auto-advance)
  useEffect(() => {
    if (appointmentData.barber && currentStep === 1) {
      handleBarberSelect(appointmentData.barber);
    }
  }, [appointmentData.barber, currentStep]);

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.getAppointmentById(id);
      setAppointment(data);
      
      // Extract date from startLocal (YYYY-MM-DD format)
      const dateStr = data.startLocal ? data.startLocal.split('T')[0] : null;
      // Extract time from startLocal (HH:MM format)
      const timeStr = data.startLocal ? data.startLocal.split('T')[1]?.substring(0, 5) : null;
      
      setAppointmentData({
        service: data.service,
        barber: data.employee,
        slot: timeStr,
        date: dateStr,
        clientId: data.client?._id,
        clientData: {
          name: data.client?.name,
          phone: data.client?.phone,
          email: data.client?.email
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    setAppointmentData(prev => ({ ...prev, service }));
  };

  const handleBarberSelect = (barber) => {
    // When barber changes, clear the service if it's not available for the new barber
    setAppointmentData(prev => {
      const newBarberId = barber?._id?.toString();
      const prevBarberId = prev.barber?._id?.toString();
      
      // If barber changed, clear the service (ServiceSelection will validate if it's available)
      if (newBarberId !== prevBarberId) {
        return { ...prev, barber, service: null };
      }
      return { ...prev, barber };
    });
  };

  const handleTimeSelect = (slot, date) => {
    setAppointmentData(prev => ({ ...prev, slot, date }));
  };

  const handleUpdate = async (updatedData) => {
    try {
      setError('');
      setSuccess('');
      
      // Extract date and time from slot
      let date = appointmentData.date;
      let startTime = appointmentData.slot;
      
      // If slot is an object with startLocalISO, extract from it
      if (appointmentData.slot && typeof appointmentData.slot === 'object' && appointmentData.slot.startLocalISO) {
        const slotISO = appointmentData.slot.startLocalISO;
        date = slotISO.substring(0, 10);
        startTime = slotISO.substring(11, 16);
      }
      
      // First delete the old appointment
      await appointmentAPI.deleteAppointment(id);
      
      // Then create a new one with updated data
      const newAppointment = await appointmentAPI.createAppointment({
        clientId: appointmentData.clientId,
        clientData: updatedData.clientData || appointmentData.clientData,
        employeeId: appointmentData.barber._id,
        serviceId: appointmentData.service._id,
        date: date,
        startTime: startTime,
        notes: updatedData.notes || appointment.notes
      });
      
      const successMessage = 'Appointment updated successfully!';
      setSuccess(successMessage);
      toast.success(successMessage);
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to update appointment';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
console.log(appointmentData.service)
  // Define steps using useMemo - must be before any conditional returns
  // New flow: Barber -> Service -> Time -> Details
  const steps = useMemo(() => [
    {
      component: (
        <BarberSelection
          key="barber-selection"
          barbershopId={user.barbershopId}
          selectedService={null} // No service selected yet in new flow
          onBarberSelect={handleBarberSelect}
          onNext={nextStep}
          onBack={prevStep}
          initialBarber={appointmentData.barber}
        />
      )
    },
    {
      component: (
        <ServiceSelection
          key={`service-selection-${appointmentData.barber?._id || 'no-barber'}`}
          barbershopId={user.barbershopId}
          onServiceSelect={handleServiceSelect}
          onNext={nextStep}
          onBack={prevStep}
          initialService={appointmentData.service}
          employeeId={appointmentData.barber?._id || null}
        />
      )
    },
    {
      component: (
        <TimeSlotSelection
          key="time-slot-selection"
          barbershopId={user.barbershopId}
          selectedService={appointmentData.service}
          selectedBarber={appointmentData.barber}
          onTimeSelect={handleTimeSelect}
          onNext={nextStep}
          onBack={prevStep}
        />
      )
    },
    {
      component: (
        <ClientForm
          key="client-form"
          barbershopId={user.barbershopId}
          appointmentDetails={appointmentData}
          onAppointmentCreated={handleUpdate}
          onBack={prevStep}
          initialClient={appointmentData.clientData}
        />
      )
    }
  ], [user.barbershopId, appointmentData.service, appointmentData.barber, appointmentData.clientData]);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointment...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="dashboard-container">
        <div className="card-surface">
          <div className="text-center py-8">
            <p className="text-red-600">Appointment not found</p>
            <button onClick={() => navigate('/appointments')} className="btn-secondary mt-4">
              Back to Appointments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Edit Appointment</h1>
          <p className="dash-welcome">Update appointment details</p>
        </div>
        <button onClick={() => navigate('/appointments')} className="btn-secondary">
          Cancel
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-700 text-sm">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="text-green-700 text-sm">{success}</div>
        </div>
      )}

      <div className="card-surface">
        <div className="booking-widget">
          {/* Progress Steps */}
          <div className="progress-steps">
            {['Barber', 'Service', 'Time', 'Details'].map((step, index) => (
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
      </div>
    </div>
  );
};

export default EditAppointment;

