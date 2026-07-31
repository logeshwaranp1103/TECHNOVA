import React, { useEffect, useState } from 'react';
import { useWaitlistStore } from '../../store/useWaitlistStore';
import type { WaitlistEntry } from '../../types/waitlist';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Calendar,
  Sparkles,
  Timer,
  Layers,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';

export const WaitlistPage: React.FC = () => {
  const { entries, fetchData, simulateAccept, simulateDecline } = useWaitlistStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live timer tick for countdown displays
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter options
  const uniqueDates = Array.from(new Set(entries.map((e) => e.date)));

  const filteredEntries = entries.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false;
    if (dateFilter !== 'ALL' && e.date !== dateFilter) return false;
    return true;
  });

  // Summary Metrics
  const waitingCount = entries.filter((e) => e.status === 'WAITING').length;
  const notifiedCount = entries.filter((e) => e.status === 'NOTIFIED').length;
  const acceptedCount = entries.filter((e) => e.status === 'ACCEPTED').length;
  const expiredCount = entries.filter((e) => e.status === 'EXPIRED' || e.status === 'DECLINED').length;

  // Group entries by Date + Time Slot
  const groupedEntries = filteredEntries.reduce<Record<string, WaitlistEntry[]>>((acc, entry) => {
    const key = `${entry.date} (${entry.preferredTimeSlot})`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  // Format countdown string
  const getCountdownString = (responseExpiry?: string) => {
    if (!responseExpiry) return 'Expired';
    const diff = new Date(responseExpiry).getTime() - now;
    if (diff <= 0) return '00m 00s';
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const getStatusBadgeVariant = (status: WaitlistEntry['status']) => {
    switch (status) {
      case 'WAITING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> WAITING</span>;
      case 'NOTIFIED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 animate-pulse flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> NOTIFIED</span>;
      case 'ACCEPTED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> ACCEPTED</span>;
      case 'DECLINED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> DECLINED</span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> EXPIRED</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      <PageHeader
        title="Automated Waiting List Management"
        subtitle="First-come-first-served (FCFS) queue auto-resolution on slot cancellations."
      />

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waiting in Queue</span>
          <p className="font-heading text-2xl font-extrabold text-amber-600 mt-1">{waitingCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Offered & Pending</span>
          <p className="font-heading text-2xl font-extrabold text-blue-600 mt-1">{notifiedCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accepted Seats</span>
          <p className="font-heading text-2xl font-extrabold text-emerald-600 mt-1">{acceptedCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-slate-400 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Declined / Expired</span>
          <p className="font-heading text-2xl font-extrabold text-slate-700 mt-1">{expiredCount}</p>
        </Card>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Queue:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs">
              {(['ALL', 'WAITING', 'NOTIFIED', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                    statusFilter === st ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            {uniqueDates.length > 0 && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">All Dates</option>
                  {uniqueDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queue Groups List */}
      {Object.keys(groupedEntries).length === 0 ? (
        <Card className="p-12 text-center bg-white border border-slate-200/90 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-base text-slate-900">No students currently on the waiting list</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When all seats for a date and time slot are booked, student waitlist requests will automatically queue here FCFS.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntries).map(([slotGroupKey, groupList]) => {
            // Sort FCFS within group
            const sortedGroup = [...groupList].sort(
              (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
            );

            return (
              <Card key={slotGroupKey} className="overflow-hidden border border-slate-200/90 rounded-2xl bg-white shadow-2xs">
                {/* Group Header Banner - Clean Slate Style */}
                <div className="p-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-heading font-extrabold text-base text-slate-900 tracking-tight leading-none">
                        Matching Slot: {slotGroupKey}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 font-mono">
                        FCFS Auto-Matching Key (Date + Time Slot)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                      {sortedGroup.length} Queued {sortedGroup.length === 1 ? 'Student' : 'Students'}
                    </span>
                  </div>
                </div>

                {/* Queue Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Queue Pos</th>
                        <th className="py-3 px-4">Student Info</th>
                        <th className="py-3 px-4">Requested Floor</th>
                        <th className="py-3 px-4">Joined Queue At</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Simulated Response Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {sortedGroup.map((entry, idx) => (
                        <tr
                          key={entry.id}
                          className={`transition-colors hover:bg-slate-50/80 ${
                            entry.status === 'NOTIFIED' ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          {/* Queue Position */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                            <span className="w-7 h-7 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-xs shadow-2xs font-extrabold">
                              #{idx + 1}
                            </span>
                          </td>

                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                                {entry.userName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{entry.userName}</p>
                                <p className="text-[11px] font-mono text-slate-500">ID: {entry.userCollegeId}</p>
                              </div>
                            </div>
                          </td>

                          {/* Requested Floor */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <span className="text-[11px] font-semibold text-slate-800">{entry.floorName || 'Any Floor'}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">(FCFS matches any floor)</span>
                          </td>

                          {/* Joined At */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                            {new Date(entry.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1">
                              {getStatusBadgeVariant(entry.status)}
                              {entry.status === 'NOTIFIED' && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-mono font-bold border border-blue-200">
                                  <Sparkles className="w-3 h-3 text-blue-600 animate-spin" />
                                  <span>Expires in {getCountdownString(entry.responseExpiry)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Simulation Action Controls */}
                          <td className="py-3.5 px-4 text-right">
                            {entry.status === 'NOTIFIED' ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => simulateAccept(entry.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                                  title="Simulate student clicking ACCEPT in portal"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  Simulate Accept
                                </button>
                                <button
                                  type="button"
                                  onClick={() => simulateDecline(entry.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                                  title="Simulate student clicking DECLINE in portal"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  Simulate Decline
                                </button>
                              </div>
                            ) : entry.status === 'ACCEPTED' ? (
                              <span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Seat Reserved
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No action required</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
