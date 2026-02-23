// pages/EmployeeEdit.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeAPI } from '../apis/employeeAPI';
import { serviceAPI } from '../apis/serviceAPI';
import { useAuth } from '../contexts/AuthContext';

const EmployeeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isCreating = !id;
  
  const [employee, setEmployee] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR');
  const [loading, setLoading] = useState(!isCreating);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

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
      const response = await serviceAPI.getBarbershop(user.barbershopId);
      if (response.data?.currency) {
        setBarbershopCurrency(response.data.currency);
      }
    } catch (err) {
      console.error('Failed to fetch barbershop currency:', err);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    services: [], // This matches your backend services array
    workingHours: {
      mon: { start: '09:00', end: '18:00', isWorkingDay: true },
      tue: { start: '09:00', end: '18:00', isWorkingDay: true },
      wed: { start: '09:00', end: '18:00', isWorkingDay: true },
      thu: { start: '09:00', end: '18:00', isWorkingDay: true },
      fri: { start: '09:00', end: '18:00', isWorkingDay: true },
      sat: { start: '10:00', end: '16:00', isWorkingDay: true },
      sun: { start: '', end: '', isWorkingDay: false }
    },
    notes: '',
    isActive: true
  });

  useEffect(() => {
    if (!isCreating) {
      fetchEmployee();
    }
    loadServicesAndCategories();
    fetchBarbershopCurrency();
  }, [id]);

  const loadServicesAndCategories = async () => {
    try {
      // Only load ACTIVE services for employee assignment
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceAPI.getServices(user.barbershopId, true), // true = only active services
        serviceAPI.getCategories(user.barbershopId, true) // true = only active categories
      ]);
      
      console.log('Active services loaded:', servicesRes.data.length);
      console.log('Active categories loaded:', categoriesRes.data.length);
      
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error('Error loading services and categories:', err);
    }
  };

  const fetchEmployee = async () => {
    try {
      const data = await employeeAPI.getEmployeeById(id);
      setEmployee(data);
      
      // Convert services array to the format your backend expects
      const employeeServices = data.services || [];
      
      setFormData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        photo: data.photo || '',
        services: employeeServices, // Direct array assignment
        workingHours: data.workingHours || formData.workingHours,
        notes: data.notes || '',
        isActive: data.isActive !== undefined ? data.isActive : true
      });
      setPhotoPreview(data.photo || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data exactly as your backend expects
      const employeeData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        photo: formData.photo,
        services: formData.services, // Array of service IDs
        workingHours: formData.workingHours,
        notes: formData.notes,
        isActive: formData.isActive
      };

      if (isCreating) {
        await employeeAPI.createEmployee(employeeData);
        setSuccess('Employee created successfully!');
        setTimeout(() => navigate('/employees'), 2000);
      } else {
        await employeeAPI.updateEmployee(id, employeeData);
        setSuccess('Employee updated successfully!');
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isCreating ? 'create' : 'update'} employee`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const compressImage = (file, maxDimension = 500, quality = 0.55) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
          const width = img.width * scale;
          const height = img.height * scale;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Photo upload helpers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      if (compressed.length > 0.9 * 1024 * 1024) {
        setError('Compressed image is still too large. Please choose a smaller image.');
        setUploadingPhoto(false);
        return;
      }
      setFormData(prev => ({
        ...prev,
        photo: compressed
      }));
      setPhotoPreview(compressed);
      setError('');
    } catch (err) {
      setError('Failed to process image. Please try another file.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
    setPhotoPreview('');
  };

  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handlePhotoUpload(e);
    input.click();
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  const toggleWorkingDay = (day) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          isWorkingDay: !prev.workingHours[day].isWorkingDay
        }
      }
    }));
  };

  // Service Assignment Functions - Only active services are available
  const toggleServiceSelection = (serviceId) => {
    setFormData(prev => {
      const currentServices = prev.services || [];
      const serviceIndex = currentServices.findIndex(id => id === serviceId);
      
      let newServices;
      if (serviceIndex > -1) {
        // Remove service
        newServices = currentServices.filter(id => id !== serviceId);
      } else {
        // Add service
        newServices = [...currentServices, serviceId];
      }
      
      return {
        ...prev,
        services: newServices
      };
    });
  };

  const toggleAllServicesInCategory = (categoryId, selectAll = true) => {
    setFormData(prev => {
      const currentServices = prev.services || [];
      const categoryServices = getServicesByCategory(categoryId);
      
      const categoryServiceIds = categoryServices.map(service => service._id);
      
      let newServices;
      if (selectAll) {
        // Add all category services (remove duplicates)
        newServices = [...new Set([...currentServices, ...categoryServiceIds])];
      } else {
        // Remove all category services
        newServices = currentServices.filter(id => !categoryServiceIds.includes(id));
      }
      
      return {
        ...prev,
        services: newServices
      };
    });
  };

  const isServiceSelected = (serviceId) => {
    return formData.services.includes(serviceId);
  };

  const isCategoryFullySelected = (categoryId) => {
    const categoryServices = getServicesByCategory(categoryId);
    
    if (categoryServices.length === 0) return false;
    
    return categoryServices.every(service => 
      formData.services.includes(service._id)
    );
  };

  const isCategoryPartiallySelected = (categoryId) => {
    const categoryServices = getServicesByCategory(categoryId);
    
    if (categoryServices.length === 0) return false;
    
    const selectedCount = categoryServices.filter(service => 
      formData.services.includes(service._id)
    ).length;
    
    return selectedCount > 0 && selectedCount < categoryServices.length;
  };

  const getServicesByCategory = (categoryId) => {
    // All services are already active (filtered in loadServicesAndCategories)
    return services.filter(service => 
      service.categoryId === categoryId || service.categoryId?._id === categoryId
    );
  };

  const getSelectedServicesCount = () => {
    return formData.services.length;
  };

  const getSelectedServicesInCategoryCount = (categoryId) => {
    const categoryServices = getServicesByCategory(categoryId);
    return categoryServices.filter(service => 
      formData.services.includes(service._id)
    ).length;
  };

  // Filter out services that are assigned but no longer active
  const cleanupInactiveAssignedServices = () => {
    const activeServiceIds = services.map(service => service._id);
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(serviceId => activeServiceIds.includes(serviceId))
    }));
  };

  // Clean up inactive assigned services when services data changes
  useEffect(() => {
    if (services.length > 0 && formData.services.length > 0) {
      cleanupInactiveAssignedServices();
    }
  }, [services]);

  if (loading) return (
    <div className="center-screen">
      <div className="text-center fade-in">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Loading employee details...</p>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="card-surface fade-in">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="dash-title">
            {isCreating ? 'Add New Employee' : 'Edit Employee'}
          </h1>
          <p className="dash-welcome">
            {isCreating ? 'Create a new employee profile' : `Employee ID: ${id}`}
          </p>
          <div className="text-xs text-gray-500 mt-1">
            Available Services: {services.length} active • Categories: {categories.length} active
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-700 text-sm">{success}</div>
            </div>
          )}

          {/* Photo Upload */}
          <div className="form-section">
            <h3 className="form-section-title">Profile Photo</h3>
            <div className="image-upload">
              <div className="image-preview" style={{ borderRadius: '999px' }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <span className="image-placeholder">No photo</span>
                )}
              </div>

              <div className="image-actions">
                <label className="btn-secondary text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </label>
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="btn-secondary"
                >
                  Take Photo
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn-secondary"
                  >
                    Remove
                  </button>
                )}
                <p className="image-hint">JPG/PNG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Basic Information Section */}
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Enter employee name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value={true}>Active</option>
                  <option value={false}>Inactive</option>
                </select>
              </div>

              <div className="md:col-span-2 form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Additional notes"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Services Assignment Section */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="form-section-title">Assigned Services</h3>
              <div className="text-sm text-gray-500">
                {getSelectedServicesCount()} service(s) selected
              </div>
            </div>
            
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">

                <p className="text-gray-600">No active categories available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Create active categories and services first to assign to employees
                </p>
              </div>
            ) : (
              <div className="service-selection-container">
                {categories.map(category => {
                  const categoryServices = getServicesByCategory(category._id);
                  if (categoryServices.length === 0) return null;
                  
                  return (
                    <div key={category._id} className="service-category-card">
                      {/* Category Header */}
                      <div className="service-category-header">
                        <div className="service-category-title-group">
                          <input
                            type="checkbox"
                            checked={isCategoryFullySelected(category._id)}
                            ref={input => {
                              if (input) {
                                input.indeterminate = isCategoryPartiallySelected(category._id);
                              }
                            }}
                            onChange={(e) => toggleAllServicesInCategory(
                              category._id, 
                              e.target.checked
                            )}
                            className="service-checkbox"
                          />
                          <h4 className="service-category-title">
                            {category.name}
                          </h4>
                          {category.description && (
                            <span className="service-category-desc">
                              {category.description}
                            </span>
                          )}
                        </div>
                        <span className="service-category-count">
                          {getSelectedServicesInCategoryCount(category._id)}
                          /{categoryServices.length} selected
                        </span>
                      </div>

                      {/* Services List */}
                      <div className="service-list">
                        {categoryServices.map(service => (
                          <label 
                            key={service._id} 
                            className="service-item"
                          >
                            <input
                              type="checkbox"
                              checked={isServiceSelected(service._id)}
                              onChange={() => toggleServiceSelection(service._id)}
                              className="service-checkbox"
                            />
                            <div className="service-item-content">
                              <div className="service-item-header">
                                <span className="service-item-name">
                                  {service.name}
                                </span>
                                <div className="service-item-meta">
                                  <span className="service-price">{getCurrencySymbol()}{service.price}</span>
                                  <span className="service-duration">{service.duration} min</span>
                                </div>
                              </div>
                              {service.description && (
                                <p className="service-item-desc">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Uncategorized Services */}
                {(() => {
                  const uncategorizedServices = services.filter(service => 
                    !service.categoryId
                  );
                  
                  if (uncategorizedServices.length === 0) return null;
                  
                  return (
                    <div className="service-category-card">
                      <div className="service-category-header">
                        <h4 className="service-category-title">
                          Uncategorized Services
                        </h4>
                        <span className="service-category-count">
                          {uncategorizedServices.filter(s => isServiceSelected(s._id)).length}
                          /{uncategorizedServices.length} selected
                        </span>
                      </div>
                      <div className="service-list">
                        {uncategorizedServices.map(service => (
                          <label 
                            key={service._id} 
                            className="service-item"
                          >
                            <input
                              type="checkbox"
                              checked={isServiceSelected(service._id)}
                              onChange={() => toggleServiceSelection(service._id)}
                              className="service-checkbox"
                            />
                            <div className="service-item-content">
                              <div className="service-item-header">
                                <span className="service-item-name">
                                  {service.name}
                                </span>
                                <div className="service-item-meta">
                                  <span className="service-price">{getCurrencySymbol()}{service.price}</span>
                                  <span className="service-duration">{service.duration} min</span>
                                </div>
                              </div>
                              {service.description && (
                                <p className="service-item-desc">
                                  {service.description}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Working Hours Section */}
          <div className="form-section">
            <h3 className="form-section-title">Working Hours</h3>
            <div className="space-y-3">
              {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 min-w-24">
                    <input
                      type="checkbox"
                      checked={formData.workingHours[day]?.isWorkingDay || false}
                      onChange={() => toggleWorkingDay(day)}
                      className="rounded"
                    />
                    <span className="capitalize font-medium">
                      {day === 'mon' ? 'Monday' :
                       day === 'tue' ? 'Tuesday' :
                       day === 'wed' ? 'Wednesday' :
                       day === 'thu' ? 'Thursday' :
                       day === 'fri' ? 'Friday' :
                       day === 'sat' ? 'Saturday' : 'Sunday'}
                    </span>
                  </label>
                  
                  {formData.workingHours[day]?.isWorkingDay && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={formData.workingHours[day]?.start || ''}
                        onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                        className="input text-sm"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={formData.workingHours[day]?.end || ''}
                        onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                        className="input text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
              style={{maxWidth: '200px'}}
            >
              {saving ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isCreating ? 'Creating...' : 'Saving...'}
                </div>
              ) : (
                isCreating ? 'Create Employee' : 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeEdit;