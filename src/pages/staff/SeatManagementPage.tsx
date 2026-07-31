import React, { useState, useEffect } from 'react';
import { useSeatStore } from '../../store/useSeatStore';
import type { SeatStatus, SeatType } from '../../types/seat';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Monitor,
  VolumeX,
  Users,
  Accessibility,
  SlidersHorizontal,
  Layers,
  CheckSquare,
  Square,
  FileText,
  Zap,
  Tv,
  Sun,
} from 'lucide-react';

export const SeatManagementPage: React.FC = () => {
  const {
    floors,
    seats,
    selectedFloorId,
    setSelectedFloorId,
    fetchData,
    updateSeatStatus,
    bulkUpdateSeatStatus,
  } = useSeatStore();

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<SeatType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<SeatStatus | 'ALL'>('ALL');
  const [noteModalSeatId, setNoteModalSeatId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [targetStatus, setTargetStatus] = useState<SeatStatus>('MAINTENANCE');

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const floorTabs = floors.map((f) => ({ id: f.id, label: `Floor ${f.floorNumber}` }));

  const currentFloorSeats = seats.filter((s) => s.floorId === selectedFloorId);

  const filteredSeats = currentFloorSeats.filter((s) => {
    if (typeFilter !== 'ALL' && s.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    return true;
  });

  const availableCount = currentFloorSeats.filter((s) => s.status === 'AVAILABLE').length;
  const occupiedCount = currentFloorSeats.filter((s) => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
  const maintenanceCount = currentFloorSeats.filter((s) => s.status === 'MAINTENANCE').length;
  const blockedCount = currentFloorSeats.filter((s) => s.status === 'BLOCKED').length;

  const toggleSelectSeat = (id: string) => {
    setSelectedSeatIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSeatIds.length === filteredSeats.length) setSelectedSeatIds([]);
    else setSelectedSeatIds(filteredSeats.map((s) => s.id));
  };

  const handleBulkStatusChange = async (status: SeatStatus) => {
    if (selectedSeatIds.length === 0) return;
    await bulkUpdateSeatStatus(selectedSeatIds, status);
    setSelectedSeatIds([]);
  };

  const openNoteModal = (seatId: string, status: SeatStatus) => {
    const seat = seats.find((s) => s.id === seatId);
    setNoteModalSeatId(seatId);
    setTargetStatus(status);
    setNoteText(seat?.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!noteModalSeatId) return;
    await updateSeatStatus(noteModalSeatId, targetStatus, noteText);
    setNoteModalSeatId(null);
  };

  const getSeatTypeIcon = (type: SeatType) => {
    switch (type) {
      case 'COMPUTER_DESK':
        return <Monitor className="w-4 h-4 text-blue-600" />;
      case 'SILENT_STUDY':
        return <VolumeX className="w-4 h-4 text-indigo-600" />;
      case 'GROUP_TABLE':
        return <Users className="w-4 h-4 text-emerald-600" />;
      case 'ACCESSIBLE':
        return <Accessibility className="w-4 h-4 text-teal-600" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      <PageHeader
        title="Physical Desk Management & Maintenance"
        subtitle="Control floor carrels, block damaged equipment, update maintenance logs, or execute batch status changes."
      />

      {/* Floor Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Desks</span>
          <p className="font-heading text-2xl font-extrabold text-emerald-600 mt-1">{availableCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-600 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Use / Reserved</span>
          <p className="font-heading text-2xl font-extrabold text-blue-600 mt-1">{occupiedCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-slate-400 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Under Maintenance</span>
          <p className="font-heading text-2xl font-extrabold text-slate-700 mt-1">{maintenanceCount}</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500 bg-white">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Blocked Desks</span>
          <p className="font-heading text-2xl font-extrabold text-rose-600 mt-1">{blockedCount}</p>
        </Card>
      </div>

      {/* Floor Selector and Category Filter Bar */}
      <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs tabs={floorTabs} activeTab={selectedFloorId} onChange={setSelectedFloorId} variant="pills" />

          {/* Quick Select All */}
          <button
            onClick={toggleSelectAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer self-start sm:self-auto"
          >
            {selectedSeatIds.length === filteredSeats.length ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>{selectedSeatIds.length === filteredSeats.length ? 'Deselect All' : 'Select All Filtered'}</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          {(['ALL', 'COMPUTER_DESK', 'SILENT_STUDY', 'GROUP_TABLE', 'ACCESSIBLE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                typeFilter === t ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <span>Status:</span>
          </div>
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BLOCKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === st ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Seats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {filteredSeats.map((seat) => {
          const isChecked = selectedSeatIds.includes(seat.id);

          const getStatusTopBar = (status: SeatStatus) => {
            switch (status) {
              case 'AVAILABLE':
                return 'bg-emerald-500';
              case 'RESERVED':
                return 'bg-blue-600';
              case 'OCCUPIED':
                return 'bg-amber-500';
              case 'BLOCKED':
                return 'bg-rose-500';
              case 'MAINTENANCE':
                return 'bg-slate-400';
              default:
                return 'bg-slate-300';
            }
          };

          const sanitizeNoteText = (notes?: string, seatNum?: string) => {
            if (!notes) return '';
            if (!seatNum) return notes;
            let cleaned = notes.replace(new RegExp(`Blocked\\s+${seatNum}`, 'gi'), 'Desk blocked by staff');
            cleaned = cleaned.replace(new RegExp(seatNum, 'gi'), '').trim();
            return cleaned || notes;
          };

          const cleanNote = (seat.status === 'MAINTENANCE' || seat.status === 'BLOCKED')
            ? sanitizeNoteText(seat.notes, seat.seatNumber)
            : '';

          return (
            <div
              key={seat.id}
              className={`flex flex-col justify-between h-full relative transition-all duration-300 rounded-2xl bg-white border shadow-2xs hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
                isChecked
                  ? 'ring-2 ring-blue-600 border-blue-500 bg-blue-50/10 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {/* Status Top Accent Bar */}
              <div className={`h-1.5 w-full ${getStatusTopBar(seat.status)}`} />

              {/* Card Body */}
              <div className="p-4.5 space-y-3.5">
                {/* Header Row: Checkbox, Seat ID, Type Icon & Status Badge */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectSeat(seat.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-extrabold text-lg text-slate-900 leading-none">{seat.seatNumber}</h4>
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                        {getSeatTypeIcon(seat.type)}
                      </div>
                    </div>
                  </div>
                  <Badge status={seat.status} size="sm" />
                </div>

                {/* Sub-Header Row: Desk Type & Carrel ID */}
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="capitalize font-bold text-slate-800 tracking-tight truncate">
                    {seat.type.replace('_', ' ').toLowerCase()}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 font-mono text-slate-600 border border-slate-200/70 shrink-0">
                    Carrel #{seat.id}
                  </span>
                </div>

                {/* Hardware Feature Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {seat.hasPowerOutlet && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-[11px] font-semibold text-slate-700 border border-slate-200/80">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Power
                    </span>
                  )}
                  {seat.hasMonitor && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-[11px] font-semibold text-slate-700 border border-slate-200/80">
                      <Tv className="w-3.5 h-3.5 text-blue-500" />
                      Monitor
                    </span>
                  )}
                  {seat.isNearWindow && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-[11px] font-semibold text-slate-700 border border-slate-200/80">
                      <Sun className="w-3.5 h-3.5 text-teal-500" />
                      Window
                    </span>
                  )}
                </div>

                {/* Note Field (Only rendered if note exists - empty state collapsed) */}
                {cleanNote ? (
                  <div
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2.5 truncate"
                    title={cleanNote}
                  >
                    <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate text-xs font-medium leading-relaxed">{cleanNote}</span>
                  </div>
                ) : null}
              </div>

              {/* Action Footer */}
              <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2">
                {seat.status === 'BLOCKED' || seat.status === 'MAINTENANCE' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openNoteModal(seat.id, 'MAINTENANCE')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-all cursor-pointer"
                    >
                      Edit Note
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSeatStatus(seat.id, 'AVAILABLE')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                      Restore Desk
                    </button>
                  </>
                ) : seat.status === 'AVAILABLE' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openNoteModal(seat.id, 'MAINTENANCE')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-all cursor-pointer"
                    >
                      Maintenance
                    </button>
                    <button
                      type="button"
                      onClick={() => openNoteModal(seat.id, 'BLOCKED')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                    >
                      Block Desk
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openNoteModal(seat.id, 'MAINTENANCE')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-all cursor-pointer"
                    >
                      Maintenance
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSeatStatus(seat.id, 'AVAILABLE')}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer"
                    >
                      Release Desk
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Sticky Batch Action Bar */}
      {selectedSeatIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <span className="text-xs font-bold font-mono text-teal-400">{selectedSeatIds.length} Desks Selected</span>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs"
              onClick={() => handleBulkStatusChange('AVAILABLE')}
            >
              Set Available
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold text-xs"
              onClick={() => handleBulkStatusChange('MAINTENANCE')}
            >
              Mark Maintenance
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="font-bold text-xs shadow-md"
              onClick={() => handleBulkStatusChange('BLOCKED')}
            >
              Block Selected
            </Button>
          </div>
        </div>
      )}

      {/* Maintenance Notes Modal */}
      {noteModalSeatId && (
        <Modal
          isOpen={!!noteModalSeatId}
          onClose={() => setNoteModalSeatId(null)}
          title={`Desk Status Log: Seat ${seats.find((s) => s.id === noteModalSeatId)?.seatNumber}`}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Updating desk status to <strong className="uppercase">{targetStatus}</strong>. Provide an optional maintenance note for desk staff records.
            </p>
            <Input
              label="Staff Inspection Notes / Reason"
              placeholder="e.g. Electrical outlet repair scheduled..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" size="md" onClick={() => setNoteModalSeatId(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" className="font-bold" onClick={handleSaveNotes}>
                Confirm Status Change
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
