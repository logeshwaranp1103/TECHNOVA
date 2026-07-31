import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  Users, UserCheck, ShieldAlert, UserPlus, Search, Plus, 
  Eye, RotateCcw, AlertTriangle, User 
} from 'lucide-react';
import { toast } from 'sonner';
import type { Student } from '../types';
import { useAppStore } from '../store/useAppStore';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

export const StudentManagementPage: React.FC = () => {
  const { students, selectedStudentId, setSelectedStudentId, updateStudentStatus, addStudent } = useAppStore();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [suspendDays, setSuspendDays] = useState(7);

  // Form State for Add Student
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    academicYear: 'Year 1',
    registerNo: `STU-2024-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'active' as Student['status'],
    penaltyCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  });

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];

  // Filter logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.registerNo.toLowerCase().includes(search.toLowerCase()) ||
                          s.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = departmentFilter === 'all' || s.department === departmentFilter;
    const matchesYear = yearFilter === 'all' || s.academicYear === yearFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesDept && matchesYear && matchesStatus;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.email) {
      toast.error('Please fill in required fields');
      return;
    }
    addStudent(newStudent);
    toast.success(`Student account created for ${newStudent.name}`);
    setIsAddModalOpen(false);
  };

  const handleToggleRestrict = (id: string, currentStatus: Student['status']) => {
    const nextStatus = currentStatus === 'restricted' ? 'active' : 'restricted';
    updateStudentStatus(id, nextStatus);
    toast.success(`Student status updated to ${nextStatus}`);
  };

  const handleToggleSuspend = (id: string, currentStatus: Student['status']) => {
    if (currentStatus === 'suspended') {
      updateStudentStatus(id, 'active');
      toast.success(`Student status updated to active`);
    } else {
      setIsSuspendModalOpen(true);
    }
  };

  const handleConfirmSuspend = () => {
    if (!selectedStudent) return;
    updateStudentStatus(selectedStudent.id, 'suspended', suspendDays);
    toast.success(`Student suspended for ${suspendDays} days`);
    setIsSuspendModalOpen(false);
  };

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Profile',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-navy truncate max-w-[160px]">{row.original.name}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'registerNo',
      header: 'Register No.',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-slate-600">
          {row.original.registerNo}
        </span>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => <span className="text-xs text-slate-700 font-medium">{row.original.department}</span>,
    },
    {
      accessorKey: 'academicYear',
      header: 'Year',
      cell: ({ row }) => <span className="text-xs text-slate-600">{row.original.academicYear}</span>,
    },
    {
      accessorKey: 'currentSeatCode',
      header: 'Current Reservation',
      cell: ({ row }) => (
        row.original.currentSeatCode ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-brandBlue">
            {row.original.currentSeatCode}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-normal">No active booking</span>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Library Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const days = row.original.suspensionDays || 7;
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-2xs ${
            status === 'active'
              ? 'bg-emerald-50/90 text-emerald-700 border-emerald-300/80'
              : status === 'suspended'
              ? 'bg-slate-100/90 text-slate-700 border-slate-300'
              : 'bg-red-50/90 text-red-700 border-red-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              status === 'active' ? 'bg-emerald-500' :
              status === 'suspended' ? 'bg-slate-500' : 'bg-red-500'
            }`} />
            <span className="capitalize">
              {status === 'suspended' ? `suspended (${days} Days)` : status}
            </span>
          </span>
        );
      },
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
              setSelectedStudentId(row.original.id);
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
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">Student Management</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage student accounts, permissions, seat reservations, and library access.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm">
            Import Students
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* KPI Counters (24px gap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value="8,642"
          icon={Users}
          trend={{ value: "+4.8%", isPositive: true, label: "registered" }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Active Students"
          value="7,916"
          icon={UserCheck}
          trend={{ value: "91.5%", isPositive: true, label: "eligible" }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Restricted Students"
          value="38"
          icon={ShieldAlert}
          trend={{ value: "-6 today", isNegative: true, label: "no-show infractions" }}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          title="New Registrations"
          value="24"
          icon={UserPlus}
          trend={{ value: "Today", isPositive: true }}
          iconBg="bg-teal-50"
          iconColor="text-tealAccent-600"
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
            placeholder="Search by student name, register number, or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-navy focus:outline-none focus:border-brandBlue focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Architecture">Architecture</option>
            <option value="Economics">Economics</option>
            <option value="History">History</option>
            <option value="Biology">Biology</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Academic Years</option>
            <option value="Year 1">Year 1</option>
            <option value="Year 2">Year 2</option>
            <option value="Year 3">Year 3</option>
            <option value="Year 4">Year 4</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-brandBlue cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="restricted">Restricted</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <Table
        columns={columns}
        data={filteredStudents}
        pageSize={10}
        selectedRowId={selectedStudentId || undefined}
        getRowId={(row) => row.id}
        onRowClick={(row) => {
          setSelectedStudentId(row.id);
          setIsDrawerOpen(true);
        }}
      />

      {/* Selected Student Slide-over Drawer */}
      <Drawer
        isOpen={isDrawerOpen && !!selectedStudent}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedStudent.name}
        subtitle={selectedStudent.registerNo}
        width="lg"
        footer={
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => toast.info('Password reset email sent to student')}
              className="text-xs px-2"
            >
              Reset Pass
            </Button>

            <Button
              variant={selectedStudent?.status === 'suspended' ? 'primary' : 'outline'}
              size="sm"
              leftIcon={<ShieldAlert className="w-4 h-4" />}
              onClick={() => handleToggleSuspend(selectedStudent.id, selectedStudent.status)}
              className="text-xs px-2"
            >
              {selectedStudent?.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
            </Button>

            <Button
              variant={selectedStudent?.status === 'restricted' ? 'primary' : 'danger'}
              size="sm"
              leftIcon={<AlertTriangle className="w-4 h-4" />}
              onClick={() => handleToggleRestrict(selectedStudent.id, selectedStudent.status)}
              className="text-xs px-2"
            >
              {selectedStudent?.status === 'restricted' ? 'Unrestrict' : 'Restrict'}
            </Button>
          </div>
        }
      >
        {selectedStudent && (
          <div className="space-y-6">
            {/* Avatar Header */}
            <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="w-16 h-16 rounded-full bg-brandBlue/10 border-2 border-brandBlue/30 flex items-center justify-center shadow-sm shrink-0">
                <User className="w-8 h-8 text-brandBlue" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-navy truncate">{selectedStudent.name}</h4>
                <div className="font-mono text-xs text-slate-500">{selectedStudent.registerNo}</div>
                <div className="mt-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                    selectedStudent.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : selectedStudent.status === 'suspended'
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      selectedStudent.status === 'active' ? 'bg-emerald-500' :
                      selectedStudent.status === 'suspended' ? 'bg-slate-500' : 'bg-red-500'
                    }`} />
                    <span className="capitalize">
                      {selectedStudent.status === 'suspended' 
                        ? `suspended (${selectedStudent.suspensionDays || 7} Days)` 
                        : `${selectedStudent.status} student account`}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Personal Information Grid */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Information</h5>
              <div className="grid grid-cols-2 gap-4 text-xs bg-white p-5 rounded-2xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">Department</span>
                  <span className="font-bold text-navy text-sm">{selectedStudent.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">Academic Year</span>
                  <span className="font-bold text-navy text-sm">{selectedStudent.academicYear}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">Phone</span>
                  <span className="font-bold text-navy text-sm">{selectedStudent.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] uppercase font-semibold">Penalty Count</span>
                  <span className="font-bold text-errorRed text-sm">{selectedStudent.penaltyCount} infractions</span>
                </div>
              </div>
            </div>

            {/* Current Booking Card */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Reservation</h5>
              <div className="p-5 bg-blue-50/60 rounded-2xl border border-brandBlue/20 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brandBlue">Checked In</span>
                  <span className="font-mono text-[11px] text-slate-500">Today, 11:00-14:00</span>
                </div>
                <div className="text-navy font-bold text-base">Floor 2 - Quiet Zone - Seat G-14</div>
                <p className="text-slate-500 text-xs leading-relaxed">Seat features: Power Outlet, USB Charger, Window Facade View.</p>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Activity Log</h5>
              <div className="space-y-4 text-xs pl-2 border-l-2 border-slate-200">
                <div className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-brandBlue" />
                  <div className="font-bold text-navy">Checked in to Seat G-14</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Today - 11:04 AM</div>
                </div>

                <div className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300" />
                  <div className="font-bold text-navy">Reserved Quiet Zone</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Today - 09:30 AM via Self-Service App</div>
                </div>

                <div className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300" />
                  <div className="font-bold text-navy">Library Access Turnstile Verified</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Tuesday - 15:40 PM</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Student"
        subtitle="Create student profile for library seat reservation system"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateStudent}>
              Create Student Account
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Aisha Raman"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
          />

          <Input
            label="Email Address *"
            placeholder="e.g. aisha.raman@northstar.edu"
            type="email"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              options={[
                { value: 'Computer Science', label: 'Computer Science' },
                { value: 'Architecture', label: 'Architecture' },
                { value: 'Economics', label: 'Economics' },
                { value: 'Biology', label: 'Biology' },
              ]}
              value={newStudent.department}
              onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
            />

            <Select
              label="Academic Year"
              options={[
                { value: 'Year 1', label: 'Year 1' },
                { value: 'Year 2', label: 'Year 2' },
                { value: 'Year 3', label: 'Year 3' },
                { value: 'Year 4', label: 'Year 4' },
              ]}
              value={newStudent.academicYear}
              onChange={(e) => setNewStudent({ ...newStudent, academicYear: e.target.value })}
            />
          </div>

          <Input
            label="Phone Number"
            placeholder="+44 7700 900 228"
            value={newStudent.phone}
            onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
          />
        </form>
      </Modal>

      {/* Suspend Student Duration Modal */}
      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title={`Suspend Account - ${selectedStudent?.name}`}
        subtitle="Set suspension duration for student library access"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmSuspend}>
              Confirm Suspension ({suspendDays} Days)
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select how many days <strong className="text-navy font-bold">{selectedStudent?.name}</strong> should be suspended from booking seats:
          </p>

          <div className="grid grid-cols-4 gap-2.5">
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSuspendDays(d)}
                className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  suspendDays === d
                    ? 'bg-brandBlue text-white border-brandBlue shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {d} Days
              </button>
            ))}
          </div>

          <div className="pt-2">
            <Input
              label="Custom Suspension Period (Days)"
              type="number"
              min={1}
              max={365}
              value={suspendDays}
              onChange={(e) => setSuspendDays(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
