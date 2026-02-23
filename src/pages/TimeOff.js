// src/pages/TimeOff.js
import React, { useState, useEffect } from 'react';
import { timeoffAPI } from '../apis/timeoffAPI';
import { employeeAPI } from '../apis/employeeAPI';
import { useAuth } from '../contexts/AuthContext';
import '../styles/global.css';

// ---------- Helpers ----------

const formatLocalDateTime = (isoString) => {
  if (!isoString) return '';

  const [datePart, timeAndOffset] = isoString.split('T');
  if (!timeAndOffset) return datePart;

  const timePart = timeAndOffset.split(/[Z+-.]/)[0];
  const [hh, mm] = timePart.split(':');
  if (!hh || !mm) return datePart;

  return `${datePart} ${hh}:${mm}`;
};

const formatTimeOff = (timeoff) => {
  if (timeoff.recurring?.isRecurring) {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    return `Every ${days[timeoff.recurring.dayOfWeek]} ${timeoff.recurring.startTime} - ${timeoff.recurring.endTime}`;
  }

  const hasStartLocal = Object.prototype.hasOwnProperty.call(timeoff, 'startLocal');
  const hasEndLocal = Object.prototype.hasOwnProperty.call(timeoff, 'endLocal');

  if (hasStartLocal || hasEndLocal) {
    const start = timeoff.startLocal ? formatLocalDateTime(timeoff.startLocal) : '';
    const end = timeoff.endLocal ? formatLocalDateTime(timeoff.endLocal) : '';

    if (start && end) return `${start} - ${end}`;
    if (start) return start;
    if (end) return end;
  }

  if (timeoff.startTime && timeoff.endTime) {
    const start = formatLocalDateTime(timeoff.startTime);
    const end = formatLocalDateTime(timeoff.endTime);
    return `${start} - ${end}`;
  }

  if (timeoff.date) {
    const dateOnly = timeoff.date.split('T')[0];
    return `Full day: ${dateOnly}`;
  }

  return 'Time off record';
};

// Helper to determine if a timeoff is upcoming or archived
const isTimeOffUpcoming = (timeoff) => {
  const now = new Date();
  
  // Recurring timeoffs are always considered upcoming
  if (timeoff.recurring?.isRecurring) {
    return true;
  }

  // Check end date/time
  let endDate = null;
  
  if (timeoff.endLocal) {
    endDate = new Date(timeoff.endLocal);
  } else if (timeoff.endTime) {
    endDate = new Date(timeoff.endTime);
  } else if (timeoff.date) {
    // For full day, check if date is today or in the future
    const dateOnly = timeoff.date.split('T')[0];
    endDate = new Date(dateOnly);
    endDate.setHours(23, 59, 59); // End of day
  } else if (timeoff.startLocal) {
    // If only start time, use start time as end
    endDate = new Date(timeoff.startLocal);
  } else if (timeoff.startTime) {
    endDate = new Date(timeoff.startTime);
  }

  if (!endDate) return true; // If we can't determine, consider it upcoming

  return endDate >= now;
};

// Helper to get timeoff type badge class
const getTimeOffTypeClass = (timeoff) => {
  if (timeoff.recurring?.isRecurring) {
    return 'timeoff-type-badge timeoff-recurring';
  }
  if (timeoff.date && !timeoff.startLocal && !timeoff.endLocal) {
    return 'timeoff-type-badge timeoff-fullday';
  }
  return 'timeoff-type-badge timeoff-single';
};

// ---------- Component ----------

