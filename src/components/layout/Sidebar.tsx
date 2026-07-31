import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useReservationStore } from '../../store/useReservationStore';
import { useWaitlistStore } from '../../store/useWaitlistStore';
import {
  LayoutDashboard,
  BookmarkCheck,
  QrCode,
  Sliders,
  AlertTriangle,
  LogOut,
  Sparkles,
  Users,
  Settings,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';

export interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenProfile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onMobileClose, onOpenProfile }) => {
  const { currentUser, logout } = useAuthStore();
  const { reservations } = useReservationStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  const location = useLocation();

  if (!currentUser) return null;

  const noShowCount = reservations.filter((r) => r.status === 'NO_SHOW').length;
  const upcomingCount = reservations.filter((r) => r.status === 'UPCOMING').length;
  const waitingListCount = waitlistEntries.filter((e) => e.status === 'WAITING' || e.status === 'NOTIFIED').length;

  const coreModules = [
    {
      to: '/staff/dashboard',
      label: 'Live Occupancy',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />,
    },
    {
      to: '/staff/reservations',
      label: 'Reservations Overview',
      icon: <BookmarkCheck className="w-4 h-4" />,
      badge: upcomingCount > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700">
          {upcomingCount}
        </span>
      ) : null,
    },
    {
      to: '/staff/scan',
      label: 'QR Desk Scanner',
      icon: <QrCode className="w-4 h-4" />,
      badge: <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">Optical</span>,
    },
  ];

  const systemModules = [
    {
      to: '/staff/seats',
      label: 'Seat Management',
      icon: <Sliders className="w-4 h-4" />,
    },
    {
      to: '/staff/waitlist',
      label: 'Waiting List',
      icon: <Users className="w-4 h-4" />,
      badge: waitingListCount > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300/60">
          {waitingListCount}
        </span>
      ) : null,
    },
    {
      to: '/staff/no-shows',
      label: 'No-Shows Monitor',
      icon: <AlertTriangle className="w-4 h-4" />,
      badge: noShowCount > 0 ? (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 animate-pulse">
          {noShowCount}
        </span>
      ) : null,
    },
    {
      to: '/staff/policies',
      label: 'Policy Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-700 flex flex-col transition-transform duration-300 border-r border-slate-200/90 shadow-2xl md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sleek Executive Brand Header */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-teal-400 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/25">
                <Sparkles className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-base text-slate-900 tracking-tight leading-none">
                  SeatSync <span className="text-teal-600 font-extrabold text-xs">OS</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1">
                  Smart Library Platform
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Modules List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Section 1: Core Operations */}
          <div className="space-y-1">
            <div className="px-3 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Core Operations
              </p>
            </div>
            {coreModules.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onMobileClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-xs shadow-blue-500/25 translate-x-0.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 transition-colors'}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>
                  {link.badge}
                </NavLink>
              );
            })}
          </div>

          {/* Section 2: Desk Controls & Audits */}
          <div className="space-y-1">
            <div className="px-3 mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Desk Controls & Audits
              </p>
            </div>
            {systemModules.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onMobileClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold shadow-xs shadow-blue-500/25 translate-x-0.5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700 transition-colors'}>
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </div>
                  {link.badge}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Sleek Staff Profile Card Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/80">
          <div
            onClick={onOpenProfile}
            className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
            title="Click to view & edit staff profile"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {currentUser.name}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate">ID: {currentUser.collegeId}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  logout();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
