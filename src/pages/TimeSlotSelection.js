import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../apis/appointmentAPI';
import { useToast } from '../components/Toast';

const TimeSlotSelection = ({ 
  barbershopId, 
  selectedService, 
  selectedBarber, 
  onTimeSelect, 
  onNext, 
  onBack 
}) => {
  const toast = useToast();
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('30min'); // '30min' or '15min'

  // Helper to check if employee works on a given day (moved before useEffect)
  const employeeWorksOnDate = (dateString) => {
    if (!selectedBarber || !selectedBarber.workingHours) return false; // Default to false if no data
    
    const date = new Date(dateString);
    const weekday = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
    const dayKey = dayMap[weekday];
    
    if (!dayKey) return false;
    
    const dayHours = selectedBarber.workingHours[dayKey];
    // Must have isWorkingDay = true AND both start and end times
    return dayHours && dayHours.isWorkingDay === true && dayHours.start && dayHours.end;
  };

  // default date = first available working day (starting from tomorrow)
  useEffect(() => {
    const findFirstWorkingDay = () => {
      for (let i = 1; i <= 14; i++) { // Check up to 2 weeks ahead
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        if (employeeWorksOnDate(dateStr)) {
          return dateStr;
        }
      }
      // Fallback to tomorrow if no working day found
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    };
    
    if (selectedBarber) {
      const firstWorkingDay = findFirstWorkingDay();
      setSelectedDate(firstWorkingDay);
    }
  }, [selectedBarber]);

  useEffect(() => {
    if (selectedDate && selectedBarber && selectedService) {
      loadTimeSlots();
    } else {
      setSlots([]);
    }
  }, [selectedDate, selectedBarber, selectedService]);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const availableSlots = await appointmentAPI.getAvailableSlots(
        barbershopId,
        selectedBarber._id,
        selectedService._id,
        selectedDate
      );
      setSlots(availableSlots || []);
    } catch (err) {
      const errorMessage = err.userMessage || 'Failed to load available time slots';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    onTimeSelect(slot, selectedDate);
  };

  const handleNext = () => {
    if (selectedSlot) onNext();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // NEW FORMATTER — Direct string slicing instead of timezone conversion
  const formatTime = (isoString) => {
    if (!isoString) return '';
    return isoString.substring(11, 16); // return "HH:mm"
  };

  const getDateOptions = () => {
    const dates = [];
    // Start from today (i = 0) and check up to 14 days ahead
    for (let i = 0; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    // Filter to only include working days
    return dates.filter(date => employeeWorksOnDate(date));
  };

  return (
    <div className="widget-step">
      <div className="step-header">
        <h2 className="step-title">Choose Time</h2>
        <p className="step-description">Select your preferred date and time</p>
      </div>

      {/* Date Selection */}
      <div className="date-selection">
        <h4 className="section-subtitle">Select Date</h4>
        <div className="dates-grid">
          {getDateOptions().map(date => {
            const worksOnThisDay = employeeWorksOnDate(date);
            return (
              <button
                key={date}
                onClick={() => worksOnThisDay && handleDateChange(date)}
                className={`date-option ${selectedDate === date ? 'selected' : ''} ${!worksOnThisDay ? 'date-option-disabled' : ''}`}
                type="button"
                disabled={!worksOnThisDay}
                title={!worksOnThisDay ? `${selectedBarber?.name || 'This barber'} does not work on this day` : ''}
                style={!worksOnThisDay ? { 
                  opacity: 0.5, 
                  cursor: 'not-allowed',
                  backgroundColor: '#f5f5f5'
                } : {}}
              >
                <div className="date-day">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="date-number">
                  {new Date(date).getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="time-selection">
        <h4 className="section-subtitle">
          Available Times for {formatDate(selectedDate)}
        </h4>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" style={{ margin: '0 auto 8px' }}></div>
            <p>Loading available times...</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="empty-state">
            <p>No available time slots for this date.</p>
            <p className="text-sm">
              {!employeeWorksOnDate(selectedDate) 
                ? `${selectedBarber?.name || 'This barber'} does not work on ${formatDate(selectedDate)}. Please select a different date.`
                : 'All time slots may be booked or the barber may have time off. Please try another date.'}
            </p>
          </div>
        ) : (
          <div className="time-slots-container">
            {/* Tabs for 30-minute and 15-minute slots */}
            <div className="slot-tabs">
              <button
                type="button"
                className={`slot-tab ${activeTab === '30min' ? 'active' : ''}`}
                onClick={() => setActiveTab('30min')}
              >
                30-Minute Slots
              </button>
              <button
                type="button"
                className={`slot-tab ${activeTab === '15min' ? 'active' : ''}`}
                onClick={() => setActiveTab('15min')}
              >
                15-Minute Slots
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === '30min' && (
              <div className="time-slots-section">
                {slots.filter(slot => slot.interval === 30).length > 0 ? (
                  <div className="time-slots-grid">
                    {slots
                      .filter(slot => slot.interval === 30)
                      .map((slot, index) => (
                        <button
                          key={`30-${index}`}
                          onClick={() => handleSlotSelect(slot)}
                          className={`time-slot ${
                            selectedSlot?.startLocalISO === slot.startLocalISO ? 'selected' : ''
                          }`}
                          type="button"
                        >
                          {formatTime(slot.startLocalISO)}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No 30-minute slots available for this date.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === '15min' && (
              <div className="time-slots-section">
                {slots.filter(slot => slot.interval === 15).length > 0 ? (
                  <div className="time-slots-grid">
                    {slots
                      .filter(slot => slot.interval === 15)
                      .map((slot, index) => (
                        <button
                          key={`15-${index}`}
                          onClick={() => handleSlotSelect(slot)}
                          className={`time-slot ${
                            selectedSlot?.startLocalISO === slot.startLocalISO ? 'selected' : ''
                          }`}
                          type="button"
                        >
                          {formatTime(slot.startLocalISO)}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No 15-minute slots available for this date.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="step-actions">
        <button onClick={onBack} className="btn-secondary" type="button">
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedSlot}
          className="btn-primary"
          type="button"
        >
          Next: Your Details
        </button>
      </div>
    </div>
  );
};

export default TimeSlotSelection;
