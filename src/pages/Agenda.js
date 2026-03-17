import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agendaAPI } from '../apis/agendaAPI';
import { employeeAPI } from '../apis/employeeAPI';
import { appointmentAPI } from '../apis/appointmentAPI';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AppointmentDetail from '../components/AppointmentDetail';
import '../styles/global.css';

// ------------------- HELPERS -------------------

const getTodayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (isoDate, days) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayInfo = (isoDate) => {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  // getDay() returns: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  const weekday = date.getDay();
  return { weekdayShort, dayNumber, monthShort, weekday };
};

// Helper to check if employee works on a given day
const employeeWorksOnDay = (employee, weekday) => {
  if (!employee) return false;
  
  // If no workingHours at all, assume they don't work (should be set up)
  if (!employee.workingHours) return false;
  
  // Convert JavaScript weekday (0=Sun, 1=Mon, ..., 6=Sat) to our day keys
  const dayMap = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
  const dayKey = dayMap[weekday];
  
  if (!dayKey) return false;
  
  const dayHours = employee.workingHours[dayKey];
  
  // If dayHours doesn't exist, they don't work that day
  if (!dayHours) return false;
  
  // If isWorkingDay is explicitly false, they don't work
  if (dayHours.isWorkingDay === false) return false;
  
  // If isWorkingDay is true but no start/end times, they don't work
  if (!dayHours.start || !dayHours.end) return false;
  
  // They work if isWorkingDay is true and has start/end times
  return dayHours.isWorkingDay === true;
};

