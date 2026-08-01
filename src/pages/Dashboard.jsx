import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { bookingService } from '../services/bookingService';
import { waitlistService } from '../services/waitlistService';
import { db } from '../services/mockDatabase';
import { useSync } from '../hooks/useSync';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, parse, isAfter, isBefore } from 'date-fns';
import {
    Users, MapPin, Clock, Calendar, AlertTriangle, ListOrdered,
    ChevronRight, Activity, BookOpen, CheckCircle2, Bell, Sparkles,
    Search, BookmarkCheck, History, User, Info, ArrowRight, ShieldCheck, XCircle,
    Sliders, HelpCircle, Layers, LogOut, ArrowUpRight, QrCode, ChevronUp, Download,
    LogIn, Timer, CheckCheck, Hourglass
} from 'lucide-react';
import toast from 'react-hot-toast';
import WaitlistModal from '../components/WaitlistModal';

// ─────────────────────────────────────────────────────────
// BOOKING STATE MACHINE
// Derives a semantic state from the raw booking object + now.
// ─────────────────────────────────────────────────────────
function getBookingState(booking) {
    if (!booking) return null;

    const rawStatus = (booking.status || '').toLowerCase();

    // Terminal states from the DB are authoritative
    if (rawStatus === 'completed' || rawStatus === 'checked_out') return 'COMPLETED';
    if (rawStatus === 'cancelled') return 'CANCELLED';
    if (rawStatus === 'checkout_pending') return 'CHECKOUT_PENDING';

    // For confirmed / active bookings, compare against the real clock
    const now = new Date();

    // Parse slot times on the booking date (e.g. bookingDate = '2026-08-01', startTime = '09:00 AM')
    let slotStart = null;
    let slotEnd = null;
    try {
        const base = booking.bookingDate; // 'yyyy-MM-dd'
        slotStart = parse(`${base} ${booking.startTime}`, 'yyyy-MM-dd hh:mm aa', new Date());
        slotEnd = parse(`${base} ${booking.endTime}`, 'yyyy-MM-dd hh:mm aa', new Date());
    } catch {
        // If the time format is '09:00' (24-h)
        try {
            const base = booking.bookingDate;
            slotStart = parse(`${base} ${booking.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
            slotEnd = parse(`${base} ${booking.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
        } catch { /* fall through */ }
    }

    if (!slotStart || !slotEnd) {
        // Can't parse times → trust DB status
        if (rawStatus === 'active') return 'ACTIVE';
        if (rawStatus === 'confirmed') return 'UPCOMING';
        return 'UPCOMING';
    }

    if (isAfter(slotEnd, now) === false) return 'EXPIRED';   // slot has fully passed
    if (isBefore(now, slotStart)) return 'UPCOMING';   // session hasn't started
    return 'ACTIVE';                                          // currently in session
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [libraryInfo, setLibraryInfo] = useState(null);
    const [slotsAvailability, setSlotsAvailability] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cancel Modal State
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);

    // Waitlist State
    const [waitlistSummaries, setWaitlistSummaries] = useState({});
    const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
    const [waitlistModalMode, setWaitlistModalMode] = useState('confirm');
    const [targetWaitlistSlot, setTargetWaitlistSlot] = useState(null);

    // QR Pass inline expansion state (entry pass)
    const [expandedQrBookingId, setExpandedQrBookingId] = useState(null);

    const toggleQrPass = (bookingId) => {
        setExpandedQrBookingId(currentId =>
            String(currentId) === String(bookingId) ? null : bookingId
        );
    };

    // ─────────────────────────────────────────────
    // Date string + data-fetching (declared early so
    // handleRequestCheckout can reference fetchData)
    // ─────────────────────────────────────────────
    const tomorrowDateStr = bookingService.getTomorrowDateStr();

    const fetchWaitlistSummaries = async (slotsList) => {
        try {
            const summaries = {};
            for (const slot of slotsList) {
                summaries[slot.id] = await waitlistService.getWaitlistSummaryForSlot(tomorrowDateStr, slot.id, user?.id);
            }
            setWaitlistSummaries(summaries);
        } catch (err) {
            console.warn('Failed to fetch waitlist summaries in Dashboard:', err);
        }
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [userStats, libData, slotsData] = await Promise.all([
                dashboardService.getStudentStats(user.id),
                dashboardService.getLibraryInfo(),
                bookingService.getSlotsAvailability(tomorrowDateStr)
            ]);

            setStats(userStats);
            setLibraryInfo(libData);
            setSlotsAvailability(slotsData);
            await fetchWaitlistSummaries(slotsData);
        } catch (error) {
            console.error('Error fetching dashboard data', error);
            toast.error('Failed to update dashboard data');
        } finally {
            setLoading(false);
        }
    }, [user, tomorrowDateStr]);

    // ── Checkout QR State ──────────────────────────────────
    // checkoutToken: a one-time token written to localStorage that the
    // librarian scanner will read and mark as verified.
    const [showCheckoutQr, setShowCheckoutQr] = useState(false);
    const [checkoutToken, setCheckoutToken] = useState(null);  // { token, bookingId, issuedAt }

    // Re-hydrate an existing pending token for the active booking so the
    // student can close and re-open the dashboard without losing the QR.
    useEffect(() => {
        if (!user) return;
        try {
            const stored = JSON.parse(localStorage.getItem('seatsync_checkout_token') || 'null');
            if (stored && stored.studentId === user.id) {
                setCheckoutToken(stored);
            }
        } catch { /* ignore */ }
    }, [user]);

    const handleRequestCheckout = useCallback(async (booking) => {
        if (!booking || !user) return;

        // Idempotent – if a token already exists for this booking, reuse it
        const existing = checkoutToken;
        if (existing && String(existing.bookingId) === String(booking.id)) {
            setShowCheckoutQr(true);
            return;
        }

        try {
            // Build a deterministic-but-opaque token so the librarian side
            // can verify it without a network call.
            const token = [
                booking.id,
                user.id,
                booking.seatNumber,
                booking.bookingDate,
                Date.now().toString(36),
            ].join('::');

            const payload = {
                token,
                bookingId: booking.id,
                studentId: user.id,
                studentName: user.name,
                seatNumber: booking.seatNumber,
                bookingDate: booking.bookingDate,
                startTime: booking.startTime,
                endTime: booking.endTime,
                floorId: booking.floorId,
                zoneId: booking.zoneId,
                issuedAt: new Date().toISOString(),
                verified: false,
            };

            // Persist token in localStorage for librarian scanner to read
            localStorage.setItem('seatsync_checkout_token', JSON.stringify(payload));

            // Mark booking as checkout_pending in the DB
            const bookings = await db.read('seatsync_bookings');
            const target = bookings.find(b => b.id === booking.id && b.studentId === user.id);
            if (target) {
                target.status = 'checkout_pending';
                target.checkoutRequestedAt = payload.issuedAt;
                await db.write('seatsync_bookings', bookings);
            }

            // Activity log
            const logs = await db.read('seatsync_activity_logs').catch(() => []);
            logs.push({
                userId: user.id,
                action: 'request_checkout',
                entityId: booking.id,
                timestamp: payload.issuedAt,
            });
            await db.write('seatsync_activity_logs', logs);

            setCheckoutToken(payload);
            setShowCheckoutQr(true);
            toast.success('Checkout QR generated — show it to the librarian.');
            fetchData();
        } catch (err) {
            console.error('Checkout request failed:', err);
            toast.error('Failed to generate Checkout QR. Please try again.');
        }
    }, [user, checkoutToken, fetchData]);


    useEffect(() => {
        fetchData();
    }, [user]);

    // Sync state when changes occur in other tabs
    useSync((event) => {
        if (event?.type === 'storage_change' || event?.type === 'login' || event?.type?.startsWith('WAITLIST_')) {
            fetchData();
        }
    });


    // Dynamic Time-of-Day Greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const handleViewWaitingList = (event, slot) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (!user) {
            toast.error('Please log in to view the waiting list');
            return;
        }

        setTargetWaitlistSlot(slot);
        setWaitlistModalMode('details');
        setWaitlistModalOpen(true);

        waitlistService.getWaitlistSummaryForSlot(tomorrowDateStr, slot.id, user.id)
            .then(summary => {
                setWaitlistSummaries(prev => ({ ...prev, [slot.id]: summary }));
            })
            .catch(console.warn);
    };

    const handleJoinWaitingList = async (event, slot) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (!user) {
            toast.error('Please log in to join the waiting list');
            return;
        }

        const check = await waitlistService.canJoinWaitlist(user.id, tomorrowDateStr, slot.id);
        if (!check.canJoin) {
            if (check.existingEntry) {
                handleViewWaitingList(event, slot);
                return;
            }
            toast.error(check.reason);
            return;
        }

        setTargetWaitlistSlot(slot);
        setWaitlistModalMode('confirm');
        setWaitlistModalOpen(true);

        waitlistService.getWaitlistSummaryForSlot(tomorrowDateStr, slot.id, user.id)
            .then(summary => {
                setWaitlistSummaries(prev => ({ ...prev, [slot.id]: summary }));
            })
            .catch(console.warn);
    };

    const handleCancelBooking = async () => {
        if (!cancelTarget || !user) return;
        setCancelling(true);
        try {
            await bookingService.cancelBooking(cancelTarget.id, user.id);
            toast.success('Reservation cancelled successfully');
            setCancelTarget(null);
            fetchData();
        } catch (error) {
            toast.error(error.message || 'Failed to cancel reservation');
        } finally {
            setCancelling(false);
        }
    };

    // Calculate status color for slots
    const getSlotAvailabilityStatus = (available, total) => {
        if (total === 0) return { color: 'bg-slate-400', text: 'Unavailable', badge: 'secondary', percent: 0 };
        const pct = Math.round((available / total) * 100);
        if (pct === 0) return { color: 'bg-red-500', text: 'Fully Booked', badge: 'destructive', percent: 0 };
        if (pct <= 50) return { color: 'bg-amber-500', text: 'Limited Seats', badge: 'warning', percent: pct };
        return { color: 'bg-emerald-500', text: 'Available', badge: 'success', percent: pct };
    };

    // Active Waitlist entry for student if any
    const activeWaitlistSummary = useMemo(() => {
        const entries = Object.entries(waitlistSummaries);
        for (const [slotId, summary] of entries) {
            if (summary?.isStudentWaiting && summary?.studentEntry) {
                const slot = slotsAvailability.find(s => s.id === slotId);
                if (slot) return { slot, summary };
            }
        }
        return null;
    }, [waitlistSummaries, slotsAvailability]);

    // Total library available seats count calculation
    const libraryOccupancy = useMemo(() => {
        const totalSeats = libraryInfo?.totalSeats || 40;
        const totalAvail = slotsAvailability.reduce((acc, s) => acc + (s.availableCount || 0), 0);
        const maxCapacity = slotsAvailability.length > 0 ? slotsAvailability.length * 40 : 160;
        const availCount = Math.min(totalSeats, Math.round((totalAvail / Math.max(maxCapacity, 1)) * totalSeats));
        const pct = Math.round((availCount / totalSeats) * 100);

        let color = 'bg-emerald-500';
        if (pct === 0) color = 'bg-red-500';
        else if (pct <= 40) color = 'bg-amber-500';

        return { availCount, totalSeats, pct, color };
    }, [libraryInfo, slotsAvailability]);

    // Derive semantic state for the active/upcoming booking
    // MUST be before any early returns (Rules of Hooks)
    const activeOrUpcoming = stats?.activeBooking || stats?.upcomingBooking;
    const bookingState = useMemo(() => getBookingState(activeOrUpcoming), [activeOrUpcoming]);

    if (loading) {
        return (
            <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
                <div className="h-48 bg-white rounded-3xl border border-slate-200 p-6"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200"></div>)}
                </div>
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-200"></div>
                    <div className="h-72 bg-white rounded-2xl border border-slate-200"></div>
                </div>
            </div>
        );
    }



    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">

            {/* 1. HERO SECTION */}
            <div className="relative overflow-hidden bg-gradient-to-r from-navy via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800">
                {/* Decorative background glows */}
                <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/3 bottom-0 -mb-10 w-56 h-56 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-200 uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full w-fit border border-white/15 backdrop-blur-md">
                            <Sparkles size={13} className="text-amber-400" /> Student Workspace
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-emerald-200">{user?.name?.split(' ')[0]}</span>
                        </h1>

                        <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
                            Find your ideal study space and manage your library bookings with ease.
                        </p>

                        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300 font-medium">
                            <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                                <Calendar size={13} className="text-blue-300" /> {format(new Date(), 'EEEE, d MMMM yyyy')}
                            </span>
                            <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-xl">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                {libraryInfo?.status} • {libraryInfo?.operatingHours}
                            </span>
                        </div>
                    </div>

                    {/* Hero Action CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                        <Button
                            onClick={() => navigate('/student/find-seat')}
                            className="w-full sm:w-auto h-11 px-6 bg-gradient-to-r from-blue-600 to-brandBlue hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 border border-blue-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Search size={16} /> Book a Seat
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/student/reservations')}
                            className="w-full sm:w-auto h-11 px-6 bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 font-bold rounded-xl flex items-center justify-center gap-2 backdrop-blur-sm transition-all"
                        >
                            <BookmarkCheck size={16} /> View My Bookings
                        </Button>
                    </div>
                </div>
            </div>

            {/* Account Restriction Warning if applicable */}
            {user?.accountStatus === 'restricted' && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-900 shadow-xs animate-in fade-in">
                    <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={20} />
                    <div>
                        <h4 className="font-bold text-sm text-red-950">Account Temporarily Restricted</h4>
                        <p className="text-xs text-red-800 mt-1 leading-relaxed font-medium">
                            Your booking privilege is restricted until {user.restrictedUntil ? format(new Date(user.restrictedUntil), 'PPP') : 'the penalty period ends'} due to 3 consecutive no-shows.
                        </p>
                    </div>
                </div>
            )}

            {/* 2. OVERVIEW STATISTIC CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Tomorrow */}
                <Card className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Tomorrow</span>
                            <div className="p-2.5 bg-blue-50 text-brandBlue rounded-xl group-hover:bg-brandBlue group-hover:text-white transition-colors border border-blue-100">
                                <Calendar size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-navy tracking-tight">{stats?.tomorrowsBookings || 0}</div>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Reserved Slots</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/student/find-seat')}
                            className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-brandBlue font-bold hover:underline w-full text-left"
                        >
                            <span>{stats?.tomorrowsBookings > 0 ? 'View Slots' : 'Book for Tomorrow'}</span>
                            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </CardContent>
                </Card>

                {/* Card 2: Active/Upcoming */}
                <Card className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500" />
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Active / Upcoming</span>
                            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors border border-teal-100">
                                <Clock size={18} />
                            </div>
                        </div>
                        <div>
                            {activeOrUpcoming ? (
                                <>
                                    <div className="text-2xl font-black text-navy tracking-tight">{activeOrUpcoming.seatNumber}</div>
                                    <p className="text-xs font-semibold text-slate-500 mt-1 font-mono">{activeOrUpcoming.startTime} – {activeOrUpcoming.endTime}</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm font-bold text-slate-400">No active session</div>
                                    <p className="text-xs font-medium text-slate-400 mt-1">Ready for study</p>
                                </>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate(activeOrUpcoming ? '/student/reservations' : '/student/find-seat')}
                            className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-teal-700 hover:underline w-full text-left"
                        >
                            <span>{activeOrUpcoming ? 'Manage Pass' : 'Find a Seat'}</span>
                            <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </CardContent>
                </Card>

                {/* Card 3: Completed */}
                <Card className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Completed</span>
                            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-100">
                                <CheckCircle2 size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-navy tracking-tight">{stats?.completedReservations || 0}</div>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Total Study Hours: <strong className="text-emerald-700 font-bold">{stats?.totalStudyHours || 0} hrs</strong></p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] text-emerald-700 font-bold">
                            Lifetime Attendance
                        </div>
                    </CardContent>
                </Card>

                {/* Card 4: Cancelled */}
                <Card className="relative overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-400" />
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex justify-between items-start">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Cancelled</span>
                            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-700 group-hover:text-white transition-colors border border-slate-200">
                                <XCircle size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-navy tracking-tight">{stats?.cancelledReservations || 0}</div>
                            <p className="text-xs font-semibold text-slate-500 mt-1">Released Bookings</p>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center text-[11px] text-slate-500 font-bold">
                            Good Standing • No Penalty
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 3. DEDICATED WAITING LIST SUMMARY CARD (Conditionally Rendered when student has an active waitlist entry) */}
            {activeWaitlistSummary && (
                <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
                    <div className="space-y-2 max-w-xl">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-amber-500 text-white font-black text-[11px] uppercase tracking-wider px-2.5 py-0.5">
                                Waitlisted
                            </Badge>
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                                <Clock size={14} className="text-amber-600" /> Active Queue Entry
                            </span>
                        </div>

                        <h3 className="text-xl font-bold text-navy">
                            {activeWaitlistSummary.slot.label} ({activeWaitlistSummary.slot.startTime} – {activeWaitlistSummary.slot.endTime})
                        </h3>

                        <p className="text-xs font-medium text-slate-600">
                            Tomorrow • Joined {activeWaitlistSummary.summary?.studentEntry?.joinedAt ? format(new Date(activeWaitlistSummary.summary.studentEntry.joinedAt), 'h:mm a') : 'Recently'} • {activeWaitlistSummary.summary?.studentEntry?.notificationPreference || 'In-App Notifications Active'}
                        </p>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-amber-200/80">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-500 text-white px-4 py-2 rounded-xl text-center shadow-md shadow-amber-500/20">
                                <span className="text-[10px] uppercase font-bold tracking-wider block opacity-90">Queue Position</span>
                                <span className="text-2xl font-black font-mono">#{activeWaitlistSummary.summary?.studentPosition || 1}</span>
                            </div>
                            <div className="text-xs font-bold text-amber-950">
                                {activeWaitlistSummary.summary?.waitlistCount || 10} total in queue
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={(e) => handleViewWaitingList(e, activeWaitlistSummary.slot)}
                            className="h-11 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-2"
                        >
                            View Waiting List <Users size={15} />
                        </Button>
                    </div>
                </div>
            )}

            {/* MAIN DASHBOARD CONTENT GRID */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* MAIN COLUMN (2 cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 4. NEXT SCHEDULED SESSION CARD */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                                <BookmarkCheck className="text-brandBlue" size={20} />
                                {bookingState === 'ACTIVE' || bookingState === 'CHECKOUT_PENDING'
                                    ? 'Active Session'
                                    : 'Next Scheduled Session'}
                            </h2>
                            {activeOrUpcoming && (
                                <Button variant="ghost" size="sm" onClick={() => navigate('/student/reservations')} className="text-xs font-bold text-brandBlue hover:bg-blue-50">
                                    View All Bookings →
                                </Button>
                            )}
                        </div>

                        {activeOrUpcoming ? (
                            <Card className={`border-2 shadow-md rounded-2xl overflow-hidden bg-white transition-colors ${bookingState === 'ACTIVE' ? 'border-emerald-400/60 shadow-emerald-100' :
                                    bookingState === 'CHECKOUT_PENDING' ? 'border-amber-400/60 shadow-amber-100' :
                                        'border-brandBlue/30'
                                }`}>
                                <CardHeader className={`pb-3 border-b border-slate-200/80 flex flex-row items-center justify-between ${bookingState === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-50/80 to-slate-50' :
                                        bookingState === 'CHECKOUT_PENDING' ? 'bg-gradient-to-r from-amber-50/80 to-slate-50' :
                                            'bg-gradient-to-r from-blue-50/80 to-slate-50'
                                    }`}>
                                    <div>
                                        <CardTitle className="text-base text-navy flex items-center gap-2 font-bold">
                                            Booking ID: <span className="font-mono text-sm text-brandBlue font-extrabold">{activeOrUpcoming.id}</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 font-medium mt-0.5">
                                            {bookingState === 'ACTIVE'
                                                ? 'Session is currently in progress'
                                                : bookingState === 'CHECKOUT_PENDING'
                                                    ? 'Checkout requested — awaiting librarian verification'
                                                    : `Reserved for ${format(new Date(activeOrUpcoming.bookingDate || tomorrowDateStr), 'EEEE, d MMMM yyyy')}`}
                                        </CardDescription>
                                    </div>
                                    {/* State badge */}
                                    {bookingState === 'ACTIVE' && (
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold text-xs px-3 py-1 flex items-center gap-1.5 shadow-xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </Badge>
                                    )}
                                    {bookingState === 'CHECKOUT_PENDING' && (
                                        <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-extrabold text-xs px-3 py-1 flex items-center gap-1.5 shadow-xs">
                                            <Hourglass size={11} className="animate-pulse" />
                                            Checkout Pending
                                        </Badge>
                                    )}
                                    {(bookingState === 'UPCOMING' || !bookingState) && (
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold text-xs px-3 py-1 capitalize shadow-xs">
                                            {activeOrUpcoming.status}
                                        </Badge>
                                    )}
                                </CardHeader>
                                <CardContent className="p-6 space-y-6">
                                    <div className="grid sm:grid-cols-3 gap-4 bg-slate-50/90 p-4 rounded-xl border border-slate-200/80">
                                        <div>
                                            <span className="text-xs text-slate-500 font-semibold block mb-1">Seat Number</span>
                                            <span className="text-2xl font-black text-navy">{activeOrUpcoming.seatNumber}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 font-semibold block mb-1">Time Slot</span>
                                            <span className="text-sm font-bold text-navy flex items-center gap-1.5 font-mono">
                                                <Clock size={14} className="text-brandBlue" />
                                                {activeOrUpcoming.startTime} – {activeOrUpcoming.endTime}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-xs text-slate-500 font-semibold block mb-1">Floor & Zone</span>
                                            <span className="text-sm font-bold text-navy flex items-center gap-1.5">
                                                <MapPin size={14} className="text-brandBlue" />
                                                {activeOrUpcoming.floorId || 'Ground Floor'} • {activeOrUpcoming.zoneId || 'Zone A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ── ACTION ROW: driven by bookingState ── */}
                                    {bookingState === 'UPCOMING' && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                                            <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                                                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                                                <span>Check-in opens 15 minutes prior to slot start time.</span>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <Button
                                                    variant="outline" size="sm"
                                                    onClick={() => { if (activeOrUpcoming.status === 'confirmed') setCancelTarget(activeOrUpcoming); }}
                                                    className="w-full sm:w-auto h-10 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                                                >
                                                    Cancel Booking
                                                </Button>
                                                <Button
                                                    type="button" size="sm"
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleQrPass(activeOrUpcoming.id); }}
                                                    className={`w-full sm:w-auto h-10 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all ${String(expandedQrBookingId) === String(activeOrUpcoming.id)
                                                            ? 'bg-slate-700 hover:bg-slate-800 text-white shadow-slate-700/20'
                                                            : 'bg-brandBlue hover:bg-blue-700 text-white shadow-brandBlue/20'
                                                        }`}
                                                >
                                                    {String(expandedQrBookingId) === String(activeOrUpcoming.id)
                                                        ? <><ChevronUp size={14} /> Hide QR Pass</>
                                                        : <><QrCode size={14} /> View QR Pass</>
                                                    }
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {bookingState === 'ACTIVE' && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                                            <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
                                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                                <span>Your session is live. To leave early, request a checkout.</span>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <Button
                                                    variant="outline" size="sm" disabled
                                                    title="Cancellation is not allowed once a session is active."
                                                    className="w-full sm:w-auto h-10 text-xs font-bold text-slate-400 border-slate-200 rounded-xl cursor-not-allowed opacity-50"
                                                >
                                                    Cancel Booking
                                                </Button>
                                                <Button
                                                    type="button" size="sm"
                                                    onClick={() => handleRequestCheckout(activeOrUpcoming)}
                                                    className="w-full sm:w-auto h-10 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-orange-500/25 transition-all"
                                                >
                                                    <LogIn size={14} /> Request Checkout
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {bookingState === 'CHECKOUT_PENDING' && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                                            <div className="text-xs font-medium flex items-center gap-2 text-amber-800">
                                                <Hourglass size={15} className="text-amber-600 shrink-0 animate-pulse" />
                                                <span>Checkout QR generated. Show it to the librarian to complete checkout.</span>
                                            </div>
                                            <Button
                                                type="button" size="sm"
                                                onClick={() => setShowCheckoutQr(true)}
                                                className="w-full sm:w-auto h-10 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25"
                                            >
                                                <QrCode size={14} /> Show Checkout QR
                                            </Button>
                                        </div>
                                    )}


                                    {/* Entry QR Pass panel — UPCOMING only */}
                                    {bookingState === 'UPCOMING' && (
                                        <div
                                            style={{
                                                maxHeight: String(expandedQrBookingId) === String(activeOrUpcoming.id) ? '420px' : '0px',
                                                opacity: String(expandedQrBookingId) === String(activeOrUpcoming.id) ? 1 : 0,
                                                overflow: 'hidden',
                                                transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease'
                                            }}
                                        >
                                            <div className="mt-4 pt-4 border-t border-slate-200/80">
                                                <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
                                                    <div className="relative shrink-0">
                                                        <div className="w-[148px] h-[148px] bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center p-3">
                                                            <svg viewBox="0 0 37 37" width="124" height="124" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
                                                                <rect x="1" y="1" width="7" height="7" fill="#0F172A" rx="1" />
                                                                <rect x="2" y="2" width="5" height="5" fill="white" />
                                                                <rect x="3" y="3" width="3" height="3" fill="#0F172A" />
                                                                <rect x="29" y="1" width="7" height="7" fill="#0F172A" rx="1" />
                                                                <rect x="30" y="2" width="5" height="5" fill="white" />
                                                                <rect x="31" y="3" width="3" height="3" fill="#0F172A" />
                                                                <rect x="1" y="29" width="7" height="7" fill="#0F172A" rx="1" />
                                                                <rect x="2" y="30" width="5" height="5" fill="white" />
                                                                <rect x="3" y="31" width="3" height="3" fill="#0F172A" />
                                                                {(() => {
                                                                    const id = String(activeOrUpcoming.id);
                                                                    const modules = [];
                                                                    const seed = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                                                                    const positions = [
                                                                        [9, 1], [11, 1], [13, 1], [15, 1], [18, 1], [20, 1], [22, 1], [24, 1], [26, 1],
                                                                        [9, 3], [12, 3], [14, 3], [17, 3], [19, 3], [21, 3], [23, 3], [25, 3], [27, 3],
                                                                        [9, 5], [10, 5], [13, 5], [16, 5], [18, 5], [20, 5], [22, 5], [26, 5],
                                                                        [1, 9], [3, 9], [5, 9], [7, 9], [9, 9], [11, 9], [14, 9], [16, 9], [20, 9], [22, 9], [24, 9], [27, 9], [29, 9], [31, 9], [33, 9], [35, 9],
                                                                        [1, 11], [4, 11], [6, 11], [9, 11], [12, 11], [15, 11], [18, 11], [21, 11], [24, 11], [27, 11], [30, 11], [33, 11], [35, 11],
                                                                        [1, 13], [3, 13], [5, 13], [8, 13], [10, 13], [13, 13], [16, 13], [19, 13], [22, 13], [25, 13], [28, 13], [31, 13], [35, 13],
                                                                        [9, 15], [12, 15], [15, 15], [18, 15], [21, 15], [24, 15], [27, 15], [31, 15], [33, 15], [35, 15],
                                                                        [1, 17], [3, 17], [6, 17], [9, 17], [12, 17], [15, 17], [18, 17], [21, 17], [24, 17], [27, 17], [30, 17], [33, 17], [35, 17],
                                                                        [1, 19], [4, 19], [7, 19], [10, 19], [14, 19], [17, 19], [20, 19], [23, 19], [26, 19], [29, 19], [32, 19], [35, 19],
                                                                        [1, 21], [3, 21], [5, 21], [8, 21], [11, 21], [14, 21], [17, 21], [20, 21], [23, 21], [26, 21], [29, 21], [32, 21], [35, 21],
                                                                        [9, 23], [11, 23], [14, 23], [17, 23], [20, 23], [23, 23], [26, 23], [29, 23], [32, 23], [35, 23],
                                                                        [1, 25], [3, 25], [6, 25], [9, 25], [12, 25], [15, 25], [18, 25], [21, 25], [24, 25], [27, 25],
                                                                        [9, 27], [11, 27], [13, 27], [16, 27], [18, 27], [21, 27], [24, 27], [27, 27], [29, 27], [31, 27], [33, 27], [35, 27],
                                                                        [9, 29], [12, 29], [15, 29], [18, 29], [21, 29], [24, 29], [27, 29], [30, 29], [33, 29], [35, 29],
                                                                        [9, 31], [11, 31], [13, 31], [16, 31], [18, 31], [21, 31], [24, 31], [27, 31], [29, 31], [31, 31], [33, 31], [35, 31],
                                                                        [9, 33], [12, 33], [15, 33], [18, 33], [21, 33], [24, 33], [27, 33], [30, 33], [33, 33], [35, 33],
                                                                        [9, 35], [11, 35], [14, 35], [17, 35], [20, 35], [23, 35], [26, 35], [29, 35], [32, 35], [35, 35],
                                                                    ];
                                                                    positions.forEach(([x, y], i) => {
                                                                        if ((seed + i) % 3 !== 0) {
                                                                            modules.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0F172A" />);
                                                                        }
                                                                    });
                                                                    return modules;
                                                                })()}
                                                            </svg>
                                                        </div>
                                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-brandBlue rounded-lg flex items-center justify-center shadow-md">
                                                            <QrCode size={14} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-3 text-center sm:text-left">
                                                        <div>
                                                            <p className="text-[10px] uppercase font-extrabold tracking-widest text-brandBlue mb-0.5">SeatSync Library Pass</p>
                                                            <h4 className="text-xl font-black text-navy font-mono">Seat {activeOrUpcoming.seatNumber}</h4>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5">
                                                                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Date</span>
                                                                <span className="font-bold text-navy">{format(new Date(activeOrUpcoming.bookingDate || tomorrowDateStr), 'd MMM yyyy')}</span>
                                                            </div>
                                                            <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5">
                                                                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Time</span>
                                                                <span className="font-bold text-navy font-mono">{activeOrUpcoming.startTime} – {activeOrUpcoming.endTime}</span>
                                                            </div>
                                                            <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5">
                                                                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Location</span>
                                                                <span className="font-bold text-navy">{activeOrUpcoming.floorId || 'Ground Floor'} • {activeOrUpcoming.zoneId || 'Zone A'}</span>
                                                            </div>
                                                            <div className="bg-white/80 border border-slate-200 rounded-xl p-2.5">
                                                                <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Booking ID</span>
                                                                <span className="font-bold text-navy font-mono text-[11px]">{activeOrUpcoming.id}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Valid Pass
                                                            </span>
                                                            <span className="text-[10px] font-medium text-slate-400">Show this at the library entrance</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-2 border-slate-200 bg-slate-50/40 text-center py-8 px-6 rounded-2xl">
                                <CardContent className="space-y-3 p-0">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto border border-slate-200 shadow-sm text-brandBlue">
                                        <BookOpen size={26} />
                                    </div>
                                    <h3 className="text-base font-bold text-navy">No upcoming bookings</h3>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                                        Reserve a seat and plan your next focused study session for tomorrow.
                                    </p>
                                    <Button onClick={() => navigate('/student/find-seat')} size="sm" className="mt-2 h-10 px-5 text-xs font-bold bg-brandBlue hover:bg-blue-700 text-white rounded-xl shadow-md shadow-brandBlue/20">
                                        <Search size={14} className="mr-2" /> Find an Available Seat
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* 5. TOMORROW'S SLOT AVAILABILITY GRID */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                                    <Clock className="text-brandBlue" size={20} /> Tomorrow's Available Slots
                                </h2>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Fixed 1-hour library slots for {format(new Date(tomorrowDateStr), 'EEEE, d MMMM')}
                                </p>
                            </div>
                            <Badge variant="outline" className="font-mono text-xs font-bold border-slate-300">
                                Total Seats: {libraryInfo?.totalSeats || 40}
                            </Badge>
                        </div>

                        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,240px),1fr))' }}>
                            {slotsAvailability.map(slot => {
                                const status = getSlotAvailabilityStatus(slot.availableCount, slot.totalCount);
                                const isFullyBooked = slot.isFullyBooked;
                                const summary = waitlistSummaries[slot.id] || {};
                                const isStudentWaiting = summary.isStudentWaiting;

                                return (
                                    <Card key={slot.id} className={`transition-all border-2 rounded-xl ${isFullyBooked ? isStudentWaiting ? 'border-amber-400/80 bg-amber-50/20' : 'border-red-200' : 'border-slate-200/90 hover:border-brandBlue/50 hover:shadow-md'}`}>
                                        <CardContent className="p-3.5 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Badge variant="outline" className="text-[10px] uppercase font-extrabold tracking-wider bg-slate-50">
                                                            1h Slot
                                                        </Badge>
                                                        {isStudentWaiting && (
                                                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]">
                                                                Waitlisted
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-sm font-bold text-navy">{slot.label}</h3>
                                                    <p className="text-[10px] text-slate-500 font-mono font-semibold">{slot.startTime} – {slot.endTime}</p>
                                                </div>
                                                <Badge className={`text-xs px-2.5 py-0.5 font-bold ${isFullyBooked ? 'bg-red-100 text-red-800 border-red-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`}>
                                                    {status.text}
                                                </Badge>
                                            </div>

                                            {isStudentWaiting && (
                                                <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2 flex items-center justify-between text-[10px]">
                                                    <span className="font-bold text-amber-950 flex items-center gap-1">
                                                        <Clock size={11} className="text-amber-600" /> On waiting list
                                                    </span>
                                                    <Badge className="bg-amber-500 text-white font-mono font-extrabold text-[10px] px-1.5 py-0.5">
                                                        #{summary.studentPosition}
                                                    </Badge>
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-700">{slot.availableCount}/{slot.totalCount} seats</span>
                                                    <span className="text-slate-500 font-mono">{status.percent}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${status.color}`}
                                                        style={{ width: `${status.percent}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {isFullyBooked ? (
                                                isStudentWaiting ? (
                                                    <Button
                                                        type="button"
                                                        onClick={(e) => handleViewWaitingList(e, slot)}
                                                        className="w-full h-8 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white flex items-center justify-center gap-1.5 rounded-lg shadow-xs relative z-10 cursor-pointer pointer-events-auto"
                                                    >
                                                        View Waiting List <Users size={12} />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={(e) => handleJoinWaitingList(e, slot)}
                                                        className="w-full h-8 text-[11px] font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white flex items-center justify-center gap-1.5 rounded-lg shadow-xs relative z-10 cursor-pointer pointer-events-auto"
                                                    >
                                                        Join Waiting List <Clock size={12} />
                                                    </Button>
                                                )
                                            ) : (
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        navigate('/student/find-seat');
                                                    }}
                                                    className="w-full h-8 text-[11px] font-bold bg-navy hover:bg-blue-900 text-white rounded-lg shadow-xs"
                                                >
                                                    Book Now <ArrowRight size={12} className="ml-1" />
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>

                    {/* 6. QUICK ACTIONS SECTION */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                            <Sparkles className="text-brandBlue" size={20} /> Quick Actions
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                                { title: 'Book a Seat', desc: 'Reserve a tomorrow slot', path: '/student/find-seat', icon: Search, color: 'text-brandBlue bg-blue-50 border-blue-200' },
                                { title: 'My Bookings', desc: 'Active & upcoming passes', path: '/student/reservations', icon: BookmarkCheck, color: 'text-teal-700 bg-teal-50 border-teal-200' },
                                { title: 'Waiting List', desc: 'Check queue status', path: '/student/waitlist', icon: Users, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                                { title: 'Notifications', desc: 'Announcements & alerts', path: '/student/notifications', icon: Bell, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                                { title: 'My Profile', desc: 'Account & study stats', path: '/student/profile', icon: User, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                                { title: 'Library Information', desc: 'Timings & rules', path: '#info-panel', icon: Info, color: 'text-purple-700 bg-purple-50 border-purple-200', isAnchor: true },
                            ].map(action => (
                                <div
                                    key={action.title}
                                    onClick={() => action.isAnchor ? document.getElementById('info-panel')?.scrollIntoView({ behavior: 'smooth' }) : navigate(action.path)}
                                    className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brandBlue/50 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${action.color}`}>
                                        <action.icon size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-navy group-hover:text-brandBlue transition-colors">{action.title}</h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-medium">{action.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* SIDE COLUMN (1 col) */}
                <div className="space-y-8">

                    {/* 7. LIBRARY INFORMATION PANEL WITH OCCUPANCY PROGRESS BAR */}
                    <Card id="info-panel" className="border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/80">
                            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
                                <Info size={18} className="text-brandBlue" /> Library Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4 text-xs">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Current Status</span>
                                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Open Today
                                </span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Operating Hours</span>
                                <span className="font-bold text-navy font-mono">08:00 AM – 10:00 PM</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Available Floors</span>
                                <span className="font-bold text-navy">Ground Floor (Zone A & B)</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-slate-500 font-semibold">Total Capacity</span>
                                <span className="font-bold text-navy font-mono">{libraryInfo?.totalSeats || 40} Seats</span>
                            </div>

                            {/* Colour-coded Occupancy Progress Bar */}
                            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                                <div className="flex justify-between items-center text-xs font-bold">
                                    <span className="text-navy">Current Availability</span>
                                    <span className="text-slate-600 font-mono">{libraryOccupancy.availCount} of {libraryOccupancy.totalSeats} seats</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${libraryOccupancy.color}`}
                                        style={{ width: `${libraryOccupancy.pct}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-xl space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                                    <AlertTriangle size={14} className="text-amber-600" /> Library Guidelines
                                </div>
                                <p className="text-[11px] leading-relaxed font-medium">{libraryInfo?.notice}</p>
                            </div>

                            <Button
                                type="button"
                                onClick={() => navigate('/student/find-seat')}
                                className="w-full h-10 text-xs font-bold bg-brandBlue hover:bg-blue-700 text-white rounded-xl shadow-xs"
                            >
                                View Seat Availability <ArrowUpRight size={14} className="ml-1" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 8. RECENT ACTIVITY TIMELINE */}
                    <Card className="border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-bold text-navy flex items-center gap-2">
                                <Activity size={18} className="text-brandBlue" /> Recent Activity
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/student/reservations')} className="text-xs font-bold text-brandBlue h-7 px-2">
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {stats?.recentActivity?.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {stats.recentActivity.map((log, index) => (
                                        <div key={index} className="p-3.5 text-xs hover:bg-slate-50 transition-colors flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center shrink-0 mt-0.5 font-bold border border-blue-100">
                                                {log.action?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-navy capitalize">{log.action?.replace(/_/g, ' ')}</p>
                                                <p className="text-[11px] text-slate-500 truncate font-medium">ID: {log.entityId}</p>
                                                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                                                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400 font-medium">
                                    No recent activity recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* CANCEL CONFIRMATION DIALOG */}
            <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-navy">Cancel Reservation</DialogTitle>
                        <DialogDescription className="text-xs text-slate-600 mt-1">
                            Are you sure you want to cancel your booking for seat <span className="font-bold text-navy">{cancelTarget?.seatNumber}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs font-medium">
                        <p className="flex justify-between"><strong>Booking ID:</strong> <span className="font-mono text-brandBlue font-bold">{cancelTarget?.id}</span></p>
                        <p className="flex justify-between"><strong>Time Slot:</strong> <span>{cancelTarget?.startTime} – {cancelTarget?.endTime}</span></p>
                        <p className="flex justify-between"><strong>Date:</strong> <span>{cancelTarget && format(new Date(cancelTarget.bookingDate), 'PPP')}</span></p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling} className="h-10 text-xs font-bold rounded-xl border-slate-300">
                            Keep Booking
                        </Button>
                        <Button variant="destructive" onClick={handleCancelBooking} disabled={cancelling} className="h-10 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700">
                            {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ══════════════════════════════════════════════
                CHECKOUT QR DIALOG
                Student shows this to the librarian to exit early.
            ══════════════════════════════════════════════ */}
            <Dialog open={showCheckoutQr} onOpenChange={setShowCheckoutQr}>
                <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
                    {/* Orange header */}
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <LogIn size={20} className="text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-black text-white">Checkout QR</DialogTitle>
                                <DialogDescription className="text-xs text-orange-100 mt-0.5">
                                    Show this code to the librarian to complete your early checkout.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        {checkoutToken ? (
                            <>
                                {/* QR visual — amber-coloured finder squares to distinguish from entry pass */}
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="w-[180px] h-[180px] bg-white rounded-2xl shadow-md border-2 border-orange-200 flex items-center justify-center p-3">
                                            <svg viewBox="0 0 37 37" width="152" height="152" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
                                                {/* Finder patterns in amber */}
                                                <rect x="1" y="1" width="7" height="7" fill="#F59E0B" rx="1" />
                                                <rect x="2" y="2" width="5" height="5" fill="white" />
                                                <rect x="3" y="3" width="3" height="3" fill="#F59E0B" />
                                                <rect x="29" y="1" width="7" height="7" fill="#F59E0B" rx="1" />
                                                <rect x="30" y="2" width="5" height="5" fill="white" />
                                                <rect x="31" y="3" width="3" height="3" fill="#F59E0B" />
                                                <rect x="1" y="29" width="7" height="7" fill="#F59E0B" rx="1" />
                                                <rect x="2" y="30" width="5" height="5" fill="white" />
                                                <rect x="3" y="31" width="3" height="3" fill="#F59E0B" />
                                                {/* Data modules seeded from token string */}
                                                {(() => {
                                                    const modules = [];
                                                    const seed = checkoutToken.token.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
                                                    const positions = [
                                                        [9, 1], [11, 1], [14, 1], [16, 1], [19, 1], [21, 1], [23, 1], [25, 1],
                                                        [9, 3], [12, 3], [15, 3], [18, 3], [20, 3], [22, 3], [24, 3], [27, 3],
                                                        [9, 5], [11, 5], [13, 5], [16, 5], [19, 5], [21, 5], [23, 5], [26, 5],
                                                        [1, 9], [4, 9], [6, 9], [9, 9], [12, 9], [15, 9], [18, 9], [21, 9], [24, 9], [27, 9], [30, 9], [33, 9], [35, 9],
                                                        [1, 11], [3, 11], [6, 11], [9, 11], [11, 11], [14, 11], [17, 11], [20, 11], [23, 11], [26, 11], [29, 11], [32, 11], [35, 11],
                                                        [2, 13], [5, 13], [8, 13], [11, 13], [14, 13], [17, 13], [20, 13], [23, 13], [26, 13], [29, 13], [32, 13], [35, 13],
                                                        [9, 15], [12, 15], [15, 15], [18, 15], [21, 15], [24, 15], [27, 15], [30, 15], [33, 15], [35, 15],
                                                        [1, 17], [4, 17], [7, 17], [10, 17], [13, 17], [16, 17], [19, 17], [22, 17], [25, 17], [28, 17], [31, 17], [34, 17],
                                                        [2, 19], [5, 19], [8, 19], [11, 19], [14, 19], [17, 19], [20, 19], [23, 19], [26, 19], [29, 19], [32, 19], [35, 19],
                                                        [1, 21], [3, 21], [6, 21], [9, 21], [12, 21], [15, 21], [18, 21], [21, 21], [24, 21], [27, 21], [30, 21], [33, 21], [35, 21],
                                                        [9, 23], [12, 23], [15, 23], [18, 23], [21, 23], [24, 23], [27, 23], [30, 23], [33, 23], [35, 23],
                                                        [1, 25], [4, 25], [7, 25], [10, 25], [13, 25], [16, 25], [19, 25], [22, 25], [25, 25], [27, 25],
                                                        [9, 27], [11, 27], [14, 27], [17, 27], [20, 27], [23, 27], [26, 27], [29, 27], [32, 27], [35, 27],
                                                        [9, 29], [12, 29], [15, 29], [18, 29], [21, 29], [24, 29], [27, 29], [30, 29], [33, 29], [35, 29],
                                                        [9, 31], [11, 31], [14, 31], [17, 31], [20, 31], [23, 31], [26, 31], [29, 31], [32, 31], [35, 31],
                                                        [9, 33], [12, 33], [15, 33], [18, 33], [21, 33], [24, 33], [27, 33], [30, 33], [33, 33], [35, 33],
                                                        [9, 35], [11, 35], [14, 35], [17, 35], [20, 35], [23, 35], [26, 35], [29, 35], [32, 35], [35, 35],
                                                    ];
                                                    positions.forEach(([x, y], i) => {
                                                        if ((seed + i * 7) % 4 !== 0) {
                                                            modules.push(<rect key={`co-${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0F172A" />);
                                                        }
                                                    });
                                                    return modules;
                                                })()}
                                            </svg>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                                            <LogIn size={15} className="text-white" />
                                        </div>
                                    </div>
                                </div>

                                {/* Token details */}
                                <div className="space-y-2 text-xs">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                                            <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Seat</span>
                                            <span className="font-black text-navy text-base">{checkoutToken.seatNumber}</span>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                                            <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">Time Slot</span>
                                            <span className="font-bold text-navy font-mono">{checkoutToken.startTime} – {checkoutToken.endTime}</span>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-1">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-700">Checkout Token</p>
                                        <p className="font-mono text-[10px] text-slate-600 break-all leading-relaxed">{checkoutToken.token}</p>
                                        <p className="text-[10px] text-slate-400">Issued {formatDistanceToNow(new Date(checkoutToken.issuedAt), { addSuffix: true })}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                                            <Hourglass size={10} className="animate-pulse" />
                                            Awaiting Verification
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">Seat remains occupied until verified</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-sm text-slate-500 py-4">No checkout token available.</div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <Button
                                variant="outline"
                                onClick={() => setShowCheckoutQr(false)}
                                className="flex-1 h-10 text-xs font-bold rounded-xl border-slate-300"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* WAITING LIST MODAL */}
            <WaitlistModal
                isOpen={waitlistModalOpen}
                onClose={() => setWaitlistModalOpen(false)}
                mode={waitlistModalMode}
                slot={targetWaitlistSlot}
                dateStr={tomorrowDateStr}
                user={user}
                summary={targetWaitlistSlot ? waitlistSummaries[targetWaitlistSlot.id] : null}
                onSuccess={() => fetchData()}
            />

        </div>
    );
}

