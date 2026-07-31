import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { ErrorBoundary } from './pages/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './pages/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffReservationsPage } from './pages/staff/StaffReservationsPage';
import { QRScannerPage } from './pages/staff/QRScannerPage';
import { SeatManagementPage } from './pages/staff/SeatManagementPage';
import { NoShowsMonitorPage } from './pages/staff/NoShowsMonitorPage';
import { WaitlistPage } from './pages/staff/WaitlistPage';
import { PolicySettingsPage } from './pages/staff/PolicySettingsPage';

// Fallback Pages
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const { initializeAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Default Landing Route */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/staff/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Staff Protected Console Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/reservations" element={<StaffReservationsPage />} />
            <Route path="/staff/scan" element={<QRScannerPage />} />
            <Route path="/staff/seats" element={<SeatManagementPage />} />
            <Route path="/staff/waitlist" element={<WaitlistPage />} />
            <Route path="/staff/no-shows" element={<NoShowsMonitorPage />} />
            <Route path="/staff/policies" element={<PolicySettingsPage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
