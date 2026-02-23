import React, { useState, useEffect } from 'react';
import { serviceAPI } from '../apis/serviceAPI';
import { employeeAPI } from '../apis/employeeAPI';
import { useToast } from '../components/Toast';

const ServiceSelection = ({ barbershopId, onServiceSelect, onNext, initialService = null, employeeId = null, onBack = null }) => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [selectedService, setSelectedService] = useState(initialService);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [barbershopCurrency, setBarbershopCurrency] = useState('EUR'); // Default to EUR as in your backend

  // Currency helper functions
  const getCurrencySymbol = () => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      TRY: '₺'
    };
    return currencySymbols[barbershopCurrency] || '€'; // Default to € as in your backend
  };

  // Fetch barbershop currency from API
  const fetchBarbershopCurrency = async () => {
    try {
      console.log('Fetching barbershop currency for:', barbershopId);
      const response = await serviceAPI.getBarbershop(barbershopId);
      
      if (response.data?.currency) {
        setBarbershopCurrency(response.data.currency);
        console.log('Barbershop currency set to:', response.data.currency);
        return response.data.currency;
      } else {
        console.log('No currency found in barbershop response, using default EUR');
        return 'EUR';
      }
    } catch (err) {
      console.error('Failed to fetch barbershop currency:', err);
      return 'EUR';
    }
  };

  useEffect(() => {
    // Load services when barbershopId or employeeId changes
    loadServices();
  }, [barbershopId, employeeId]);

  // Update selected service when initialService changes
  // Also validate that the service is available for the current employee
  useEffect(() => {
    if (initialService) {
      // If employeeId is provided, we need to check if the service is available for that employee
      // This will be validated when services are loaded
      setSelectedService(initialService);
      // Only call onServiceSelect if it's a function to avoid unnecessary calls
      if (typeof onServiceSelect === 'function') {
        onServiceSelect(initialService);
      }
    } else {
      // Clear selected service if initialService is null/undefined
      setSelectedService(null);
    }
  }, [initialService]);

  // Validate selected service when services are loaded and employeeId changes
  useEffect(() => {
    if (selectedService && employeeId && categories.length > 0) {
      // Check if the selected service is in the available services for this employee
      const serviceExists = categories.some(([categoryName, categoryServices]) => 
        categoryServices.some(s => 
          s._id?.toString() === selectedService._id?.toString()
        )
      );
      
      if (!serviceExists) {
        // Service is not available for this employee, clear it
        console.log('Selected service is not available for this employee, clearing selection');
        setSelectedService(null);
        if (typeof onServiceSelect === 'function') {
          onServiceSelect(null);
        }
      }
    }
  }, [categories, employeeId]); // Removed selectedService from dependencies to avoid infinite loop

  const loadServices = async () => {
    try {
      setLoading(true);
      
      // STEP 1: Fetch barbershop currency first
      await fetchBarbershopCurrency();
      
      // STEP 2: Get employee services if employeeId is provided
      let employeeServiceIds = null;
      if (employeeId) {
        try {
          const employeeServicesResponse = await serviceAPI.getEmployeeServices(employeeId);
          const employeeServices = employeeServicesResponse.data || employeeServicesResponse;
          // Extract service IDs from employee services
          employeeServiceIds = new Set(
            (employeeServices || []).map(s => {
              if (typeof s === 'string') return s;
              if (s?._id) return s._id.toString();
              return String(s);
            })
          );
          console.log('Employee service IDs:', Array.from(employeeServiceIds));
        } catch (err) {
          console.error('Error loading employee services:', err);
          // Continue without filtering if employee services can't be loaded
        }
      }
      
      // STEP 3: Get active services and categories in parallel
      const [servicesResponse, categoriesResponse] = await Promise.all([
        serviceAPI.getServices(barbershopId, true),
        serviceAPI.getCategories(barbershopId, true)
      ]);
      
      let services = servicesResponse.data || servicesResponse;
      const categoriesData = categoriesResponse.data || categoriesResponse;
      
      // STEP 4: Filter services by employee if employeeId is provided
      if (employeeId) {
        if (employeeServiceIds && employeeServiceIds.size > 0) {
          services = services.filter(service => {
            const serviceId = service._id?.toString() || String(service._id);
            return employeeServiceIds.has(serviceId);
          });
          console.log('Filtered services for employee:', services.length);
        } else {
          // If employeeId is provided but no services found, show empty list
          services = [];
          console.log('No services found for employee');
        }
      }
      
      console.log('Services loaded:', services);
      console.log('Categories loaded:', categoriesData);
      console.log('First service example:', services && services[0] ? {
        name: services[0].name,
        categoryId: services[0].categoryId,
        categoryIdType: typeof services[0].categoryId
      } : 'No services');
      
      // Create a map of category IDs to names for lookup
      const categoryMap = new Map();
      if (categoriesData && Array.isArray(categoriesData)) {
        categoriesData.forEach(cat => {
          if (cat && cat._id) {
            const catId = cat._id.toString();
            categoryMap.set(catId, cat.name);
          }
        });
      }
      console.log('Category map:', Array.from(categoryMap.entries()));
      
      // Group services by category name
      const grouped = {};
      
      if (services && Array.isArray(services) && services.length > 0) {
        services.forEach(service => {
          let categoryName = 'Other';
          
          if (service.categoryId) {
            // Case 1: categoryId is populated as an object with name
            if (typeof service.categoryId === 'object' && service.categoryId !== null) {
              if (service.categoryId.name) {
                categoryName = service.categoryId.name;
              } else if (service.categoryId._id) {
                // If it's an object but no name, try to look it up
                const catId = service.categoryId._id.toString();
                categoryName = categoryMap.get(catId) || 'Other';
              }
            } 
            // Case 2: categoryId is a string/ID - look it up in the map
            else if (typeof service.categoryId === 'string') {
              categoryName = categoryMap.get(service.categoryId) || 'Other';
            }
          }
          
          console.log(`Service "${service.name}" -> Category: "${categoryName}"`);
          
          // Initialize category array if it doesn't exist
          if (!grouped[categoryName]) {
            grouped[categoryName] = [];
          }
          
          // Add service to its category
          grouped[categoryName].push(service);
        });
      }
      
      // Convert to array of [categoryName, services] tuples, sorted by category name
      // Put "Other" at the end if it exists
      const categoriesArray = Object.entries(grouped)
        .filter(([categoryName, categoryServices]) => categoryServices && categoryServices.length > 0)
        .sort(([nameA], [nameB]) => {
          if (nameA === 'Other') return 1;
          if (nameB === 'Other') return -1;
          return nameA.localeCompare(nameB);
        });
      
      console.log('Grouped categories:', categoriesArray);
      console.log('Category breakdown:', categoriesArray.map(([name, svcs]) => `${name}: ${svcs.length} services`));
      setCategories(categoriesArray);
      
      if (categoriesArray.length === 0) {
        const message = employeeId 
          ? "This employee doesn't offer any services yet." 
          : "No services available.";
        toast.warning(message);
      }
    } catch (err) {
      const errorMessage = err.userMessage || 'Failed to load services';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error loading services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    onServiceSelect(service);
  };

  const handleNext = () => {
    if (selectedService) {
      onNext();
    }
  };

  if (loading) {
    return (
      <div className="widget-step">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-center text-gray-600">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="widget-step">
      <div className="step-header">
        <h2 className="step-title">Select Service</h2>
        <p className="step-description">Choose the service you'd like to book</p>
        <p className="text-sm text-gray-500 text-center mt-1">
          Prices in {barbershopCurrency} ({getCurrencySymbol()})
        </p>
      </div> 
      

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="services-container">
        {categories.length === 0 ? (
          <div className="empty-state-small">
            <p className="empty-description">
              {employeeId 
                ? "This employee doesn't offer any services yet." 
                : "This barbershop hasn't set up any services yet."}
            </p>
          </div>
        ) : (
          categories.map(([categoryName, categoryServices]) => {
            // Skip empty categories
            if (!categoryServices || categoryServices.length === 0) return null;
            
            return (
              <div key={categoryName} className="category-section">
                <div className="category-header">
                  <h3 className="category-title">{categoryName}</h3>
                  <span className="category-service-count">
                    {categoryServices.length} service{categoryServices.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="services-grid">
                  {categoryServices.map(service => {
                    // Check if this service is selected (compare by _id)
                    const isSelected = selectedService && (
                      selectedService._id === service._id || 
                      selectedService._id?.toString() === service._id?.toString()
                    );
                    
                    return (
                      <div
                        key={service._id}
                        className={`service-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleServiceSelect(service)}
                      >
                        <div className="service-info">
                          <h4 className="service-name">{service.name}</h4>
                          {service.description && (
                            <p className="service-description">{service.description}</p>
                          )}
                          <div className="service-meta">
                            <span className="service-duration">{service.duration} min</span>
                            <span className="service-price">
                              {getCurrencySymbol()}{service.price}
                            </span>
                          </div>
                        </div>
                        <div className="service-selector">
                          <div className="selection-dot"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="step-actions">
        {onBack && (
          <button
            onClick={onBack}
            className="btn-secondary"
            style={{ marginRight: '8px' }}
          >
            Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!selectedService}
          className="btn-primary"
        >
          {employeeId ? 'Next: Choose Time' : 'Next: Choose Barber'}
        </button>
      </div>
    </div>
  );
};

export default ServiceSelection;