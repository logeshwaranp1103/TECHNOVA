import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  Clock, Users, ArrowUpRight, Zap, CheckCircle2, Search, 
  Bell, User, MapPin, Sparkles, ChevronDown, Check 
} from 'lucide-react';
import { toast } from 'sonner';
import type { WaitingListEntry } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';

export const WaitingListPage: React.FC = () => {
  const { waitingList, assignWaitlistSeat, removeWaitlistSeat, seats } = useAppStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<WaitingListEntry | null>(null);

  // Typeable Seat Combobox State (Starts Blank)
  const [selectedSeatCode, setSelectedSeatCode] = useState('');
  const [seatSearch, setSeatSearch] = useState('');
  const [isSeatDropdownOpen, setIsSeatDropdownOpen] = useState(false);

  // Notified Bell 3-Second Active State
  const [notifiedIds, setNotifiedIds] = useState<Record<string, boolean>>({});

  // Available seats sorted Alphabetically
  const availableSeats = seats.filter(s => s.status === 'available');
  const sortedAvailableSeats = [...availableSeats].sort((a, b) => 
    a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Filtered available seats based on user search input
  const filteredAvailableSeats = sortedAvailableSeats.filter(s => {
    const q = seatSearch.toLowerCase();
    return s.code.toLowerCase().includes(q) || 
           s.floorName.toLowerCase().includes(q) || 
           s.zoneName.toLowerCase().includes(q);
  });

  // Filtered waiting list entries
  const filteredWaitingList = waitingList.filter(item => {
    const matchesSearch = item.studentName.toLowerCase().includes(search.toLowerCase()) ||
                          item.registerNo.toLowerCase().includes(search.toLowerCase()) ||
                          item.requestedFloor.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || item.requestedFloor.toLowerCase().includes(floorFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesFloor;
  });

  const handleOpenAssignModal = (entry: WaitingListEntry) => {
    setSelectedEntry(entry);
    setSelectedSeatCode('');
    setSeatSearch('');
    setIsSeatDropdownOpen(false);
  };

  const handleAssignSeat = () => {
    if (!selectedEntry) return;
    if (!selectedSeatCode) {
      toast.error('Please select or search an available seat from the list');
      return;
    }
    assignWaitlistSeat(selectedEntry.id, selectedSeatCode);
    toast.success(`Seat ${selectedSeatCode} successfully allocated to ${selectedEntry.studentName}`);
    setSelectedEntry(null);
  };

  const handleAutoAllocateNext = () => {
    const nextWaiting = waitingList.find(w => w.status === 'waiting');
    if (!nextWaiting) {
      toast.info('No pending students in waiting queue');
      return;
    }
    const assignCode = sortedAvailableSeats[0]?.code || 'G-24';
    assignWaitlistSeat(nextWaiting.id, assignCode);
    toast.success(`Auto-Allocated Seat ${assignCode} to ${nextWaiting.studentName} (Priority #${nextWaiting.priorityScore})`);
  };

  const handleNotifyStudent = (id: string, name: string) => {
    if (notifiedIds[id]) {
      toast.warning(`Please wait 3 seconds before sending another notification to ${name}`);
      return;
    }

    setNotifiedIds(prev => ({ ...prev, [id]: true }));
    toast.success(`Instant notification sent to ${name}: "Seat available soon, please hold"`);

    setTimeout(() => {
      setNotifiedIds(prev => ({ ...prev, [id]: false }));
    }, 3000);
  };

  const columns: ColumnDef<WaitingListEntry>[] = [
    {
      accessorKey: 'priorityScore',
      header: 'RANK / PRIORITY',
      cell: ({ row }) => {
        const index = row.index + 1;
        const score = row.original.priorityScore;
        return (
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-2xs ${
              index === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
              index === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
              index === 3 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
              'bg-slate-100 text-slate-600'
            }`}>
              #{index}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-brandBlue">
              Pts: {score}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'studentName',
      header: 'STUDENT PROFILE',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-navy text-xs truncate max-w-[150px]">{row.original.studentName}</div>
            <div className="font-mono text-[10px] text-slate-400">{row.original.registerNo}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'requestedFloor',
      header: 'REQUESTED PREFERENCE',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
            <MapPin className="w-3.5 h-3.5 text-brandBlue shrink-0" />
            <span>{row.original.requestedFloor}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium pl-5">{row.original.requestedZone} • {row.original.seatTypePreference}</div>
        </div>
      ),
    },
    {
      accessorKey: 'waitTimeMinutes',
      header: 'WAIT DURATION',
      cell: ({ row }) => {
        const mins = row.original.waitTimeMinutes;
        const colorClass = mins < 15 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           mins < 25 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                           'bg-red-50 text-red-700 border-red-200';
        return (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${colorClass}`}>
              <Clock className="w-3 h-3" />
              {mins} mins
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({row.original.requestTime})</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'QUEUE STATUS',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            status === 'assigned'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${status === 'assigned' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="capitalize">{status}</span>
          </span>
        );
      },
    },
    {
      id: 'notify',
      header: 'NOTIFY',
      cell: ({ row }) => {
        const isNotified = !!notifiedIds[row.original.id];
        return (
          <div className="flex items-center justify-center">
            <Button
              variant={isNotified ? 'primary' : 'ghost'}
              size="sm"
              disabled={isNotified}
              onClick={() => handleNotifyStudent(row.original.id, row.original.studentName)}
              title={isNotified ? "Notification cooldown active (3s)" : "Notify Student"}
              className={`w-8 h-8 p-0 flex items-center justify-center rounded-xl border-none outline-none ring-0 shadow-none transition-all duration-300 ${
                isNotified
                  ? 'bg-brandBlue text-white cursor-not-allowed scale-105'
                  : 'text-slate-500 hover:text-brandBlue hover:bg-blue-50 cursor-pointer'
              }`}
            >
              <Bell className={`w-4 h-4 transition-transform duration-300 ${isNotified ? 'scale-110 rotate-12' : ''}`} />
            </Button>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'ACTION',
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          {row.original.status === 'assigned' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                removeWaitlistSeat(row.original.id);
                toast.success(`Seat allocation removed for ${row.original.studentName}`);
              }}
              className="w-28 justify-center whitespace-nowrap"
            >
              Remove Seat
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenAssignModal(row.original)}
              className="w-28 justify-center whitespace-nowrap"
            >
              Assign Seat
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Waiting List Queue</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time dynamic waiting list queue for high-demand peak library study hours.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" leftIcon={<Sparkles className="w-4 h-4 text-brandBlue" />} onClick={handleAutoAllocateNext}>
            Auto-Allocate Top Priority
          </Button>
          <Button variant="primary" size="sm" leftIcon={<Zap className="w-4 h-4" />}>
            Auto Allocator Active
          </Button>
        </div>
      </div>

      {/* KPI Stats (24px gap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Queue Depth"
          value={waitingList.filter(w => w.status === 'waiting').length.toString()}
          icon={Users}
          trend={{ value: "+4 this hour", isPositive: true }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Avg Wait Duration"
          value="14m"
          icon={Clock}
          trend={{ value: "-3m faster", isPositive: true }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Allocations Today"
          value={waitingList.filter(w => w.status === 'assigned').length.toString()}
          icon={CheckCircle2}
          trend={{ value: "Live allocated", isPositive: true }}
          iconBg="bg-teal-50"
          iconColor="text-tealAccent-600"
        />
        <StatCard
          title="Auto Allocation Rate"
          value="94.2%"
          icon={ArrowUpRight}
          trend={{ value: "System operational", isPositive: true }}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search queue by student, reg no, or location..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Queue Statuses</option>
            <option value="waiting">Waiting Only</option>
            <option value="assigned">Assigned</option>
          </select>

          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Requested Floors</option>
            <option value="Ground">Ground Floor</option>
            <option value="Floor 1">Floor 1</option>
            <option value="Floor 2">Floor 2</option>
            <option value="Floor 3">Floor 3</option>
            <option value="Floor 7">Floor 7</option>
          </select>
        </div>
      </div>

      {/* Waiting List Table */}
      <Card title="Live Queue Standings" subtitle="Priority queue sorted by request timestamp and priority score">
        <Table columns={columns} data={filteredWaitingList} pageSize={10} />
      </Card>

      {/* Manual Seat Assignment Modal with Typeable Combobox */}
      <Modal
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
        title={`Assign Seat - ${selectedEntry?.studentName}`}
        subtitle={`Manual override seat allocation for queue entry #${selectedEntry?.id}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedEntry(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAssignSeat}>
              Confirm Allocation {selectedSeatCode ? `(Seat ${selectedSeatCode})` : ''}
            </Button>
          </>
        }
      >
        {selectedEntry && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div><span className="text-slate-400 block">Student</span><strong>{selectedEntry.studentName} ({selectedEntry.registerNo})</strong></div>
              <div><span className="text-slate-400 block">Requested Location</span><strong>{selectedEntry.requestedFloor} - {selectedEntry.requestedZone}</strong></div>
              <div><span className="text-slate-400 block">Wait Time</span><strong className="text-amber-600">{selectedEntry.waitTimeMinutes} minutes</strong></div>
            </div>

            {/* Typeable Searchable Combobox Starts Blank */}
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-brandBlue/20 text-navy space-y-2.5">
              <label className="font-bold text-xs text-navy block">Select or Search Available Seat *</label>
              
              <div className="relative">
                <input
                  type="text"
                  value={seatSearch || selectedSeatCode}
                  onFocus={() => setIsSeatDropdownOpen(true)}
                  onChange={(e) => {
                    setSeatSearch(e.target.value);
                    setSelectedSeatCode('');
                    setIsSeatDropdownOpen(true);
                  }}
                  placeholder="Type or search available seat (e.g. F1-01, G-24)..."
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-navy font-mono focus:outline-none focus:border-brandBlue shadow-xs transition-all"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />

                {/* Floating Alphabetical Dropdown Menu (Cleanly renders 3 options) */}
                {isSeatDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setIsSeatDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1.5 max-h-[160px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl z-30 divide-y divide-slate-100">
                      {filteredAvailableSeats.length > 0 ? (
                        filteredAvailableSeats.map((seat) => (
                          <div
                            key={seat.id}
                            onClick={() => {
                              setSelectedSeatCode(seat.code);
                              setSeatSearch(seat.code);
                              setIsSeatDropdownOpen(false);
                            }}
                            className={`h-[52px] px-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                              selectedSeatCode === seat.code ? 'bg-blue-50/80 font-bold text-brandBlue' : 'hover:bg-slate-50 text-navy'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-brandBlue text-xs block leading-tight">{seat.code}</span>
                              <span className="text-[11px] text-slate-500 truncate block leading-tight mt-0.5">{seat.floorName} • {seat.zoneName}</span>
                            </div>
                            {selectedSeatCode === seat.code && (
                              <Check className="w-4 h-4 text-brandBlue shrink-0 ml-2" />
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="h-[52px] flex items-center justify-center text-xs text-slate-500 font-medium">
                          No matching available seats found
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <span className="text-[11px] text-slate-600 block pt-1">
                Showing {filteredAvailableSeats.length} available seats sorted alphabetically. Assigning sends a check-in QR code immediately.
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
