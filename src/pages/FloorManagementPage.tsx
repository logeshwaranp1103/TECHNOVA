import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const FloorManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { floors, selectedFloorId, setSelectedFloorId, addFloor, updateFloor, deleteFloor } = useAppStore();
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);

  // Scroll to top whenever navigating back to Floors page
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, []);

  const selectedFloor = floors.find(f => f.id === selectedFloorId);

  const handleDeleteFloor = (floorId: string, floorName: string) => {
    deleteFloor(floorId);
    setSelectedFloorId(null);
    toast.error(`Removed ${floorName} and all associated seats from system`);
  };

  // Edit Floor State
  const [isEditFloorOpen, setIsEditFloorOpen] = useState(false);
  const [editFloorData, setEditFloorData] = useState<{
    id: string;
    name: string;
    buildingWing: string;
    supervisorName: string;
    totalSeats: number;
    status: 'open' | 'restricted' | 'closed';
  }>({
    id: '',
    name: '',
    buildingWing: '',
    supervisorName: '',
    totalSeats: 0,
    status: 'open',
  });

  const handleOpenEditFloorModal = (floor: typeof floors[0]) => {
    setEditFloorData({
      id: floor.id,
      name: floor.name,
      buildingWing: floor.buildingWing,
      supervisorName: floor.supervisorName,
      totalSeats: floor.totalSeats,
      status: floor.status as any,
    });
    setIsEditFloorOpen(true);
  };

  const handleSaveFloorEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFloor(editFloorData.id, {
      name: editFloorData.name,
      buildingWing: editFloorData.buildingWing,
      supervisorName: editFloorData.supervisorName,
      totalSeats: editFloorData.totalSeats,
      status: editFloorData.status as any,
    });
    toast.success(`${editFloorData.name} updated successfully`);
    setIsEditFloorOpen(false);
  };

  const [newFloor, setNewFloor] = useState({
    number: floors.length,
    name: '',
    buildingWing: '',
    totalSeats: '' as any,
    supervisorName: '',
  });

  const handleOpenAddFloorModal = () => {
    setNewFloor({
      number: floors.length,
      name: '',
      buildingWing: '',
      totalSeats: '' as any,
      supervisorName: '',
    });
    setIsAddFloorOpen(true);
  };

  const handleAddFloorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const capacity = Number(newFloor.totalSeats) || 250;
    const floorName = newFloor.name.trim() || `Floor ${floors.length + 1}`;
    const wing = newFloor.buildingWing.trim() || 'North Wing';
    const supervisor = newFloor.supervisorName.trim() || 'Unassigned';

    addFloor({
      number: floors.length,
      name: floorName,
      buildingWing: wing,
      totalSeats: capacity,
      supervisorName: supervisor,
      occupiedSeats: 0,
      reservedSeats: 0,
      availableSeats: capacity,
      blockedSeats: 0,
      maintenanceSeats: 0,
      totalZonesCount: 3,
      status: 'open',
    });
    toast.success(`Floor added: ${floorName}`);
    setIsAddFloorOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Floor Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Interactive overview of library floors, occupancy rates, zone breakdowns, and floor supervisor assignments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddFloorModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Floor
          </Button>
        </div>
      </div>

      {/* Floor Cards Grid (24px gap) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {floors.map((fl) => {
          const occPct = Math.round((fl.occupiedSeats / fl.totalSeats) * 100);

          return (
            <div
              key={fl.id}
              onClick={() => setSelectedFloorId(fl.id)}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between mb-3 gap-2">
                  <span className="text-[10px] font-bold font-mono text-brandBlue uppercase px-2.5 py-1 bg-blue-50 rounded-md shrink-0">
                    {fl.buildingWing}
                  </span>
                  <Badge variant={fl.status === 'open' ? 'high' : 'warning'} dot>
                    {fl.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-navy truncate">{fl.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Supervisor: <strong className="text-slate-700 font-semibold">{fl.supervisorName}</strong></p>
              </div>

              {/* Occupancy Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Occupancy Rate</span>
                  <span className="text-navy">{occPct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occPct > 85 ? 'bg-errorRed' : occPct > 60 ? 'bg-warningOrange' : 'bg-successGreen'
                    }`}
                    style={{ width: `${occPct}%` }}
                  />
                </div>
              </div>

              {/* Breakdown Pills */}
              <div className="grid grid-cols-3 gap-2 text-[11px] text-center pt-3 border-t border-slate-100">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <span className="block font-bold text-emerald-700 text-sm">{fl.availableSeats}</span>
                  <span className="text-emerald-600 font-medium text-[10px]">Available</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-xl">
                  <span className="block font-bold text-brandBlue text-sm">{fl.occupiedSeats}</span>
                  <span className="text-blue-600 font-medium text-[10px]">Occupied</span>
                </div>
                <div className="p-2 bg-slate-100 rounded-xl">
                  <span className="block font-bold text-slate-700 text-sm">{fl.totalSeats}</span>
                  <span className="text-slate-500 font-medium text-[10px]">Total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Floor Modal */}
      <Modal
        isOpen={isAddFloorOpen}
        onClose={() => setIsAddFloorOpen(false)}
        title="Add New Floor"
        subtitle="Expand library physical capacity infrastructure"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddFloorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddFloorSubmit}>
              Create Floor
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Floor Name *"
            placeholder="e.g. Floor 4 - Graduate Commons"
            value={newFloor.name}
            onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
          />

          <Input
            label="Building Wing / Facade *"
            placeholder="e.g. North Wing, East Atrium"
            value={newFloor.buildingWing}
            onChange={(e) => setNewFloor({ ...newFloor, buildingWing: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Capacity (Seats) *"
              type="number"
              placeholder="e.g. 250"
              value={newFloor.totalSeats}
              onChange={(e) => setNewFloor({ ...newFloor, totalSeats: e.target.value as any })}
            />

            <Input
              label="Supervisor Name"
              placeholder="e.g. David Chen"
              value={newFloor.supervisorName}
              onChange={(e) => setNewFloor({ ...newFloor, supervisorName: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Floor Information Inspector Drawer */}
      {selectedFloor && (
        <Drawer
          isOpen={!!selectedFloor}
          onClose={() => setSelectedFloorId(null)}
          title={
            <div className="flex items-center gap-3">
              <span className="font-bold text-navy text-xl">{selectedFloor.name}</span>
              <Badge variant={selectedFloor.status === 'open' ? 'high' : 'warning'} dot>
                {selectedFloor.status}
              </Badge>
            </div>
          }
          subtitle={`${selectedFloor.buildingWing} • Floor #${selectedFloor.number}`}
          width="md"
        >
          <div className="space-y-6">
            {/* Supervisor Info Card */}
            <div className="flex items-center gap-3.5 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="w-11 h-11 rounded-full bg-brandBlue text-white font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                {selectedFloor.supervisorName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">FLOOR SUPERVISOR</div>
                <div className="font-bold text-navy text-base truncate">{selectedFloor.supervisorName}</div>
                <div className="text-xs text-slate-500">Responsible for floor operations & seat allocation</div>
              </div>
            </div>

            {/* Occupancy Rate Bar & Stat Grid */}
            <div className="space-y-3 p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Live Floor Occupancy Rate</span>
                <span className="text-brandBlue text-base font-extrabold">
                  {Math.round((selectedFloor.occupiedSeats / selectedFloor.totalSeats) * 100)}%
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (selectedFloor.occupiedSeats / selectedFloor.totalSeats) > 0.85 ? 'bg-errorRed' :
                    (selectedFloor.occupiedSeats / selectedFloor.totalSeats) > 0.6 ? 'bg-warningOrange' : 'bg-successGreen'
                  }`}
                  style={{ width: `${Math.round((selectedFloor.occupiedSeats / selectedFloor.totalSeats) * 100)}%` }}
                />
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                  <span className="text-emerald-700 font-bold block text-sm">{selectedFloor.availableSeats} Seats</span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Available for Booking</span>
                </div>
                <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100">
                  <span className="text-brandBlue font-bold block text-sm">{selectedFloor.occupiedSeats} Seats</span>
                  <span className="text-[11px] text-blue-600 font-semibold">Currently Occupied</span>
                </div>
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100">
                  <span className="text-amber-700 font-bold block text-sm">{selectedFloor.reservedSeats} Seats</span>
                  <span className="text-[11px] text-amber-600 font-semibold">Reserved (Upcoming)</span>
                </div>
                <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                  <span className="text-slate-700 font-bold block text-sm">{selectedFloor.maintenanceSeats + selectedFloor.blockedSeats} Seats</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Blocked / Maintenance</span>
                </div>
              </div>
            </div>

            {/* Floor Facilities & Infrastructure Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">FLOOR INFRASTRUCTURE</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="font-bold text-navy text-xs">Active Study Zones</div>
                  <div className="text-slate-500 mt-0.5">{selectedFloor.totalZonesCount} Configured Zones</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="font-bold text-navy text-xs">Building Facade</div>
                  <div className="text-slate-500 mt-0.5">{selectedFloor.buildingWing}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditFloorModal(selectedFloor)}
                >
                  Edit Floor
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setSelectedFloorId(selectedFloor.id);
                    navigate('/seats');
                  }}
                >
                  View Floor Map
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 font-semibold"
                onClick={() => handleDeleteFloor(selectedFloor.id, selectedFloor.name)}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Remove Floor & Associated Seats
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Edit Floor Modal */}
      <Modal
        isOpen={isEditFloorOpen}
        onClose={() => setIsEditFloorOpen(false)}
        title={`Edit Floor - ${editFloorData.name}`}
        subtitle="Update floor details, capacity, and supervisor"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditFloorOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveFloorEdit}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveFloorEdit} className="space-y-4">
          <Input
            label="Floor Name *"
            value={editFloorData.name}
            onChange={(e) => setEditFloorData({ ...editFloorData, name: e.target.value })}
          />

          <Input
            label="Building Wing / Facade *"
            value={editFloorData.buildingWing}
            onChange={(e) => setEditFloorData({ ...editFloorData, buildingWing: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Capacity (Seats) *"
              type="number"
              value={editFloorData.totalSeats}
              onChange={(e) => setEditFloorData({ ...editFloorData, totalSeats: Number(e.target.value) })}
            />

            <Input
              label="Supervisor Name *"
              value={editFloorData.supervisorName}
              onChange={(e) => setEditFloorData({ ...editFloorData, supervisorName: e.target.value })}
            />
          </div>

          <Select
            label="Floor Status *"
            options={[
              { value: 'open', label: 'Open' },
              { value: 'restricted', label: 'Restricted' },
              { value: 'closed', label: 'Closed / Maintenance' },
            ]}
            value={editFloorData.status}
            onChange={(e) => setEditFloorData({ ...editFloorData, status: e.target.value as any })}
          />
        </form>
      </Modal>
    </div>
  );
};
