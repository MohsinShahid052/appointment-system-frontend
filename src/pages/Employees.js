import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../apis/employeeAPI';
import { serviceAPI } from '../apis/serviceAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Employees = () => {
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('active');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: '',
    services: [],
    notes: '',
    gender: ''
  });

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

  useEffect(() => {
    loadAllEmployees();
    fetchBarbershopCurrency();
  }, []);

  const loadAllEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Loading employees for barbershop:', user.barbershopId);
      
      // Load ALL employees without any active filter
      const employees = await employeeAPI.getEmployees(user.barbershopId);
      
      console.log('API Response:', employees);
      console.log('Total employees:', employees.length);
      console.log('Active employees:', employees.filter(emp => emp.isActive).length);
      console.log('Inactive employees:', employees.filter(emp => !emp.isActive).length);
      
      setAllEmployees(employees);
      
    } catch (err) {
      console.error('Error loading employees:', err);
      setError(err.response?.data?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
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

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
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

  // Remove photo
  const handleRemovePhoto = () => {
    setFormData(prev => ({
      ...prev,
      photo: ''
    }));
    setPhotoPreview('');
  };

  // Take photo from camera
  const handleTakePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    input.onchange = (e) => handlePhotoUpload(e);
    input.click();
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await employeeAPI.createEmployee({
        ...formData,
        barbershopId: user.barbershopId
      });
      setSuccess('Employee created successfully!');
      setShowCreateForm(false);
      resetForm();
      loadAllEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee');
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      photo: '',
      services: [],
      notes: '',
      gender: ''
    });
    setPhotoPreview('');
  };

  const handleDeleteEmployee = async (id, employeeName) => {
    if (window.confirm(`Are you sure you want to deactivate ${employeeName}?`)) {
      setError('');
      setSuccess('');
      
      try {
        const result = await employeeAPI.deleteEmployee(id);
        console.log('Delete result:', result);
        setSuccess(`${employeeName} has been deactivated successfully!`);
        
        // Update local state immediately
        setAllEmployees(prev => 
          prev.map(emp => 
            emp._id === id ? { ...emp, isActive: false } : emp
          )
        );
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to deactivate employee');
      }
    }
  };

  const handleRestoreEmployee = async (id, employeeName) => {
    setError('');
    setSuccess('');
    
    try {
      const result = await employeeAPI.restoreEmployee(id);
      console.log('Restore result:', result);
      setSuccess(`${employeeName} has been activated successfully!`);
      
      // Update local state immediately
      setAllEmployees(prev => 
        prev.map(emp => 
          emp._id === id ? { ...emp, isActive: true } : emp
        )
      );
      
    } catch (err) {
      console.error('Restore error:', err);
      setError(err.response?.data?.message || 'Failed to activate employee');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get employees based on current filter
  const getFilteredEmployees = () => {
    let employeesToShow = allEmployees;

    // Apply status filter
    if (activeFilter === 'active') {
      employeesToShow = allEmployees.filter(emp => emp.isActive);
    } else if (activeFilter === 'inactive') {
      employeesToShow = allEmployees.filter(emp => !emp.isActive);
    }

    // Apply search filter
    if (searchTerm) {
      employeesToShow = employeesToShow.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return employeesToShow;
  };

  // Helper function to display services
  const renderServices = (services) => {
    if (!services || services.length === 0) {
      return <span className="text-gray-500 text-sm">No services assigned</span>;
    }

    // Show first 2-3 services with details
    const visibleServices = services.slice(0, 3);
    const remainingCount = services.length - visibleServices.length;

    return (
      <div className="space-y-1">
        {visibleServices.map((service, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">
              {typeof service === 'object' ? service.name : 'Service'}
            </span>
            {typeof service === 'object' && (
              <span className="text-gray-500 text-xs">
                {getCurrencySymbol()}{service.price} • {service.duration}min
              </span>
            )}
          </div>
        ))}
        {remainingCount > 0 && (
          <div className="text-xs text-gray-500">
            +{remainingCount} more service{remainingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get service count text
  const getServiceCountText = (services) => {
    if (!services || services.length === 0) return 'No services';
    return `${services.length} service${services.length !== 1 ? 's' : ''}`;
  };

  const filteredEmployees = getFilteredEmployees();
  const activeCount = allEmployees.filter(emp => emp.isActive).length;
  const inactiveCount = allEmployees.filter(emp => !emp.isActive).length;

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">Employees</h1>
          <p className="dash-welcome">Manage your barbershop team and their services</p>
          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-1">
            Total: {allEmployees.length} | Active: {activeCount} | Inactive: {inactiveCount}
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
          style={{maxWidth: '200px'}}
        >
          Add Employee
        </button>
      </div>

      {/* Status Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'active' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setActiveFilter('inactive')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'inactive' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'all' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({allEmployees.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Success and Error Messages */}
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

      {/* Create Employee Form */}
      {showCreateForm && (
        <div className="card-surface fade-in mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Add New Employee</h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>
          
          <form onSubmit={handleCreateEmployee} className="space-y-6">
            {/* Photo Upload Section */}
            <div className="form-group">
              <label className="form-label">Profile Photo</label>
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
                  <p className="image-hint">JPG/PNG up to ~1MB after compression</p>
                </div>
              </div>
            </div>

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
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
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
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Additional notes about the employee"
                  rows="3"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="btn-primary"
                style={{maxWidth: '200px'}}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? 'Uploading...' : 'Create Employee'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employees Grid */}
      <div className="barbershop-grid">
        {filteredEmployees.map((employee) => (
          <div key={employee._id} className="barbershop-card fade-in">
            <div className="barbershop-header">
              <div className="barbershop-avatar">
                {employee.photo ? (
                  <img 
                    src={employee.photo} 
                    alt={employee.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  employee.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`barbershop-status ${
                employee.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {employee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <h3 className="stat-value text-lg mb-2">{employee.name}</h3>
            
            {employee.gender && (
              <div className="text-sm text-gray-600 mb-2 capitalize">
                {employee.gender}
              </div>
            )}
            
            <div className="barbershop-info">
              {employee.email && (
                <div className="info-item">
                  <div className="info-dot"></div>
                  {employee.email}
                </div>
              )}
              {employee.phone && (
                <div className="info-item">
                  <div className="info-dot"></div>
                  {employee.phone}
                </div>
              )}
              
              {/* Services Section - Enhanced Display */}
              <div className="info-item">
                <div className="info-dot"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-700">
                      {getServiceCountText(employee.services)}
                    </span>
                  </div>
                  {renderServices(employee.services)}
                </div>
              </div>

              {employee.notes && (
                <div className="info-item text-xs text-gray-500">
                  <div className="info-dot"></div>
                  <span className="italic">{employee.notes}</span>
                </div>
              )}
            </div>

            <div className="barbershop-actions">
              <button
                onClick={() => navigate(`/employee/edit/${employee._id}`)}
                className="action-btn action-primary"
              >
                Edit Services
              </button>
              {employee.isActive ? (
                <button
                  onClick={() => handleDeleteEmployee(employee._id, employee.name)}
                  className="action-btn action-secondary"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => handleRestoreEmployee(employee._id, employee.name)}
                  className="action-btn action-primary"
                >
                  Activate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="empty-title">
            {activeFilter === 'inactive' ? 'No inactive employees' :
             activeFilter === 'active' ? 'No active employees' : 'No employees found'}
          </h3>
          <p className="empty-description">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : activeFilter === 'inactive'
                ? 'All employees are currently active'
                : 'Get started by adding your first employee'
            }
          </p>
          {!searchTerm && activeFilter === 'active' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary"
              style={{maxWidth: '200px'}}
            >
              Add Employee
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Employees;