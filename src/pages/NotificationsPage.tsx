import React, { useState } from 'react';
import { 
  Send, Radio, Bell, AlertTriangle, ShieldAlert, Info, 
  CheckCircle, Search, Megaphone, Smartphone, Mail, Globe, CheckCheck, MessageSquare 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';

export const NotificationsPage: React.FC = () => {
  const { notifications, sendBroadcastNotification, markAllNotificationsRead, markNotificationRead } = useAppStore();
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'broadcast' | 'warning' | 'emergency'>('all');

  // Form State for New Broadcast
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('All Students & Staff');
  const [type, setType] = useState<'system' | 'broadcast' | 'warning' | 'emergency'>('broadcast');
  const [channels, setChannels] = useState({
    push: true,
    email: true,
    portal: true,
    sms: false,
  });

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      toast.error('Please enter announcement title and message content');
      return;
    }
    sendBroadcastNotification({
      title,
      message,
      type,
      targetGroup,
      author: 'Avery Morgan (Admin)',
    });
    toast.success(`Broadcast "${title}" dispatched successfully across active channels`);
    setIsBroadcastModalOpen(false);
    setTitle('');
    setMessage('');
  };

  // Filtered notifications logic
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
                          n.message.toLowerCase().includes(search.toLowerCase()) ||
                          n.author.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'broadcast') return n.type === 'broadcast';
    if (activeTab === 'warning') return n.type === 'warning' || n.type === 'system';
    if (activeTab === 'emergency') return n.type === 'emergency';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-2.5">
            <span>Notifications & Broadcast Center</span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-brandBlue text-white shadow-2xs">
                {unreadCount} New
              </span>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Dispatch system broadcasts, manage automated reminders, and review notification logs.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" onClick={markAllNotificationsRead} leftIcon={<CheckCheck className="w-4 h-4 text-emerald-600" />}>
            Mark All as Read
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBroadcastModalOpen(true)}
            leftIcon={<Megaphone className="w-4 h-4" />}
            className="shadow-md hover:shadow-lg transition-all"
          >
            New Broadcast Announcement
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards (24px gap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Dispatched"
          value={notifications.length.toString()}
          icon={Radio}
          trend={{ value: "+8 this week", isPositive: true }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Unread Messages"
          value={unreadCount.toString()}
          icon={Bell}
          trend={{ value: unreadCount === 0 ? "All caught up" : "Requires attention", isPositive: unreadCount === 0 }}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Delivery Success Rate"
          value="99.4%"
          icon={CheckCircle}
          trend={{ value: "All channels active", isPositive: true }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Emergency Broadcasts"
          value={notifications.filter(n => n.type === 'emergency').length.toString()}
          icon={ShieldAlert}
          trend={{ value: "Safety protocols operational", isPositive: true }}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
      </div>

      {/* Search & Tab Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements by title, content, or sender..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
            }`}
          >
            All Stream
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'unread' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'broadcast' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
            }`}
          >
            General
          </button>

          <button
            onClick={() => setActiveTab('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'warning' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
            }`}
          >
            Warnings
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'emergency' ? 'bg-white text-navy shadow-xs' : 'text-slate-600 hover:text-navy'
            }`}
          >
            Emergency
          </button>
        </div>
      </div>

      {/* Notifications Feed */}
      <Card title="Live Notification Stream" subtitle="Historical and live announcements sent to library users">
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationRead(n.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                  n.read 
                    ? 'bg-slate-50/60 border-slate-200/70 opacity-90' 
                    : 'bg-white border-brandBlue/40 shadow-xs ring-1 ring-brandBlue/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      n.type === 'emergency' ? 'bg-red-50 text-red-600' :
                      n.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                      n.type === 'system' ? 'bg-purple-50 text-purple-600' :
                      'bg-blue-50 text-brandBlue'
                    }`}>
                      {n.type === 'emergency' ? <ShieldAlert className="w-5 h-5" /> :
                       n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                       n.type === 'system' ? <Info className="w-5 h-5" /> :
                       <Megaphone className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy text-sm">{n.title}</span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-brandBlue animate-pulse" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{n.timestamp}</span>
                        <span>•</span>
                        <span className="capitalize font-semibold text-slate-600">{n.type} priority</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        n.type === 'emergency' ? 'danger' :
                        n.type === 'warning' ? 'warning' : 'primary'
                      }
                      dot
                    >
                      {n.type}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-2.5 pl-12">{n.message}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium pl-12">
                  <span>Author: <strong className="text-navy">{n.author}</strong></span>
                  <span>Target Audience: <strong className="text-brandBlue">{n.targetGroup}</strong></span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-600">No notifications match your filter criteria</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search terms or clearing active filters</p>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Broadcast Announcement Modal */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Broadcast Announcement"
        subtitle="Send instant push notification and multi-channel alerts to library users"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSendBroadcast} 
              leftIcon={<Send className="w-4 h-4" />}
              className="shadow-md hover:shadow-lg transition-all"
            >
              Dispatch Announcement
            </Button>
          </>
        }
      >
        <form onSubmit={handleSendBroadcast} className="space-y-5">
          {/* Header Banner */}
          <div className="p-4 bg-blue-50/70 rounded-2xl border border-brandBlue/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brandBlue text-white flex items-center justify-center shrink-0 shadow-xs">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy">Live Multi-Channel Broadcast</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Announcements are broadcasted in real-time to active student apps and administrative portals.</p>
            </div>
          </div>

          <Input
            label="Announcement Title *"
            placeholder="e.g. Extended Library Hours for Midterm Exams"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Priority Type Selector Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Notification Priority Type *</label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'broadcast', label: 'General Broadcast', icon: Megaphone, color: 'text-brandBlue bg-blue-50 border-brandBlue' },
                { id: 'warning', label: 'Important Warning', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-400' },
                { id: 'emergency', label: 'Emergency Alert', icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-400' },
                { id: 'system', label: 'System Update', icon: Info, color: 'text-purple-600 bg-purple-50 border-purple-400' },
              ].map(item => {
                const IconComponent = item.icon;
                const isSelected = type === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setType(item.id as any)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? `${item.color} shadow-xs ring-1 ring-brandBlue/30`
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Select
            label="Target Audience *"
            options={[
              { value: 'All Students & Staff', label: 'All Students & Staff (Broad Coverage)' },
              { value: 'All Library Users', label: 'All Registered Library Members' },
              { value: 'Students Only', label: 'All Active Students (Self-Service App)' },
              { value: 'Library Staff Only', label: 'Library Staff & Supervisors Only' },
              { value: 'Library Managers Only', label: 'Library Managers & Administrators' },
              { value: 'Faculty & Researchers', label: 'Faculty & Post-Graduate Researchers' },
              { value: 'Ground Floor Occupants', label: 'Ground Floor - Main Reading Hall' },
              { value: 'Floor 1 Occupants', label: 'Floor 1 - Quiet Zone Occupants' },
              { value: 'Floor 2 Occupants', label: 'Floor 2 - Research Hub Occupants' },
              { value: 'Floor 3 Occupants', label: 'Floor 3 - Digital Media Lab Occupants' },
              { value: 'Floor 4 Occupants', label: 'Floor 4 - Group Discussion Pods' },
              { value: 'Floor 7 Occupants', label: 'Floor 7 - Silent Sanctuary' },
              { value: 'Currently Checked-in Students', label: 'Currently Checked-in Seat Occupants' },
              { value: 'Waiting List Queued Students', label: 'Waiting List Queued Students' },
            ]}
            value={targetGroup}
            onChange={(e) => setTargetGroup(e.target.value)}
          />

          {/* Delivery Channels Checklist */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Dispatch Delivery Channels</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={channels.push}
                  onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                  className="rounded text-brandBlue focus:ring-brandBlue"
                />
                <span className="font-semibold text-navy flex items-center gap-1"><Smartphone className="w-3.5 h-3.5 text-slate-500" /> Push</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                  className="rounded text-brandBlue focus:ring-brandBlue"
                />
                <span className="font-semibold text-navy flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-500" /> Email</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={channels.portal}
                  onChange={(e) => setChannels({ ...channels, portal: e.target.checked })}
                  className="rounded text-brandBlue focus:ring-brandBlue"
                />
                <span className="font-semibold text-navy flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-slate-500" /> Portal</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                  className="rounded text-brandBlue focus:ring-brandBlue"
                />
                <span className="font-semibold text-navy flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5 text-slate-500" /> SMS</span>
              </label>
            </div>
          </div>

          {/* Message Content Textarea with Counter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Message Content *</span>
              <span className="text-slate-400 font-mono text-[11px]">{message.length} / 500 chars</span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter announcement text to be broadcasted to users..."
              className="w-full bg-white border border-slate-200 rounded-xl text-sm text-navy p-3.5 focus:outline-none focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20 transition-all leading-relaxed"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
