import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import StudentLayout from './layouts/StudentLayout';
import Dashboard from './pages/Dashboard';
import FindSeat from './pages/FindSeat';
import MyReservations from './pages/MyReservations';
import WaitingList from './pages/WaitingList';
import History from './pages/History';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="find-seat" element={<FindSeat />} />
            <Route path="reservations" element={<MyReservations />} />
            <Route path="waitlist" element={<WaitingList />} />
            <Route path="waiting-list" element={<WaitingList />} />
            <Route path="history" element={<Navigate to="/student/reservations" replace />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
