import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../ui/ToastContainer';
import { StaffProfileModal } from '../modals/StaffProfileModal';
import { startSimulationEngine, stopSimulationEngine } from '../../utils/simulationEngine';
import { useWaitlistStore } from '../../store/useWaitlistStore';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    startSimulationEngine();
    // Global auto-expiry ticker for waitlist offers
    const waitlistTimer = setInterval(() => {
      useWaitlistStore.getState().checkAutoExpiries();
    }, 1000);

    return () => {
      stopSimulationEngine();
      clearInterval(waitlistTimer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Toast Alert System Overlay */}
      <ToastContainer />

      {/* Staff Profile Modal */}
      <StaffProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 transition-all duration-300">
        <Topbar
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
