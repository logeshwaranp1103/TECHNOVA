import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { useSync } from '../hooks/useSync';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek, subDays } from 'date-fns';
import { 
  Bell, BookmarkCheck, ListOrdered, Megaphone, Info, Check, Trash2, 
  Search, Filter, CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle, 
  MoreVertical, ArrowRight, Eye, Sparkles, Layers, RefreshCw, X, CheckSquare, Square
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Toolbar & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Bulk Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Menu Overlay State
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [announcementModal, setAnnouncementModal] = useState(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const headerMenuRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await notificationService.getNotifications(user.id);
      setNotifications(res);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useSync((event) => {
    if (event?.type === 'storage_change') {
      fetchNotifications();
    }
  });

  // Handle outside click for header menu dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedNotifications = useMemo(() => {
    let result = notifications;

    // Filter by Tab
    if (activeTab === 'unread') result = result.filter(n => !n.isRead);
    else if (activeTab === 'reservations') result = result.filter(n => n.category === 'Reservation' || n.title.includes('Booking') || n.title.includes('Seat'));
    else if (activeTab === 'waitlist') result = result.filter(n => n.category === 'Waitlist' || n.title.includes('Waitlist'));
    else if (activeTab === 'announcements') result = result.filter(n => n.category === 'Announcement' || n.category === 'Warning' || n.category === 'Restriction' || n.title.includes('Notice') || n.title.includes('Announcement'));

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(n => 
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q)
      );
    }

    // Sort Logic
    return [...result].sort((a, b) => {
      if (sortOption === 'unread_first') {
        if (a.isRead === b.isRead) return new Date(b.createdAt) - new Date(a.createdAt);
        return a.isRead ? 1 : -1;
      }
      if (sortOption === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest first
    });
  }, [notifications, activeTab, searchQuery, sortOption]);

  // Group notifications into Date categories
  const groupedNotifications = useMemo(() => {
    const groups = { Today: [], Yesterday: [], 'Earlier This Week': [], Older: [] };

    filteredAndSortedNotifications.forEach(item => {
      const date = new Date(item.createdAt);
      if (isToday(date)) groups['Today'].push(item);
      else if (isYesterday(date)) groups['Yesterday'].push(item);
      else if (isThisWeek(date)) groups['Earlier This Week'].push(item);
      else groups['Older'].push(item);
    });

    // Sort each group so unread items come first if sorted newest
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [filteredAndSortedNotifications]);

  // Counts calculation
  const counts = useMemo(() => {
    const unread = notifications.filter(n => !n.isRead).length;
    const reservations = notifications.filter(n => n.category === 'Reservation' || n.title.includes('Booking') || n.title.includes('Seat')).length;
    const waitlist = notifications.filter(n => n.category === 'Waitlist' || n.title.includes('Waitlist')).length;
    const announcements = notifications.filter(n => n.category === 'Announcement' || n.category === 'Warning' || n.category === 'Restriction' || n.title.includes('Notice')).length;
    return { all: notifications.length, unread, reservations, waitlist, announcements };
  }, [notifications]);

  // Individual Handlers
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    await notificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setActiveMenuId(null);
  };

  const handleMarkAsUnread = async (id, e) => {
    if (e) e.stopPropagation();
    await notificationService.markAsUnread(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    setActiveMenuId(null);
  };

  const handleRemoveNotification = async (id, e) => {
    if (e) e.stopPropagation();
    await notificationService.removeNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification removed');
    setActiveMenuId(null);
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
    setHeaderMenuOpen(false);
  };

  const handleMarkAllUnread = async () => {
    if (!user) return;
    await notificationService.markAllAsUnread(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: false })));
    toast.success('All notifications marked as unread');
    setHeaderMenuOpen(false);
  };

  const handleClearRead = async () => {
    if (!user) return;
    await notificationService.clearReadNotifications(user.id);
    setNotifications(prev => prev.filter(n => !n.isRead));
    setClearConfirmOpen(false);
    toast.success('Cleared all read notifications');
  };

  // Bulk Selection Handlers
  const toggleSelectId = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAndSortedNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedNotifications.map(n => n.id));
    }
  };

  const handleBulkMarkRead = async () => {
    await notificationService.bulkMarkAsRead(selectedIds);
    setNotifications(prev => prev.map(n => selectedIds.includes(n.id) ? { ...n, isRead: true } : n));
    toast.success(`${selectedIds.length} marked as read`);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    await notificationService.bulkRemove(selectedIds);
    setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
    toast.success(`${selectedIds.length} notifications removed`);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  // Contextual action click handler
  const handleContextualAction = (notif, e) => {
    if (e) e.stopPropagation();
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }

    if (notif.title.includes('Booking') || notif.category === 'Reservation') {
      navigate('/student/reservations');
    } else if (notif.title.includes('Seat Now Available') || notif.title.includes('Available')) {
      navigate('/student/find-seat');
    } else if (notif.title.includes('Notice') || notif.category === 'Announcement') {
      setAnnouncementModal(notif);
    } else {
      navigate('/student/reservations');
    }
  };

  // Type-specific icon and style configuration
  const getTypeConfig = (notif) => {
    const title = notif.title || '';
    const cat = notif.category || '';

    if (title.includes('Confirmed') || title.includes('Booked Successfully')) {
      return { icon: CheckCircle2, bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', actionText: 'View Booking' };
    }
    if (title.includes('Cancelled')) {
      return { icon: XCircle, bg: 'bg-red-50 text-red-600 border-red-200', actionText: 'View Details' };
    }
    if (title.includes('Reminder') || title.includes('Upcoming')) {
      return { icon: Clock, bg: 'bg-blue-50 text-brandBlue border-blue-200', actionText: 'View Pass' };
    }
    if (title.includes('Waitlist') || cat === 'Waitlist') {
      return { icon: ListOrdered, bg: 'bg-amber-50 text-amber-600 border-amber-200', actionText: 'Check Status' };
    }
    if (title.includes('Available')) {
      return { icon: Sparkles, bg: 'bg-emerald-50 text-emerald-600 border-emerald-200', actionText: 'Book Now' };
    }
    if (title.includes('Check-in Successful') || title.includes('Checked In')) {
      return { icon: ShieldCheck, bg: 'bg-teal-50 text-teal-600 border-teal-200', actionText: 'View Session' };
    }
    if (title.includes('Warning') || title.includes('Penalty') || cat === 'Warning') {
      return { icon: AlertTriangle, bg: 'bg-amber-50 text-amber-700 border-amber-200', actionText: 'View Rules' };
    }
    if (cat === 'Announcement' || title.includes('Notice')) {
      return { icon: Megaphone, bg: 'bg-purple-50 text-purple-600 border-purple-200', actionText: 'Read Notice' };
    }
    return { icon: Bell, bg: 'bg-slate-100 text-slate-600 border-slate-200', actionText: 'View' };
  };

  const getEmptyStateInfo = () => {
    switch (activeTab) {
      case 'unread':
        return { title: 'You’re all caught up', message: 'You have no unread notifications right now.', icon: CheckCircle2 };
      case 'reservations':
        return { title: 'No reservation updates', message: 'Booking confirmations and reminders will appear here.', icon: BookmarkCheck };
      case 'waitlist':
        return { title: 'No waitlist updates', message: 'Updates regarding waitlist queue positions will appear here.', icon: ListOrdered };
      case 'announcements':
        return { title: 'No announcements', message: 'Library announcements and administration notices will appear here.', icon: Megaphone };
      default:
        return { title: 'No notifications yet', message: 'Updates about your bookings and library activity will appear here.', icon: Bell };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-20 bg-white rounded-2xl border"></div>
        <div className="h-10 bg-white rounded-xl border"></div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-xl border"></div>)}
        </div>
      </div>
    );
  }

  const emptyInfo = getEmptyStateInfo();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* 1. PAGE HEADER */}
      <div className="space-y-3">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="hover:text-navy cursor-pointer" onClick={() => navigate('/student/dashboard')}>Dashboard</span>
          <span>/</span>
          <span className="text-navy font-semibold">Notifications</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">Notifications</h1>
              {counts.unread > 0 ? (
                <Badge variant="default" className="bg-brandBlue text-white font-bold text-xs px-2.5 py-0.5 rounded-full">
                  {counts.unread} unread
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                  All caught up ✓
                </Badge>
              )}
            </div>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Stay updated with your seat bookings and library announcements.
            </p>
          </div>

          {/* Action Menu Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {counts.unread > 0 && (
              <Button 
                onClick={handleMarkAllRead} 
                className="h-9 px-4 bg-brandBlue hover:bg-brandBlue/90 text-white font-bold text-xs shadow-xs"
              >
                <Check size={14} className="mr-1.5" /> Mark All as Read
              </Button>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIds([]); }} 
              className={`h-9 text-xs font-semibold border-slate-200 ${isSelectionMode ? 'bg-slate-100 text-navy' : ''}`}
            >
              {isSelectionMode ? 'Cancel Select' : 'Select'}
            </Button>

            {/* Overflow Header Actions Menu */}
            <div className="relative" ref={headerMenuRef}>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 border-slate-200"
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                aria-label="More Options"
              >
                <MoreVertical size={16} className="text-slate-600" />
              </Button>

              {headerMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1.5 space-y-1 text-xs animate-in fade-in duration-150">
                  <button 
                    onClick={handleMarkAllUnread}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2"
                  >
                    <Bell size={14} className="text-brandBlue" /> Mark all as unread
                  </button>
                  <button 
                    onClick={() => { setHeaderMenuOpen(false); setClearConfirmOpen(true); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 font-medium text-destructive flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Clear read notifications
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPACT SUMMARY COUNT CHIPS */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge 
          onClick={() => setActiveTab('all')} 
          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${activeTab === 'all' ? 'bg-navy text-white border-navy shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          All {counts.all}
        </Badge>
        <Badge 
          onClick={() => setActiveTab('unread')} 
          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${activeTab === 'unread' ? 'bg-brandBlue text-white border-brandBlue shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          Unread {counts.unread}
        </Badge>
        <Badge 
          onClick={() => setActiveTab('reservations')} 
          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${activeTab === 'reservations' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          Reservations {counts.reservations}
        </Badge>
        <Badge 
          onClick={() => setActiveTab('waitlist')} 
          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${activeTab === 'waitlist' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          Waitlist {counts.waitlist}
        </Badge>
        <Badge 
          onClick={() => setActiveTab('announcements')} 
          className={`cursor-pointer text-xs font-semibold px-3 py-1 rounded-lg border transition-all ${activeTab === 'announcements' ? 'bg-purple-600 text-white border-purple-600 shadow-xs' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
        >
          Announcements {counts.announcements}
        </Badge>
      </div>

      {/* 3. SEARCH & SORT TOOLBAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brandBlue focus:bg-white"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Filter size={14} /> Sort:
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-9 text-xs rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-navy focus:outline-none focus:ring-2 focus:ring-brandBlue"
            >
              <option value="newest">Newest First</option>
              <option value="unread_first">Unread First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* 10. BULK ACTION TOOLBAR (Appears when selection mode active) */}
      {isSelectionMode && (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-md flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <button onClick={handleSelectAll} className="flex items-center gap-2 text-xs font-semibold hover:text-tealAccent">
              {selectedIds.length === filteredAndSortedNotifications.length ? <CheckSquare size={16} /> : <Square size={16} />}
              Select All ({selectedIds.length}/{filteredAndSortedNotifications.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleBulkMarkRead} disabled={selectedIds.length === 0} className="h-8 text-xs bg-brandBlue hover:bg-brandBlue/90">
              Mark Read ({selectedIds.length})
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="h-8 text-xs">
              Delete ({selectedIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* 4, 5, 6 & 7. GROUPED NOTIFICATIONS LIST */}
      {Object.keys(groupedNotifications).length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border text-slate-400 shadow-sm">
            <emptyInfo.icon size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy">{emptyInfo.title}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">{emptyInfo.message}</p>
          </div>
          {activeTab === 'reservations' && (
            <Button onClick={() => navigate('/student/find-seat')} size="sm" className="bg-brandBlue text-white font-bold">
              <Search size={14} className="mr-2" /> Book a Seat Now
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([groupTitle, items]) => (
            <div key={groupTitle} className="space-y-3">
              
              {/* Group Heading */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 border-b border-slate-200/60 pb-1.5">
                <span>{groupTitle}</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
                  {items.length}
                </span>
              </div>

              {/* Group Items List */}
              <div className="space-y-2.5">
                {items.map(notif => {
                  const typeConfig = getTypeConfig(notif);
                  const Icon = typeConfig.icon;
                  const isSelected = selectedIds.includes(notif.id);

                  return (
                    <div 
                      key={notif.id}
                      onClick={() => isSelectionMode ? toggleSelectId(notif.id) : (!notif.isRead && handleMarkAsRead(notif.id))}
                      className={`
                        relative bg-white rounded-xl p-4 border transition-all duration-200 flex items-start gap-4 group cursor-pointer
                        ${!notif.isRead ? 'border-l-4 border-l-brandBlue border-slate-200 bg-blue-50/20 shadow-xs' : 'border-slate-200/90 hover:border-slate-300'}
                        ${isSelected ? 'ring-2 ring-brandBlue bg-brandBlue/5' : ''}
                      `}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectId(notif.id)}
                          className="mt-1.5 h-4 w-4 rounded border-slate-300 text-brandBlue focus:ring-brandBlue" 
                        />
                      )}

                      {/* Icon Badge */}
                      <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${typeConfig.bg}`}>
                        <Icon size={18} />
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-navy' : 'font-semibold text-slate-700'}`}>
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="h-2 w-2 rounded-full bg-brandBlue inline-block" title="Unread" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono shrink-0">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </span>
                        </div>

                        <p className={`text-xs leading-relaxed ${!notif.isRead ? 'text-slate-800' : 'text-slate-600'}`}>
                          {notif.message}
                        </p>

                        {/* 8. Contextual Action Button */}
                        <div className="pt-2 flex items-center justify-between">
                          <button
                            onClick={(e) => handleContextualAction(notif, e)}
                            className="text-xs font-bold text-brandBlue hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                          >
                            {typeConfig.actionText} <ArrowRight size={12} />
                          </button>

                          {/* Individual Item Options Overflow */}
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === notif.id ? null : notif.id); }}
                              className="p-1 text-slate-400 hover:text-navy rounded-md hover:bg-slate-100"
                              title="Notification options"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeMenuId === notif.id && (
                              <div className="absolute right-0 bottom-full mb-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-1 text-xs space-y-1 animate-in fade-in duration-150">
                                {notif.isRead ? (
                                  <button onClick={(e) => handleMarkAsUnread(notif.id, e)} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2">
                                    <Bell size={13} className="text-brandBlue" /> Mark as unread
                                  </button>
                                ) : (
                                  <button onClick={(e) => handleMarkAsRead(notif.id, e)} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium text-slate-700 flex items-center gap-2">
                                    <Check size={13} className="text-emerald-600" /> Mark as read
                                  </button>
                                )}
                                <button onClick={(e) => handleRemoveNotification(notif.id, e)} className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-50 font-medium text-destructive flex items-center gap-2">
                                  <Trash2 size={13} /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ANNOUNCEMENT DETAIL MODAL */}
      <Dialog open={!!announcementModal} onOpenChange={() => setAnnouncementModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy flex items-center gap-2">
              <Megaphone size={20} className="text-purple-600" /> Announcement Details
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Published by Library Administration
            </DialogDescription>
          </DialogHeader>

          {announcementModal && (
            <div className="space-y-4 py-2 text-xs">
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-purple-900 text-sm">{announcementModal.title}</h4>
                <p className="text-slate-700 leading-relaxed">{announcementModal.message}</p>
                <span className="text-[10px] text-purple-600 block pt-2 font-mono">
                  {format(new Date(announcementModal.createdAt), 'PPP • p')}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setAnnouncementModal(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CLEAR READ CONFIRMATION DIALOG */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy">Clear Read Notifications?</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              This will remove all read notifications from your history. Unread notifications will remain intact.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setClearConfirmOpen(false)}>Keep Notifications</Button>
            <Button variant="destructive" onClick={handleClearRead}>Clear Read</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