const TimeOff = () => {
  const [employees, setEmployees] = useState([]);
  const [allTimeOffs, setAllTimeOffs] = useState([]);
  const [timeOffs, setTimeOffs] = useState([]);
  const [upcomingTimeOffs, setUpcomingTimeOffs] = useState([]);
  const [archivedTimeOffs, setArchivedTimeOffs] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'archive'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: '',
    reason: ''
  });

  const { user } = useAuth();

  const [formData, setFormData] = useState({
    employeeId: '',
    date: '',
    startLocal: '',
    endLocal: '',
    recurring: {
      isRecurring: false,
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '17:00'
    },
    reason: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    applyFilter(selectedEmployee);
  }, [selectedEmployee, allTimeOffs, activeTab]);

  // Keep form employee in sync with selected employee (if not "all")
  useEffect(() => {
    if (selectedEmployee !== 'all') {
      setFormData(prev => ({ ...prev, employeeId: selectedEmployee }));
    } else if (!formData.employeeId && employees.length > 0) {
      setFormData(prev => ({ ...prev, employeeId: employees[0]._id }));
    }
  }, [selectedEmployee, employees]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear conflicting fields when switching between types
  useEffect(() => {
    if (formData.recurring.isRecurring) {
      // Clear single occurrence fields when switching to recurring
      setFormData(prev => ({
        ...prev,
        date: '',
        startLocal: '',
        endLocal: ''
      }));
    }
  }, [formData.recurring.isRecurring]);

  const loadInitialData = async () => {
    try {
      const empData = await employeeAPI.getEmployees(user.barbershopId);
      const activeEmployees = empData.filter(emp => emp.isActive);
      setEmployees(activeEmployees);

      const timeoffData = await timeoffAPI.getAllTimeOffs();
      setAllTimeOffs(timeoffData);

      if (activeEmployees.length > 0) {
        setFormData(prev => ({ ...prev, employeeId: activeEmployees[0]._id }));
      }

      applyFilter('all', timeoffData);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (employeeId, baseList) => {
    const list = baseList || allTimeOffs;
    
    // Filter by employee
    let filtered = list;
    if (employeeId && employeeId !== 'all') {
      filtered = list.filter(t => t.employeeId && t.employeeId._id === employeeId);
    }

    // Separate upcoming and archived
    const upcoming = filtered.filter(isTimeOffUpcoming);
    const archived = filtered.filter(t => !isTimeOffUpcoming(t));

    setUpcomingTimeOffs(upcoming);
    setArchivedTimeOffs(archived);
    
    // Set current display based on active tab
    if (activeTab === 'upcoming') {
      setTimeOffs(upcoming);
    } else {
      setTimeOffs(archived);
    }
  };

  const reloadTimeOffs = async () => {
    try {
      const data = await timeoffAPI.getAllTimeOffs();
      setAllTimeOffs(data);
      applyFilter(selectedEmployee, data);
    } catch (err) {
      console.error('Error reloading time offs:', err);
      setError(err.response?.data?.message || 'Failed to reload time off records');
    }
  };

  const handleCreateTimeOff = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate employee selection
      if (!formData.employeeId) {
        setError('Please select an employee.');
        return;
      }

      console.log('Form Data for Time Off Creation:', formData);

      let timeOffData = {
        employeeId: formData.employeeId,
        reason: formData.reason || 'No reason provided'
      };

      // 1) Recurring time off
      if (formData.recurring.isRecurring) {
        timeOffData.recurring = {
          isRecurring: true,
          dayOfWeek: parseInt(formData.recurring.dayOfWeek, 10),
          startTime: formData.recurring.startTime,
          endTime: formData.recurring.endTime
        };
        console.log('Creating recurring time off with data:', timeOffData);
      } 
      // 2) Full day time off
      else if (formData.date && !formData.startLocal && !formData.endLocal) {
        timeOffData.date = formData.date;
        console.log('Creating full-day time off with data:', timeOffData);
      } 
      // 3) Specific time range
      else if (formData.startLocal && formData.endLocal && !formData.date) {
        // Format the datetime-local inputs properly for the backend
        timeOffData.startLocal = `${formData.startLocal}:00`;
        timeOffData.endLocal = `${formData.endLocal}:00`;
        console.log('Creating specific time range off with data:', timeOffData);
      } 
      // Invalid combination
      else {
        setError('Please provide either: a full date OR start/end times OR recurring schedule. Do not mix types.');
        return;
      }

      console.log('Final Time Off Data to be sent to API:', timeOffData);
      const response = await timeoffAPI.createTimeOff(timeOffData);
      console.log('API Response:', response);

      setSuccess('Time off created successfully!');
      setShowCreateForm(false);

      // Reset form but keep employee selection
      setFormData({
        employeeId: formData.employeeId,
        date: '',
        startLocal: '',
        endLocal: '',
        recurring: {
          isRecurring: false,
          dayOfWeek: 0,
          startTime: '09:00',
          endTime: '17:00'
        },
        reason: ''
      });

      await reloadTimeOffs();
    } catch (err) {
      console.error('Error creating time off:', err);
      console.error('Error details:', err.response?.data);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to create time off. Please check your input and try again.'
      );
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!holidayForm.date) {
      setError('Please select a date for the holiday.');
      return;
    }

    try {
      await timeoffAPI.createHolidayForAll({
        date: holidayForm.date,
        reason: holidayForm.reason || 'Holiday'
      });

      setSuccess('Holiday created for all employees!');
      setShowHolidayForm(false);
      setHolidayForm({ date: '', reason: '' });

      reloadTimeOffs();
    } catch (err) {
      console.error('Error creating holiday:', err);
      setError(
        err.response?.data?.message ||
        'Failed to create holiday for all employees.'
      );
    }
  };

  const handleDeleteTimeOff = async (id) => {
    if (window.confirm('Are you sure you want to delete this time off record?')) {
      try {
        await timeoffAPI.deleteTimeOff(id);
        setSuccess('Time off deleted successfully!');
        reloadTimeOffs();
      } catch (err) {
        console.error('Error deleting time off:', err);
        setError(err.response?.data?.message || 'Failed to delete time off');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Clear conflicting fields
      if (name === 'date' && value) {
        newData.startLocal = '';
        newData.endLocal = '';
      } else if ((name === 'startLocal' || name === 'endLocal') && value) {
        newData.date = '';
      }
      
      return newData;
    });
  };

  const handleRecurringChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurring: {
        ...prev.recurring,
        [field]: value
      }
    }));
  };

  // Helper to format datetime-local value for input
  const getCurrentDateTimeForInput = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedEmployeeName =
    selectedEmployee === 'all'
      ? 'All Employees'
      : employees.find(emp => emp._id === selectedEmployee)?.name || 'Employee';

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Time Off Management</h1>
          <p className="dash-welcome">Manage employee availability and time off</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowHolidayForm(true)}
            className="btn-secondary"
            style={{ maxWidth: '260px' }}
          >
            Create Holiday for All
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
            style={{ maxWidth: '200px' }}
          >
            Add Time Off
          </button>
        </div>
      </div>

      {/* Employee Filter */}
      <div className="card-surface mb-6">
        <label className="form-label block mb-2">Filter by Employee</label>
        <select
          value={selectedEmployee}
          onChange={(e) => setSelectedEmployee(e.target.value)}
          className="input"
        >
          <option value="all">All employees</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>{emp.name}</option>
          ))}
        </select>
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

      {/* Create Time Off Form */}
      {showCreateForm && (
        <div className="card-surface fade-in mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Add Time Off</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setError('');
                setSuccess('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>
          
          <form onSubmit={handleCreateTimeOff} className="space-y-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Type *</label>
                <select
                  value={formData.recurring.isRecurring ? 'recurring' : 'single'}
                  onChange={(e) =>
                    handleRecurringChange('isRecurring', e.target.value === 'recurring')
                  }
                  className="input"
                  required
                >
                  <option value="single">Single Occurrence</option>
                  <option value="recurring">Recurring Weekly</option>
                </select>
              </div>

              {!formData.recurring.isRecurring ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Day Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For full day off only
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      name="startLocal"
                      value={formData.startLocal}
                      onChange={handleInputChange}
                      className="input"
                      min={getCurrentDateTimeForInput()}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For specific time off
                    </p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date & Time</label>
                    <input
                      type="datetime-local"
                      name="endLocal"
                      value={formData.endLocal}
                      onChange={handleInputChange}
                      className="input"
                      min={formData.startLocal || getCurrentDateTimeForInput()}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Day of Week *</label>
                    <select
                      value={formData.recurring.dayOfWeek}
                      onChange={(e) =>
                        handleRecurringChange('dayOfWeek', parseInt(e.target.value, 10))
                      }
                      className="input"
                      required
                    >
                      <option value={0}>Sunday</option>
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      value={formData.recurring.startTime}
                      onChange={(e) =>
                        handleRecurringChange('startTime', e.target.value)
                      }
                      className="input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input
                      type="time"
                      value={formData.recurring.endTime}
                      onChange={(e) =>
                        handleRecurringChange('endTime', e.target.value)
                      }
                      className="input"
                      required
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2 form-group">
                <label className="form-label">Reason</label>
                <input
                  type="text"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Reason for time off (optional)"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h4>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• <strong>Full day off:</strong> Only fill the date field</li>
                <li>• <strong>Specific hours:</strong> Fill start and end date/time fields</li>
                <li>• <strong>Recurring:</strong> Select day of week and times</li>
                <li>• <strong>Important:</strong> Do not mix full day date with specific times</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="btn-primary"
                style={{ maxWidth: '200px' }}
              >
                Create Time Off
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setError('');
                  setSuccess('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Holiday form (all employees) */}
      {showHolidayForm && (
        <div className="card-surface fade-in mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Create Holiday for All Employees</h3>
            <button
              onClick={() => {
                setShowHolidayForm(false);
                setError('');
                setSuccess('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleCreateHoliday} className="space-y-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Holiday Date *</label>
                <input
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) =>
                    setHolidayForm(prev => ({ ...prev, date: e.target.value }))
                  }
                  className="input"
                  required
                />
              </div>

              <div className="md:col-span-2 form-group">
                <label className="form-label">Reason / Name of Holiday</label>
                <input
                  type="text"
                  value={holidayForm.reason}
                  onChange={(e) =>
                    setHolidayForm(prev => ({ ...prev, reason: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g. Christmas, New Year, Eid, etc."
                />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2">Note</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• This will create a full-day time off for every active employee.</li>
                <li>• Existing overlapping time-offs will be skipped by the backend.</li>
              </ul>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="btn-primary"
                style={{ maxWidth: '240px' }}
              >
                Create Holiday for All
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHolidayForm(false);
                  setError('');
                  setSuccess('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Time Off List */}
      <div className="card-surface">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title">
            Time Off Records – {selectedEmployeeName}
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`tab-button ${activeTab === 'upcoming' ? 'tab-active' : ''}`}
          >
            Upcoming ({upcomingTimeOffs.length})
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`tab-button ${activeTab === 'archive' ? 'tab-active' : ''}`}
          >
            Archive ({archivedTimeOffs.length})
          </button>
        </div>

        {timeOffs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="empty-title">
              {activeTab === 'upcoming' ? 'No upcoming time off records' : 'No archived time off records'}
            </h3>
            <p className="empty-description">
              {activeTab === 'upcoming' 
                ? 'All upcoming time off requests will appear here'
                : 'Past time off records will appear here'}
            </p>
          </div>
        ) : (
          <div className="barbershop-grid">
            {timeOffs.map(timeoff => (
              <div key={timeoff._id} className="barbershop-card fade-in">
                <div className="barbershop-header">
                  <div className="flex-1">
                    <p className="stat-value text-lg mb-2 flex items-center gap-2 flex-wrap">
                      {formatTimeOff(timeoff)}
                      <span className={getTimeOffTypeClass(timeoff)}>
                        {timeoff.recurring?.isRecurring ? 'Recurring' : 
                         (timeoff.date && !timeoff.startLocal && !timeoff.endLocal) ? 'Full Day' : 
                         'Single'}
                      </span>
                      {!timeoff.employeeId && (
                        <span className="preset-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
                          Holiday (All)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="barbershop-info">
                  {timeoff.employeeId && (
                    <div className="info-item">
                      <span className="info-dot" />
                      <span>Employee: <strong>{timeoff.employeeId.name}</strong></span>
                    </div>
                  )}

                  {timeoff.reason && (
                    <div className="info-item">
                      <span className="info-dot" />
                      <span>Reason: {timeoff.reason}</span>
                    </div>
                  )}

                  <div className="info-item">
                    <span className="info-dot" />
                    <span className="text-xs text-gray-500">
                      Created: {new Date(timeoff.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="barbershop-actions">
                  <button
                    onClick={() => handleDeleteTimeOff(timeoff._id)}
                    className="action-btn action-secondary"
                  >
                    Delete
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

export default TimeOff;