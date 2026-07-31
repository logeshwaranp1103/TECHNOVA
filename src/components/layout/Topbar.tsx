import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { Bell, Menu, ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { formatDate } from '../../utils/dateUtils';

export interface TopbarProps {
  onMenuToggle: () => void;
  onOpenProfile?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle, onOpenProfile }) => {
  const { currentUser } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id);
    }
  }, [currentUser, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const pathParts = location.pathname.split('/').filter(Boolean);

  const formattedLiveTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedLiveDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs transition-all">
      {/* Left Path / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="text-slate-400 font-semibold">SeatSync OS</span>
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className={idx === pathParts.length - 1 ? 'font-bold text-[#2563EB] capitalize' : 'capitalize text-slate-600'}>
                {part.replace('-', ' ')}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="flex items-center gap-4">
        {/* Live Campus Time Badge */}
        <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200/70 text-xs font-medium text-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono font-bold text-slate-900">{formattedLiveTime}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-medium">{formattedLiveDate}</span>
        </div>
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 my-2">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 rounded-lg text-xs transition-colors cursor-pointer ${
                        !n.isRead ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900">{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-1" />}
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 leading-snug">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">No notifications yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Button */}
        {currentUser && (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="View & edit staff profile"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} size="sm" />
          </button>
        )}
      </div>
    </header>
  );
};
