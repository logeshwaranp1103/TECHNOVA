import React, { useState, useEffect } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  UserCheck, ShieldCheck, Clock, UserPlus, Search, 
  Activity, QrCode, CheckCircle, Shield, Eye, RotateCcw, Edit3, User, AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import type { LibraryStaff } from '../types';
import { useAppStore } from '../store/useAppStore';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const StaffManagementPage: React.FC = () => {
  const { staff, inviteStaff, selectedStaffId, setSelectedStaffId, updateStaffRole, updateStaff, floors } = useAppStore();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const selectedStaff = staff.find(s => s.id === selectedStaffId) || staff[0];

  const [editStaffForm, setEditStaffForm] = useState<Partial<LibraryStaff>>({});

  useEffect(() => {
    if (selectedStaff) {
      setEditStaffForm({
        name: selectedStaff.name,
        role: selectedStaff.role,
        assignedFloor: selectedStaff.assignedFloor,
        shiftHours: selectedStaff.shiftHours,
        email: selectedStaff.email,
        phone: selectedStaff.phone,
        status: selectedStaff.status,
      });
    }
  }, [selectedStaffId, selectedStaff]);

  const handleSaveStaffProfile = () => {
    if (!selectedStaff) return;
    updateStaff(selectedStaff.id, editStaffForm);
    toast.success(`Staff profile for ${editStaffForm.name || selectedStaff.name} saved successfully`);
  };

  const handleToggleStaffRestrict = () => {
    if (!selectedStaff) return;
    const isCurrentlyRestricted = selectedStaff.status === 'restricted' || selectedStaff.status === 'offline';
    const nextStatus: LibraryStaff['status'] = isCurrentlyRestricted ? 'available' : 'restricted';
    updateStaff(selectedStaff.id, { status: nextStatus });
    setEditStaffForm(prev => ({ ...prev, status: nextStatus }));
    toast.success(`Staff access status updated to ${nextStatus === 'available' ? 'Available' : 'Restricted'}`);
  };

  const [newStaff, setNewStaff] = useState({
    employeeId: `LIB-10${Math.floor(10 + Math.random() * 89)}`,
    name: '',
    email: '',
    phone: '',
    role: 'Floor Supervisor' as LibraryStaff['role'],
    assignedFloor: 'Floor 1',
    shiftHours: '08:00 - 16:00',
    permissionsCount: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  });

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.employeeId.toLowerCase().includes(search.toLowerCase()) ||
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) {
      toast.error('Please enter name and email');
      return;
    }
    inviteStaff(newStaff);
    toast.success(`Invitation sent to ${newStaff.name}`);
    setIsInviteModalOpen(false);
  };

  const columns: ColumnDef<LibraryStaff>[] = [
    {
      accessorKey: 'name',
      header: 'Staff Profile',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-navy truncate max-w-[160px]">{row.original.name}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'employeeId',
      header: 'Employee ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-600">
          {row.original.employeeId}
        </span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <span className="text-xs font-bold text-brandBlue">{row.original.role}</span>,
    },
    {
      accessorKey: 'assignedFloor',
      header: 'Floor',
      cell: ({ row }) => <span className="text-xs text-slate-700 font-medium">{row.original.assignedFloor}</span>,
    },
    {
      accessorKey: 'shiftHours',
      header: 'Shift',
      cell: ({ row }) => <span className="text-xs text-slate-600 font-mono">{row.original.shiftHours}</span>,
    },
    {
      accessorKey: 'lastActive',
      header: 'Last Login',
      cell: ({ row }) => <span className="text-xs text-slate-500">{row.original.lastActive}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isAvailable = status === 'available' || status === 'online';
        const isRestricted = status === 'restricted' || status === 'offline';
        const displayLabel = isAvailable ? 'available' : (isRestricted ? 'restricted' : 'on-leave');

        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
            isAvailable
              ? 'bg-emerald-50/90 text-emerald-700 border-emerald-300/80'
              : isRestricted
              ? 'bg-red-50/90 text-red-700 border-red-200'
              : 'bg-amber-50/90 text-amber-700 border-amber-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isAvailable ? 'bg-emerald-500' :
              isRestricted ? 'bg-red-500' : 'bg-amber-500'
            }`} />
            <span className="capitalize">{displayLabel}</span>
          </span>
        );
      },
    },
    {
      accessorKey: 'permissionsCount',
      header: 'Permissions',
      cell: ({ row }) => (
        <span className="px-2.5 py-1 rounded bg-blue-50 text-brandBlue text-xs font-semibold">
          {row.original.role === 'Library Manager' ? 'Administrator' : 'QR Scanner'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedStaffId(row.original.id);
              setIsDrawerOpen(true);
            }}
          >
            <Eye className="w-4 h-4 text-slate-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Library Staff Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage library staff accounts, roles, permissions, and operational activities.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInviteModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Invite Staff
          </Button>
        </div>
      </div>

      {/* KPI Counters (24px gap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Staff"
          value="126"
          icon={UserCheck}
          trend={{ value: "+5.5%", isPositive: true, label: "this quarter" }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Currently Active"
          value="98"
          icon={Activity}
          trend={{ value: "77.8%", isPositive: true, label: "on floor duty" }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="On Leave"
          value="7"
          icon={Clock}
          trend={{ value: "This week", isPositive: false }}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Staff Online"
          value="54"
          icon={ShieldCheck}
          trend={{ value: "+11 live", isPositive: true }}
          iconBg="bg-teal-50"
          iconColor="text-tealAccent-600"
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by staff name, employee ID, email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Roles</option>
            <option value="Library Manager">Library Manager</option>
            <option value="Floor Supervisor">Floor Supervisor</option>
            <option value="Reservation Officer">Reservation Officer</option>
            <option value="Support Staff">Support Staff</option>
          </select>
        </div>
      </div>

      {/* Staff Directory Table */}
      <Table
        columns={columns}
        data={filteredStaff}
        pageSize={8}
        selectedRowId={selectedStaffId || undefined}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          setSelectedStaffId(row.id);
          setIsDrawerOpen(true);
        }}
      />

      {/* Selected Staff Details Drawer */}
      <Drawer
        isOpen={isDrawerOpen && !!selectedStaff}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedStaff?.name || 'Staff Details'}
        subtitle={`Employee ID: ${selectedStaff?.employeeId || ''}`}
        width="lg"
        footer={
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => toast.info(`Password reset link sent to ${selectedStaff.email}`)}
              className="text-xs px-2"
            >
              Reset Pass
            </Button>

            <Button
              variant={selectedStaff?.status === 'restricted' ? 'primary' : 'danger'}
              size="sm"
              leftIcon={<AlertTriangle className="w-4 h-4" />}
              onClick={handleToggleStaffRestrict}
              className="text-xs px-2"
            >
              {selectedStaff?.status === 'restricted' ? 'Unrestrict' : 'Restrict'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit3 className="w-4 h-4" />}
              onClick={handleSaveStaffProfile}
              className="text-xs px-2 cursor-pointer"
            >
              Save Profile
            </Button>
          </div>
        }
      >
        {selectedStaff && (
          <div className="space-y-6">
            {/* Header Avatar Card */}
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="w-16 h-16 rounded-full bg-brandBlue/10 border-2 border-brandBlue/30 flex items-center justify-center shadow-sm shrink-0">
                <User className="w-8 h-8 text-brandBlue" />
              </div>
              <div className="min-w-0 space-y-1 flex-1">
                <Input
                  label="Staff Full Name"
                  value={editStaffForm.name || ''}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-xs text-slate-500">{selectedStaff.employeeId}</span>
                  {(() => {
                    const isAvailable = selectedStaff.status === 'available' || selectedStaff.status === 'online';
                    const isRestricted = selectedStaff.status === 'restricted' || selectedStaff.status === 'offline';
                    const label = isAvailable ? 'available' : (isRestricted ? 'restricted' : 'on-leave');

                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : isRestricted
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          isAvailable ? 'bg-emerald-500' :
                          isRestricted ? 'bg-red-500' : 'bg-amber-500'
                        }`} />
                        <span className="capitalize">{label}</span>
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Role & Access Management Card */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Staff Role & Permissions</h5>
              <div className="p-5 bg-blue-50/60 rounded-2xl border border-brandBlue/20 space-y-4">
                <div>
                  <label className="text-xs font-bold text-navy block mb-1.5">Assigned System Role</label>
                  <Select
                    options={[
                      { value: 'Library Manager', label: 'Library Manager (Full Access)' },
                      { value: 'Floor Supervisor', label: 'Floor Supervisor (Zone Control)' },
                      { value: 'Reservation Officer', label: 'Reservation Officer (Check-in / Desk)' },
                      { value: 'Support Staff', label: 'Support Staff (General Assistance)' },
                      { value: 'Administrator', label: 'System Administrator' },
                    ]}
                    value={editStaffForm.role || selectedStaff.role}
                    onChange={(e) => {
                      const newRole = e.target.value as LibraryStaff['role'];
                      setEditStaffForm({ ...editStaffForm, role: newRole });
                      updateStaffRole(selectedStaff.id, newRole);
                    }}
                  />
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-between border-t border-brandBlue/10 pt-3">
                  <span>Permission Level</span>
                  <span className="font-bold text-brandBlue">
                    {(editStaffForm.role || selectedStaff.role) === 'Library Manager' ? '16 Permissions • Administrator' : '12 Permissions • QR Scanner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Editable Operational Details Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operational Assignments (Editable)</h5>
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Assigned Floor"
                    options={[
                      ...floors.map(f => ({ value: f.name, label: f.name })),
                      { value: 'All Floors', label: 'All Floors' }
                    ]}
                    value={editStaffForm.assignedFloor || ''}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, assignedFloor: e.target.value })}
                  />

                  <Select
                    label="Shift Hours"
                    options={[
                      { value: '08:00 - 16:00', label: 'Morning (08:00 - 16:00)' },
                      { value: '16:00 - 00:00', label: 'Evening (16:00 - 00:00)' },
                      { value: '00:00 - 08:00', label: 'Night (00:00 - 08:00)' },
                      { value: '09:00 - 17:00', label: 'General (09:00 - 17:00)' },
                    ]}
                    value={editStaffForm.shiftHours || ''}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, shiftHours: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Contact Email"
                    value={editStaffForm.email || ''}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                  />

                  <Input
                    label="Phone Number"
                    value={editStaffForm.phone || ''}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Recent Operational Activity Stream */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Operational Actions</h5>
              <div className="space-y-4 text-xs pl-2 border-l-2 border-slate-200">
                <div className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-brandBlue" />
                  <div className="font-bold text-navy">Verified Student Entry Scan</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Floor 2 turnstile • 12 min ago</div>
                </div>
                <div className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300" />
                  <div className="font-bold text-navy">Resolved Seat Maintenance Alert</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Seat F1-24 unblocked • 45 min ago</div>
                </div>
                <div className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300" />
                  <div className="font-bold text-navy">Logged into Floor Supervisor Terminal</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Today • 08:30 AM</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Staff Performance & Recent Activity Cards (24px gap) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Staff performance" subtitle="Today's operations metrics">
          <div className="space-y-4 text-xs pt-1">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">QR Scans Today</span>
              <span className="font-bold text-navy text-base">418</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Reservations Verified</span>
              <span className="font-bold text-navy text-base">187</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Manual Check-ins</span>
              <span className="font-bold text-navy text-base">34</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Seat Maintenance Resolved</span>
              <span className="font-bold text-navy text-base">12</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-600">Average response time</span>
                <span className="text-emerald-600 font-bold">2m 18s</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-tealAccent rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recent staff activity" subtitle="Live staff actions stream">
          <div className="space-y-5 pt-1">
            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center shrink-0">
                <QrCode className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy">Priya verified access</div>
                <p className="text-xs text-slate-500 mt-0.5">QR entry - Floor 2 - 8 min ago</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-tealAccent-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy">Seat F1-24 reopened</div>
                <p className="text-xs text-slate-500 mt-0.5">Jonah Williams - 22 min ago</p>
              </div>
            </div>

            <div className="flex gap-3.5 items-start">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Shield className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy">Booking exception cleared</div>
                <p className="text-xs text-slate-500 mt-0.5">Elena Torres - 1 hr ago</p>
              </div>
            </div>
          </div>
        </Card>
      </div>



      {/* Invite Staff Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Library Staff"
        subtitle="Send employee invitation to join library operations team"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleInviteSubmit}>
              Send Invitation
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Samuel Reed"
            value={newStaff.name}
            onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
          />

          <Input
            label="Email Address *"
            placeholder="e.g. samuel.reed@northstar.edu"
            type="email"
            value={newStaff.email}
            onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Role Assignment"
              options={[
                { value: 'Library Manager', label: 'Library Manager' },
                { value: 'Floor Supervisor', label: 'Floor Supervisor' },
                { value: 'Reservation Officer', label: 'Reservation Officer' },
                { value: 'Support Staff', label: 'Support Staff' },
              ]}
              value={newStaff.role}
              onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as LibraryStaff['role'] })}
            />

            <Select
              label="Assigned Floor"
              options={[
                { value: 'Ground Floor', label: 'Ground Floor' },
                { value: 'Floor 1', label: 'Floor 1' },
                { value: 'Floor 2', label: 'Floor 2' },
                { value: 'Floor 3', label: 'Floor 3' },
                { value: 'All Floors', label: 'All Floors' },
              ]}
              value={newStaff.assignedFloor}
              onChange={(e) => setNewStaff({ ...newStaff, assignedFloor: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
