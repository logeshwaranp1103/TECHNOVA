import React, { useState, useRef, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  Armchair, CheckCircle2, Users, Clock, ShieldAlert, Wrench, 
  Search, Plus, Grid, List, ZoomIn, ZoomOut, Lock, Unlock, ChevronLeft, ChevronRight, Plug, RotateCcw 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Seat, SeatStatus } from '../types';
import { useAppStore } from '../store/useAppStore';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const SeatManagementPage: React.FC = () => {
  const { 
    seats, 
    seatViewMode, 
    setSeatViewMode, 
    selectedSeatId, 
    setSelectedSeatId,
    updateSeatStatus,
    updateSeat,
    addSeat,
    floors,
    selectedFloorId
  } = useAppStore();

  const matchedFloor = floors.find(f => f.id === selectedFloorId);
  const [activeFloorTab, setActiveFloorTab] = useState(matchedFloor?.name || floors[0]?.name || 'Ground Floor');
  const [activeZoneSubfilter, setActiveZoneSubfilter] = useState('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (selectedFloorId) {
      const targetFloor = floors.find(f => f.id === selectedFloorId);
      if (targetFloor) {
        setActiveFloorTab(targetFloor.name);
      }
    }
  }, [selectedFloorId, floors]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.15, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.15, 0.75));
  const handleZoomReset = () => setZoomLevel(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSeatForm, setEditSeatForm] = useState<Partial<Seat>>({});
  const [animatingSeatId, setAnimatingSeatId] = useState<string | null>(null);

  const [newSeat, setNewSeat] = useState({
    code: 'G-99',
    floorId: floors[0]?.id || 'fl-0',
    floorNumber: 0,
    floorName: 'Ground Floor',
    zoneId: 'z-1',
    zoneName: 'Main Reading Hall',
    seatType: 'Standard Desk' as Seat['seatType'],
    amenities: ['Power Outlet', 'USB Charger'] as Seat['amenities'],
    isAccessible: true,
  });

  const selectedSeat = seats.find(s => s.id === selectedSeatId) || seats[0];

  // Dynamically resolve active floor name from existing floors
  const currentFloorName = floors.some(f => f.name === activeFloorTab) 
    ? activeFloorTab 
    : (floors[0]?.name || 'Ground Floor');

  // Filter seats for map grid display
  const currentFloorSeats = seats.filter(s => {
    const matchesFloor = s.floorName === currentFloorName;
    const matchesZone = activeZoneSubfilter === 'All' || s.zoneName.includes(activeZoneSubfilter);
    const matchesSearch = s.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesFloor && matchesZone && matchesSearch && matchesStatus;
  });

  // Pagination state for seat map (18 seats per page)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 18;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFloorTab, activeZoneSubfilter, search, statusFilter]);

  const totalSeatCount = currentFloorSeats.length;
  const totalPages = Math.max(1, Math.ceil(totalSeatCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = totalSeatCount > 0 ? (safeCurrentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, totalSeatCount);

  const paginatedSeats = currentFloorSeats.slice(startIndex, endIndex);

  const handleToggleBlock = (seatId: string, currentStatus: SeatStatus) => {
    setAnimatingSeatId(seatId);
    const nextStatus = currentStatus === 'blocked' ? 'available' : 'blocked';
    updateSeatStatus(seatId, nextStatus);
    toast.success(`Seat ${selectedSeat.code} status updated to ${nextStatus}`);

    setTimeout(() => {
      setAnimatingSeatId(null);
    }, 450);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOpenEditModal = () => {
    if (!selectedSeat) return;
    setEditSeatForm({
      code: selectedSeat.code,
      floorName: selectedSeat.floorName,
      zoneName: selectedSeat.zoneName,
      seatType: selectedSeat.seatType,
      status: selectedSeat.status,
      isAccessible: selectedSeat.isAccessible,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;
    updateSeat(selectedSeat.id, editSeatForm);
    toast.success(`Seat ${editSeatForm.code || selectedSeat.code} updated successfully`);
    setIsEditModalOpen(false);
  };

  const handleAddSeatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSeat({
      ...newSeat,
      status: 'available',
      row: 1,
      column: 1,
    });
    toast.success(`Seat ${newSeat.code} created`);
    setIsAddModalOpen(false);
  };

  const columns: ColumnDef<Seat>[] = [
    {
      accessorKey: 'code',
      header: 'SEAT CODE',
      cell: ({ row }) => (
        <span className="font-mono font-bold text-brandBlue text-sm">
          {row.original.code}
        </span>
      ),
    },
    {
      accessorKey: 'floorName',
      header: 'FLOOR',
      cell: ({ row }) => <span className="text-xs font-semibold text-slate-700">{row.original.floorName}</span>,
    },
    {
      accessorKey: 'zoneName',
      header: 'ZONE',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.zoneName}</span>,
    },
    {
      accessorKey: 'seatType',
      header: 'TYPE',
      cell: ({ row }) => <span className="text-xs text-slate-600 font-medium">{row.original.seatType}</span>,
    },
    {
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === 'available' ? 'high' :
            row.original.status === 'occupied' ? 'neutral' :
            row.original.status === 'reserved' ? 'primary' :
            row.original.status === 'blocked' ? 'danger' : 'warning'
          }
          dot
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'currentReservation',
      header: 'OCCUPANT',
      cell: ({ row }) => (
        row.original.currentReservation ? (
          <div>
            <div className="font-bold text-navy text-xs">{row.original.currentReservation.studentName}</div>
            <div className="text-[10px] text-slate-400">{row.original.currentReservation.department}</div>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Seat Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage, monitor, configure, and organize every library seat across all floors and zones.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Seat
          </Button>
        </div>
      </div>

      {/* KPI Counters Grid (Computed dynamically from store state) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          title="Total Seats"
          value={seats.length.toString()}
          icon={Armchair}
          trend={{ value: "+3.8%", isPositive: true }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Available"
          value={seats.filter(s => s.status === 'available').length.toString()}
          icon={CheckCircle2}
          subtitle={`${seats.length > 0 ? Math.round((seats.filter(s => s.status === 'available').length / seats.length) * 100) : 0}% available`}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Occupied"
          value={seats.filter(s => s.status === 'occupied').length.toString()}
          icon={Users}
          trend={{ value: "+8.2%", isPositive: true }}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Reserved"
          value={seats.filter(s => s.status === 'reserved').length.toString()}
          icon={Clock}
          subtitle="active reservations"
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Blocked"
          value={seats.filter(s => s.status === 'blocked').length.toString()}
          icon={ShieldAlert}
          subtitle="access review"
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          title="Maintenance"
          value={seats.filter(s => s.status === 'maintenance').length.toString()}
          icon={Wrench}
          subtitle="maintenance queue"
          iconBg="bg-slate-100"
          iconColor="text-slate-600"
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search seat code (e.g. G-14), zone, or occupant..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="reserved">Reserved</option>
            <option value="blocked">Blocked</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Floor Selection Tabs + Left/Right Scroll Arrows + Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          {/* Scroll Left Button */}
          <button
            onClick={handleScrollLeft}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Scroll floors left"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>

          {/* Scrollable Floor Tabs Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto scroll-smooth py-1 px-0.5 no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {floors.map((fl) => {
              const isSel = currentFloorName === fl.name;
              const floorSeatCount = seats.filter(s => s.floorName === fl.name).length;
              return (
                <button
                  key={fl.id}
                  onClick={() => setActiveFloorTab(fl.name)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSel
                      ? 'bg-brandBlue text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {fl.name} <span className="opacity-75 font-normal ml-1">{floorSeatCount} seats</span>
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            onClick={handleScrollRight}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center shrink-0 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Scroll floors right"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <Tabs
          tabs={[
            { id: 'grid', label: 'Grid', icon: <Grid className="w-3.5 h-3.5" /> },
            { id: 'table', label: 'Table', icon: <List className="w-3.5 h-3.5" /> },
          ]}
          activeTab={seatViewMode}
          onChange={(mode) => setSeatViewMode(mode as any)}
        />
      </div>

      {/* Zone Sub-filters */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs font-medium text-slate-600 pb-1">
        {['All', 'Reading Hall', 'Silent Zone', 'Discussion Zone', 'Research Area', 'Computer Lab'].map((sub) => (
          <button
            key={sub}
            onClick={() => setActiveZoneSubfilter(sub)}
            className={`px-3.5 py-1.5 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
              activeZoneSubfilter === sub
                ? 'bg-blue-50 text-brandBlue border-brandBlue/30 font-semibold'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {sub}
          </button>
        ))}
      </div>

      {/* Map View Grid vs Table View */}
      {seatViewMode === 'grid' ? (
        <Card
          title={
            <div className="flex items-center gap-3">
              <span>{currentFloorName} Seat Map</span>
              <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-brandBlue rounded-full font-bold border border-blue-100">
                {currentFloorSeats.length} Seats
              </span>
            </div>
          }
          subtitle={`Interactive floor plan • Zoom: ${Math.round(zoomLevel * 100)}% • Live status updates`}
          headerAction={
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.75}
                  className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 disabled:opacity-40 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-navy px-2 min-w-[45px] text-center select-none">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 1.5}
                  className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-600 disabled:opacity-40 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomReset}
                className="px-2.5 text-xs text-slate-600"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          }
        >
          {/* Visual Interactive Floor Layout Map */}
          <div className="p-6 sm:p-8 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-6 overflow-hidden">
            {/* Top Architectural Facade Header */}
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-widest bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                NORTH FACADE • NATURAL DAYLIGHT WINDOWS
              </span>
              <span className="hidden md:flex items-center gap-2 text-slate-400">
                <span>QUIET STUDY POLICY ACTIVE</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                EMERGENCY EXIT READY
              </span>
            </div>

            {/* Live Floor Stats Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-semibold text-center bg-white p-2.5 rounded-xl border border-slate-200">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                <span className="font-bold text-sm block">{currentFloorSeats.filter(s => s.status === 'available').length}</span>
                <span className="text-[10px] text-emerald-600 uppercase">Available</span>
              </div>
              <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <span className="font-bold text-sm block">{currentFloorSeats.filter(s => s.status === 'occupied').length}</span>
                <span className="text-[10px] text-slate-500 uppercase">Occupied</span>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-brandBlue">
                <span className="font-bold text-sm block">{currentFloorSeats.filter(s => s.status === 'reserved').length}</span>
                <span className="text-[10px] text-blue-600 uppercase">Reserved</span>
              </div>
              <div className="p-2 bg-red-50 rounded-lg text-red-700">
                <span className="font-bold text-sm block">{currentFloorSeats.filter(s => s.status === 'blocked').length}</span>
                <span className="text-[10px] text-red-600 uppercase">Blocked</span>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-amber-700 col-span-2 sm:col-span-1">
                <span className="font-bold text-sm block">{currentFloorSeats.filter(s => s.status === 'maintenance').length}</span>
                <span className="text-[10px] text-amber-600 uppercase">Maintenance</span>
              </div>
            </div>

            {/* Interactive Seat Units Grid with Dynamic Zoom */}
            <div
              className="transition-all duration-300 origin-top"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {paginatedSeats.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {paginatedSeats.map((seat) => {
                    const isSelected = seat.id === selectedSeat.id;
                    const hasPower = seat.amenities.includes('Power Outlet') || seat.amenities.includes('USB Charger');

                    const statusStyles: Record<SeatStatus, string> = {
                      available: 'bg-emerald-50/90 border-emerald-300/80 text-emerald-800 hover:bg-emerald-100/80 hover:border-emerald-400',
                      occupied: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200/80',
                      reserved: 'bg-blue-50 border-brandBlue/70 text-brandBlue hover:bg-blue-100/70',
                      blocked: 'bg-red-50/90 border-red-300 text-red-700 hover:bg-red-100',
                      maintenance: 'bg-amber-50/90 border-amber-300 text-amber-800 hover:bg-amber-100',
                    };

                    return (
                      <div
                        key={seat.id}
                        onClick={() => setSelectedSeatId(seat.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 select-none relative group ${
                          statusStyles[seat.status]
                        } ${isSelected ? 'ring-4 ring-brandBlue/40 border-brandBlue scale-[1.04] shadow-md z-10 bg-white' : 'hover:scale-[1.02] shadow-xs'}`}
                      >
                        {/* Top Seat Code & Indicator Dot */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-extrabold text-navy tracking-tight">{seat.code}</span>
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            seat.status === 'available' ? 'bg-emerald-500 animate-pulse' :
                            seat.status === 'reserved' ? 'bg-brandBlue' :
                            seat.status === 'occupied' ? 'bg-slate-400' :
                            seat.status === 'blocked' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                        </div>

                        {/* Middle Status & Icons */}
                        <div className="min-h-[30px] flex flex-col justify-center text-xs gap-0.5">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[11px] font-extrabold capitalize ${
                              seat.status === 'available' ? 'text-emerald-700' :
                              seat.status === 'reserved' ? 'text-brandBlue' :
                              seat.status === 'occupied' ? 'text-slate-700' :
                              seat.status === 'blocked' ? 'text-red-700' : 'text-amber-700'
                            }`}>
                              {seat.status}
                            </span>

                            {seat.isAccessible && (
                              <span className="text-[10px] font-bold px-1 py-0.5 bg-blue-100 text-brandBlue rounded shrink-0">
                                ♿
                              </span>
                            )}
                          </div>

                          {seat.currentReservation ? (
                            <div className="flex items-center gap-1 min-w-0 text-[10px] text-slate-600 font-medium">
                              <span className="truncate">{seat.currentReservation.studentName}</span>
                            </div>
                          ) : hasPower ? (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Plug className="w-3 h-3 text-slate-400" />
                              <span>Power</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Bottom Amenities & Type Pill */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span className="truncate max-w-[80px] font-medium">{seat.zoneName || seat.seatType}</span>
                          <span className="font-mono font-bold text-[10px] text-slate-400">R{seat.row}C{seat.column}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <Armchair className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <div className="font-bold text-navy text-sm">No seats found on {currentFloorName}</div>
                  <p className="text-xs text-slate-500 mt-1">Try selecting another floor or adding seats to this floor.</p>
                </div>
              )}
            </div>

            {/* Seat Map Record Counter & Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 bg-white p-4 rounded-xl border">
              <div className="text-xs text-slate-500 font-semibold">
                {totalSeatCount > 0 ? (
                  <span>
                    Showing <strong className="text-navy font-bold">{startIndex + 1}</strong> to <strong className="text-navy font-bold">{endIndex}</strong> of <strong className="text-navy font-bold">{totalSeatCount}</strong> seats on {currentFloorName}
                  </span>
                ) : (
                  <span>No seats found</span>
                )}
              </div>

              <div className="flex items-center gap-3 whitespace-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  leftIcon={<ChevronLeft className="w-3.5 h-3.5 text-slate-500" />}
                  className="px-4 rounded-xl text-xs font-bold whitespace-nowrap"
                >
                  Previous
                </Button>

                <span className="text-xs font-bold text-navy px-2 whitespace-nowrap">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={safeCurrentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  rightIcon={<ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                  className="px-4 rounded-xl text-xs font-bold whitespace-nowrap"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Table columns={columns} data={currentFloorSeats} pageSize={10} onRowClick={(s) => setSelectedSeatId(s.id)} />
      )}

      {/* Selected Seat Details Inspector */}
      {selectedSeat && (
        <Card
          title={
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">SELECTED SEAT</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-navy">{selectedSeat.code}</span>
                  <Badge variant={selectedSeat.status === 'reserved' ? 'primary' : 'high'} dot>
                    {selectedSeat.status}
                  </Badge>
                </div>
              </div>
            </div>
          }
          headerAction={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plug className="w-4 h-4 text-brandBlue" />}
                onClick={handleOpenEditModal}
                className="px-4 py-2 text-xs font-bold rounded-xl hover:border-brandBlue hover:bg-blue-50 transition-all"
              >
                Edit Seat
              </Button>
              <Button
                variant={selectedSeat.status === 'blocked' ? 'primary' : 'outline'}
                size="sm"
                leftIcon={
                  <span className={`inline-flex items-center justify-center transition-transform duration-300 transform ${
                    animatingSeatId === selectedSeat.id ? 'scale-125 -rotate-12' : 'group-hover:scale-110'
                  }`}>
                    {selectedSeat.status === 'blocked' ? (
                      <Unlock className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-red-500" />
                    )}
                  </span>
                }
                onClick={() => handleToggleBlock(selectedSeat.id, selectedSeat.status)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 transform active:scale-90 cursor-pointer shadow-xs border ${
                  animatingSeatId === selectedSeat.id
                    ? 'ring-4 ring-brandBlue/40 scale-105 bg-blue-50/80 border-brandBlue'
                    : 'hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                {selectedSeat.status === 'blocked' ? 'Unblock Seat' : 'Block Seat'}
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Location & Type info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Location</span>
                <span className="font-bold text-navy text-sm">{selectedSeat.floorName} • {selectedSeat.zoneName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Seat Type</span>
                <span className="font-bold text-navy text-sm">{selectedSeat.seatType}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Amenities</span>
                <span className="font-bold text-navy text-sm">{selectedSeat.amenities.join(' • ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-semibold">Accessibility</span>
                <span className="font-bold text-navy text-sm">{selectedSeat.isAccessible ? 'Wheelchair Accessible' : 'Standard access'}</span>
              </div>
            </div>

            {/* Current Reservation details */}
            {selectedSeat.currentReservation && (
              <div className="p-5 bg-blue-50/60 rounded-2xl border border-brandBlue/20 text-xs space-y-2.5">
                <div className="text-[11px] font-bold text-brandBlue uppercase tracking-wider">CURRENT RESERVATION</div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-navy text-base">{selectedSeat.currentReservation.studentName}</div>
                  <span className="text-slate-500 font-mono text-[11px]">Checked in 10:14</span>
                </div>
                <div className="text-slate-600 text-xs">
                  {selectedSeat.currentReservation.department} • Remaining time: <strong className="text-brandBlue font-bold">1h 46m</strong>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Floor Analytics Bottom Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Occupancy Rate</span>
          <div className="text-2xl font-bold text-navy mt-1">68%</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Available Seats</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">104</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Peak Usage</span>
          <div className="text-2xl font-bold text-navy mt-1">13:00–15:00</div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Top Zone</span>
          <div className="text-2xl font-bold text-brandBlue mt-1">Reading Hall</div>
        </div>
      </div>

      {/* Add Seat Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Seat Unit"
        subtitle="Configure physical seat unit properties and layout assignment"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddSeatSubmit}>
              Create Seat
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Seat Code *"
            value={newSeat.code}
            onChange={(e) => setNewSeat({ ...newSeat, code: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assigned Floor *"
              options={floors.map(f => ({ value: f.id, label: f.name }))}
              value={newSeat.floorId}
              onChange={(e) => {
                const fl = floors.find(f => f.id === e.target.value);
                setNewSeat({ ...newSeat, floorId: e.target.value, floorName: fl?.name || 'Ground Floor' });
              }}
            />

            <Select
              label="Seat Type *"
              options={[
                { value: 'Standard Desk', label: 'Standard Desk' },
                { value: 'Silent Box', label: 'Silent Box' },
                { value: 'Group Pod', label: 'Group Pod' },
                { value: 'Computer Station', label: 'Computer Station' },
                { value: 'Window Bench', label: 'Window Bench' },
              ]}
              value={newSeat.seatType}
              onChange={(e) => setNewSeat({ ...newSeat, seatType: e.target.value as any })}
            />
          </div>
        </form>
      </Modal>

      {/* Edit Seat Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Seat ${selectedSeat?.code || ''}`}
        subtitle="Update physical properties, status, and zone assignment"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleEditSeatSubmit}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSeatSubmit} className="space-y-4">
          <Input
            label="Seat Code *"
            value={editSeatForm.code || ''}
            onChange={(e) => setEditSeatForm({ ...editSeatForm, code: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assigned Floor *"
              options={floors.map(f => ({ value: f.name, label: f.name }))}
              value={editSeatForm.floorName || ''}
              onChange={(e) => setEditSeatForm({ ...editSeatForm, floorName: e.target.value })}
            />

            <Select
              label="Zone Name *"
              options={[
                { value: 'Main Reading Hall', label: 'Main Reading Hall' },
                { value: 'Quiet Study Zone', label: 'Quiet Study Zone' },
                { value: 'Research Area', label: 'Research Area' },
                { value: 'Computer Lab', label: 'Computer Lab' },
                { value: 'Discussion Zone', label: 'Discussion Zone' },
              ]}
              value={editSeatForm.zoneName || ''}
              onChange={(e) => setEditSeatForm({ ...editSeatForm, zoneName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Seat Type *"
              options={[
                { value: 'Standard Desk', label: 'Standard Desk' },
                { value: 'Silent Box', label: 'Silent Box' },
                { value: 'Group Pod', label: 'Group Pod' },
                { value: 'Computer Station', label: 'Computer Station' },
                { value: 'Window Bench', label: 'Window Bench' },
              ]}
              value={editSeatForm.seatType || 'Standard Desk'}
              onChange={(e) => setEditSeatForm({ ...editSeatForm, seatType: e.target.value as any })}
            />

            <Select
              label="Status *"
              options={[
                { value: 'available', label: 'Available' },
                { value: 'occupied', label: 'Occupied' },
                { value: 'reserved', label: 'Reserved' },
                { value: 'blocked', label: 'Blocked' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
              value={editSeatForm.status || 'available'}
              onChange={(e) => setEditSeatForm({ ...editSeatForm, status: e.target.value as SeatStatus })}
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-accessible"
              checked={!!editSeatForm.isAccessible}
              onChange={(e) => setEditSeatForm({ ...editSeatForm, isAccessible: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-brandBlue focus:ring-brandBlue/50 cursor-pointer"
            />
            <label htmlFor="edit-accessible" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Wheelchair Accessible Seat
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
