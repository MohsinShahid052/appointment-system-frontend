import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../apis/authApi';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const BarbershopEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const barbershopId = id || user?.barbershopId;

  const [barbershop, setBarbershop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    logo: '',
    timezone: 'Europe/Amsterdam',
    currency: 'EUR',
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

  const [originalData, setOriginalData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (originalData) {
      const changed = Object.keys(formData).some(key =>
        formData[key] !== originalData[key]
      );
      setHasChanges(changed);
    }
  }, [formData, originalData]);

  useEffect(() => {
    const fetchBarbershopData = async () => {
      try {
        setLoading(true);
        setError('');

        if (!barbershopId) {
          setError('No barbershop ID available');
          return;
        }

        let currentBarbershop = null;

        if (user?.role === 'admin') {
          const barbershops = await authAPI.listBarbershops();
          currentBarbershop = barbershops.find(shop => shop._id === barbershopId);
        } else if (user?.role === 'barbershop') {
          currentBarbershop = await authAPI.getBarbershop(barbershopId);
        }

        if (currentBarbershop) {
          setBarbershop(currentBarbershop);
          const defaultHours = {
            mon: { start: '09:00', end: '18:00' },
            tue: { start: '09:00', end: '18:00' },
            wed: { start: '09:00', end: '18:00' },
            thu: { start: '09:00', end: '18:00' },
            fri: { start: '09:00', end: '18:00' },
            sat: { start: '09:00', end: '18:00' },
            sun: { start: '', end: '' }
          };
          const initialData = {
            name: currentBarbershop.name || '',
            address: currentBarbershop.address || '',
            city: currentBarbershop.city || '',
            postalCode: currentBarbershop.postalCode || '',
            phone: currentBarbershop.phone || '',
            email: currentBarbershop.email || '',
            logo: currentBarbershop.logo || '',
            timezone: currentBarbershop.timezone || 'Europe/Amsterdam',
            currency: currentBarbershop.currency || 'EUR',
            openingHours: currentBarbershop.openingHours || defaultHours
          };
          setFormData(initialData);
          setOriginalData(initialData);
        }
      } catch (err) {
        setError(t.barbershops.failedUpdate);
      } finally {
        setLoading(false);
      }
    };
    fetchBarbershopData();
  }, [barbershopId, user]);

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

  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;

    if (name === 'logo' && files?.length > 0) {
      const file = files[0];
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
        setFormData(prev => ({ ...prev, logo: compressed }));
      } catch (err) {
        setError('Failed to process image. Please try another file.');
      }
    } else if (name.startsWith('openingHours.')) {
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
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasChanges) {
      setError(t.barbershops.noChanges);
      return;
    }

    try {
      setSaving(true);
      await authAPI.updateBarbershop(barbershopId, formData);
      setSuccess(t.barbershops.updatedSuccess);
      setOriginalData(formData);
      setHasChanges(false);
    } catch (err) {
      setError(t.barbershops.failedUpdate);
    } finally {
      setSaving(false);
    }
  };

  const handleAdminPasswordChange = async () => {
    if (adminNewPassword !== adminConfirmPassword) {
      setError(t.barbershops.passwordMismatch);
      return;
    }

    try {
      setSaving(true);
      await authAPI.adminResetPassword(barbershopId, adminNewPassword);
      setSuccess(t.barbershops.passwordUpdated);
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (err) {
      setError(t.barbershops.failedPassword);
    } finally {
      setSaving(false);
    }
  };

  const handleBarbershopPasswordChange = async () => {
    if (newPassword !== confirmNewPassword) {
      setError(t.barbershops.passwordMismatch);
      return;
    }

    try {
      setSaving(true);
      await authAPI.changeOwnPassword(oldPassword, newPassword);
      setSuccess(t.barbershops.passwordChanged);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(t.barbershops.failedPassword);
    } finally {
      setSaving(false);
    }
  };

  const dayNames = {
    mon: t.timeOff.monday,
    tue: t.timeOff.tuesday,
    wed: t.timeOff.wednesday,
    thu: t.timeOff.thursday,
    fri: t.timeOff.friday,
    sat: t.timeOff.saturday,
    sun: t.timeOff.sunday,
  };

  if (loading) return <p>{t.barbershops.loadingBarbershop}</p>;

  return (
    <div className="dashboard-container">

      <div className="card-surface fade-in">

        {/* HEADER */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="dash-title">
            {user.role === 'admin' ? t.barbershops.editBarbershop : t.barbershops.myBarbershop}
          </h1>
        </div>

        {/* Feedback */}
        {error && (
          <div className="px-6 pt-4">
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 10, color: '#b91c1c', fontSize: 14 }}>
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="px-6 pt-4">
            <div style={{ background: '#ecfdf3', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, color: '#166534', fontSize: 14 }}>
              {success}
            </div>
          </div>
        )}

        {/* MAIN BARBERSHOP FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">

          <div className="form-grid">
            <div className="form-group">
              <label>{t.barbershops.barbershopName} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t.barbershops.phoneNumber}</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t.barbershops.address}</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t.barbershops.city}</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t.barbershops.postalCode}</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t.common.email}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t.common.currency}</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="input"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.barbershops.logo}</label>
              <div className="image-upload">
                <div className="image-preview">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo preview" />
                  ) : (
                    <span className="image-placeholder">{t.barbershops.noLogo}</span>
                  )}
                </div>

                <div className="image-actions">
                  <label className="btn-secondary w-full text-center cursor-pointer">
                    <input
                      type="file"
                      name="logo"
                      accept="image/*"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    {t.barbershops.uploadLogo}
                  </label>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="btn-secondary"
                    >
                      {t.common.remove}
                    </button>
                  )}
                  <p className="image-hint">JPG/PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>{t.barbershops.timezone}</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="input"
              >
                <option value="Europe/Amsterdam">Europe/Amsterdam</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="Australia/Sydney">Australia/Sydney</option>
              </select>
            </div>
          </div>

          {/* Opening Hours Section */}
          <div className="form-section">
            <h2 className="form-section-title">{t.barbershops.openingHours}</h2>
            <p className="form-section-subtitle">{t.barbershops.openingHoursSubtitle}</p>
            <div className="form-grid">
              {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                <div key={day} className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>{dayNames[day]}</label>
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
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!hasChanges || saving}
            className="btn-primary"
          >
            {t.barbershops.saveChanges}
          </button>
        </form>

        {/* ADMIN PASSWORD RESET SECTION */}
        {user.role === 'admin' && (
          <div className="p-6 border-t border-gray-200 mt-6">
            <h2 className="text-lg font-semibold mb-4">{t.barbershops.adminChangePassword}</h2>
            <input
              type="password"
              className="input mb-3"
              placeholder={t.barbershops.newPassword}
              value={adminNewPassword}
              onChange={(e) => setAdminNewPassword(e.target.value)}
            />
            <input
              type="password"
              className="input mb-3"
              placeholder={t.barbershops.confirmPassword}
              value={adminConfirmPassword}
              onChange={(e) => setAdminConfirmPassword(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={handleAdminPasswordChange}
              disabled={saving}
            >
              {t.barbershops.updatePassword}
            </button>
          </div>
        )}

        {/* BARBERSHOP OWNER PASSWORD CHANGE */}
        {user.role === 'barbershop' && (
          <div className="p-6 border-t border-gray-300 mt-6">
            <h2 className="text-lg font-semibold mb-4">{t.barbershops.changeYourPassword}</h2>
            <input
              type="password"
              className="input mb-3"
              placeholder={t.barbershops.oldPassword}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <input
              type="password"
              className="input mb-3"
              placeholder={t.barbershops.newPassword}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              className="input mb-3"
              placeholder={t.barbershops.confirmPassword}
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={handleBarbershopPasswordChange}
              disabled={saving}
            >
              {t.barbershops.changePassword}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default BarbershopEdit;
