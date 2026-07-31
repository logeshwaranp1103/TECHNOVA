import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import QRCode from 'react-qr-code';
import { 
  CalendarCheck, Clock, CheckCircle2, XCircle, Users, 
  Search, Plus, QrCode as QrIcon, Send, Edit3, X, Calendar as CalendarIcon, List, Activity, Download, Layers 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Reservation } from '../types';
import { useAppStore } from '../store/useAppStore';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const ReservationManagementPage: React.FC = () => {
  const { 
    reservations, 
    reservationViewMode, 
    setReservationViewMode,
    selectedReservationId, 
    setSelectedReservationId,
    cancelReservation,
    rejectReservation,
    createReservation,
    updateReservation,
    students
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-07-31');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    setNewRes(prev => ({ ...prev, studentId: '' }));
    setStudentSearch('');
    setIsCreateModalOpen(true);
  };

  const handleExportCSV = () => {
    if (filteredReservations.length === 0) {
      toast.error('No reservations found matching the selected filters');
      return;
    }

    const headers = ['Reservation ID', 'Student Name', 'Register No', 'Department', 'Seat Code', 'Floor Name', 'Zone Name', 'Date', 'Start Time', 'End Time', 'Status', 'Check-In Status'];
    const rows = filteredReservations.map(r => [
      `"${r.id}"`,
      `"${r.studentName}"`,
      `"${r.studentRegisterNo}"`,
      `"${r.department}"`,
      `"${r.seatCode}"`,
      `"${r.floorName}"`,
      `"${r.zoneName}"`,
      `"${r.date}"`,
      `"${r.startTime}"`,
      `"${r.endTime}"`,
      `"${r.status}"`,
      `"${r.checkInStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_reservations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredReservations.length} reservations to CSV successfully!`);
  };

  const handleBulkCheckIn = () => {
    const pendingRes = filteredReservations.filter(r => r.status === 'confirmed');
    if (pendingRes.length === 0) {
      toast.info('No pending confirmed reservations to check-in');
      return;
    }
    pendingRes.forEach(r => updateReservation(r.id, { status: 'checked-in', checkInStatus: 'Checked In' }));
    toast.success(`Successfully checked-in ${pendingRes.length} student reservations!`);
    setIsBulkModalOpen(false);
  };

  const handleBulkReject = () => {
    const pendingRes = filteredReservations.filter(r => r.status === 'confirmed');
    if (pendingRes.length === 0) {
      toast.info('No pending confirmed reservations to reject');
      return;
    }
    pendingRes.forEach(r => rejectReservation(r.id));
    toast.error(`Rejected ${pendingRes.length} pending student reservations.`);
    setIsBulkModalOpen(false);
  };

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editResData, setEditResData] = useState<{
    id: string;
    seatCode: string;
    floorName: string;
    zoneName: string;
    startTime: string;
    endTime: string;
    status: Reservation['status'];
  }>({
    id: '',
    seatCode: '',
    floorName: '',
    zoneName: '',
    startTime: '',
    endTime: '',
    status: 'confirmed',
  });

  // New Reservation Form State
  const [newRes, setNewRes] = useState({
    studentId: '',
    seatCode: 'G-14',
    floorName: 'Ground Floor',
    zoneName: 'Main Reading Hall',
    startTime: '11:00',
    endTime: '15:00',
  });

  // Only show details when user explicitly selects a reservation row
  const selectedRes = reservations.find(r => r.id === selectedReservationId);

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(search.toLowerCase()) || 
                          r.studentName.toLowerCase().includes(search.toLowerCase()) ||
                          r.seatCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || r.floorName === floorFilter;
    return matchesSearch && matchesStatus && matchesFloor;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentObj = students.find(s => s.id === newRes.studentId) || students[0];

    createReservation({
      studentId: studentObj.id,
      studentName: studentObj.name,
      studentEmail: studentObj.email,
      studentRegisterNo: studentObj.registerNo,
      department: studentObj.department,
      academicYear: studentObj.academicYear,
      seatId: 'seat-14',
      seatCode: newRes.seatCode,
      floorName: newRes.floorName,
      zoneName: newRes.zoneName,
      date: '2026-07-31',
      startTime: newRes.startTime,
      endTime: newRes.endTime,
      durationHours: 4,
      status: 'confirmed',
      checkInStatus: 'Pending - 15m',
      createdMethod: 'Staff created',
    });

    toast.success(`Reservation created for ${studentObj.name}`);
    setIsCreateModalOpen(false);
  };

  const handleRejectReservation = (id: string) => {
    rejectReservation(id);
    toast.error(`Reservation ${id} has been rejected by admin`);
  };

  const handleOpenEditModal = (res: Reservation) => {
    setEditResData({
      id: res.id,
      seatCode: res.seatCode,
      floorName: res.floorName,
      zoneName: res.zoneName,
      startTime: res.startTime,
      endTime: res.endTime,
      status: res.status,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateReservation(editResData.id, {
      seatCode: editResData.seatCode,
      floorName: editResData.floorName,
      zoneName: editResData.zoneName,
      startTime: editResData.startTime,
      endTime: editResData.endTime,
      status: editResData.status,
    });
    toast.success(`Reservation ${editResData.id} updated successfully`);
    setIsEditModalOpen(false);
  };

  const columns: ColumnDef<Reservation>[] = [
    {
      accessorKey: 'id',
      header: 'RESERVATION',
      cell: ({ row }) => (
        <div>
          <div className="font-mono font-bold text-navy">{row.original.id}</div>
          <div className="text-[10px] text-slate-400">{row.original.createdMethod}</div>
        </div>
      ),
    },
    {
      accessorKey: 'studentName',
      header: 'STUDENT',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brandBlue/10 text-brandBlue font-bold flex items-center justify-center text-xs shrink-0">
            {row.original.studentName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-navy truncate max-w-[140px]">{row.original.studentName}</div>
            <div className="text-[10px] text-slate-400 truncate">{row.original.department}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'seatCode',
      header: 'SEAT',
      cell: ({ row }) => (
        <div>
          <div className="font-mono font-bold text-brandBlue">{row.original.seatCode}</div>
          <div className="text-[10px] text-slate-400">{row.original.floorName}</div>
        </div>
      ),
    },
    {
      accessorKey: 'startTime',
      header: 'TIME',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-700">{row.original.startTime} - {row.original.endTime}</div>
          <div className="text-[10px] text-slate-400">{row.original.durationHours}h duration</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'checked-in' ? 'checked-in' :
            row.original.status === 'confirmed' ? 'primary' :
            row.original.status === 'late' ? 'late' :
            row.original.status === 'completed' ? 'completed' :
            (row.original.status === 'cancelled' || row.original.status === 'rejected') ? 'danger' : 'neutral'
          }
          dot
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'checkInStatus',
      header: 'CHECK-IN',
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
          {row.original.checkInStatus}
        </span>
      ),
    },
  ];

  const totalToday = reservations.length;
  const activeResCount = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'late').length;
  const checkedInCount = reservations.filter(r => r.status === 'checked-in').length;
  const pendingCount = reservations.filter(r => r.status === 'confirmed').length;
  const cancelledCount = reservations.filter(r => r.status === 'cancelled' || r.status === 'rejected').length;
  const waitingListCount = useAppStore.getState().waitingList.filter(w => w.status === 'waiting').length;
  const liveOccupancyPct = useAppStore.getState().seats.length > 0 
    ? Math.round((useAppStore.getState().seats.filter(s => s.status === 'occupied').length / useAppStore.getState().seats.length) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Reservation Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Monitor, manage, approve, cancel, and analyze all library seat reservations in one centralized workspace.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            leftIcon={<Layers className="w-4 h-4" />}
            onClick={() => setIsBulkModalOpen(true)}
          >
            Bulk Actions
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            Create Reservation
          </Button>
        </div>
      </div>

      {/* Modern KPI Cards Grid (Computed dynamically from Store State) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          title="Today's Reservations"
          value={totalToday.toString()}
          icon={CalendarCheck}
          trend={{ value: "+12.4%", isPositive: true }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Active Reservations"
          value={activeResCount.toString()}
          icon={Activity}
          subtitle={`${activeResCount > 0 ? Math.round((activeResCount / (totalToday || 1)) * 100) : 0}% active`}
          iconBg="bg-teal-50"
          iconColor="text-tealAccent-600"
        />
        <StatCard
          title="Checked In"
          value={checkedInCount.toString()}
          icon={CheckCircle2}
          trend={{ value: "+9.1%", isPositive: true }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Pending Check-ins"
          value={pendingCount.toString()}
          icon={Clock}
          subtitle={`${pendingCount} due soon`}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Cancelled"
          value={cancelledCount.toString()}
          icon={XCircle}
          trend={{ value: `${cancelledCount > 0 ? Math.round((cancelledCount / (totalToday || 1)) * 100) : 0}%`, isNegative: false }}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          title="Waiting List"
          value={waitingListCount.toString()}
          icon={Users}
          subtitle="Queue candidates"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </div>

      {/* Operational Signals Status Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between text-xs gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            Library open: 08:00–22:00
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Current time: <strong>14:32</strong></span>
        </div>
        <div className="flex items-center gap-5 text-slate-600 flex-wrap font-medium">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Reservation engine healthy
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            QR scanners online
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Auto allocation active
          </span>
          <span className="font-bold text-navy bg-slate-100 px-2.5 py-1 rounded-lg">Live occupancy: {liveOccupancyPct}%</span>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reservation ID, student, register number, seat..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Floors</option>
            <option value="Ground Floor">Ground Floor</option>
            <option value="Floor 1 - Quiet Zone">Floor 1</option>
            <option value="Floor 2 - Research Hub">Floor 2</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="checked-in">Checked In</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected (Admin)</option>
            <option value="cancelled">Cancelled (Student)</option>
          </select>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { 
              setSearch(''); 
              setStatusFilter('all'); 
              setFloorFilter('all'); 
              setSelectedDate('2026-07-31');
              setSelectedReservationId(null);
              toast.success('Reservation filters and search reset to default');
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Live Reservations Table View (Full Width) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-navy">Live reservations</h3>
            <p className="text-xs text-slate-500">{filteredReservations.length} reservations across all library floors</p>
          </div>
          <Tabs
            tabs={[
              { id: 'table', label: 'Table', icon: <List className="w-3.5 h-3.5" /> },
              { id: 'calendar', label: 'Calendar', icon: <CalendarIcon className="w-3.5 h-3.5" /> },
            ]}
            activeTab={reservationViewMode}
            onChange={(id) => setReservationViewMode(id as any)}
          />
        </div>

        {/* Render Active View: Table | Calendar */}
        {reservationViewMode === 'table' && (
          <div className="overflow-x-auto w-full">
            <Table
              columns={columns}
              data={filteredReservations}
              pageSize={8}
              selectedRowId={selectedReservationId || undefined}
              getRowId={(row) => row.id}
              onRowClick={(row) => setSelectedReservationId(row.id)}
            />
          </div>
        )}

        {(reservationViewMode as string) === 'calendar' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card space-y-6">
            {/* Top Date Jump Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-navy">Interactive Date Calendar</h4>
                  <p className="text-xs text-slate-500">Jump to any date to view reserved seats & schedule details</p>
                </div>
              </div>

              {/* Date Jump Control */}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500 pl-1">Jump to Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-navy focus:outline-none focus:border-brandBlue cursor-pointer"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate('2026-07-31')}
                  className="text-xs"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Date Details & Reservations Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-sm font-bold text-navy flex items-center gap-2">
                  <span>Reservations for {selectedDate}</span>
                  <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-brandBlue rounded-full font-semibold border border-blue-100">
                    {filteredReservations.filter(r => r.date === selectedDate).length} Bookings
                  </span>
                  {(search || floorFilter !== 'all' || statusFilter !== 'all') && (
                    <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                      Filters Active
                    </span>
                  )}
                </h4>
              </div>

              {/* Grid of Reservation Cards for Selected Date */}
              {filteredReservations.filter(r => r.date === selectedDate).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredReservations.filter(r => r.date === selectedDate).map((res) => (
                    <div
                      key={res.id}
                      onClick={() => setSelectedReservationId(res.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                        selectedReservationId === res.id ? 'border-brandBlue bg-blue-50/50 shadow-xs' : 'border-slate-200/80 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-brandBlue">{res.seatCode}</span>
                        <Badge
                          variant={
                            res.status === 'checked-in' ? 'checked-in' :
                            res.status === 'confirmed' ? 'primary' :
                            res.status === 'late' ? 'late' :
                            res.status === 'completed' ? 'completed' :
                            (res.status === 'cancelled' || res.status === 'rejected') ? 'danger' : 'neutral'
                          }
                          size="sm"
                        >
                          {res.status}
                        </Badge>
                      </div>
                      <div className="font-bold text-navy text-sm truncate">{res.studentName}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{res.startTime} - {res.endTime} ({res.durationHours}h)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 truncate">{res.floorName} - {res.zoneName}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No matching reservations found for {selectedDate}</p>
                  {(search || floorFilter !== 'all' || statusFilter !== 'all') && (
                    <p className="text-[11px] text-slate-400 mt-1">Try resetting search or filter options</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Reservation Detail Inspector Drawer */}
      {selectedRes && (
        <Drawer
          isOpen={!!selectedRes}
          onClose={() => setSelectedReservationId(null)}
          title={
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-navy text-xl">{selectedRes.id}</span>
              <Badge variant={selectedRes.status === 'checked-in' ? 'checked-in' : 'primary'} dot>
                {selectedRes.checkInStatus}
              </Badge>
            </div>
          }
          subtitle={`Complete reservation details for ${selectedRes.studentName}`}
          width="md"
        >
          <div className="space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-full bg-brandBlue text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                {selectedRes.studentName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-navy text-base truncate">{selectedRes.studentName}</div>
                <div className="text-xs text-slate-500 truncate">{selectedRes.department} • {selectedRes.academicYear}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedRes.studentEmail}</div>
              </div>
            </div>

            {/* Seat & Location Details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Seat & Location</span>
                <span className="font-bold text-navy text-lg">{selectedRes.seatCode}</span>
                <span className="text-xs text-slate-500 block truncate">{selectedRes.floorName} - {selectedRes.zoneName}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">
                  {selectedRes.status === 'checked-in' ? 'Remaining Time' : 'Session Status'}
                </span>
                <span className={`font-bold text-lg ${
                  selectedRes.status === 'checked-in' ? 'text-brandBlue' :
                  selectedRes.status === 'completed' ? 'text-purple-700' :
                  selectedRes.status === 'late' ? 'text-amber-700' :
                  selectedRes.status === 'confirmed' ? 'text-blue-700' :
                  selectedRes.status === 'no-show' ? 'text-slate-600' : 'text-red-600'
                }`}>
                  {
                    selectedRes.status === 'checked-in' ? '1h 46m' :
                    selectedRes.status === 'completed' ? 'Completed' :
                    selectedRes.status === 'late' ? 'Late Arrival' :
                    selectedRes.status === 'confirmed' ? 'Pending' :
                    selectedRes.status === 'no-show' ? 'No-Show' :
                    selectedRes.status === 'rejected' ? 'Rejected' : 'Cancelled'
                  }
                </span>
                <span className="text-xs text-slate-500 block">
                  {
                    selectedRes.status === 'checked-in' ? `Ends at ${selectedRes.endTime}` :
                    selectedRes.status === 'completed' ? `Ended at ${selectedRes.endTime}` :
                    selectedRes.status === 'late' ? '15m grace exceeded' :
                    selectedRes.status === 'confirmed' ? `Starts at ${selectedRes.startTime}` :
                    selectedRes.status === 'no-show' ? 'Expired after 15m' :
                    selectedRes.status === 'rejected' ? 'Rejected by Admin' : 'Cancelled by Student'
                  }
                </span>
              </div>
            </div>

            {/* Reservation Timeline */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">RESERVATION TIMELINE</h4>
              <div className="space-y-4 pl-2 border-l-2 border-slate-200 text-xs">
                {selectedRes.timeline.map((step, sIdx) => (
                  <div key={sIdx} className="relative pl-4">
                    <span className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${
                      step.status === 'done'
                        ? (selectedRes.status === 'rejected' || selectedRes.status === 'cancelled' ? 'bg-red-500' :
                           selectedRes.status === 'late' ? 'bg-amber-500' :
                           selectedRes.status === 'completed' ? 'bg-purple-500' : 'bg-emerald-500')
                        : 'bg-slate-300'
                    }`} />
                    <div className="font-bold text-navy text-sm">{step.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.timestamp}</div>
                    {step.detail && <div className="text-[11px] text-slate-400 mt-0.5">{step.detail}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Button Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => toast.info(`Notification sent to ${selectedRes.studentName}`)}
              >
                Notify Student
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Edit3 className="w-4 h-4" />}
                onClick={() => handleOpenEditModal(selectedRes)}
              >
                Edit Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                leftIcon={<QrIcon className="w-4 h-4" />}
                onClick={() => setShowQRModal(true)}
              >
                Generate QR
              </Button>

              <Button
                variant="danger"
                size="sm"
                leftIcon={<X className="w-4 h-4" />}
                onClick={() => handleRejectReservation(selectedRes.id)}
              >
                Reject
              </Button>

              {(selectedRes.status === 'confirmed' || selectedRes.status === 'checked-in') && (
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  className="col-span-2 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    cancelReservation(selectedRes.id);
                    setSelectedReservationId(null);
                    toast.success(`Reservation ${selectedRes.id} cancelled`);
                  }}
                >
                  Cancel Reservation
                </Button>
              )}
            </div>
          </div>
        </Drawer>
      )}

      {/* QR Code Inspection Modal */}
      <Modal
        isOpen={showQRModal && !!selectedRes}
        onClose={() => setShowQRModal(false)}
        title={`QR Code Verification - ${selectedRes?.id}`}
        subtitle={`Scan for instant turnstile check-in validation`}
        footer={
          <Button variant="primary" size="sm" onClick={() => setShowQRModal(false)}>
            Close QR Inspector
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
            <QRCode value={selectedRes?.qrCodePayload || 'NORTHSTAR-LIB'} size={180} />
          </div>
          <div className="text-center">
            <div className="font-mono text-base font-bold text-navy">{selectedRes?.seatCode} ({selectedRes?.floorName})</div>
            <div className="text-xs text-slate-500 mt-1">Student: {selectedRes?.studentName} ({selectedRes?.studentRegisterNo})</div>
          </div>
        </div>
      </Modal>

      {/* Create Reservation Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Seat Reservation"
        subtitle="Manually assign library seat to student"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateSubmit}>
              Confirm Reservation
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {/* Searchable Type-to-Filter Student Dropdown Combobox */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-semibold text-slate-700">
              Select Student *
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search student name or register no..."
                value={studentSearch}
                onFocus={() => setIsStudentDropdownOpen(true)}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setIsStudentDropdownOpen(true);
                }}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy font-medium focus:outline-none focus:border-brandBlue focus:bg-white transition-all cursor-text"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
            </div>

            {/* Auto-filtering Dropdown List */}
            {isStudentDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsStudentDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto z-20 divide-y divide-slate-100">
                  {students
                    .filter((s) =>
                      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.registerNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
                      s.department.toLowerCase().includes(studentSearch.toLowerCase())
                    )
                    .map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          setNewRes({ ...newRes, studentId: student.id });
                          setStudentSearch(`${student.name} (${student.registerNo})`);
                          setIsStudentDropdownOpen(false);
                        }}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors hover:bg-blue-50/70 ${
                          newRes.studentId === student.id ? 'bg-blue-50 font-bold text-brandBlue' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brandBlue text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-navy text-xs">{student.name}</div>
                            <div className="text-[11px] text-slate-500">{student.registerNo} • {student.department}</div>
                          </div>
                        </div>
                        {newRes.studentId === student.id && (
                          <span className="text-[10px] font-bold text-brandBlue bg-blue-100 px-2 py-0.5 rounded-full">Selected</span>
                        )}
                      </div>
                    ))}
                  {students.filter((s) =>
                    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.registerNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
                    s.department.toLowerCase().includes(studentSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500 font-medium">
                      No matching students found
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Select Floor *"
              options={[
                { value: 'Ground Floor', label: 'Ground Floor' },
                { value: 'Floor 1 - Quiet Zone', label: 'Floor 1 - Quiet Zone' },
                { value: 'Floor 2 - Research Hub', label: 'Floor 2 - Research Hub' },
              ]}
              value={newRes.floorName}
              onChange={(e) => setNewRes({ ...newRes, floorName: e.target.value })}
            />

            <Input
              label="Seat Code *"
              value={newRes.seatCode}
              onChange={(e) => setNewRes({ ...newRes, seatCode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={newRes.startTime}
              onChange={(e) => setNewRes({ ...newRes, startTime: e.target.value })}
            />

            <Input
              label="End Time *"
              type="time"
              value={newRes.endTime}
              onChange={(e) => setNewRes({ ...newRes, endTime: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Reservation Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Reservation - ${editResData.id}`}
        subtitle="Modify reservation location, scheduled times, or status"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Floor *"
              options={[
                { value: 'Ground Floor', label: 'Ground Floor' },
                { value: 'Floor 1 - Quiet Zone', label: 'Floor 1 - Quiet Zone' },
                { value: 'Floor 2 - Research Hub', label: 'Floor 2 - Research Hub' },
              ]}
              value={editResData.floorName}
              onChange={(e) => setEditResData({ ...editResData, floorName: e.target.value })}
            />

            <Input
              label="Seat Code *"
              value={editResData.seatCode}
              onChange={(e) => setEditResData({ ...editResData, seatCode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={editResData.startTime}
              onChange={(e) => setEditResData({ ...editResData, startTime: e.target.value })}
            />

            <Input
              label="End Time *"
              type="time"
              value={editResData.endTime}
              onChange={(e) => setEditResData({ ...editResData, endTime: e.target.value })}
            />
          </div>

          <Select
            label="Reservation Status *"
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'checked-in', label: 'Checked-In' },
              { value: 'rejected', label: 'Rejected (Admin)' },
              { value: 'cancelled', label: 'Cancelled (Student)' },
            ]}
            value={editResData.status}
            onChange={(e) => setEditResData({ ...editResData, status: e.target.value as any })}
          />
        </form>
      </Modal>

      {/* Bulk Actions Batch Management Modal */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        title="Batch Reservation Management"
        subtitle={`Apply operation to ${filteredReservations.length} filtered reservations`}
        footer={
          <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="text-xs font-bold text-navy">Active Scope Filter</div>
            <div className="text-xs text-slate-500">
              {filteredReservations.length} total reservations match your active search and filter criteria.
            </div>
          </div>

          <div className="space-y-3">
            <div
              onClick={handleBulkCheckIn}
              className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-navy text-xs group-hover:text-emerald-700">Check-in All Pending Reservations</div>
                  <div className="text-[11px] text-slate-500 font-medium">Instantly mark all confirmed bookings as checked-in</div>
                </div>
              </div>
              <Badge variant="high" size="sm">
                {filteredReservations.filter(r => r.status === 'confirmed').length} Pending
              </Badge>
            </div>

            <div
              onClick={handleBulkReject}
              className="p-4 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-navy text-xs group-hover:text-red-700">Reject All Pending Reservations</div>
                  <div className="text-[11px] text-slate-500 font-medium">Batch reject pending student reservations</div>
                </div>
              </div>
              <Badge variant="danger" size="sm">
                {filteredReservations.filter(r => r.status === 'confirmed').length} Pending
              </Badge>
            </div>

            <div
              onClick={() => {
                handleExportCSV();
                setIsBulkModalOpen(false);
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-brandBlue flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-navy text-xs group-hover:text-brandBlue">Download CSV Report</div>
                  <div className="text-[11px] text-slate-500 font-medium">Export active filtered dataset to CSV spreadsheet</div>
                </div>
              </div>
              <Badge variant="primary" size="sm">
                CSV Export
              </Badge>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