const extractTime = (isoString) => {
  if (!isoString) return '';
  const timePart = isoString.split('T')[1] || '';
  const [h, m] = timePart.split(':');
  if (!h || !m) return '';
  return `${h}:${m}`;
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      if (hour === 18 && minute > 0) break;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const getAppointmentStyle = (startTime, duration, timeSlots) => {
  const startMinutes = timeToMinutes(startTime);
  const slotHeight = 40; // Match time-slot-background height
  
  // Find exact slot index for the start time
  let startSlotIndex = -1;
  
  // First, try exact match
  for (let i = 0; i < timeSlots.length; i++) {
    const slotMinutes = timeToMinutes(timeSlots[i]);
    if (slotMinutes === startMinutes) {
      startSlotIndex = i;
      break;
    }
  }
  
  // If no exact match, find the slot that contains this time
  if (startSlotIndex === -1) {
    for (let i = 0; i < timeSlots.length; i++) {
      const slotMinutes = timeToMinutes(timeSlots[i]);
      const nextSlotMinutes = i < timeSlots.length - 1 ? timeToMinutes(timeSlots[i + 1]) : slotMinutes + 15;
      
      if (startMinutes >= slotMinutes && startMinutes < nextSlotMinutes) {
        startSlotIndex = i;
        break;
      }
    }
  }
  
  // Calculate duration in slots (each slot is 15 minutes, so convert minutes to slots)
  const durationSlots = duration / 15;
  
  if (startSlotIndex === -1) {
    console.warn('Could not find slot for start time:', startTime, 'duration:', duration);
    return null;
  }
  
  return {
    top: `${startSlotIndex * slotHeight}px`,
    height: `${durationSlots * slotHeight}px`,
    position: 'absolute',
    width: 'calc(100% - 12px)',
    left: '6px',
    right: '6px',
    boxSizing: 'border-box'
  };
};

// ------------------- COMPONENT -------------------

const Agenda = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [dayData, setDayData] = useState(null);
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState(null);

  const timeSlots = useMemo(() => generateTimeSlots(), []);
  const { weekdayShort, dayNumber, monthShort, weekday } = getDayInfo(selectedDate);

  const navigateDay = (days) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  const jumpToToday = () => setSelectedDate(getTodayISO());

  const handleDateChange = (e) => {
    if (e.target.value) setSelectedDate(e.target.value);
  };

  const activeEmployees = useMemo(() => {
    return employees.filter(emp => emp.isActive);
  }, [employees]);

  const getEmployeeAppointments = (employeeId) => {
    if (!dayData || !dayData.entries) return [];
    return dayData.entries.filter(entry => {
      const eid = entry.meta?.employeeId || entry.meta?.employeeID || entry.employeeId;
      const isAppointment = entry.type === 'appointment';
      const isNotNoShow = entry.meta?.status !== 'no-show';
      return eid?.toString() === employeeId.toString() && isAppointment && isNotNoShow;
    });
  };

  const getEmployeeTimeOffs = (employeeId) => {
    if (!dayData || !dayData.entries) return [];
    return dayData.entries.filter(entry => {
      const eid = entry.meta?.employeeId || entry.meta?.employeeID || entry.employeeId;
      const isTimeOff = entry.type === 'timeoff';
      return eid?.toString() === employeeId.toString() && isTimeOff;
    });
  };

  const handleAppointmentClick = async (appointment) => {
    try {
      // Get full appointment details
      const appointmentId = appointment.meta?.appointmentId;
      if (appointmentId) {
        const details = await appointmentAPI.getAppointmentById(appointmentId);
        setAppointmentDetails(details);
        setSelectedAppointment(appointment);
      } else {
        // If no appointment ID, use the entry data
        setAppointmentDetails({
          _id: appointment._id,
          client: appointment.meta?.client,
          employee: appointment.meta?.employee || { 
            name: appointment.meta?.employeeName,
            photo: employees.find(e => e._id === appointment.meta?.employeeId)?.photo
          },
          service: { 
            name: appointment.meta?.serviceName, 
            duration: appointment.meta?.duration || 30 
          },
          startLocal: appointment.startLocal,
          endLocal: appointment.endLocal,
          status: appointment.meta?.status || 'scheduled',
          createdAt: appointment.createdAt || new Date().toISOString()
        });
        setSelectedAppointment(appointment);
      }
    } catch (err) {
      console.error('Error loading appointment details:', err);
      setError('Failed to load appointment details');
    }
  };

  const handleAppointmentUpdate = () => {
    // Reload agenda data
    const loadDayAgenda = async () => {
      try {
        setLoading(true);
        const response = await agendaAPI.getDayAgenda(user.barbershopId, selectedDate, null);
        setDayData(response.data);
      } catch {
        setError('Failed to reload schedule');
      } finally {
        setLoading(false);
      }
    };
    loadDayAgenda();
  };

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await employeeAPI.getEmployees(user.barbershopId);
        // Debug: Log employee working hours
        console.log('Loaded employees:', data.map(emp => ({
          name: emp.name,
          hasWorkingHours: !!emp.workingHours,
          workingHours: emp.workingHours
        })));
        setEmployees(data);
      } catch {
        setError('Failed to load employees');
      }
    };
    loadEmployees();
  }, [user.barbershopId]);

  useEffect(() => {
    const loadDayAgenda = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await agendaAPI.getDayAgenda(user.barbershopId, selectedDate, null);
        setDayData(response.data);
        if (response.data?.zone) setZone(response.data.zone);
      } catch {
        setError('Failed to load daily schedule');
      } finally {
        setLoading(false);
      }
    };
    loadDayAgenda();
  }, [selectedDate, user.barbershopId]);

  if (loading && !dayData) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner" style={{ margin: '0 auto 14px' }}></div>
          <p style={{ color: '#6b7280' }}>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">{t.agenda.title}</h1>
          <p className="dash-welcome">{t.agenda.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/book-now')}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '14px' }}
          >
            + {t.appointments.addAppointment}
          </button>
        <div className="agenda-timezone">
          Timezone: {zone || t.common.loading}
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="card-surface agenda-controls">
        <div className="controls-row">
          <div className="week-nav">
            <button onClick={() => navigateDay(-1)} className="btn-secondary">← Previous</button>
            <div className="date-display">
              <div className="label-small">Day</div>
              <div className="label-strong">
                {weekdayShort} {dayNumber} {monthShort}
              </div>
            </div>
            <button onClick={() => navigateDay(1)} className="btn-secondary">Next →</button>
            <button onClick={jumpToToday} className="btn-secondary small-btn">{t.common.today}</button>
            <div className="jump-date">
              <span className="label-small">Jump to:</span>
              <input 
                type="date" 
                value={selectedDate} 
                onChange={handleDateChange} 
                className="input" 
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* AGENDA GRID */}
      <div className="card-surface agenda-grid-container">
        <div className="agenda-wrapper">
          {/* Header row with employee names */}
          <div className="agenda-grid-header">
            <div className="time-column-header">{t.common.time}</div>
            {activeEmployees.map(emp => (
              <div key={emp._id} className="employee-column-header">
                <div className="employee-avatar-small">
                  {emp.photo ? (
                    <img 
                      src={emp.photo} 
                      alt={emp.name}
                      className="employee-avatar-img"
                    />
                  ) : (
                    emp.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="employee-name-truncated">
                  {emp.name}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots and appointments */}
          <div className="agenda-grid-body">
            {/* Time column */}
            <div className="time-column">
              {timeSlots.map((time, index) => (
                <div key={time} className="time-slot">
                  {time}
                </div>
              ))}
            </div>

            {/* Employee columns */}
            {activeEmployees.map(emp => {
              const appointments = getEmployeeAppointments(emp._id);
              const timeOffs = getEmployeeTimeOffs(emp._id);
              const worksToday = employeeWorksOnDay(emp, weekday);
              
              return (
                <div 
                  key={emp._id} 
                  className={`employee-column ${!worksToday ? 'employee-column-no-work' : ''}`}
                >
                  {/* Background time slots */}
                  {timeSlots.map(time => (
                    <div key={time} className="time-slot-background"></div>
                  ))}
                  
                  {/* Time Offs */}
                  {timeOffs.map((timeoff, index) => {
                    const startTime = extractTime(timeoff.startLocal);
                    const endTime = extractTime(timeoff.endLocal);
                    const startMinutes = timeToMinutes(startTime);
                    const endMinutes = timeToMinutes(endTime);
                    const duration = endMinutes - startMinutes;
                    const style = getAppointmentStyle(startTime, duration, timeSlots);
                    
                    if (!style) return null;

                    return (
                      <div
                        key={`timeoff-${index}`}
                        className="timeoff-block"
                        style={style}
                        title={timeoff.meta?.reason || 'Time Off'}
                      >
                        <div className="timeoff-content">
                          <div className="timeoff-time">
                            {startTime} - {endTime}
                          </div>
                          <div className="timeoff-label">
                            {timeoff.meta?.reason || 'Time Off'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Appointments */}
                  {appointments.map((appointment, index) => {
                    const startTime = extractTime(appointment.startLocal);
                    const endTime = extractTime(appointment.endLocal);
                    
                    // Calculate duration from start and end times if not provided in meta
                    let duration = appointment.meta?.duration;
                    if (!duration && startTime && endTime) {
                      const startMinutes = timeToMinutes(startTime);
                      const endMinutes = timeToMinutes(endTime);
                      duration = endMinutes - startMinutes;
                    }
                    // Fallback to 30 minutes if still no duration
                    if (!duration || duration <= 0) {
                      duration = 30;
                    }
                    
                    const style = getAppointmentStyle(startTime, duration, timeSlots);
                    
                    if (!style) return null;

                    // Get client name
                    const clientName = appointment.meta?.client?.name || 'Client';
                    
                    return (
                      <div
                        key={index}
                        className="appointment-block"
                        style={style}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <div className="appointment-content">
                          <div className="appointment-time">
                            {startTime}-{endTime} {clientName}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
          
                );
            })}
          </div>
        </div>

        {activeEmployees.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3 className="empty-title">{t.agenda.noAppointmentsToday}</h3>
            <p className="empty-description">
              There are no active employees to display in the agenda.
            </p>
          </div>
        )}
      </div>

      {/* LEGEND */}
      <div className="card-surface agenda-legend">
        <div className="legend">
          <div className="legend-item">
            <div className="legend-color appointment-color"></div>
            <span>{t.appointments.title}</span>
          </div>
          <div className="legend-description">
            Each block shows client name and service. Height represents duration. Click to view details.
          </div>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && appointmentDetails && (
        <AppointmentDetail
          appointment={appointmentDetails}
          onClose={() => {
            setSelectedAppointment(null);
            setAppointmentDetails(null);
          }}
          onUpdate={handleAppointmentUpdate}
          onDelete={handleAppointmentUpdate}
        />
      )}
    </div>
  );
};

export default Agenda;