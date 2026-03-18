import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import BarbershopDashboard from './pages/BarbershopDashboard';
import Barbershops from './pages/Barbershops';
import BarbershopEdit from './pages/BarbershopEdit';
import Employees from './pages/Employees';
import EmployeeEdit from './pages/EmployeeEdit';
import TimeOff from './pages/TimeOff';
import Layout from './components/Layout';
import Services from './pages/Services';
import Agenda from './pages/Agenda';

// Import the new booking components
import AppointmentsList from './pages/AppointmentsList';
import BookingWidget from './pages/BookingWidget';
import EditAppointment from './pages/EditAppointment';
import EditAppointmentNew from './pages/EditAppointmentNew';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

// Barbershop Route component
const BarbershopRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.role === 'barbershop' ? children : <Navigate to="/dashboard" />;
};

// Dashboard selector
const DashboardSelector = () => {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else {
    return <BarbershopDashboard />;
  }
};

const InternalBookingPage = () => {
  const { t } = useLanguage();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dash-title">{t.booking.title}</h1>
        <p className="dash-welcome">{t.booking.testFlowSubtitle}</p>
      </div>
      <BookingWidget />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <Router>
          <AuthProvider>
            <ToastProvider>
              <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Dashboard routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardSelector />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <DashboardSelector />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin only routes */}
            <Route path="/change-password" element={
              <ProtectedRoute>
                <Layout>
                  <ChangePassword />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/barbershops" element={
              <AdminRoute>
                <Layout>
                  <Barbershops />
                </Layout>
              </AdminRoute>
            } />
            <Route path="/barbershop/edit/:id" element={
              <ProtectedRoute>
                <Layout>
                  <BarbershopEdit />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Barbershop routes */}
            <Route path="/employees" element={
              <BarbershopRoute>
                <Layout>
                  <Employees />
                </Layout>
              </BarbershopRoute>
            } />
            <Route path="/employee/edit/:id" element={
              <BarbershopRoute>
                <Layout>
                  <EmployeeEdit />
                </Layout>
              </BarbershopRoute>
            } />
            <Route path="/employee/create" element={
              <BarbershopRoute>
                <Layout>
                  <EmployeeEdit />
                </Layout>
              </BarbershopRoute>
            } />
            <Route path="/timeoff" element={
              <BarbershopRoute>
                <Layout>
                  <TimeOff />
                </Layout>
              </BarbershopRoute>
            } />
            
            {/* Services and Agenda */}
            <Route path="/services" element={
              <ProtectedRoute>
                <Layout>
                  <Services />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/agenda" element={
              <ProtectedRoute>
                <Layout>
                  <Agenda />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* NEW: Appointments Management */}
            <Route path="/appointments" element={
              <BarbershopRoute>
                <Layout>
                  <AppointmentsList />
                </Layout>
              </BarbershopRoute>
            } />
            
            {/* NEW: Internal booking widget for testing */}
            <Route path="/book-now" element={
              <BarbershopRoute>
                <Layout>
                  <InternalBookingPage />
                </Layout>
              </BarbershopRoute>
            } />
            
            {/* Edit Appointment */}
            <Route path="/appointments/edit/:id" element={
              <BarbershopRoute>
                <Layout>
                  <EditAppointmentNew />
                </Layout>
              </BarbershopRoute>
            } />

            {/* Clients */}
            <Route path="/clients" element={
              <BarbershopRoute>
                <Layout>
                  <Clients />
                </Layout>
              </BarbershopRoute>
            } />
            <Route path="/clients/:id" element={
              <BarbershopRoute>
                <Layout>
                  <ClientDetail />
                </Layout>
              </BarbershopRoute>
            } />
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </Router>
      </ErrorBoundary>
    </LanguageProvider>
  );
}

export default App;
//testing
