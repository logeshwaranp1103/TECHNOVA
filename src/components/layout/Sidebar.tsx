import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  LayoutDashboard, CalendarCheck, Layers, Armchair, 
  Users, UserCheck, Clock, LineChart, FileText, BellRing, 
  ShieldAlert, Settings, User, LogOut, ChevronLeft, ChevronRight, Library
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar, adminProfile, unreadNotificationCount } = useAppStore();

  const navigationGroups: NavGroup[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
      ]
    },
    {
      title: 'LIBRARY',
      items: [
        { id: 'reservations', label: 'Reservations', path: '/reservations', icon: CalendarCheck },
        { id: 'floors', label: 'Floors', path: '/floors', icon: Layers },
        { id: 'seats', label: 'Seats', path: '/seats', icon: Armchair },
      ]
    },
    {
      title: 'USERS',
      items: [
        { id: 'students', label: 'Students', path: '/students', icon: Users },
        { id: 'staff', label: 'Library Staff', path: '/staff', icon: UserCheck },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'waiting-list', label: 'Waiting List', path: '/waiting-list', icon: Clock },
        { id: 'analytics', label: 'Analytics', path: '/analytics', icon: LineChart },
        { id: 'reports', label: 'Reports', path: '/reports', icon: FileText },
        { id: 'notifications', label: 'Notifications', path: '/notifications', icon: BellRing, badge: unreadNotificationCount },
        { id: 'audit-logs', label: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert },
        { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
      ]
    }
  ];

  return (
    <aside
      className={clsx(
        "bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none relative shadow-xs",
        sidebarCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Sidebar Header Brand Logo */}
      <div className={clsx("border-b border-slate-100 flex items-center transition-all", sidebarCollapsed ? "py-4 px-2 justify-center" : "p-4 justify-between")}>
        {sidebarCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center group cursor-pointer focus:outline-none"
            title="Expand sidebar"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-brandBlue text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 group-hover:scale-105 transition-transform">
                <Library className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center shadow-xs group-hover:bg-brandBlue group-hover:text-white transition-colors">
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden min-w-0">
              <div className="w-10 h-10 rounded-xl bg-brandBlue text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                <Library className="w-5 h-5" />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-bold text-navy text-base leading-tight tracking-tight truncate">Northstar</span>
                <span className="text-[11px] font-medium text-slate-500 truncate">Library Operations</span>
              </motion.div>
            </div>

            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors hidden sm:flex shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Links Grouped */}
      <div className={clsx("flex-1 overflow-y-auto py-4 space-y-6", sidebarCollapsed ? "px-2" : "px-3")}>
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!sidebarCollapsed && (
              <h4 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {group.title}
              </h4>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive: linkActive }) => clsx(
                    "flex items-center rounded-xl text-sm font-medium transition-all duration-150 relative group",
                    sidebarCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                    (linkActive || isActive)
                      ? "bg-blue-50/80 text-brandBlue font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-navy"
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={clsx("w-5 h-5 shrink-0 transition-colors", (isActive) ? "text-brandBlue" : "text-slate-400 group-hover:text-slate-600")} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}

                  {/* Notification Badge */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={clsx(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-errorRed text-white shrink-0",
                      sidebarCollapsed ? "absolute -top-1 -right-1" : "ml-auto"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer User Info */}
      <div className={clsx("p-3 border-t border-slate-100 bg-slate-50/40 flex items-center", sidebarCollapsed ? "justify-center" : "justify-between")}>
        <div 
          onClick={() => navigate('/profile')}
          className={clsx("flex items-center gap-3 overflow-hidden cursor-pointer group p-1 -m-1 rounded-lg hover:bg-slate-100/70 transition-all", sidebarCollapsed && "justify-center")}
          title="View Admin Profile"
        >
          <div className="w-9 h-9 rounded-full bg-brandBlue/10 border border-brandBlue/20 flex items-center justify-center shrink-0 group-hover:border-brandBlue transition-colors">
            <User className="w-4 h-4 text-brandBlue" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-navy group-hover:text-brandBlue transition-colors truncate">{adminProfile.name}</span>
              <span className="text-[10px] text-slate-500 truncate">Administrator</span>
            </div>
          )}
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={() => alert('Log out trigger')}
            className="p-1.5 text-slate-400 hover:text-errorRed hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
