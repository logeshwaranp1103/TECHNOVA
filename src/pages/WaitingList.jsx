import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { waitlistService } from '../services/waitlistService';
import { useSync } from '../hooks/useSync';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { 
  Users, Clock, Calendar, AlertCircle, CheckCircle2, XCircle, 
  ArrowRight, RefreshCw, LogOut, Info, ShieldAlert, Check
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import WaitlistDemoPanel from '../components/WaitlistDemoPanel';

export default function WaitingList() {
  const { user } = useAuth();
  const [waitlists, setWaitlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  // Modal state for leaving waitlist
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const fetchWaitlists = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await waitlistService.getStudentWaitlists(user.id);
      setWaitlists(data);
    } catch (err) {
      toast.error('Failed to load waitlist entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlists();
  }, [user]);

  useSync((event) => {
    if (event?.type === 'WAITLIST_JOINED' || event?.type === 'WAITLIST_CANCELLED' || event?.type === 'WAITLIST_ALLOCATED' || event?.type === 'WAITLIST_TEST_SCENARIO_CREATED' || event?.type === 'WAITLIST_TEST_SCENARIO_RESET') {
      fetchWaitlists();
    }
  });

  const handleOpenLeaveModal = (entry) => {
    setSelectedEntry(entry);
    setLeaveModalOpen(true);
  };

  const handleConfirmLeave = async () => {
    if (!selectedEntry || !user) return;
    setLeaving(true);
    try {
      await waitlistService.leaveWaitlist(selectedEntry.id, user.id);
      toast.success('Successfully left the waiting list');
      setLeaveModalOpen(false);
      setSelectedEntry(null);
      await fetchWaitlists();
    } catch (err) {
      toast.error(err.message || 'Could not leave waiting list');
    } finally {
      setLeaving(false);
    }
  };

  const activeEntries = waitlists.filter(w => w.status === 'waiting' || w.status === 'allocating');
  const historyEntries = waitlists.filter(w => w.status !== 'waiting' && w.status !== 'allocating');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1"><Clock size={12} /> Waiting</Badge>;
      case 'allocated':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1"><CheckCircle2 size={12} /> Seat Allocated</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1"><XCircle size={12} /> Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 flex items-center gap-1"><Info size={12} /> Expired</Badge>;
      case 'skipped':
        return <Badge className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"><AlertCircle size={12} /> Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300">
      
      {/* DEMO TEST SCENARIO CONTROL PANEL */}
      <WaitlistDemoPanel onScenarioChange={fetchWaitlists} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span className="hover:text-navy cursor-pointer" onClick={() => window.location.href='/student/dashboard'}>Dashboard</span>
            <span>/</span>
            <span className="text-navy font-semibold">My Waiting List</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy tracking-tight">My Waiting List</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            Track your queue positions and automatic seat allocation status in real-time.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={fetchWaitlists} 
          disabled={loading}
          className="self-start md:self-auto h-9 text-xs gap-2 border-slate-200 shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Queue
        </Button>
      </div>

      {/* Tabs Filter */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="active" className="rounded-lg text-xs font-bold px-4 py-2">
            Active Queue ({activeEntries.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs font-bold px-4 py-2">
            Queue History ({historyEntries.length})
          </TabsTrigger>
        </TabsList>

        {/* ACTIVE QUEUE CONTENT */}
        <TabsContent value="active" className="space-y-4 pt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}
            </div>
          ) : activeEntries.length === 0 ? (
            <Card className="bg-white border-dashed border-2 border-slate-200">
              <CardContent className="py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users size={24} />
                </div>
                <h3 className="text-base font-bold text-navy">No Active Waitlists</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You are not currently in any waiting list queue. When a desired slot is fully booked, you can join the waitlist to receive a seat automatically.
                </p>
                <Button 
                  onClick={() => window.location.href='/student/find-seat'} 
                  className="bg-brandBlue hover:bg-blue-700 text-white font-bold text-xs h-10 px-6 rounded-xl mt-2 shadow-sm"
                >
                  Browse Time Slots <ArrowRight size={14} className="ml-1" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5">
              {activeEntries.map(entry => {
                const isFirst = entry.position === 1;
                return (
                  <Card key={entry.id} className="bg-white border-2 border-amber-200/80 rounded-2xl shadow-sm overflow-hidden">
                    <CardContent className="p-6 space-y-5">
                      
                      {/* Top Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-extrabold text-lg ${isFirst ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'}`}>
                            #{entry.position}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-navy">Position #{entry.position}</span>
                              {isFirst && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-extrabold">
                                  You're Next!
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              {entry.aheadCount === 0 ? 'You are first in line for seat allocation.' : `${entry.aheadCount} student${entry.aheadCount === 1 ? '' : 's'} ahead of you.`}
                            </p>
                          </div>
                        </div>

                        <div>{getStatusBadge(entry.status)}</div>
                      </div>

                      {/* Entry Details */}
                      <div className="grid sm:grid-cols-3 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold text-[10px] uppercase block">Booking Date</span>
                          <span className="font-bold text-navy font-mono text-sm">{format(new Date(entry.bookingDate), 'EEEE, d MMM yyyy')}</span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold text-[10px] uppercase block">Time Slot</span>
                          <span className="font-bold text-brandBlue font-mono text-sm">{entry.slotLabel} ({entry.startTime} – {entry.endTime})</span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                          <span className="text-slate-400 font-semibold text-[10px] uppercase block">Preferences</span>
                          <span className="font-bold text-navy">
                            {entry.allowAnySeat ? 'Any available seat' : 'Specific floor/zone'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Indicator */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                          <span>Queue Progress</span>
                          <span>Position {entry.position} of {entry.totalInQueue || entry.position}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                            style={{ width: `${Math.max(15, Math.round(((entry.totalInQueue - entry.position + 1) / entry.totalInQueue) * 100))}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium">Joined {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href='/student/find-seat'} 
                            className="text-xs h-9 font-semibold text-slate-700"
                          >
                            View Slot
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleOpenLeaveModal(entry)} 
                            className="text-xs h-9 font-semibold text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut size={14} className="mr-1" /> Leave Waiting List
                          </Button>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* HISTORY CONTENT */}
        <TabsContent value="history" className="space-y-4 pt-4">
          {historyEntries.length === 0 ? (
            <Card className="bg-white border-dashed border-2 border-slate-200">
              <CardContent className="py-12 text-center text-slate-400 text-xs">
                No past waitlist records found.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {historyEntries.map(entry => (
                <Card key={entry.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">{entry.slotLabel}</span>
                      <span className="text-slate-400">•</span>
                      <span className="font-mono text-slate-500">{entry.bookingDate}</span>
                      {getStatusBadge(entry.status)}
                    </div>
                    {entry.allocatedBookingId && (
                      <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <Check size={13} /> Allocated Booking ID: {entry.allocatedBookingId}
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">{format(new Date(entry.joinedAt), 'd MMM yyyy')}</span>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* LEAVE WAITING LIST CONFIRMATION MODAL */}
      <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center justify-center gap-2">
              <ShieldAlert size={22} /> Leave Waiting List?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              You will lose your current queue position (#{selectedEntry?.position}). If you rejoin later, you will be added to the end of the line.
            </DialogDescription>
          </DialogHeader>

          {selectedEntry && (
            <div className="bg-slate-50 p-4 rounded-xl text-xs text-left space-y-2 border border-slate-200 my-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Slot:</span>
                <span className="font-bold text-navy">{selectedEntry.slotLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Queue Position:</span>
                <span className="font-bold text-amber-600 font-mono">#{selectedEntry.position}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setLeaveModalOpen(false)} disabled={leaving}>
              Stay in Queue
            </Button>
            <Button variant="destructive" onClick={handleConfirmLeave} disabled={leaving}>
              {leaving ? 'Leaving...' : 'Leave Waiting List'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
