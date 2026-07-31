import React, { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/useAppStore';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement>(null);

  const { 
    activeDrawer, 
    closeDrawer, 
    notifications, 
    markNotificationRead,
    markAllNotificationsRead 
  } = useAppStore();

  // Scroll main content container to top whenever navigating to a new route/section
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
      mainContentRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.key]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-lightBg font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Top Header */}
        <Header />

        {/* Page View Container with Max-Width 1600px and 32px padding */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          <div className="max-w-[1600px] w-full mx-auto space-y-8">
            <Outlet />
          </div>
        </main>

        {/* Global Footer */}
        <footer className="bg-white border-t border-slate-200/80 px-6 sm:px-8 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-medium text-navy">© 2026 Academic Flux Smart Library System</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline-block" />
            <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online (v2.4.0)
            </span>
          </div>
          <div className="flex items-center gap-5 text-slate-500 font-medium">
            <a href="#help" className="hover:text-brandBlue transition-colors">Documentation</a>
            <a href="#support" className="hover:text-brandBlue transition-colors">Support Desk</a>
            <a href="#privacy" className="hover:text-brandBlue transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>

      {/* Slide-over Notifications Drawer */}
      <Drawer
        isOpen={activeDrawer?.type === 'notifications'}
        onClose={closeDrawer}
        title="Notification Center"
        subtitle="Recent system notifications and broadcasts"
        width="md"
        footer={
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={markAllNotificationsRead}>
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" onClick={closeDrawer}>
              Close Panel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                n.read ? 'bg-slate-50 border-slate-200/60 opacity-80' : 'bg-white border-brandBlue/30 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className={`text-xs font-bold truncate ${
                  n.type === 'emergency' ? 'text-errorRed' :
                  n.type === 'warning' ? 'text-amber-600' : 'text-brandBlue'
                }`}>
                  {n.title}
                </span>
                <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed break-words">{n.message}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100 font-medium">
                <span className="truncate">By {n.author}</span>
                <span className="truncate">Target: {n.targetGroup}</span>
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      {/* Global Toast Notifications (Sonner) set to Top Center */}
      <Toaster position="top-center" richColors duration={2000} />
    </div>
  );
};
