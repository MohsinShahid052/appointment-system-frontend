import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../apis/appointmentAPI';
import { employeeAPI } from '../apis/employeeAPI';
import { serviceAPI } from '../apis/serviceAPI';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/global.css';

const EditAppointmentNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR');
  
  const [allServices, setAllServices] = useState([]); // All services (unfiltered)
  const [filteredServices, setFilteredServices] = useState([]); // Services filtered by employee
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [employeeServiceIds, setEmployeeServiceIds] = useState([]); // Employee's service IDs as array
  
  const [formData, setFormData] = useState({
    service: null,
    employee: null,
    date: '',
    time: '',
    notes: ''
  });

  // Currency helper
  const getCurrencySymbol = () => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      TRY: '₺'
    };
    return currencySymbols[barbershopCurrency] || '€';
  };

  useEffect(() => {
    if (user?.barbershopId) {
      loadServicesAndCategories();
      loadEmployees();
      fetchBarbershopCurrency();
    }
  }, [user?.barbershopId]);

  useEffect(() => {
    // Wait for both services and employees to be loaded before loading appointment
    if (id && !loadingServices && allServices.length >= 0 && employees.length > 0) {
      loadAppointment();
    }
  }, [id, loadingServices, employees.length]);

  useEffect(() => {
    if (formData.employee && formData.service && formData.date) {
      loadAvailableSlots();
    }
  }, [formData.employee, formData.service, formData.date]);

  // Load employee services when employee changes
  useEffect(() => {
    if (formData.employee?._id && employees.length > 0 && allServices.length > 0) {
      loadEmployeeServices(formData.employee._id);
    } else if (!formData.employee && allServices.length > 0) {
      // If no employee selected, show all services
      setFilteredServices(allServices);
      setEmployeeServiceIds([]);
    }
  }, [formData.employee?._id, employees.length, allServices.length]);

  const fetchBarbershopCurrency = async () => {
    try {
      const response = await serviceAPI.getBarbershop(user.barbershopId);
      if (response.data?.currency) {
        setBarbershopCurrency(response.data.currency);
      }
    } catch (err) {
      console.error('Failed to fetch currency:', err);
    }
  };

  const loadAppointment = async () => {
    try {
      setLoading(true);
      const data = await appointmentAPI.getAppointmentById(id);
      setAppointment(data);
      
      const dateStr = data.startLocal ? data.startLocal.split('T')[0] : '';
      const timeStr = data.startLocal ? data.startLocal.split('T')[1]?.substring(0, 5) : '';
      
      // Find service and employee from loaded lists
      const serviceId = data.service?._id || data.service;
      const employeeId = data.employee?._id || data.employee;
      
      const employee = employees.find(e => {
        const eId = e._id?.toString();
        const dId = employeeId?.toString();
        return eId === dId;
      }) || data.employee;
      
      const service = allServices.find(s => {
        const sId = s._id?.toString();
        const dId = serviceId?.toString();
        return sId === dId;
      }) || data.service;
      
      setFormData({
        service: service,
        employee: employee,
        date: dateStr,
        time: timeStr,
        notes: data.notes || ''
      });
    } catch (err) {
      setError(err.response?.data?.message || t.editAppointment.loadingAppointment);
    } finally {
      setLoading(false);
    }
  };

  const loadServicesAndCategories = async () => {
    try {
      setLoadingServices(true);
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceAPI.getServices(user.barbershopId, true),
        serviceAPI.getCategories(user.barbershopId, true)
      ]);
      const servicesData = servicesRes.data || servicesRes;
      const categoriesData = categoriesRes.data || categoriesRes;
      setAllServices(servicesData);
      setCategories(categoriesData);
      console.log('Loaded services:', servicesData.length);
      console.log('Loaded categories:', categoriesData.length);
    } catch (err) {
      console.error('Error loading services:', err);
      setError(t.editAppointment.loadingServices);
    } finally {
      setLoadingServices(false);
    }
  };

  const loadEmployeeServices = (employeeId) => {
    try {
      // Find the employee in the already-loaded employees array
      const employee = employees.find(emp => {
        const empId = emp._id?.toString();
        const targetId = employeeId?.toString();
        return empId === targetId;
      });
      
      if (!employee) {
        console.warn('Employee not found in loaded employees');
        setEmployeeServiceIds([]);
        return;
      }
      
      // Extract service IDs from employee's services array
      const employeeServices = employee.services || [];
      const serviceIds = employeeServices.map(s => {
        if (typeof s === 'string') return s;
        if (s?._id) return s._id.toString();
        return String(s);
      });
      
      setEmployeeServiceIds(serviceIds);
      console.log('Employee service IDs extracted:', serviceIds.length);
    } catch (err) {
      console.error('Error extracting employee services:', err);
      setEmployeeServiceIds([]);
    }
  };

  // Filter services whenever employeeServiceIds or allServices changes
  useEffect(() => {
    if (employeeServiceIds.length > 0 && allServices.length > 0) {
      const serviceIdsSet = new Set(employeeServiceIds);
      const filtered = allServices.filter(service => {
        const serviceId = service._id?.toString();
        return serviceIdsSet.has(serviceId);
      });
      setFilteredServices(filtered);
      console.log('Filtered services for employee:', filtered.length);
      console.log('Filtered services data:', filtered);
    } else if (employeeServiceIds.length === 0 && allServices.length > 0 && !formData.employee) {
      // No employee selected, show all
      setFilteredServices(allServices);
    }
  }, [employeeServiceIds, allServices, formData.employee]);

  const loadEmployees = async () => {
    try {
      const data = await employeeAPI.getEmployees(user.barbershopId, true);
      setEmployees(data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const slots = await appointmentAPI.getAvailableSlots(
        user.barbershopId,
        formData.employee._id,
        formData.service._id,
        formData.date
      );
      setAvailableSlots(slots || []);
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (e) => {
    const serviceId = e.target.value;
    const service = filteredServices.find(s => s._id === serviceId) || allServices.find(s => s._id === serviceId);
    setFormData(prev => ({ ...prev, service }));
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find(e => e._id === employeeId);
    
    // When employee changes, clear service if it's not available for the new employee
    setFormData(prev => {
      const newEmployeeId = employee?._id?.toString();
      const prevEmployeeId = prev.employee?._id?.toString();
      
      // If employee changed, clear the service
      if (newEmployeeId !== prevEmployeeId) {
        return { ...prev, employee, service: null };
      }
      return { ...prev, employee };
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      
      if (!formData.service || !formData.employee || !formData.date || !formData.time) {
        setError(t.editAppointment.allRequired);
        return;
      }

      // Delete old appointment
      await appointmentAPI.deleteAppointment(id);
      
      // Create new appointment
      await appointmentAPI.createAppointment({
        clientId: appointment.client?._id,
        clientData: {
          name: appointment.client?.name,
          phone: appointment.client?.phone,
          email: appointment.client?.email
        },
        employeeId: formData.employee._id,
        serviceId: formData.service._id,
        date: formData.date,
        startTime: formData.time,
        notes: formData.notes
      });
      
      setSuccess(t.editAppointment.updatedSuccess);
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || t.editAppointment.loadingAppointment);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    });
  };

  const getServicesByCategory = (categoryId) => {
    if (!categoryId) return [];
    const servicesToUse = formData.employee ? filteredServices : allServices;
    return servicesToUse.filter(s => {
      const sCatId = s.categoryId?.toString();
      const catId = categoryId.toString();
      return sCatId === catId;
    });
  };

  const getTotalPrice = () => {
    return formData.service?.price || 0;
  };

  if (loading || loadingServices) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">{t.editAppointment.loadingAppointment}</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="dashboard-container">
        <div className="card-surface">
          <div className="text-center py-8">
            <p className="text-red-600">{t.editAppointment.appointmentNotFound}</p>
            <button onClick={() => navigate('/appointments')} className="btn-secondary mt-4">
              {t.editAppointment.backToAppointments}
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
          <h1 className="dash-title">{t.editAppointment.title}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/appointments')} className="btn-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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

      <div className="edit-appointment-container">
        {/* Left Column */}
        <div className="edit-appointment-left">
          {/* Services Section */}
          <div className="edit-section">
            <h3 className="edit-section-title">{t.editAppointment.services}</h3>
            
            {/* Employee Selection First */}
            <div className="form-group">
              <label className="form-label">{t.editAppointment.employee} *</label>
              <div className="employee-select-wrapper">
                <select
                  name="employee"
                  value={formData.employee?._id || ''}
                  onChange={handleEmployeeChange}
                  className="input"
                  required
                >
                  <option value="">{t.editAppointment.selectEmployee}</option>
                  {employees.map(employee => (
                    <option key={employee._id} value={employee._id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                {formData.employee && (
                  <div className="employee-avatar-small">
                    {formData.employee.photo ? (
                      <img src={formData.employee.photo} alt={formData.employee.name} />
                    ) : (
                      formData.employee.name.charAt(0).toUpperCase()
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Service Selection - Only shows services for selected employee */}
            <div className="form-group">
              <label className="form-label">{t.editAppointment.service} *</label>
              {loadingServices ? (
                <div className="no-services-message">
                  <p className="text-gray-600">{t.editAppointment.loadingServices}</p>
                </div>
              ) : !formData.employee ? (
                <div className="no-services-message">
                  <p className="text-gray-600">{t.editAppointment.selectEmployeeFirst}</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="no-services-message">
                  <p className="text-gray-600">{t.editAppointment.noServices}</p>
                </div>
              ) : (
                <select
                  name="service"
                  value={formData.service?._id || ''}
                  onChange={handleServiceChange}
                  className="input"
                  required
                  disabled={!formData.employee}
                >
                  <option value="">{t.editAppointment.selectService}</option>
                  {(() => {
                    console.log('Rendering services dropdown. Filtered services count:', filteredServices.length);
                    console.log('Categories count:', categories.length);
                    
                    // If no categories, just render all filtered services
                    if (categories.length === 0) {
                      return filteredServices.map(service => (
                        <option key={service._id} value={service._id}>
                          {service.name} - {getCurrencySymbol()}{service.price} ({service.duration} min)
                        </option>
                      ));
                    }
                    
                    // Get services with categories
                    const servicesWithCategories = [];
                    const servicesWithoutCategories = [];
                    
                    filteredServices.forEach(service => {
                      const hasCategory = service.categoryId && 
                                        (typeof service.categoryId === 'object' ? service.categoryId._id : service.categoryId);
                      if (hasCategory) {
                        servicesWithCategories.push(service);
                      } else {
                        servicesWithoutCategories.push(service);
                      }
                    });
                    
                    console.log('Services with categories:', servicesWithCategories.length);
                    console.log('Services without categories:', servicesWithoutCategories.length);
                    
                    // Group services with categories by category
                    const categoryMap = new Map();
                    servicesWithCategories.forEach(service => {
                      let categoryId;
                      if (typeof service.categoryId === 'object' && service.categoryId !== null) {
                        categoryId = service.categoryId._id?.toString() || service.categoryId._id;
                      } else {
                        categoryId = service.categoryId?.toString();
                      }
                      
                      if (!categoryMap.has(categoryId)) {
                        categoryMap.set(categoryId, []);
                      }
                      categoryMap.get(categoryId).push(service);
                    });
                    
                    const categoryGroups = [];
                    const renderedCategoryIds = new Set();
                    
                    // Render services grouped by category
                    categories.forEach(category => {
                      const categoryId = category._id?.toString();
                      const categoryServices = categoryMap.get(categoryId) || [];
                      if (categoryServices.length > 0) {
                        renderedCategoryIds.add(categoryId);
                        categoryGroups.push(
                          <optgroup key={category._id} label={`${category.name} (${categoryServices.length})`}>
                            {categoryServices.map(service => (
                              <option key={service._id} value={service._id}>
                                {service.name} - {getCurrencySymbol()}{service.price} ({service.duration} min)
                              </option>
                            ))}
                          </optgroup>
                        );
                      }
                    });
                    
                    // Also check for services with categories that don't match any existing category
                    categoryMap.forEach((services, catId) => {
                      if (!renderedCategoryIds.has(catId)) {
                        servicesWithoutCategories.push(...services);
                      }
                    });
                    
                    return (
                      <>
                        {categoryGroups}
                        {/* Render services without categories */}
                        {servicesWithoutCategories.length > 0 && (
                          <optgroup label={`Other (${servicesWithoutCategories.length})`}>
                            {servicesWithoutCategories.map(service => (
                              <option key={service._id} value={service._id}>
                                {service.name} - {getCurrencySymbol()}{service.price} ({service.duration} min)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}
                </select>
              )}
            </div>

            {formData.service && (
              <div className="form-group">
                <label className="form-label">{t.editAppointment.duration}</label>
                <input
                  type="text"
                  value={`${formData.service.duration} min`}
                  className="input"
                  disabled
                />
              </div>
            )}
          </div>

          {/* Date and Time Section */}
          <div className="edit-section">
            <h3 className="edit-section-title">{t.editAppointment.dateAndTime}</h3>
            
            <div className="form-group">
              <label className="form-label">{t.editAppointment.dateAndTimeLabel}</label>
              <div className="datetime-inputs">
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
                <button
                  type="button"
                  onClick={loadAvailableSlots}
                  className="btn-secondary"
                  disabled={!formData.employee || !formData.service || !formData.date}
                >
                  {t.editAppointment.findAvailabilities}
                </button>
              </div>
              {availableSlots.length > 0 && (
                <div className="available-slots-container">
                  <p className="text-sm text-gray-600 mb-2">{t.editAppointment.availableSlots}</p>
                  <div className="slots-grid">
                    {availableSlots.map((slot, index) => {
                      const timeStr = slot.startLocalISO ? slot.startLocalISO.split('T')[1]?.substring(0, 5) : '';
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, time: timeStr }))}
                          className={`slot-button ${formData.time === timeStr ? 'slot-selected' : ''}`}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Note Section */}
          <div className="edit-section">
            <div className="note-header">
              <h3 className="edit-section-title">{t.editAppointment.note}</h3>
              <svg className="note-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              className="input"
              rows="4"
              placeholder={t.editAppointment.notePlaceholder}
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="edit-appointment-right">
          {/* Customer Section */}
          <div className="edit-section">
            <h3 className="edit-section-title">{t.editAppointment.customer}</h3>
            <div className="customer-info">
              <div className="customer-avatar">
                {appointment.client?.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div className="customer-details">
                <h4 className="customer-name">{appointment.client?.name || 'Unknown'}</h4>
                <div className="customer-contact">
                  <p className="text-orange-600">
                    {appointment.client?.phone || t.editAppointment.noPhone}
                  </p>
                  <p className="text-orange-600">
                    {appointment.client?.email || t.editAppointment.noEmail}
                  </p>
                </div>
                {!appointment.client?.phone && !appointment.client?.email && (
                  <span className="customer-badge">
                    It is {appointment.client?.name?.split(' ')[0] || 'customer'}'s {t.editAppointment.firstAppointment}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="edit-section">
            <div className="summary-item">
              <span className="summary-label">{t.editAppointment.dateAndTimeLabel}</span>
              <span className="summary-value">
                {formData.date ? formatDate(formData.date) : t.editAppointment.notSet} - {formData.time || t.editAppointment.notSet}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t.editAppointment.price}</span>
              <span className="summary-value">
                {getCurrencySymbol()}{getTotalPrice().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="btn-primary w-full"
            disabled={!formData.service || !formData.employee || !formData.date || !formData.time}
          >
            {t.editAppointment.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAppointmentNew;
