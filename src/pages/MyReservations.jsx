import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { useSync } from '../hooks/useSync';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { format } from 'date-fns';
import {
  MapPin, Clock, Calendar, QrCode, LogOut, XCircle, Search,
  ChevronRight, Copy, Check, Filter, Info, ShieldCheck, Download,
  Printer, ArrowRight, BookOpen, AlertTriangle, Eye, CheckCircle2, RefreshCw
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function MyReservations() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Toolbar Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [qrModal, setQrModal] = useState(null);
  const [detailsModal, setDetailsModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('Change of schedule');
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await bookingService.getMyBookings(user.id);
      setReservations(res);
    } catch (error) {
      toast.error('Failed to fetch reservations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [user]);

  useSync((event) => {
    if (event?.type === 'storage_change' || event?.type === 'login') {
      fetchReservations();
    }
  });

  const handleCheckOut = async (id) => {
    if (!user) return;
    try {
      await bookingService.checkoutBooking(id, user.id);
      toast.success('Successfully checked out');
      fetchReservations();
    } catch (error) {
      toast.error(error.message || 'Failed to check out');
    }
  };

  const handleCancel = async () => {
    if (!cancelModal || !user) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(cancelModal.id, user.id);
      toast.success('Reservation cancelled successfully');
      setCancelModal(null);
      setCancelReason('Change of schedule');
      fetchReservations();
    } catch (error) {
      toast.error(error.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  const handleCheckIn = async (id) => {
    if (!user) return;
    try {
      await bookingService.checkinBooking(id, user.id);
      toast.success('Checked in successfully');
      setQrModal(null);
      fetchReservations();
    } catch (error) {
      toast.error(error.message || 'Failed to check in');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success('Booking ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Convert raw IDs to friendly text
  const getFriendlyLocation = (floorId, zoneId) => {
    const floorMap = { f1: 'Ground Floor', f2: 'First Floor' };
    const zoneMap = { z1: 'Quiet Study Zone', z2: 'General Reading Zone' };

    const floor = floorMap[floorId] || floorId || 'Ground Floor';
    const zone = zoneMap[zoneId] || zoneId || 'Reading Area';
    return `${floor} · ${zone}`;
  };

  const format12HourTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  };

  // Tab counts
  const counts = useMemo(() => {
    return {
      active: reservations.filter(r => r.status === 'active').length,
      upcoming: reservations.filter(r => r.status === 'confirmed').length,
      completed: reservations.filter(r => r.status === 'completed').length,
      cancelled: reservations.filter(r => r.status === 'cancelled').length,
      no_show: reservations.filter(r => r.status === 'no_show').length,
    };
  }, [reservations]);

  // Filter and Sort Logic
  const filteredAndSortedReservations = useMemo(() => {
    let result = reservations;

    // Filter by tab
    if (activeTab === 'active') result = result.filter(r => r.status === 'active');
    else if (activeTab === 'upcoming') result = result.filter(r => r.status === 'confirmed');
    else if (activeTab === 'completed') result = result.filter(r => r.status === 'completed');
    else if (activeTab === 'cancelled') result = result.filter(r => r.status === 'cancelled');
    else if (activeTab === 'no_show') result = result.filter(r => r.status === 'no_show');

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) ||
        r.seatNumber.toLowerCase().includes(q) ||
        r.floorId.toLowerCase().includes(q) ||
        r.zoneId.toLowerCase().includes(q)
      );
    }

    // Sort order
    return [...result].sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt || b.bookingDate) - new Date(a.createdAt || a.bookingDate);
      if (sortOption === 'oldest') return new Date(a.createdAt || a.bookingDate) - new Date(b.createdAt || b.bookingDate);
      return 0;
    });
  }, [reservations, activeTab, searchQuery, sortOption]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge variant="success" className="font-semibold">Active Session</Badge>;
      case 'confirmed': return <Badge variant="default" className="bg-brandBlue font-semibold">Upcoming</Badge>;
      case 'completed': return <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">Completed</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="font-semibold">Cancelled</Badge>;
      case 'no_show': return <Badge variant="warning" className="font-semibold">No-Show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmptyStateMessage = () => {
    switch (activeTab) {
      case 'active':
        return { title: 'No Active Sessions', message: 'You are not currently checked into any study seat.', icon: Clock };
      case 'upcoming':
        return { title: 'No Upcoming Reservations', message: 'You have no confirmed bookings scheduled for tomorrow.', icon: Calendar };
      case 'completed':
        return { title: 'No Completed Sessions', message: 'Completed library study sessions will be recorded here.', icon: CheckCircle2 };
      case 'cancelled':
        return { title: 'No Cancelled Bookings', message: 'Reservations you release will appear in this list.', icon: XCircle };
      case 'no_show':
        return { title: 'No Missed Reservations', message: 'Great job! You have not missed any reserved library slots.', icon: ShieldCheck };
      default:
        return { title: 'No Reservations Found', message: 'No bookings match your current filter criteria.', icon: Search };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-24 bg-white rounded-2xl border"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-xl border"></div>)}
        </div>
        <div className="h-12 bg-white rounded-xl border"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-white rounded-xl border"></div>)}
        </div>
      </div>
    );
  }

  const emptyInfo = getEmptyStateMessage();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* 1. PAGE HEADER */}
      <div className="space-y-3">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="hover:text-navy cursor-pointer" onClick={() => navigate('/student/dashboard')}>Dashboard</span>
          <span>/</span>
          <span className="text-navy font-semibold">My Bookings</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">My Reservations</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              View, manage, and verify your library seat bookings.
            </p>
          </div>

          <Button
            onClick={() => navigate('/student/find-seat')}
            className="h-11 px-6 bg-brandBlue hover:bg-brandBlue/90 text-white font-bold shadow-md shadow-brandBlue/20 shrink-0"
          >
            <Search size={16} className="mr-2" /> Book a New Seat
          </Button>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('active')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${activeTab === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' : 'border-slate-200 hover:border-emerald-300'}`}
        >
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Active</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-2xl font-extrabold text-navy mt-2">{counts.active}</div>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Currently Checked In</p>
        </div>

        <div
          onClick={() => setActiveTab('upcoming')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${activeTab === 'upcoming' ? 'border-brandBlue ring-2 ring-brandBlue/20 shadow-sm' : 'border-slate-200 hover:border-brandBlue/40'}`}
        >
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Upcoming</span>
            <Calendar size={14} className="text-brandBlue" />
          </div>
          <div className="text-2xl font-extrabold text-navy mt-2">{counts.upcoming}</div>
          <p className="text-[11px] text-brandBlue font-medium mt-0.5">Scheduled Tomorrow</p>
        </div>

        <div
          onClick={() => setActiveTab('completed')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${activeTab === 'completed' ? 'border-slate-400 ring-2 ring-slate-400/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Completed</span>
            <CheckCircle2 size={14} className="text-slate-600" />
          </div>
          <div className="text-2xl font-extrabold text-navy mt-2">{counts.completed}</div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Attended Sessions</p>
        </div>

        <div
          onClick={() => setActiveTab('cancelled')}
          className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${activeTab === 'cancelled' ? 'border-destructive ring-2 ring-destructive/20 shadow-sm' : 'border-slate-200 hover:border-destructive/30'}`}
        >
          <div className="flex justify-between items-start text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Cancelled</span>
            <XCircle size={14} className="text-destructive" />
          </div>
          <div className="text-2xl font-extrabold text-navy mt-2">{counts.cancelled}</div>
          <p className="text-[11px] text-destructive font-medium mt-0.5">Released Bookings</p>
        </div>
      </div>

      {/* 3. STATUS TABS WITH REAL BOOKING COUNTS */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar">
        <div className="flex gap-1 min-w-max">
          {[
            { id: 'upcoming', label: `Upcoming (${counts.upcoming})` },
            { id: 'active', label: `Active (${counts.active})` },
            { id: 'completed', label: `Completed (${counts.completed})` },
            { id: 'cancelled', label: `Cancelled (${counts.cancelled})` },
            { id: 'no_show', label: `No-Show (${counts.no_show})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-brandBlue text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-navy'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by booking ID, seat, or floor..."
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
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          {(searchQuery || sortOption !== 'newest') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setSortOption('newest'); }} className="text-xs text-brandBlue h-9">
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* 5 & 6. RESERVATION CARDS GRID */}
      {filteredAndSortedReservations.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border text-slate-400 shadow-sm">
            <emptyInfo.icon size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy">{emptyInfo.title}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">{emptyInfo.message}</p>
          </div>
          {activeTab === 'upcoming' && (
            <Button onClick={() => navigate('/student/find-seat')} size="sm" className="bg-brandBlue text-white font-bold">
              <Search size={14} className="mr-2" /> Reserve a Seat Now
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedReservations.map(res => {
            const friendlyLoc = getFriendlyLocation(res.floorId, res.zoneId);

            return (
              <Card
                key={res.id}
                className={`
                  flex flex-col justify-between border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-md
                  ${res.status === 'active' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-white'}
                `}
              >
                {/* Card Header */}
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-start justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Seat Number</span>
                    <CardTitle className="text-2xl font-extrabold text-navy">{res.seatNumber}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(res.status)}
                    <button
                      onClick={() => copyToClipboard(res.id)}
                      className="text-[10px] font-mono text-slate-400 hover:text-brandBlue flex items-center gap-1 mt-1"
                      title="Click to copy ID"
                    >
                      {res.id} {copiedId === res.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                    </button>
                  </div>
                </CardHeader>

                {/* Details Section */}
                <CardContent className="p-5 space-y-3 text-xs flex-1">
                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                    <Calendar size={15} className="text-brandBlue shrink-0" />
                    <span>{format(new Date(res.bookingDate), 'EEEE, d MMMM yyyy')}</span>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                    <Clock size={15} className="text-brandBlue shrink-0" />
                    <span className="font-mono">{format12HourTime(res.startTime)} – {format12HourTime(res.endTime)}</span>
                    <Badge variant="outline" className="text-[10px] font-normal py-0">1 Hour</Badge>
                  </div>

                  <div className="flex items-center gap-2.5 text-slate-600 font-medium">
                    <MapPin size={15} className="text-brandBlue shrink-0" />
                    <span>{friendlyLoc}</span>
                  </div>
                </CardContent>

                {/* Card Actions Footer */}
                <CardFooter className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-9 font-semibold border-slate-200 hover:bg-slate-100"
                    onClick={() => setDetailsModal(res)}
                  >
                    <Eye size={14} className="mr-1.5 text-slate-500" /> Details
                  </Button>

                  {res.status === 'confirmed' && (
                    <>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-9 bg-brandBlue hover:bg-brandBlue/90 font-semibold text-white shadow-xs"
                        onClick={() => setQrModal(res)}
                      >
                        <QrCode size={14} className="mr-1.5" /> Pass
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-9 text-destructive hover:bg-destructive/10 px-2"
                        onClick={() => setCancelModal(res)}
                        title="Cancel Booking"
                      >
                        <XCircle size={15} />
                      </Button>
                    </>
                  )}

                  {res.status === 'active' && (
                    <Button
                      size="sm"
                      className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-xs"
                      onClick={() => handleCheckOut(res.id)}
                    >
                      <LogOut size={14} className="mr-2" /> Check Out Now
                    </Button>
                  )}
                </CardFooter>

              </Card>
            );
          })}
        </div>
      )}

      {/* 8. QR PASS EXPERIENCE MODAL */}
      <Dialog open={!!qrModal} onOpenChange={() => setQrModal(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy flex items-center justify-center gap-2">
              <BookOpen size={20} className="text-brandBlue" /> Library Entry Pass
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Present or scan this pass at the library turnstile to enter.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white p-5 rounded-2xl border-2 border-dashed border-slate-300 mx-auto inline-block my-2 shadow-xs">
            {qrModal && <QRCodeSVG value={qrModal.id} size={180} />}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-left space-y-1.5 border border-slate-200 font-medium">
            <p className="flex justify-between">
              <span className="text-slate-500">Student Name</span>
              <span className="font-bold text-navy">{user?.name}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">College ID</span>
              <span className="font-mono font-bold text-navy">{user?.collegeId}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Seat Number</span>
              <span className="font-bold text-brandBlue">{qrModal?.seatNumber}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Date & Time</span>
              <span className="font-mono">{qrModal && format(new Date(qrModal.bookingDate), 'MMM d')} • {qrModal && format12HourTime(qrModal.startTime)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-slate-500">Location</span>
              <span>{qrModal && getFriendlyLocation(qrModal.floorId, qrModal.zoneId)}</span>
            </p>
          </div>

          <div className="bg-amber-50 text-amber-900 border border-amber-200 text-xs p-3 rounded-lg text-left flex items-start gap-2">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Check-in opens 15 minutes prior to slot start time. Arrive on time to avoid no-show penalties.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1 text-xs h-10" onClick={() => window.print()}>
              <Printer size={14} className="mr-2" /> Print Pass
            </Button>
            <Button className="flex-1 text-xs h-10 bg-brandBlue" onClick={() => handleCheckIn(qrModal.id)}>
              <CheckCircle2 size={14} className="mr-2" /> Simulate Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9. BOOKING DETAILS & TIMELINE MODAL */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-navy">Reservation Details</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Booking ID: <span className="font-mono font-bold text-brandBlue">{detailsModal?.id}</span>
            </DialogDescription>
          </DialogHeader>

          {detailsModal && (
            <div className="space-y-6 py-2">

              {/* Visual Progress Timeline */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking Lifecycle</span>
                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <div className="flex flex-col items-center text-emerald-600">
                    <span className="h-6 w-6 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-[10px]">✓</span>
                    <span className="text-[10px] mt-1">Booked</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-300 mx-2"></div>

                  <div className={`flex flex-col items-center ${detailsModal.status === 'confirmed' || detailsModal.status === 'active' || detailsModal.status === 'completed' ? 'text-brandBlue' : 'text-slate-400'}`}>
                    <span className="h-6 w-6 rounded-full bg-blue-100 border border-brandBlue flex items-center justify-center text-[10px]">2</span>
                    <span className="text-[10px] mt-1">Upcoming</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-300 mx-2"></div>

                  <div className={`flex flex-col items-center ${detailsModal.status === 'active' || detailsModal.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className="h-6 w-6 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-[10px]">3</span>
                    <span className="text-[10px] mt-1">Checked In</span>
                  </div>
                  <div className="h-0.5 flex-1 bg-slate-300 mx-2"></div>

                  <div className={`flex flex-col items-center ${detailsModal.status === 'completed' ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <span className="h-6 w-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-[10px]">4</span>
                    <span className="text-[10px] mt-1">Completed</span>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Status</span>
                  <span>{getStatusBadge(detailsModal.status)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Seat Number</span>
                  <span className="font-bold text-navy">{detailsModal.seatNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Location</span>
                  <span className="font-medium text-navy">{getFriendlyLocation(detailsModal.floorId, detailsModal.zoneId)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Reservation Date</span>
                  <span className="font-semibold text-navy">{format(new Date(detailsModal.bookingDate), 'EEEE, d MMMM yyyy')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Slot Time</span>
                  <span className="font-bold text-brandBlue">{format12HourTime(detailsModal.startTime)} – {format12HourTime(detailsModal.endTime)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Created At</span>
                  <span className="font-mono text-slate-600">{format(new Date(detailsModal.createdAt), 'PPP • p')}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setDetailsModal(null)}>Close</Button>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 10. SAFE CANCELLATION MODAL */}
      <Dialog open={!!cancelModal} onOpenChange={() => setCancelModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              <AlertTriangle size={20} /> Cancel Reservation?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              This action will release the seat for another student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><strong>Seat:</strong> {cancelModal?.seatNumber}</p>
              <p><strong>Location:</strong> {cancelModal && getFriendlyLocation(cancelModal.floorId, cancelModal.zoneId)}</p>
              <p><strong>Time:</strong> {cancelModal && format(new Date(cancelModal.bookingDate), 'MMM d')} • {cancelModal && format12HourTime(cancelModal.startTime)}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-navy">Reason for Cancellation</label>
              <select
                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brandBlue"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              >
                <option value="Change of schedule">Change of schedule</option>
                <option value="Reserved by mistake">Reserved by mistake</option>
                <option value="Unable to visit">Unable to visit</option>
                <option value="Health issue">Health issue</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setCancelModal(null)} disabled={cancelling}>
              Keep Reservation
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
