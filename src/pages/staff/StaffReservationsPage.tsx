import React, { useEffect, useState } from 'react';
import { useReservationStore } from '../../store/useReservationStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Reservation } from '../../types/reservation';
import { formatDate, formatTime } from '../../utils/dateUtils';
import {
  UserCheck,
  UserX,
  XCircle,
  Eye,
  Download,
  Calendar,
  Layers,
  QrCode,
  LogOut as LogOutIcon,
} from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

export const StaffReservationsPage: React.FC = () => {
  const {
    reservations,
    fetchReservations,
    cancelReservation,
    markNoShow,
    checkInReservation,
    checkOutReservation,
  } = useReservationStore();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedResId, setSelectedResId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'CANCEL' | 'NOSHOW' | null>(null);
  const [detailRes, setDetailRes] = useState<Reservation | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const handleConfirmAction = async () => {
    if (!selectedResId || !actionType) return;
    if (actionType === 'CANCEL') await cancelReservation(selectedResId, 'Cancelled by Staff Desk');
    else if (actionType === 'NOSHOW') await markNoShow(selectedResId);
    setSelectedResId(null);
    setActionType(null);
  };

  const handleExportCSV = () => {
    const headers = ['Booking Code,Student Name,College ID,Seat Number,Floor,Date,Start Time,End Time,Status\n'];
    const rows = reservations.map(
      (r) => `${r.bookingCode},"${r.userName}",${r.userCollegeId},${r.seatNumber},"${r.floorName.split('-')[0].trim()}",${r.date},${r.startTime},${r.endTime},${r.status}`
    );
    const blob = new Blob([...headers, rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SeatSync_Reservations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter reservations
  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  const totalCount = reservations.length;
  const checkedInCount = reservations.filter((r) => r.status === 'CHECKED_IN').length;
  const upcomingCount = reservations.filter((r) => r.status === 'UPCOMING').length;
  const noShowCount = reservations.filter((r) => r.status === 'NO_SHOW').length;

  const columns: Column<Reservation>[] = [
    {
      key: 'bookingCode',
      header: 'Booking Code',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
            {r.bookingCode}
          </span>
        </div>
      ),
    },
    {
      key: 'userName',
      header: 'Student Info',
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.userName} size="sm" />
          <div>
            <p className="font-bold text-slate-900 text-xs">{r.userName}</p>
            <p className="text-[11px] font-mono text-slate-500">{r.userCollegeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'seatNumber',
      header: 'Seat / Location',
      sortable: true,
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 font-extrabold text-blue-700 text-xs">
            <Layers className="w-3.5 h-3.5" />
            <span>Seat {r.seatNumber}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">
            {r.floorName.split('-')[0].trim()}
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & Slot',
      sortable: true,
      render: (r) => (
        <div>
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDate(r.date)}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 block">
            {formatTime(r.startTime)} - {formatTime(r.endTime)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <Badge status={r.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg"
            title="View Details"
            onClick={() => setDetailRes(r)}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {r.status === 'UPCOMING' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-emerald-700 hover:bg-emerald-50 font-semibold"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => checkInReservation(r.id)}
              >
                Check In
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:bg-rose-50"
                title="Cancel Reservation"
                onClick={() => {
                  setSelectedResId(r.id);
                  setActionType('CANCEL');
                }}
              >
                <XCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-amber-700 hover:bg-amber-50"
                title="Mark No-Show"
                onClick={() => {
                  setSelectedResId(r.id);
                  setActionType('NOSHOW');
                }}
              >
                <UserX className="w-4 h-4" />
              </Button>
            </>
          )}

          {r.status === 'CHECKED_IN' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:bg-blue-50 font-semibold"
              leftIcon={<LogOutIcon className="w-3.5 h-3.5" />}
              onClick={() => checkOutReservation(r.id)}
            >
              Check Out
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filterTabs = [
    { id: 'ALL', label: 'All Bookings', count: totalCount },
    { id: 'UPCOMING', label: 'Upcoming', count: upcomingCount },
    { id: 'CHECKED_IN', label: 'Checked In', count: checkedInCount },
    { id: 'NO_SHOW', label: 'No Shows', count: noShowCount },
    { id: 'COMPLETED', label: 'Completed', count: reservations.filter((r) => r.status === 'COMPLETED').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Student Reservations & Attendance Deck"
        subtitle="Comprehensive live log of student carrel reservations, check-ins, and desk releases across floors."
        action={
          <Button
            variant="outline"
            size="sm"
            className="font-semibold shadow-2xs"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export CSV Log
          </Button>
        }
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-blue-600 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
          <p className="font-heading text-2xl font-extrabold text-slate-900 mt-1">{totalCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Checked-in</span>
          <p className="font-heading text-2xl font-extrabold text-emerald-600 mt-1">{checkedInCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Awaiting Check-in</span>
          <p className="font-heading text-2xl font-extrabold text-amber-600 mt-1">{upcomingCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue No-Shows</span>
          <p className="font-heading text-2xl font-extrabold text-rose-600 mt-1">{noShowCount}</p>
        </Card>
      </div>

      {/* Status Filter Tab Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredReservations}
        searchPlaceholder="Search by Student ID, Name, Seat, or Booking Code..."
        searchField={(r) => `${r.bookingCode} ${r.userName} ${r.userCollegeId} ${r.seatNumber} ${r.status} ${r.floorName}`}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!selectedResId}
        onClose={() => setSelectedResId(null)}
        onConfirm={handleConfirmAction}
        title={actionType === 'CANCEL' ? 'Cancel Reservation' : 'Mark as No-Show'}
        message="This action will release the assigned study carrel immediately and update student attendance metrics."
        isDestructive={actionType === 'CANCEL'}
      />

      {/* Reservation Details Modal */}
      {detailRes && (
        <Modal
          isOpen={!!detailRes}
          onClose={() => setDetailRes(null)}
          title={`Booking Pass ${detailRes.bookingCode}`}
          size="md"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <Avatar name={detailRes.userName} size="md" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{detailRes.userName}</h4>
                  <p className="text-xs font-mono text-slate-500">{detailRes.userCollegeId}</p>
                </div>
              </div>
              <Badge status={detailRes.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Assigned Seat</span>
                <span className="font-bold text-blue-700 text-sm">Seat {detailRes.seatNumber}</span>
                <span className="text-slate-500 block truncate">{detailRes.floorName}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium block uppercase text-[10px]">Reservation Slot</span>
                <span className="font-bold text-slate-800 text-xs block">{formatDate(detailRes.date)}</span>
                <span className="text-slate-600 font-mono block">
                  {formatTime(detailRes.startTime)} - {formatTime(detailRes.endTime)}
                </span>
              </div>
            </div>

            {/* QR Code Pass Preview Data */}
            <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-2 text-center">
              <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white text-slate-950 mb-1">
                <QrCode className="w-12 h-12" />
              </div>
              <p className="text-xs font-mono text-slate-300 select-all">{detailRes.qrCodeData}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Digital Optical Pass ID</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="md" onClick={() => setDetailRes(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
