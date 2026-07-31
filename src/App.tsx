import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { StudentManagementPage } from './pages/StudentManagementPage';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { ReservationManagementPage } from './pages/ReservationManagementPage';
import { FloorManagementPage } from './pages/FloorManagementPage';
import { SeatManagementPage } from './pages/SeatManagementPage';
import { WaitingListPage } from './pages/WaitingListPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentManagementPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="reservations" element={<ReservationManagementPage />} />
          <Route path="floors" element={<FloorManagementPage />} />
          <Route path="seats" element={<SeatManagementPage />} />
          <Route path="waiting-list" element={<WaitingListPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
