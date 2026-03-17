// pages/Services.js
import React, { useState, useEffect } from 'react';
import { serviceAPI } from '../apis/serviceAPI';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useLanguage } from '../contexts/LanguageContext';

const Services = () => {
  const toast = useToast();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR'); // Default to EUR
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    categoryId: ''
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: ''
  });

  // Currency helper functions
  const getCurrencySymbol = () => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      TRY: '₺'
    };
    return currencySymbols[barbershopCurrency] || '€';
  };

  // Fetch barbershop data to get currency
  const fetchBarbershopCurrency = async () => {
    try {
      const response = await serviceAPI.getBarbershop(user.barbershopId);
      console.log('Fetched barbershop data:', response.data);

      if (response.data?.currency) {
        console.log('Barbershop currency found:', response.data.currency);
        setBarbershopCurrency(response.data.currency);
        console.log('Loaded currency from barbershop:', response.data.currency);
      } else {
        console.log('No currency found in barbershop, using default EUR');
      }
    } catch (err) {
      console.error('Failed to fetch barbershop currency:', err);
      // If we can't fetch the barbershop, try to get currency from existing services
      if (services.length > 0) {
        const serviceWithCurrency = services.find(service => service.currency);
        if (serviceWithCurrency) {
          setBarbershopCurrency(serviceWithCurrency.currency);
          console.log('Loaded currency from existing service:', serviceWithCurrency.currency);
        }
      }
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch ALL services and categories (active + inactive)
      const [servicesRes, categoriesRes] = await Promise.all([
        serviceAPI.getServices(user.barbershopId, null),
        serviceAPI.getCategories(user.barbershopId, null)
      ]);

      const servicesData = servicesRes.data || servicesRes;
      const categoriesData = categoriesRes.data || categoriesRes;

      setServices(servicesData);
      setCategories(categoriesData);

      // Fetch barbershop currency after loading services
      await fetchBarbershopCurrency();
      
    } catch (err) {
      const errorMessage = err.userMessage || 'Failed to load data';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ------------------ Service Functions ------------------
  const handleCreateService = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await serviceAPI.createService({
        ...serviceFormData,
        barbershopId: user.barbershopId,
        price: parseFloat(serviceFormData.price),
        duration: parseInt(serviceFormData.duration),
        currency: barbershopCurrency // Use the barbershop currency
      });
      const successMessage = t.services.serviceCreated;
      setSuccess(successMessage);
      toast.success(successMessage);
      setShowServiceForm(false);
      resetServiceForm();
      loadData();
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to create service';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await serviceAPI.updateService(editingService._id, {
        ...serviceFormData,
        price: parseFloat(serviceFormData.price),
        duration: parseInt(serviceFormData.duration),
        currency: barbershopCurrency // Use the barbershop currency
      });
      const successMessage = t.services.serviceUpdated;
      setSuccess(successMessage);
      toast.success(successMessage);
      setShowServiceForm(false);
      resetServiceForm();
      loadData();
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to update service';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteService = async (serviceId, serviceName) => {
    if (window.confirm(`${t.services.deactivateConfirm} "${serviceName}"?`)) {
      try {
        await serviceAPI.deleteService(serviceId);
        const successMessage = t.services.serviceDeactivated;
        setSuccess(successMessage);
        toast.success(successMessage);
        loadData();
      } catch (err) {
        const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to deactivate service';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const handleRestoreService = async (serviceId, serviceName) => {
    try {
      await serviceAPI.restoreService(serviceId);
      const successMessage = `"${serviceName}" ${t.services.activated}`;
      setSuccess(successMessage);
      toast.success(successMessage);
      loadData();
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to activate service';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // ------------------ Category Functions ------------------
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await serviceAPI.createCategory({
        ...categoryFormData,
        barbershopId: user.barbershopId
      });
      const successMessage = t.services.categoryCreated;
      setSuccess(successMessage);
      toast.success(successMessage);
      setShowCategoryForm(false);
      resetCategoryForm();
      loadData();
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to create category';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await serviceAPI.updateCategory(editingCategory._id, categoryFormData);
      const successMessage = t.services.categoryUpdated;
      setSuccess(successMessage);
      toast.success(successMessage);
      setShowCategoryForm(false);
      resetCategoryForm();
      loadData();
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to update category';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`${t.services.deactivateCategoryConfirm} "${categoryName}" ${t.services.andAllServices}`)) {
      try {
        await serviceAPI.deleteCategory(categoryId);
        const successMessage = t.services.categoryDeactivated;
        setSuccess(successMessage);
        toast.success(successMessage);
        loadData();
      } catch (err) {
        const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to deactivate category';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  const handleRestoreCategory = async (categoryId, categoryName) => {
    try {
      await serviceAPI.restoreCategory(categoryId);
      const successMessage = `"${categoryName}" ${t.services.activated}`;
      setSuccess(successMessage);
      toast.success(successMessage);
      loadData();
    } catch (err) {
      const errorMessage = err.userMessage || err.response?.data?.message || 'Failed to activate category';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // ------------------ Form Management ------------------
  const resetServiceForm = () => {
    setServiceFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      categoryId: ''
    });
    setEditingService(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: ''
    });
    setEditingCategory(null);
  };

  const handleEditService = (service) => {
    setServiceFormData({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      categoryId: service.categoryId._id || service.categoryId
    });
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleEditCategory = (category) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditingCategory(category);
    setShowCategoryForm(true);
  };

  // ------------------ Filtering ------------------
  const getFilteredServices = () => {
    let filtered = services;

    if (activeFilter === 'active') {
      filtered = filtered.filter(service => service.isActive);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(service => !service.isActive);
    }

    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();
  const activeServicesCount = services.filter(s => s.isActive).length;
  const inactiveServicesCount = services.filter(s => !s.isActive).length;
  const activeCategories = categories.filter(c => c.isActive);

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // ------------------ Render ------------------
  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">{t.services.title}</h1>
          <p className="dash-welcome">{t.services.subtitle}</p>
          <p className="text-sm text-gray-600 mt-1">
            {`${t.common.currency}: ${barbershopCurrency} (${getCurrencySymbol()})`}
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setShowCategoryForm(true)} className="btn-secondary">
            {t.services.addCategory}
          </button>
          <button onClick={() => setShowServiceForm(true)} className="btn-primary">
            {t.services.addService}
          </button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Service Form */}
      {showServiceForm && (
        <div className="card-surface fade-in mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">{editingService ? t.services.editService : t.services.createService}</h3>
            <button
              onClick={() => {
                setShowServiceForm(false);
                resetServiceForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={editingService ? handleUpdateService : handleCreateService} className="space-y-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{`${t.services.serviceName} *`}</label>
                <input
                  type="text"
                  value={serviceFormData.name}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, name: e.target.value })}
                  required
                  className="input"
                  placeholder="e.g., Haircut"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{`${t.services.category} *`}</label>
                <select
                  value={serviceFormData.categoryId}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, categoryId: e.target.value })}
                  required
                  className="input"
                >
                  <option value="">{t.services.selectCategory}</option>
                  {activeCategories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{`${t.common.price} (${getCurrencySymbol()}) *`}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={serviceFormData.price}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, price: e.target.value })}
                  required
                  className="input"
                  placeholder={`0.00 ${getCurrencySymbol()}`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t.services.currencyNote}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">{`${t.services.durationMinutes} *`}</label>
                <input
                  type="number"
                  min="1"
                  value={serviceFormData.duration}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, duration: e.target.value })}
                  required
                  className="input"
                  placeholder="30"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">{t.common.description}</label>
                <textarea
                  value={serviceFormData.description}
                  onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                  className="input"
                  placeholder="Service description..."
                  rows="3"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary">
                {editingService ? t.services.updateService : t.services.createService}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowServiceForm(false);
                  resetServiceForm();
                }}
                className="btn-secondary"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category Form */}
      {showCategoryForm && (
        <div className="card-surface fade-in mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">{editingCategory ? t.services.editCategory : t.services.createCategory}</h3>
            <button
              onClick={() => {
                setShowCategoryForm(false);
                resetCategoryForm();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{`${t.services.categoryName} *`}</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                  className="input"
                  placeholder="e.g., Hair Services, Beard Services"
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">{t.common.description}</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="input"
                  placeholder="Category description..."
                  rows="2"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary">
                {editingCategory ? t.services.updateCategory : t.services.createCategory}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false);
                  resetCategoryForm();
                }}
                className="btn-secondary"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
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
            {`${t.common.active} (${activeServicesCount})`}
          </button>
          <button
            onClick={() => setActiveFilter('inactive')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'inactive'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {`${t.common.inactive} (${inactiveServicesCount})`}
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {`${t.common.all} (${services.length})`}
          </button>
        </div>

        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={t.services.searchServices}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Categories Section */}
      <div className="card-surface mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title1">Categories</h3>
          <span className="text-sm text-gray-500">
            {categories.filter(c => c.isActive).length} {t.common.active}
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-title">{t.services.noCategoriesFound}</h3>
            <p className="empty-description">
              {t.services.createFirstCategory}
            </p>
            <button
              onClick={() => setShowCategoryForm(true)}
              className="btn-primary"
            >
              {t.services.addCategory}
            </button>
          </div>
        ) : (
          <div className="barbershop-grid">
            {categories.map((category) => (
              <div key={category._id} className="barbershop-card fade-in">
                <div className="barbershop-header">
                  <div className="barbershop-avatar">
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`status-badge ${category.isActive ? 'status-active' : 'status-inactive'}`}>
                    {category.isActive ? t.common.active : t.common.inactive}
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#111827' }}>
                    {category.name}
                  </h4>
                  {category.description && (
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                      {category.description}
                    </p>
                  )}
                </div>

                <div className="barbershop-info">
                  <div className="info-item">
                    <div className="info-dot"></div>
                    <span>
                      {services.filter(
                        s => s.categoryId === category._id || s.categoryId?._id === category._id
                      ).length} services
                    </span>
                  </div>
                </div>

                <div className="barbershop-actions">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="action-btn action-primary"
                  >
                    {t.common.edit}
                  </button>
                  {category.isActive ? (
                    <button
                      onClick={() => handleDeleteCategory(category._id, category.name)}
                      className="action-btn action-secondary"
                    >
                      {t.common.deactivate}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreCategory(category._id, category.name)}
                      className="action-btn action-primary"
                    >
                      {t.common.activate}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Services Grid */}
      <div className="card-surface">
        <h3 className="section-title1">Services</h3>

        {filteredServices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✂️</div>
            <h3 className="empty-title">{t.services.noServicesFound}</h3>
            <p className="empty-description">
              {searchTerm
                ? t.employees.adjustSearch
                : activeFilter === 'inactive'
                  ? t.employees.allEmployeesActive
                  : t.services.createFirstService
              }
            </p>
            {!searchTerm && activeFilter === 'active' && (
              <button
                onClick={() => setShowServiceForm(true)}
                className="btn-primary"
              >
                {t.services.addService}
              </button>
            )}
          </div>
        ) : (
          <div className="barbershop-grid">
            {filteredServices.map((service) => (
              <div key={service._id} className="barbershop-card fade-in">
                <div className="barbershop-header">
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>
                      {service.name}
                    </h4>
                    <span className="service-tag">
                      {service.categoryId?.name || t.services.uncategorized}
                    </span>
                  </div>
                  <span className={`status-badge ${service.isActive ? 'status-active' : 'status-inactive'}`}>
                    {service.isActive ? t.common.active : t.common.inactive}
                  </span>
                </div>

                <div className="barbershop-info">
                  <div className="info-item">
                    <div className="info-dot"></div>
                    <span>{getCurrencySymbol()}{service.price} • {service.duration} min</span>
                  </div>
                  {service.description && (
                    <div className="info-item">
                      <div className="info-dot"></div>
                      <span>{service.description}</span>
                    </div>
                  )}
                </div>

                <div className="barbershop-actions">
                  <button
                    onClick={() => handleEditService(service)}
                    className="action-btn action-primary"
                  >
                    {t.common.edit}
                  </button>
                  {service.isActive ? (
                    <button
                      onClick={() => handleDeleteService(service._id, service.name)}
                      className="action-btn action-secondary"
                    >
                      {t.common.deactivate}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreService(service._id, service.name)}
                      className="action-btn action-primary"
                    >
                      {t.common.activate}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Services;
