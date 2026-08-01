import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { waitlistService } from '../services/waitlistService';
import { useSync } from '../hooks/useSync';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import {
  Check, CheckCircle2, Clock, User, Lock, Wrench, Zap, Accessibility,
  MapPin, RefreshCw, ChevronLeft, DoorOpen, ArrowRight, Calendar, Info, Sparkles,
  Layers, ShieldCheck, X, Compass, Library, HelpCircle, AlertCircle, Users
} from 'lucide-react';
import WaitlistModal from '../components/WaitlistModal';

export default function FindSeat() {
  const { user } = useAuth();

  const [floors, setFloors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [seats, setSeats] = useState([]);

  const [selectedFloorId, setSelectedFloorId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [booking, setBooking] = useState(false);

  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  // Waiting list state
  const [waitlistSummaries, setWaitlistSummaries] = useState({});
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [waitlistModalMode, setWaitlistModalMode] = useState('confirm'); // 'confirm' | 'details'
  const [targetWaitlistSlot, setTargetWaitlistSlot] = useState(null);

  const tomorrowDate = bookingService.getTomorrowDateStr();

  const fetchWaitlistSummaries = async (slotsList) => {
    try {
      const summaries = {};
      for (const slot of slotsList) {
        summaries[slot.id] = await waitlistService.getWaitlistSummaryForSlot(tomorrowDate, slot.id, user?.id);
      }
      setWaitlistSummaries(summaries);
    } catch (err) {
      console.warn('Failed to fetch waitlist summaries:', err);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoadingSlots(true);
      const floorsData = await bookingService.getFloors();
      setFloors(floorsData);
      if (floorsData.length > 0) setSelectedFloorId(floorsData[0].id);

      const slotsData = await bookingService.getSlotsAvailability(tomorrowDate);
      setSlots(slotsData);
      await fetchWaitlistSummaries(slotsData);
    } catch (error) {
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  useSync((event) => {
    if (event?.type === 'storage_change' || event?.type?.startsWith('WAITLIST_')) {
      if (!selectedSlot) fetchInitialData();
      else fetchSeatsForSlot(false);
    }
  });

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

    waitlistService.getWaitlistSummaryForSlot(tomorrowDate, slot.id, user.id)
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

    const check = await waitlistService.canJoinWaitlist(user.id, tomorrowDate, slot.id);
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

    waitlistService.getWaitlistSummaryForSlot(tomorrowDate, slot.id, user.id)
      .then(summary => {
        setWaitlistSummaries(prev => ({ ...prev, [slot.id]: summary }));
      })
      .catch(console.warn);
  };

  const fetchSeatsForSlot = async (showToast = false) => {
    if (!selectedSlot || !selectedFloorId) return;
    try {
      if (showToast) setRefreshing(true);
      else setLoadingSeats(true);

      const seatsData = await bookingService.getSeatsForSlot(selectedFloorId, tomorrowDate, selectedSlot.id);
      setSeats(seatsData);

      if (selectedSeat) {
        const currentSeat = seatsData.find(s => s.id === selectedSeat.id);
        if (currentSeat && currentSeat.ui_status !== 'Available') {
          setSelectedSeat(null);
          toast.error('Your selected seat is no longer available.');
        }
      }

      if (showToast) {
        toast.success('Seat availability refreshed!');
      }
    } catch (error) {
      toast.error('Failed to load seats');
    } finally {
      setLoadingSeats(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedSlot && selectedFloorId) {
      fetchSeatsForSlot(false);
    }
  }, [selectedSlot, selectedFloorId]);

  const handleSeatClick = (seat) => {
    if (seat.ui_status !== 'Available' && selectedSeat?.id !== seat.id) {
      toast.error(`Seat ${seat.seatNumber} is ${seat.ui_status.toLowerCase()}`);
      return;
    }
    if (selectedSeat?.id === seat.id) {
      setSelectedSeat(null);
    } else {
      setSelectedSeat(seat);
    }
  };

  const handleConfirmReservation = async () => {
    if (!selectedSeat || !selectedSlot || !user) return;
    setBooking(true);

    try {
      // Re-verify availability
      const latestSeats = await bookingService.getSeatsForSlot(selectedFloorId, tomorrowDate, selectedSlot.id);
      const targetSeat = latestSeats.find(s => s.id === selectedSeat.id);

      if (!targetSeat || targetSeat.ui_status !== 'Available') {
        toast.error('This seat was just booked by another student. Please choose another available seat.');
        setSelectedSeat(null);
        setSeats(latestSeats);
        setBooking(false);
        setShowSummaryModal(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 600));

      const newBooking = await bookingService.createBooking(user, tomorrowDate, selectedSlot, selectedFloorId, selectedSeat.id);

      toast.success('Seat booked successfully!');
      setConfirmationData({
        ...newBooking,
        floorName: floors.find(f => f.id === selectedFloorId)?.name || 'Ground Floor',
        zoneName: selectedSeat.zoneId === 'z1' ? 'Zone A · Quiet Study' : 'Zone B · General Reading'
      });
      setShowSummaryModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to book seat');
      fetchSeatsForSlot(false);
    } finally {
      setBooking(false);
    }
  };

  // Map zoneId to professional display names
  const getZoneDisplayName = (zoneId) => {
    if (zoneId === 'z1') return 'Zone A · Quiet Study';
    if (zoneId === 'z2') return 'Zone B · General Reading';
    return zoneId;
  };

  const groupedSeats = useMemo(() => {
    const groups = {};
    seats.forEach(seat => {
      const displayZone = getZoneDisplayName(seat.zoneId);
      if (!groups[displayZone]) groups[displayZone] = [];
      groups[displayZone].push(seat);
    });
    return groups;
  }, [seats]);

  // Mini-map stats calculation
  const miniMapStats = useMemo(() => {
    const total = seats.length;
    const available = seats.filter(s => s.ui_status === 'Available').length;
    const occupied = seats.filter(s => s.ui_status === 'Occupied').length;
    const blocked = seats.filter(s => s.ui_status === 'Blocked').length;
    const maintenance = seats.filter(s => s.ui_status === 'Under Maintenance').length;
    return { total, available, occupied, blocked, maintenance };
  }, [seats]);

  const format12HourTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  };

  const getSlotStatusInfo = (availableCount, totalCount) => {
    if (totalCount === 0) {
      return { label: 'Unavailable', badgeClass: 'bg-slate-100 text-slate-600 border-slate-300 font-semibold', progressClass: 'bg-slate-400', percent: 0, isDisabled: true, isFullyBooked: false };
    }
    const pct = Math.round((availableCount / totalCount) * 100);
    if (pct === 0) {
      return { label: 'Fully Booked', badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold', progressClass: 'bg-red-700', percent: 0, isDisabled: false, isFullyBooked: true };
    }
    if (pct < 20) {
      return { label: 'Almost Full', badgeClass: 'bg-red-50 text-red-700 border-red-200 font-bold', progressClass: 'bg-red-600', percent: pct, isDisabled: false, isFullyBooked: false };
    }
    if (pct <= 50) {
      return { label: 'Filling Fast', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold', progressClass: 'bg-amber-500', percent: pct, isDisabled: false, isFullyBooked: false };
    }
    return { label: 'High Availability', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold', progressClass: 'bg-emerald-600', percent: pct, isDisabled: false, isFullyBooked: false };
  };

  // Seat visual configuration
  const getSeatVisualConfig = (seat) => {
    const isSelected = selectedSeat?.id === seat.id;

    if (isSelected) {
      return {
        bg: 'bg-brandBlue text-white shadow-md border-brandBlue ring-2 ring-brandBlue/30 scale-105 z-10',
        icon: CheckCircle2,
        label: 'Selected',
        cursor: 'cursor-pointer'
      };
    }

    switch (seat.ui_status) {
      case 'Available':
        return {
          bg: 'bg-emerald-50/90 text-emerald-950 border-emerald-400/80 hover:border-emerald-600 hover:bg-emerald-100/80 hover:-translate-y-0.5 hover:shadow-sm',
          icon: Check,
          label: 'Available',
          cursor: 'cursor-pointer'
        };
      case 'Occupied':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200 opacity-85',
          icon: User,
          label: 'Occupied',
          cursor: 'cursor-not-allowed'
        };
      case 'Blocked':
        return {
          bg: 'bg-slate-100 text-slate-500 border-slate-200 opacity-80',
          icon: Lock,
          label: 'Blocked',
          cursor: 'cursor-not-allowed'
        };
      case 'Under Maintenance':
      default:
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 opacity-80',
          icon: Wrench,
          label: 'Under Maintenance',
          cursor: 'cursor-not-allowed'
        };
    }
  };

  // --------------------------------------------------------
  // STEP 1: TIME SLOT SELECTION VIEW
  // --------------------------------------------------------
  if (!selectedSlot) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">

        {/* Breadcrumb & Header Section */}
        <div className="space-y-3">
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="hover:text-navy cursor-pointer" onClick={() => window.location.href = '/student/dashboard'}>Dashboard</span>
            <span>/</span>
            <span className="text-navy font-semibold">Book a Seat</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">Book a Seat</h1>
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                Choose a time slot for tomorrow and select your preferred study seat.
              </p>
            </div>

            {/* Tomorrow's Date Badge */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-brandBlue/10 text-brandBlue flex items-center justify-center">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider">Tomorrow's Date</p>
                <p className="text-sm font-bold text-navy font-mono">{format(new Date(tomorrowDate), 'EEEE, d MMMM yyyy')}</p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium italic">
            ℹ️ Bookings are currently available for tomorrow only.
          </p>
        </div>

        {/* 2-Step Progress Indicator */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />

            <div className="relative z-10 flex items-center gap-2 bg-white px-2">
              <div className="h-7 w-7 rounded-full bg-brandBlue text-white font-bold text-xs flex items-center justify-center shadow-sm">
                1
              </div>
              <span className="text-xs font-bold text-navy">Choose Time Slot</span>
            </div>

            <div className="relative z-10 flex items-center gap-2 bg-white px-2">
              <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-300 text-slate-400 font-semibold text-xs flex items-center justify-center">
                2
              </div>
              <span className="text-xs font-medium text-slate-400">Select Seat</span>
            </div>
          </div>
        </div>

        {/* Slot Grid (2x2 Desktop / 1-col Mobile) */}
        {loadingSlots ? (
          <div className="grid gap-3" style={{gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,260px),1fr))'}}>
            {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse"></div>)}
          </div>
        ) : (
          <div className="grid gap-3" style={{gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,260px),1fr))'}}>
            {slots.map((slot, index) => {
              const status = getSlotStatusInfo(slot.availableCount, slot.totalCount);
              const isMorning = index < 2;
              const isSelected = selectedSlot?.id === slot.id;

              const summary = waitlistSummaries[slot.id] || {};
              const isStudentWaiting = summary.isStudentWaiting;

              // Find slot with max available seats for recommended badge
              const maxAvail = Math.max(...slots.map(s => s.availableCount));
              const isRecommended = slot.availableCount === maxAvail && maxAvail > 0 && index === slots.findIndex(s => s.availableCount === maxAvail);

              const handleCardClick = (event) => {
                if (status.isDisabled) return;
                if (status.isFullyBooked) {
                  if (isStudentWaiting) {
                    handleViewWaitingList(event, slot);
                  } else {
                    handleJoinWaitingList(event, slot);
                  }
                } else {
                  setSelectedSlot(slot);
                }
              };

              return (
                <div
                  key={slot.id}
                  onClick={handleCardClick}
                  className={`
                    group relative bg-white rounded-xl p-3.5 border-2 transition-all duration-200 flex flex-col justify-between shadow-xs
                    ${status.isDisabled
                      ? 'opacity-70 bg-slate-50 border-slate-200 cursor-not-allowed'
                      : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
                    }
                    ${status.isFullyBooked
                      ? isStudentWaiting
                        ? 'border-amber-400/80 bg-amber-50/20'
                        : 'border-red-200 hover:border-amber-400'
                      : isSelected
                        ? 'border-brandBlue bg-blue-50/40 ring-2 ring-brandBlue/20 shadow-md'
                        : 'border-slate-200 hover:border-brandBlue/40'
                    }
                  `}
                >
                  {/* Selected Top-Right Checkmark Badge */}
                  {isSelected && (
                    <div className="absolute -top-2.5 -right-2.5 bg-brandBlue text-white p-1 rounded-full shadow-md z-10">
                      <CheckCircle2 size={18} />
                    </div>
                  )}

                  <div className="space-y-2">
                    {/* Header Badges Row */}
                    <div className="flex justify-between items-start gap-1.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {/* Time-of-Day Badge */}
                        {isMorning ? (
                          <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-1 px-1.5 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-brandBlue" /> Morning
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1 px-1.5 py-0.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Afternoon
                          </Badge>
                        )}

                        {/* Duration Badge */}
                        <Badge variant="outline" className="text-[10px] font-semibold text-slate-600 bg-slate-50 border-slate-200 flex items-center gap-0.5 px-1.5 py-0.5">
                          <Clock size={10} className="text-slate-400" /> 1h
                        </Badge>

                        {/* Waitlisted Badge */}
                        {isStudentWaiting && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px] px-1.5 py-0.5 flex items-center gap-0.5 shadow-xs">
                            <Clock size={10} className="text-amber-600" /> Waitlisted
                          </Badge>
                        )}
                      </div>

                      {/* Availability Status Badge */}
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 shrink-0 ${status.badgeClass}`}>
                        {status.label}
                      </Badge>
                    </div>

                    {/* Recommended Tag */}
                    {isRecommended && !status.isDisabled && (
                      <div className="inline-flex items-center gap-1 bg-blue-50 text-brandBlue border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Sparkles size={10} /> Best availability
                      </div>
                    )}

                    {/* Slot Title & Time Range */}
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${isMorning ? 'bg-blue-50 text-brandBlue border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                        <Clock size={13} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-navy group-hover:text-brandBlue transition-colors leading-tight">{slot.label}</h3>
                        <p className="text-[10px] font-semibold text-slate-500 font-mono">
                          {format12HourTime(slot.startTime)} – {format12HourTime(slot.endTime)}
                        </p>
                      </div>
                    </div>

                    {/* Waitlisted Panel */}
                    {isStudentWaiting && (
                      <div className="bg-amber-50/90 border border-amber-200/80 rounded-lg p-2 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-amber-950 flex items-center gap-1">
                          <Clock size={11} className="text-amber-600" /> On waiting list
                        </span>
                        <Badge className="bg-amber-500 text-white font-mono font-extrabold text-[10px] px-1.5 py-0.5 shadow-xs">
                          #{summary.studentPosition}
                        </Badge>
                      </div>
                    )}

                    {/* Availability Progress Bar */}
                    <div className="space-y-1 pt-0.5">
                      <div className="flex justify-between items-baseline text-[10px] font-bold">
                        <span className="text-slate-700">{slot.availableCount}/{slot.totalCount} seats</span>
                        <span className="text-slate-500 font-mono">{status.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/50">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${status.progressClass}`}
                          style={{ width: `${status.percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="pt-2.5">
                    {status.isFullyBooked ? (
                      isStudentWaiting ? (
                        <Button
                          type="button"
                          onClick={(e) => handleViewWaitingList(e, slot)}
                          className="w-full h-8 text-[11px] font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 shadow-sm bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none relative z-10 cursor-pointer pointer-events-auto"
                        >
                          View Waiting List <Users size={12} />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={(e) => handleJoinWaitingList(e, slot)}
                          className="w-full h-8 text-[11px] font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 shadow-sm bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white focus:ring-2 focus:ring-amber-500 focus:outline-none relative z-10 cursor-pointer pointer-events-auto"
                        >
                          Join Waiting List <Clock size={12} />
                        </Button>
                      )
                    ) : (
                      <Button
                        type="button"
                        disabled={status.isDisabled}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!status.isDisabled) setSelectedSlot(slot);
                        }}
                        className={`
                          w-full h-8 text-[11px] font-bold transition-all rounded-lg flex items-center justify-center gap-1.5 shadow-sm
                          ${status.isDisabled
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : isSelected
                              ? 'bg-brandBlue text-white shadow-md shadow-brandBlue/20 ring-2 ring-brandBlue/30'
                              : 'bg-brandBlue hover:bg-blue-700 text-white'
                          }
                        `}
                      >
                        {isSelected ? (
                          <>Continue <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" /></>
                        ) : (
                          <>Select Slot <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" /></>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>High availability (&gt;50%)</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Filling fast (1–50%)</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <span>Fully booked (0%)</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span>Unavailable</span>
          </div>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-950 space-y-2 shadow-sm">
          <div className="font-bold flex items-center gap-2 text-blue-900 text-sm">
            <Info size={16} className="text-brandBlue shrink-0" /> Booking Information & Policies
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 text-slate-700 list-disc pl-4 leading-relaxed">
            <li>Reservations are available for tomorrow's date only.</li>
            <li>One student can reserve only one seat per time slot.</li>
            <li>A booking is confirmed only after completing seat selection.</li>
            <li>Arrive within 15 minutes of your slot start to avoid no-show cancellation.</li>
          </ul>
        </div>

      </div>
    );
  }

  // --------------------------------------------------------
  // STEP 2: INTERACTIVE SEAT MAP & BOOKING SUMMARY VIEW
  // --------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 md:pb-6 relative animate-in slide-in-from-right-8 duration-300">

      {/* Header & Breadcrumbs Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-navy hover:bg-slate-100 text-xs font-semibold px-2 -ml-2"
            onClick={() => { setSelectedSlot(null); setSelectedSeat(null); }}
          >
            ← Change Time Slot
          </Button>

          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="hover:text-navy cursor-pointer" onClick={() => setSelectedSlot(null)}>Book a Seat</span>
            <span>/</span>
            <span className="text-navy font-semibold">Select Seat</span>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">Choose Your Seat</h1>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Select exactly one available seat from the library floor map below.
            </p>
          </div>

          {/* Selected Date & Slot Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-navy shadow-sm flex items-center gap-2">
              <Calendar size={14} className="text-brandBlue" />
              {format(new Date(tomorrowDate), 'd MMM yyyy')}
            </div>
            <div className="bg-brandBlue/10 border border-brandBlue/20 px-3 py-1.5 rounded-lg text-xs font-bold text-brandBlue shadow-sm flex items-center gap-2">
              <Clock size={14} />
              {selectedSlot.label} ({format12HourTime(selectedSlot.startTime)} – {format12HourTime(selectedSlot.endTime)})
            </div>

            {/* Floor Location Chip / Refresh Button */}
            <div className="flex items-center gap-2">
              {floors.length > 1 ? (
                <select
                  className="flex h-9 text-xs rounded-lg border border-slate-200 bg-white px-3 font-semibold text-navy shadow-sm focus:outline-none focus:ring-2 focus:ring-brandBlue"
                  value={selectedFloorId}
                  onChange={e => { setSelectedFloorId(e.target.value); setSelectedSeat(null); }}
                >
                  {floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              ) : (
                <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Library size={14} className="text-slate-500" />
                  {floors[0]?.name || 'Ground Floor'}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-xs border-slate-200 hover:bg-slate-50 shadow-sm"
                onClick={() => fetchSeatsForSlot(true)}
                disabled={refreshing || loadingSeats}
                title="Refresh seat availability"
              >
                <RefreshCw size={14} className={refreshing || loadingSeats ? 'animate-spin text-brandBlue' : 'text-slate-600'} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Step Progress Bar (Step 2 Active) */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-brandBlue z-0" />

          {/* Step 1: Completed */}
          <div
            onClick={() => { setSelectedSlot(null); setSelectedSeat(null); }}
            className="relative z-10 flex items-center gap-2 bg-white px-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="h-7 w-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              ✓
            </div>
            <span className="text-xs font-semibold text-slate-600">Step 1: Time Slot</span>
          </div>

          {/* Step 2: Active */}
          <div className="relative z-10 flex items-center gap-2 bg-white px-2">
            <div className="h-7 w-7 rounded-full bg-brandBlue text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-brandBlue/20">
              2
            </div>
            <span className="text-xs font-bold text-navy">Step 2: Select Seat</span>
          </div>
        </div>
      </div>

      {/* Mini-Map Statistics Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-navy">
          <Compass size={16} className="text-brandBlue" /> Floor Availability Statistics:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-semibold bg-slate-50 text-slate-700 border-slate-200">
            {miniMapStats.total} Total Seats
          </Badge>
          <Badge variant="outline" className="font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
            {miniMapStats.available} Available
          </Badge>
          <Badge variant="outline" className="font-semibold bg-red-50 text-red-700 border-red-200">
            {miniMapStats.occupied} Occupied
          </Badge>
          {miniMapStats.blocked > 0 && (
            <Badge variant="outline" className="font-semibold bg-slate-100 text-slate-600 border-slate-300">
              {miniMapStats.blocked} Blocked
            </Badge>
          )}
          {miniMapStats.maintenance > 0 && (
            <Badge variant="outline" className="font-semibold bg-amber-50 text-amber-700 border-amber-200">
              {miniMapStats.maintenance} Maintenance
            </Badge>
          )}
        </div>
      </div>

      {/* Seat Map Legend Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-5 md:justify-center min-w-max text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-emerald-100 border border-emerald-500 flex items-center justify-center text-emerald-700"><Check size={10} /></span>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-brandBlue text-white flex items-center justify-center"><CheckCircle2 size={10} /></span>
            <span className="font-bold text-navy">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-red-100 border border-red-300 text-red-600 flex items-center justify-center"><User size={10} /></span>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-slate-200 border border-slate-300 text-slate-500 flex items-center justify-center"><Lock size={10} /></span>
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 rounded bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center"><Wrench size={10} /></span>
            <span>Maintenance</span>
          </div>
          <div className="h-3 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Zap size={12} className="text-amber-500 fill-amber-500" /> Power</span>
            <span className="flex items-center gap-1"><Accessibility size={12} className="text-brandBlue" /> Accessible</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid (70% Map / 30% Sticky Summary) */}
      <div className="grid lg:grid-cols-10 gap-6 items-start">

        {/* Left 70% Column: REALISTIC LIBRARY MAP */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-sm bg-[#F8FAFC] overflow-hidden">

            {/* Library Architectural Markers Header */}
            <div className="bg-white p-4 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2 font-bold text-navy">
                <DoorOpen size={18} className="text-brandBlue" />
                <span>Main Entrance & Help Desk</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-400">
                <span>🪟 Perimeter Windows</span>
                <span>📚 Bookcases Aisle</span>
                <span>🚪 Emergency Exit</span>
              </div>
            </div>

            {loadingSeats ? (
              <div className="h-[480px] flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="animate-spin text-brandBlue" size={36} />
                <p className="text-xs font-semibold">Loading floor map seats...</p>
              </div>
            ) : seats.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 text-center p-6">
                <AlertCircle size={40} className="mb-2 opacity-30" />
                <h3 className="text-base font-bold text-navy">No seats found on this floor</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Please select another floor or refresh.</p>
              </div>
            ) : (
              <div className="p-4 md:p-6 overflow-x-auto hide-scrollbar">
                <div className="min-w-[640px] mx-auto space-y-8 pb-4">

                  {/* Librarian Desk / Help Center Visual Anchor */}
                  <div className="bg-slate-200/70 border border-slate-300/70 rounded-xl p-2.5 text-center text-xs font-bold text-slate-700 shadow-inner max-w-xs mx-auto flex items-center justify-center gap-2">
                    <HelpCircle size={16} className="text-brandBlue" /> Librarian Counter & Information Desk
                  </div>

                  {/* Zones Rendering */}
                  {Object.entries(groupedSeats).map(([zoneName, zoneSeats]) => {
                    const availCount = zoneSeats.filter(s => s.ui_status === 'Available').length;
                    const totalCount = zoneSeats.length;

                    return (
                      <div key={zoneName} className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">

                        {/* Zone Header */}
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-brandBlue" />
                            <h3 className="font-bold text-navy text-sm">{zoneName}</h3>
                          </div>
                          <Badge variant="outline" className="text-xs font-semibold bg-slate-50 text-slate-600 border-slate-200">
                            {availCount} of {totalCount} seats available
                          </Badge>
                        </div>

                        {/* Study Table Rows Grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 justify-items-center py-2">
                          {zoneSeats.map(seat => {
                            const config = getSeatVisualConfig(seat);
                            const StatusIcon = config.icon;
                            const shortNumber = seat.seatNumber.split('-').pop();

                            return (
                              <button
                                key={seat.id}
                                disabled={seat.ui_status !== 'Available' && selectedSeat?.id !== seat.id}
                                onClick={() => handleSeatClick(seat)}
                                title={`Seat ${seat.seatNumber} • ${config.label}`}
                                aria-label={`Seat ${seat.seatNumber}, ${config.label}`}
                                className={`
                                  relative w-11 h-13 sm:w-12 sm:h-14 rounded-xl flex flex-col items-center justify-center
                                  border-2 transition-all duration-200 font-bold focus:outline-none focus:ring-2 focus:ring-brandBlue
                                  ${config.bg} ${config.cursor}
                                `}
                              >
                                <StatusIcon size={13} className="mb-0.5 shrink-0" />
                                <span className="text-[11px] font-mono leading-none">{shortNumber}</span>

                                {/* Feature Badges */}
                                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                  {seat.hasPower === 1 && (
                                    <span className="bg-white p-0.5 rounded-full shadow-sm border border-amber-200" title="Power socket">
                                      <Zap size={9} className="text-amber-500 fill-amber-500" />
                                    </span>
                                  )}
                                  {seat.isAccessible === 1 && (
                                    <span className="bg-white p-0.5 rounded-full shadow-sm border border-blue-200" title="Accessible">
                                      <Accessibility size={9} className="text-brandBlue" />
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                      </div>
                    );
                  })}

                  {/* Main Entrance Footer Marker */}
                  <div className="flex flex-col items-center justify-center opacity-70 pt-4">
                    <DoorOpen size={28} className="text-navy" />
                    <div className="w-56 h-1 bg-navy rounded-full mt-1"></div>
                    <span className="text-[10px] font-bold tracking-widest text-navy uppercase mt-1">Main Entrance & Exit</span>
                  </div>

                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right 30% Column: STICKY BOOKING SUMMARY PANEL */}
        <div className="hidden lg:block lg:col-span-3 sticky top-24">
          {selectedSeat ? (
            <Card className="border-brandBlue shadow-lg border-2 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="bg-brandBlue p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Selected Seat</span>
                    <h3 className="text-3xl font-extrabold">{selectedSeat.seatNumber}</h3>
                  </div>
                  <Badge className="bg-white text-brandBlue font-bold border-none">Ready</Badge>
                </div>
                <p className="text-white/80 text-xs mt-1">{getZoneDisplayName(selectedSeat.zoneId)}</p>
              </div>

              <CardContent className="p-5 space-y-4 text-xs">

                {/* Student Info */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Student Profile</p>
                  <p className="font-bold text-navy text-sm">{user?.name}</p>
                  <p className="text-slate-500 font-mono">ID: {user?.collegeId}</p>
                </div>

                {/* Schedule & Location */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reservation Date</span>
                    <span className="font-semibold text-navy">{format(new Date(tomorrowDate), 'PPP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Slot Time</span>
                    <span className="font-semibold text-brandBlue">{format12HourTime(selectedSlot.startTime)} – {format12HourTime(selectedSlot.endTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration</span>
                    <span className="font-semibold text-navy">1 Hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Floor</span>
                    <span className="font-semibold text-navy">{floors.find(f => f.id === selectedFloorId)?.name || 'Ground Floor'}</span>
                  </div>
                </div>

                {/* Seat Features */}
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Amenities</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedSeat.hasPower === 1 ? (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Zap size={12} className="text-amber-500 fill-amber-500" /> Power Socket
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-400 border border-slate-200 px-2 py-0.5 rounded">No Power</span>
                    )}
                    {selectedSeat.isAccessible === 1 && (
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Accessibility size={12} className="text-brandBlue" /> Wheelchair Accessible
                      </span>
                    )}
                  </div>
                </div>

                {/* Confirm & Clear Actions */}
                <div className="pt-3 space-y-2">
                  <Button
                    className="w-full h-11 bg-brandBlue hover:bg-brandBlue/90 text-white font-bold text-sm shadow-md shadow-brandBlue/20"
                    onClick={() => setShowSummaryModal(true)}
                  >
                    Confirm Booking
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full h-8 text-xs text-slate-500 hover:text-navy"
                    onClick={() => setSelectedSeat(null)}
                  >
                    Clear Selection
                  </Button>
                </div>

              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-slate-200 bg-white text-center p-6 space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto border text-slate-400">
                <MapPin size={24} />
              </div>
              <div>
                <h4 className="font-bold text-navy text-sm">No seat selected</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Choose an available green seat from the floor map to view your summary.
                </p>
              </div>
              <div className="pt-2 border-t text-[11px] text-emerald-700 font-semibold bg-emerald-50/60 p-2 rounded-lg">
                {miniMapStats.available} green seats available for this slot
              </div>
            </Card>
          )}
        </div>

      </div>

      {/* MOBILE STICKY BOTTOM BAR (Appears when seat selected on mobile) */}
      {selectedSeat && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-slate-200 shadow-2xl p-4 animate-in slide-in-from-bottom-full duration-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Selected Seat</span>
              <p className="text-xl font-extrabold text-navy">{selectedSeat.seatNumber}</p>
              <p className="text-xs text-brandBlue font-semibold">{format12HourTime(selectedSlot.startTime)} – {format12HourTime(selectedSlot.endTime)}</p>
            </div>
            <Button
              className="h-11 px-6 bg-brandBlue text-white font-bold text-sm shadow-md"
              onClick={() => setShowSummaryModal(true)}
            >
              Continue to Booking
            </Button>
          </div>
        </div>
      )}

      {/* FINAL BOOKING SUMMARY CONFIRMATION DIALOG / MODAL */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-8">

            <div className="bg-navy p-6 text-white flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-tealAccent uppercase tracking-wider">Final Step</span>
                <h2 className="text-2xl font-bold mt-1">Review & Confirm Booking</h2>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Student</span>
                  <p className="font-bold text-navy text-sm">{user?.name}</p>
                  <p className="text-xs text-slate-500 font-mono">Reg ID: {user?.collegeId}</p>
                </div>

                <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 space-y-1">
                  <span className="text-[10px] text-blue-800 font-bold uppercase">Reserved Seat</span>
                  <p className="text-2xl font-extrabold text-brandBlue">{selectedSeat?.seatNumber}</p>
                  <p className="text-xs text-slate-600 font-medium">{getZoneDisplayName(selectedSeat?.zoneId)}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-b border-slate-100 py-4 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Date</span>
                  <span className="font-bold text-navy">{format(new Date(tomorrowDate), 'EEEE, d MMMM yyyy')}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Time Slot</span>
                  <span className="font-bold text-brandBlue">{selectedSlot.label} ({format12HourTime(selectedSlot.startTime)} – {format12HourTime(selectedSlot.endTime)})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Floor</span>
                  <span className="font-semibold text-navy">{floors.find(f => f.id === selectedFloorId)?.name || 'Ground Floor'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-navy">1 Hour</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded text-brandBlue focus:ring-brandBlue"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <span className="text-xs text-slate-700 leading-relaxed font-medium">
                    I agree to the Library Rules & Policies and understand the 15-minute check-in grace period.
                  </span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-11 px-6"
                  onClick={() => setShowSummaryModal(false)}
                  disabled={booking}
                >
                  Cancel
                </Button>
                <Button
                  className="h-11 px-8 bg-brandBlue hover:bg-brandBlue/90 text-white font-bold"
                  disabled={!agreedToTerms || booking}
                  onClick={handleConfirmReservation}
                >
                  {booking ? 'Confirming...' : 'Confirm Reservation'}
                </Button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL WITH QR PASS */}
      {!!confirmationData && (
        <Dialog open={!!confirmationData} onOpenChange={() => { setConfirmationData(null); setSelectedSeat(null); setSelectedSlot(null); }}>
          <DialogContent className="sm:max-w-md text-center z-[150]">
            <div className="flex justify-center mb-3">
              <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={36} />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center font-bold text-navy">Seat Booked Successfully!</DialogTitle>
            <p className="text-slate-500 text-xs mb-4">Booking ID: <span className="font-mono font-bold text-brandBlue">{confirmationData?.id}</span></p>

            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-300 mx-auto inline-block mb-4 shadow-sm">
              <QRCodeSVG value={confirmationData.id} size={180} />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl text-xs text-left space-y-1 border border-slate-200 mb-4">
              <p className="flex justify-between"><strong>Seat:</strong> <span className="font-bold text-navy">{confirmationData?.seatNumber} ({confirmationData?.zoneName})</span></p>
              <p className="flex justify-between"><strong>Floor:</strong> <span>{confirmationData?.floorName}</span></p>
              <p className="flex justify-between"><strong>Date:</strong> <span>{format(new Date(confirmationData.bookingDate), 'PPP')}</span></p>
              <p className="flex justify-between"><strong>Slot Time:</strong> <span className="font-bold text-brandBlue">{format12HourTime(confirmationData?.startTime)} – {format12HourTime(confirmationData?.endTime)}</span></p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-11 text-xs" onClick={() => window.location.href = '/student/dashboard'}>
                Dashboard
              </Button>
              <Button className="flex-1 h-11 text-xs bg-navy text-white" onClick={() => window.location.href = '/student/reservations'}>
                View My Bookings
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* WAITING LIST CONFIRMATION & DETAILS MODAL */}
      <WaitlistModal
        isOpen={waitlistModalOpen}
        onClose={() => setWaitlistModalOpen(false)}
        mode={waitlistModalMode}
        slot={targetWaitlistSlot}
        dateStr={tomorrowDate}
        user={user}
        summary={targetWaitlistSlot ? waitlistSummaries[targetWaitlistSlot.id] : null}
        onSuccess={() => fetchInitialData()}
      />

    </div>
  );
}
