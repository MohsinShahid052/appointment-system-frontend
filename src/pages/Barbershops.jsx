import React, { useState, useEffect } from 'react';
import { authAPI } from '../apis/authApi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/global.css';

const Barbershops = () => {
  const [barbershops, setBarbershops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { loginAs } = useAuth();
  const { t } = useLanguage();


  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    ownerEmail: '',
    ownerPassword: '',
    logo: '',
    city: '',
    postalCode: '',
    currency: 'EUR',
    presetKey: 'none',
    openingHours: {
      mon: { start: '09:00', end: '18:00' },
      tue: { start: '09:00', end: '18:00' },
      wed: { start: '09:00', end: '18:00' },
      thu: { start: '09:00', end: '18:00' },
      fri: { start: '09:00', end: '18:00' },
      sat: { start: '09:00', end: '18:00' },
      sun: { start: '', end: '' }
    }
  });
  const [presets, setPresets] = useState([]);
  const [showPresetForm, setShowPresetForm] = useState(false);
  const [editingPresetKey, setEditingPresetKey] = useState(null);
  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
    categories: [{ name: '', description: '' }],
    services: [{ name: '', description: '', price: '', duration: '', categoryKey: '' }]
  });

  useEffect(() => {
    loadBarbershops();
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await authAPI.getBarbershopPresets();
      setPresets(data || []);
    } catch (err) {
      console.error('Failed to load presets', err);
    }
  };

  const loadBarbershops = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await authAPI.listBarbershops();
      setBarbershops(data);
    } catch (err) {
      setError(err?.response?.data?.message || t.barbershops.noBarbershopsDesc);
    } finally {
      setLoading(false);
    }
  };

  const compressImage = (file, maxDimension = 800, quality = 0.7) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('openingHours.')) {
      // Handle opening hours nested fields (e.g., "openingHours.mon.start")
      const parts = name.split('.');
      if (parts.length === 3) {
        const [_, day, timeType] = parts;
        setFormData(prev => ({
          ...prev,
          openingHours: {
            ...prev.openingHours,
            [day]: {
              ...prev.openingHours[day],
              [timeType]: value
            }
          }
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleCreateBarbershop = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await authAPI.createBarbershop(formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        ownerEmail: '',
        ownerPassword: '',
        logo: '',
        city: '',
        postalCode: '',
        currency: 'EUR',
        presetKey: 'none',
        openingHours: {
          mon: { start: '09:00', end: '18:00' },
          tue: { start: '09:00', end: '18:00' },
          wed: { start: '09:00', end: '18:00' },
          thu: { start: '09:00', end: '18:00' },
          fri: { start: '09:00', end: '18:00' },
          sat: { start: '09:00', end: '18:00' },
          sun: { start: '', end: '' }
        }
      });
      await loadBarbershops();
    } catch (err) {
      setError(err?.response?.data?.message || t.barbershops.noBarbershopsDesc);
    }
  };

  const slugify = (text) =>
    text
      ?.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || '';

  const handlePresetCategoryChange = (idx, field, value) => {
    setPresetForm((prev) => {
      const categories = [...prev.categories];
      const updatedCategory = { ...categories[idx], [field]: value };
      if (field === 'name' && !editingPresetKey) {
        updatedCategory.key = slugify(value);
      }
      if (field === 'name' && !updatedCategory.key) {
        updatedCategory.key = slugify(value);
      }
      categories[idx] = updatedCategory;
      return { ...prev, categories };
    });
  };

  const handlePresetServiceChange = (idx, field, value) => {
    setPresetForm((prev) => {
      const services = [...prev.services];
      services[idx] = { ...services[idx], [field]: value };
      return { ...prev, services };
    });
  };

  const addPresetCategory = () => {
    setPresetForm((prev) => ({
      ...prev,
      categories: [...prev.categories, { name: '', description: '' }],
    }));
  };

  const addPresetService = () => {
    setPresetForm((prev) => ({
      ...prev,
      services: [...prev.services, { name: '', description: '', price: '', duration: '', categoryKey: '' }],
    }));
  };

  const removePresetCategory = (idx) => {
    setPresetForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== idx),
      services: prev.services.map((svc) =>
        svc.categoryKey === prev.categories[idx]?.name ? { ...svc, categoryKey: '' } : svc
      ),
    }));
  };

  const removePresetService = (idx) => {
    setPresetForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== idx),
    }));
  };

  const handleLoadPresetForEdit = async (key) => {
    try {
      setError('');
      const preset = await authAPI.getBarbershopPreset(key);
      
      setPresetForm({
        name: preset.name || '',
        description: preset.description || '',
        categories: preset.categories && preset.categories.length > 0 
          ? preset.categories.map(cat => ({ name: cat.name, description: cat.description || '', key: cat.key }))
          : [{ name: '', description: '' }],
        services: preset.services && preset.services.length > 0
          ? preset.services.map(svc => ({
              name: svc.name,
              description: svc.description || '',
              price: svc.price ? String(svc.price) : '',
              duration: svc.duration ? String(svc.duration) : '',
              categoryKey: svc.categoryKey || ''
            }))
          : [{ name: '', description: '', price: '', duration: '', categoryKey: '' }]
      });
      
      setEditingPresetKey(key);
      setShowPresetForm(true);
    } catch (err) {
      setError(err?.response?.data?.message || t.barbershops.noBarbershopsDesc);
    }
  };

  const handleCancelEdit = () => {
    setPresetForm({
      name: '',
      description: '',
      categories: [{ name: '', description: '' }],
      services: [{ name: '', description: '', price: 0, duration: 15, categoryKey: '' }],
    });
    setEditingPresetKey(null);
    setShowPresetForm(false);
  };

  const handleCreatePreset = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      const categories = presetForm.categories
        .filter((c) => c.name.trim())
        .map((c) => ({
          ...c,
          key: c.key || slugify(c.name),
        }));

      const services = presetForm.services
        .filter((s) => s.name.trim() && s.categoryKey)
        .map((s) => ({
          ...s,
          price: typeof s.price === 'string' ? parseFloat(s.price) || 0 : s.price,
          duration: typeof s.duration === 'string' ? parseInt(s.duration) || 15 : s.duration,
        }));

      if (editingPresetKey) {
        await authAPI.updateBarbershopPreset(editingPresetKey, {
          name: presetForm.name,
          description: presetForm.description,
          categories,
          services,
        });
        setSuccess(t.barbershops.presetUpdated);
      } else {
        await authAPI.createBarbershopPreset({
          name: presetForm.name,
          description: presetForm.description,
          categories,
          services,
        });
        setSuccess(t.barbershops.presetCreated);
      }

      setPresetForm({
        name: '',
        description: '',
        categories: [{ name: '', description: '' }],
        services: [{ name: '', description: '', price: '', duration: '', categoryKey: '' }],
      });
      setEditingPresetKey(null);
      setShowPresetForm(false);
      await loadPresets();
    } catch (err) {
      setError(err?.response?.data?.message || t.barbershops.noBarbershopsDesc);
    }
  };

  const handleDeleteBarbershop = async (id) => {
    if (!window.confirm(t.barbershops.deleteConfirm)) return;
    try {
      await authAPI.deleteBarbershop(id);
      await loadBarbershops();
    } catch (err) {
      setError(err?.response?.data?.message || t.barbershops.noBarbershopsDesc);
    }
  };

  const handleRestoreBarbershop = async (id) => {
    try {
      await authAPI.restoreBarbershop(id);
      await loadBarbershops();
    } catch (err) {
      setError(err?.response?.data?.message || t.barbershops.noBarbershopsDesc);
    }
  };

  const handleLoginAsBarbershop = async (barbershopId) => {
    try {
      const response = await authAPI.loginAsBarbershop(barbershopId);
      const { accessToken, user: barbershopUser } = response;
      loginAs(barbershopUser, accessToken);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to login as barbershop:', err);
      alert(err?.response?.data?.message || t.barbershops.loginAs);
    }
  };


  const filteredBarbershops = barbershops.filter((shop) => {
    const term = searchTerm.toLowerCase();
    return (
      shop.name?.toLowerCase().includes(term) ||
      shop.address?.toLowerCase().includes(term) ||
      shop.email?.toLowerCase().includes(term) ||
      shop.city?.toLowerCase().includes(term) ||
      shop.postalCode?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="center-screen">
        <div className="text-center fade-in">
          <div className="loading-spinner mx-auto mb-4" />
          <p style={{ color: '#4b5563', fontSize: 14 }}>{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dash-title">{t.barbershops.title}</h1>
          <p className="dash-welcome">{t.barbershops.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
          style={{ maxWidth: '200px' }}
        >
          {t.barbershops.newBarbershop}
        </button>
      </div>

      {error && (
        <div
          className="fade-in"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
            fontSize: 14,
            color: '#b91c1c'
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="fade-in"
          style={{
            background: '#ecfdf3',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
            fontSize: 14,
            color: '#166534'
          }}
        >
          {success}
        </div>
      )}

      {/* Preset Manager */}
      <div className="preset-card" style={{ marginBottom: 16 }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title">{t.barbershops.presets}</h3>
            <p className="text-sm text-gray-500">{t.barbershops.presetsSubtitle}</p>
          </div>
          <button
            className="btn-secondary"
            type="button"
            onClick={() => {
              if (showPresetForm) {
                handleCancelEdit();
              } else {
                setShowPresetForm(true);
              }
            }}
          >
            {showPresetForm ? t.common.close : t.barbershops.newPreset}
          </button>
        </div>

        {presets.length > 0 && (
          <div className="preset-grid mb-4">
            {presets.map((p) => (
              <div key={p.key} className="preset-card">
                <div className="preset-card-header">
                  <div>
                    <p className="preset-title">{p.name}</p>
                    <p className="preset-desc">{p.description}</p>
                  </div>
                </div>
                <div className="preset-meta">
                  <span className="dot" />
                  {p.categories} categories · {p.services} services
                </div>
                <div className="preset-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="preset-chip">
                    <span className="dot" /> {t.barbershops.readyToApply}
                  </span>
                  <button
                    onClick={() => handleLoadPresetForEdit(p.key)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    {t.common.edit}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showPresetForm && (
          <form onSubmit={handleCreatePreset} className="space-y-4">
            <div style={{ marginBottom: '16px' }}>
              <h4 className="form-section-title">
                {editingPresetKey ? t.barbershops.editPreset : t.barbershops.createNewPreset}
              </h4>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">{t.barbershops.presetName} *</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t.barbershops.presetNamePlaceholder}
                  value={presetForm.name}
                  onChange={(e) => setPresetForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                  Enter a descriptive name for this preset
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">{t.barbershops.presetDescription}</label>
                <input
                  type="text"
                  className="input"
                  placeholder={t.barbershops.presetDescPlaceholder}
                  value={presetForm.description}
                  onChange={(e) => setPresetForm((p) => ({ ...p, description: e.target.value }))}
                />
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                  Optional description of the preset
                </p>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">{t.barbershops.categories}</h4>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                {t.barbershops.categoriesSubtitle}
              </p>
              <div className="space-y-3">
                {presetForm.categories.map((cat, idx) => (
                  <div key={idx} className="space-y-2" style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">{t.barbershops.categoryName} *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Haircuts, Beard Services, Styling"
                        value={cat.name}
                        onChange={(e) => handlePresetCategoryChange(idx, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.barbershops.categoryDescription}</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Optional description for this category"
                        value={cat.description}
                        onChange={(e) => handlePresetCategoryChange(idx, 'description', e.target.value)}
                      />
                    </div>
                    {presetForm.categories.length > 1 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => removePresetCategory(idx)}
                        style={{ marginTop: '8px' }}
                      >
                        {t.barbershops.removeCategory}
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addPresetCategory}>
                  {t.barbershops.addCategory}
                </button>
              </div>
            </div>

            <div className="form-section">
              <h4 className="form-section-title">{t.barbershops.services}</h4>
              <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '16px' }}>
                {t.barbershops.servicesSubtitle}
              </p>
              <div className="space-y-3">
                {presetForm.services.map((svc, idx) => (
                  <div key={idx} className="space-y-2" style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <div className="form-group">
                      <label className="form-label">{t.barbershops.serviceName} *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g., Classic Cut, Beard Trim, Hair Wash"
                        value={svc.name}
                        onChange={(e) => handlePresetServiceChange(idx, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.barbershops.serviceDescription}</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Optional description of what this service includes"
                        value={svc.description}
                        onChange={(e) => handlePresetServiceChange(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="form-group">
                        <label className="form-label">{t.barbershops.servicePrice} *</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., 25, 30.50, 20 EUR"
                          value={svc.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || !isNaN(value) || !isNaN(value.replace(/[^0-9.]/g, ''))) {
                              handlePresetServiceChange(idx, 'price', value);
                            }
                          }}
                          required
                        />
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                          Enter price as number (e.g., 25 or 30.50)
                        </p>
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t.barbershops.serviceDuration} *</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g., 30, 45, 60"
                          value={svc.duration}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || !isNaN(value) || !isNaN(value.replace(/[^0-9]/g, ''))) {
                              handlePresetServiceChange(idx, 'duration', value);
                            }
                          }}
                          required
                        />
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                          Enter duration in minutes (e.g., 30, 45, 60)
                        </p>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t.barbershops.serviceCategory} *</label>
                      <select
                        className="input"
                        value={svc.categoryKey}
                        onChange={(e) => handlePresetServiceChange(idx, 'categoryKey', e.target.value)}
                        required
                      >
                        <option value="">{t.barbershops.selectCategory}</option>
                        {presetForm.categories
                          .filter((c) => c.name.trim())
                          .map((cat, catIdx) => {
                            const catKey = cat.key || slugify(cat.name);
                            return (
                              <option key={catIdx} value={catKey}>
                                {cat.name}
                              </option>
                            );
                          })}
                      </select>
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>
                        Select which category this service belongs to
                      </p>
                    </div>
                    {presetForm.services.length > 1 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => removePresetService(idx)}
                        style={{ marginTop: '8px' }}
                      >
                        {t.barbershops.removeService}
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addPresetService}>
                  {t.barbershops.addService}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary" style={{ maxWidth: '200px' }}>
                {editingPresetKey ? t.barbershops.updatePreset : t.barbershops.createPreset}
              </button>
              {editingPresetKey && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-secondary"
                >
                  {t.common.cancel}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ marginBottom: 16 }}>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder={t.barbershops.searchBarbershops}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          {filteredBarbershops.length} of {barbershops.length} barbershops
        </div>
      </div>

      {error && (
        <div
          className="fade-in"
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 10,
            padding: 10,
            marginBottom: 14,
            fontSize: 14,
            color: '#b91c1c'
          }}
        >
          {error}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="card-surface fade-in" style={{ marginBottom: 20 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">{t.barbershops.createBarbershop}</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary"
              type="button"
            >
              {t.common.close}
            </button>
          </div>

          <form onSubmit={handleCreateBarbershop} className="space-y-4">
            <div className="form-grid">
              {/* NAME */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.barbershopName} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Enter barbershop name"
                />
              </div>

              {/* ADDRESS */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.address}</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter address"
                />
              </div>

              {/* CITY */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.city}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter city"
                />
              </div>

              {/* POSTAL CODE */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.postalCode}</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter postal code"
                />
              </div>

              {/* PHONE */}
              <div className="form-group">
                <label className="form-label">{t.common.phone}</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter phone number"
                />
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.barbershopEmail}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Enter barbershop email"
                />
              </div>

              {/* LOGO */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.logo}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (!file.type.startsWith('image/')) {
                        setError('Please upload a valid image file');
                        return;
                      }
                      try {
                        const compressed = await compressImage(file);
                        if (compressed.length > 2.5 * 1024 * 1024) {
                          setError('Compressed image is still too large. Please choose a smaller image.');
                          return;
                        }
                        setError('');
                        setFormData((prev) => ({ ...prev, logo: compressed }));
                      } catch (err) {
                        setError('Failed to process image. Please try another file.');
                      }
                    }}
                    className="input"
                  />
              </div>

              {/* OWNER EMAIL */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.ownerEmail} *</label>
                <input
                  type="email"
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Enter owner email"
                />
              </div>

              {/* OWNER PASSWORD */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.ownerPassword} *</label>
                <input
                  type="password"
                  name="ownerPassword"
                  value={formData.ownerPassword}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Enter owner password"
                />
              </div>

              {/* CURRENCY */}
              <div className="form-group">
                <label className="form-label">{t.common.currency}</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="TRY">TRY (₺)</option>
                </select>
              </div>

              {/* PRESET */}
              <div className="form-group">
                <label className="form-label">{t.barbershops.starterPreset}</label>
                <select
                  name="presetKey"
                  value={formData.presetKey}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="none">{t.barbershops.noPreset}</option>
                  {presets.map((preset) => (
                    <option key={preset.key} value={preset.key}>
                      {preset.name} • {preset.categories} categories / {preset.services} services
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Selecting a preset will auto-create categories and services for the new barbershop. Choose "No preset" for a blank setup.
                </p>
              </div>
            </div>

            {/* Opening Hours Section */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{t.barbershops.openingHours}</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                {t.barbershops.openingHoursSubtitle}
              </p>
              <div className="form-grid">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => {
                  const dayNames = {
                    mon: t.timeOff.monday,
                    tue: t.timeOff.tuesday,
                    wed: t.timeOff.wednesday,
                    thu: t.timeOff.thursday,
                    fri: t.timeOff.friday,
                    sat: t.timeOff.saturday,
                    sun: t.timeOff.sunday
                  };
                  return (
                    <div key={day} className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">{dayNames[day]}</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="time"
                          name={`openingHours.${day}.start`}
                          value={formData.openingHours[day]?.start || ''}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Open"
                        />
                        <span style={{ color: '#6b7280' }}>to</span>
                        <input
                          type="time"
                          name={`openingHours.${day}.end`}
                          value={formData.openingHours[day]?.end || ''}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Close"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary" style={{ maxWidth: '200px' }}>
                {t.barbershops.createBarbershop}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barbershops Grid */}
      {filteredBarbershops.length > 0 && (
        <div className="barbershop-grid">
          {filteredBarbershops.map((shop) => (
            <div key={shop._id} className="barbershop-card fade-in">
              <div className="barbershop-header">
                <div className="barbershop-avatar" style={{ overflow: 'hidden' }}>
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    shop.name?.charAt(0)?.toUpperCase()
                  )}
                </div>
                <span className="barbershop-status">
                  {shop.deleted ? t.barbershops.deleted : t.barbershops.active}
                </span>
              </div>

              <h3 className="stat-value" style={{ marginBottom: 6 }}>
                {shop.name}
              </h3>

              <div className="info-item" style={{ marginBottom: 6 }}>
                <span className="info-dot" />
                {t.barbershops.currency}: <strong>{shop.currency}</strong>
              </div>

              <div className="barbershop-info">
                {shop.address && <div className="info-item"><span className="info-dot" />{shop.address}</div>}
                {shop.city && <div className="info-item"><span className="info-dot" />{shop.city}</div>}
                {shop.postalCode && <div className="info-item"><span className="info-dot" />{shop.postalCode}</div>}
                {shop.phone && <div className="info-item"><span className="info-dot" />{shop.phone}</div>}
                {shop.email && <div className="info-item"><span className="info-dot" />{shop.email}</div>}
              </div>

              <div className="barbershop-actions">
                {!shop.deleted ? (
                  <>
                    <button onClick={() => navigate(`/barbershop/edit/${shop._id}`)} className="action-btn action-primary">
                      {t.common.edit}
                    </button>
                    <button onClick={() => handleDeleteBarbershop(shop._id)} className="action-btn action-secondary">
                      {t.common.delete}
                    </button>
                    <button onClick={() => handleLoginAsBarbershop(shop._id)} className="action-btn action-success">
                      {t.barbershops.loginAs}
                    </button>
                  </>
                ) : (
                  <button onClick={() => handleRestoreBarbershop(shop._id)} className="action-btn action-primary">
                    {t.barbershops.restore}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredBarbershops.length === 0 && (
        <div className="empty-state fade-in" style={{ marginTop: 16 }}>
          <div className="empty-icon">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#9ca3af' }} />
          </div>
          <h3 className="empty-title">{t.barbershops.noBarbershopsFound}</h3>
          <p className="empty-description">
            {searchTerm ? t.barbershops.adjustSearch : t.barbershops.noBarbershopsDesc}
          </p>
          {!searchTerm && (
            <button onClick={() => setShowCreateForm(true)} className="btn-primary" style={{ maxWidth: '200px', margin: '0 auto' }}>
              {t.barbershops.createBarbershop}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Barbershops;
