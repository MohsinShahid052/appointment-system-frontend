import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              Dashboard
            </NavigationLink>

            {/* Admin Navigation */}
            {user?.role === 'admin' && (
              <NavigationLink to="/barbershops" icon="✂️">
                Barbershops
              </NavigationLink>
            )}

            {/* Barbershop Navigation */}
            {user?.role === 'barbershop' && (
              <>
                <NavigationLink to="/employees" icon="👥">
                  Employees
                </NavigationLink>

                <NavigationLink to="/services" icon="✂️">
                  Services
                </NavigationLink>

                <NavigationLink to="/agenda" icon="📅">
                  Schedule
                </NavigationLink>

                <NavigationLink to="/timeoff" icon="🏖️">
                  Time Off
                </NavigationLink>

                <NavigationLink to="/clients" icon="👤">
                  Clients
                </NavigationLink>

                {user?.barbershopId && (
                  <NavigationLink to={`/barbershop/edit/${user.barbershopId}`} icon="🏪">
                    My Barbershop
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

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn-logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
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
              Dashboard
            </NavigationLink>

            {/* Admin Mobile Navigation */}
            {user?.role === 'admin' && (
              <NavigationLink to="/barbershops" icon="✂️">
                Barbershops
              </NavigationLink>
            )}

            {/* Barbershop Mobile Navigation */}
            {user?.role === 'barbershop' && (
              <>
                <NavigationLink to="/employees" icon="👥">
                  Employees
                </NavigationLink>
                <NavigationLink to="/services" icon="✂️">
                  Services
                </NavigationLink>
                <NavigationLink to="/timeoff" icon="📅">
                  Time Off
                </NavigationLink>
                {user?.barbershopId && (
                  <NavigationLink to={`/barbershop/edit/${user.barbershopId}`} icon="🏪">
                    My Barbershop
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
