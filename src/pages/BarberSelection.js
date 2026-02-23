import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../apis/employeeAPI';
import { useToast } from '../components/Toast';

const BarberSelection = ({
  barbershopId,
  selectedService,
  onBarberSelect,
  onNext,
  onBack,
  initialBarber = null
}) => {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(initialBarber);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (barbershopId) {
      loadEmployees();
    }
  }, [barbershopId, selectedService]);

  // Update selected barber when initialBarber changes
  useEffect(() => {
    if (initialBarber) {
      setSelectedBarber(initialBarber);
      // Call onBarberSelect to notify parent
      if (typeof onBarberSelect === 'function') {
        onBarberSelect(initialBarber);
      }
    }
  }, [initialBarber]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');

      // Get active employees only (2nd param = onlyActive)
      const allEmployees = await employeeAPI.getEmployees(barbershopId, true);

      // If a service is selected, filter employees by that service
      // Otherwise, show all employees (for Barber -> Service flow)
      let availableEmployees = allEmployees;
      
      if (selectedService) {
        const selectedServiceId = selectedService._id?.toString();
        console.log('🔍 Selected service ID:', selectedServiceId);
        console.log('📦 Employees from API:', allEmployees);

        availableEmployees = allEmployees.filter(emp => {
          const services = emp.services || []; // your backend field

          // Normalize everything to string for safe comparison
          const normalizedServiceIds = services.map(s => {
            if (typeof s === 'string') return s;
            if (s?._id) return s._id.toString();
            if (s?.$oid) return s.$oid;
            return String(s);
          });

          const providesService = normalizedServiceIds.includes(selectedServiceId);

          console.log(`👨‍🦱 Checking ${emp.name}`, {
            rawServices: services,
            normalizedServiceIds,
            providesService
          });

          return providesService;
        });

        console.log('✅ Filtered available employees:', availableEmployees);
        
        if (availableEmployees.length === 0) {
          toast.warning('No barbers available for this service');
        }
      }

      setEmployees(availableEmployees);
    } catch (err) {
      console.error('Error loading barbers:', err);
      const errorMessage = err.userMessage || 'Failed to load barbers';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBarberSelect = (emp) => {
    setSelectedBarber(emp);
    onBarberSelect(emp);
  };

  const handleNext = () => {
    if (selectedBarber) onNext();
  };

  if (loading) {
    return (
      <div className="widget-step">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-center text-gray-600">Loading barbers...</p>
      </div>
    );
  }

  return (
    <div className="widget-step">
      <div className="step-header">
        <h2 className="step-title">Choose Barber</h2>
        <p className="step-description">
          {selectedService 
            ? `Select your preferred barber for ${selectedService.name}`
            : 'Select your preferred barber'}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {employees.length === 0 ? (
        <div className="empty-state">
          <h3 className="empty-title">No barbers available</h3>
          <p className="empty-description">
            {selectedService 
              ? `No barbers are currently assigned to ${selectedService.name}.`
              : 'No active barbers found.'}
          </p>
          {onBack && (
            <button onClick={onBack} className="btn-primary">
              Back
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="barbers-grid">
            {employees.map(emp => (
              <div
                key={emp._id}
                className={`barber-card ${
                  selectedBarber?._id === emp._id ? 'selected' : ''
                }`}
                onClick={() => handleBarberSelect(emp)}
              >
                <div className="barber-avatar">
                  {emp.photo ? (
                    <img 
                      src={emp.photo} 
                      alt={emp.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }}
                    />
                  ) : (
                    emp.name?.charAt(0)?.toUpperCase() || '?'
                  )}
                </div>

                <div className="barber-info">
                  <h4 className="barber-name">{emp.name}</h4>
                  {emp.email && (
                    <p className="barber-contact">{emp.email}</p>
                  )}
                  {emp.phone && (
                    <p className="barber-contact">{emp.phone}</p>
                  )}
                  {Array.isArray(emp.services) && (
                    <p className="barber-services">
                      {emp.services.length} service
                      {emp.services.length !== 1 ? 's' : ''} assigned
                    </p>
                  )}
                </div>

                <div className="barber-selector">
                  <div className="selection-dot"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="step-actions">
            <button onClick={onBack} className="btn-secondary">
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedBarber}
              className="btn-primary"
            >
              Next: Choose Time
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BarberSelection;
