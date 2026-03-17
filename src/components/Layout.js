import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavigationLink = ({ to, children, icon }) => (
    <Link
      to={to}
      className={`nav-link ${isActive(to) ? 'active' : ''}`}
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <span className="mr-2">{icon}</span>
      {children}
    </Link>
  );

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      
      {/* Navigation */}
      <nav className="navbar">
        
        <div className="nav-left">

       <div onClick={() => navigate('/dashboard')} className="logo-text">
        Milano Booking
        </div>


          {/* Desktop Navigation */}
          <div className="nav-right desktop-nav">
            
            <NavigationLink to="/dashboard" icon="📊">
              {t.nav.dashboard}
            </NavigationLink>

            {/* Admin Navigation */}
            {user?.role === 'admin' && (
              <NavigationLink to="/barbershops" icon="✂️">
                {t.nav.barbershops}
              </NavigationLink>
            )}

            {/* Barbershop Navigation */}
            {user?.role === 'barbershop' && (
              <>
                <NavigationLink to="/employees" icon="👥">
                  {t.nav.employees}
                </NavigationLink>

                <NavigationLink to="/services" icon="✂️">
                  {t.nav.services}
                </NavigationLink>

                <NavigationLink to="/agenda" icon="📅">
                  {t.nav.schedule}
                </NavigationLink>

                <NavigationLink to="/timeoff" icon="🏖️">
                  {t.nav.timeOff}
                </NavigationLink>

                <NavigationLink to="/clients" icon="👤">
                  {t.nav.clients}
                </NavigationLink>

                {user?.barbershopId && (
                  <NavigationLink to={`/barbershop/edit/${user.barbershopId}`} icon="🏪">
                    {t.nav.myBarbershop}
                  </NavigationLink>
                )}
              </>
            )}
          </div>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          
          {/* User Info */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.email}
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Language Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
            {[
              { code: 'en', label: 'EN', flag: '🇬🇧' },
              { code: 'nl', label: 'NL', flag: '🇳🇱' },
              { code: 'ku', label: 'KU', flag: '🌙' },
            ].map(({ code, label, flag }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                title={code === 'en' ? 'English' : code === 'nl' ? 'Nederlands' : 'Kurdî'}
                style={{
                  padding: '3px 7px',
                  fontSize: '11px',
                  fontWeight: language === code ? '700' : '400',
                  border: language === code ? '1px solid #6366f1' : '1px solid transparent',
                  borderRadius: '4px',
                  background: language === code ? '#ede9fe' : 'transparent',
                  color: language === code ? '#4338ca' : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  transition: 'all 0.15s',
                }}
              >
                <span>{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {t.nav.logout}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="mobile-nav bg-white border-b border-gray-200 py-4 fade-in">
          <div className="space-y-2 px-4">
            
            <NavigationLink to="/dashboard" icon="📊">
              {t.nav.dashboard}
            </NavigationLink>

            {/* Admin Mobile Navigation */}
            {user?.role === 'admin' && (
              <NavigationLink to="/barbershops" icon="✂️">
                {t.nav.barbershops}
              </NavigationLink>
            )}

            {/* Barbershop Mobile Navigation */}
            {user?.role === 'barbershop' && (
              <>
                <NavigationLink to="/employees" icon="👥">
                  {t.nav.employees}
                </NavigationLink>
                <NavigationLink to="/services" icon="✂️">
                  {t.nav.services}
                </NavigationLink>
                <NavigationLink to="/timeoff" icon="📅">
                  {t.nav.timeOff}
                </NavigationLink>
                {user?.barbershopId && (
                  <NavigationLink to={`/barbershop/edit/${user.barbershopId}`} icon="🏪">
                    {t.nav.myBarbershop}
                  </NavigationLink>
                )}
              </>
            )}

            {/* Mobile User Info */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Language Switcher */}
            <div className="pt-3 border-t border-gray-200 mt-2">
              <div className="text-xs text-gray-500 mb-2">Language / Taal / زمان</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { code: 'en', label: 'English', flag: '🇬🇧' },
                  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
                  { code: 'ku', label: 'Kurdî', flag: '🌙' },
                ].map(({ code, label, flag }) => (
                  <button
                    key={code}
                    onClick={() => { setLanguage(code); setIsMobileMenuOpen(false); }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: language === code ? '700' : '400',
                      border: language === code ? '1px solid #6366f1' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      background: language === code ? '#ede9fe' : 'white',
                      color: language === code ? '#4338ca' : '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    {flag} {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="dashboard-container">
        {children}
      </main>
    </div>
  );
};

export default Layout;
