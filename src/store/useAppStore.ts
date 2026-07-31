import { create } from 'zustand';
import type { 
  Seat, Reservation, Student, LibraryStaff as Staff, AuditLog, ReportItem, 
  NotificationItem, AdminProfile, SystemSettings, Floor, Zone, WaitingListEntry, LogSeverity 
} from '../types';
import { 
  initialFloors, initialZones, initialSeats, initialReservations, 
  initialStudents, initialStaff, initialWaitingList, initialNotifications, 
  initialAuditLogs, initialReports, initialAdminProfile, initialSettings 
} from '../mock/mockData';

interface AppState {
  // Shell UI State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;

  // Drawers & Modals
  activeDrawer: { type: string; data?: any } | null;
  openDrawer: (type: string, data?: any) => void;
  closeDrawer: () => void;

  activeModal: { type: string; data?: any } | null;
  openModal: (type: string, data?: any) => void;
  closeModal: () => void;

  // Admin Profile & Settings
  adminProfile: AdminProfile;
  updateAdminProfile: (updates: Partial<AdminProfile>) => void;
  settings: SystemSettings;
  updateSettings: (updates: Partial<SystemSettings>) => void;
  resetSettingsSection: (section: 'policy' | 'hours') => void;

  // Floors & Zones
  floors: Floor[];
  zones: Zone[];
  selectedFloorId: string | null;
  setSelectedFloorId: (floorId: string | null) => void;
  selectedZoneId: string | null;
  setSelectedZoneId: (zoneId: string | null) => void;
  addFloor: (floor: Omit<Floor, 'id'>) => void;
  deleteFloor: (id: string) => void;
  updateFloor: (id: string, updates: Partial<Floor>) => void;
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;

  // Seats
  seats: Seat[];
  seatViewMode: 'grid' | 'table';
  setSeatViewMode: (mode: 'grid' | 'table') => void;
  selectedSeatId: string | null;
  setSelectedSeatId: (seatId: string | null) => void;
  updateSeatStatus: (seatId: string, status: Seat['status']) => void;
  updateSeat: (id: string, updates: Partial<Seat>) => void;
  addSeat: (seat: Omit<Seat, 'id'>) => void;

  // Reservations
  reservations: Reservation[];
  reservationViewMode: 'table' | 'cards';
  setReservationViewMode: (mode: 'table' | 'cards') => void;
  selectedReservationId: string | null;
  setSelectedReservationId: (id: string | null) => void;
  updateReservationStatus: (id: string, status: Reservation['status']) => void;
  updateReservation: (id: string, updates: Partial<Reservation>) => void;
  createReservation: (reservation: Omit<Reservation, 'id' | 'qrCodePayload' | 'timeline'>) => void;
  cancelReservation: (id: string) => void;
  rejectReservation: (id: string) => void;

  // Students
  students: Student[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  updateStudentStatus: (id: string, status: Student['status'], suspensionDays?: number) => void;
  addStudent: (student: Omit<Student, 'id' | 'totalReservationsCount' | 'registeredAt'>) => void;

  // Staff
  staff: Staff[];
  selectedStaffId: string | null;
  setSelectedStaffId: (id: string | null) => void;
  inviteStaff: (staff: Omit<Staff, 'id' | 'lastActive' | 'status'>) => void;
  updateStaffRole: (id: string, role: Staff['role']) => void;
  updateStaff: (id: string, updates: Partial<Staff>) => void;

  // Waiting List
  waitingList: WaitingListEntry[];
  assignWaitlistSeat: (id: string, seatCode: string) => void;
  removeWaitlistSeat: (id: string) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendBroadcastNotification: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  // Audit Logs & Reports
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  reports: ReportItem[];
  generateReport: (title: string, type: ReportItem['type'], period: string) => void;
  triggerEmergencyMassRelease: () => void;
}

// Helper function to recalculate floor metrics across all floors dynamically
const recalculateFloors = (seats: Seat[], floors: Floor[]): Floor[] => {
  return floors.map(floor => {
    const floorSeats = seats.filter(s => s.floorId === floor.id || s.floorName === floor.name);
    if (floorSeats.length === 0) return floor;

    const totalSeats = floorSeats.length;
    const availableSeats = floorSeats.filter(s => s.status === 'available').length;
    const occupiedSeats = floorSeats.filter(s => s.status === 'occupied').length;
    const reservedSeats = floorSeats.filter(s => s.status === 'reserved').length;
    const blockedSeats = floorSeats.filter(s => s.status === 'blocked').length;
    const maintenanceSeats = floorSeats.filter(s => s.status === 'maintenance').length;

    return {
      ...floor,
      totalSeats,
      availableSeats,
      occupiedSeats,
      reservedSeats,
      blockedSeats,
      maintenanceSeats,
    };
  });
};

// Generate Audit Log Helper
const createAuditLog = (
  logs: AuditLog[], 
  action: string, 
  targetResource: string, 
  details: string, 
  severity: LogSeverity = 'info'
): AuditLog[] => {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actorName: 'Avery Morgan',
    actorRole: 'System Administrator',
    action,
    targetResource,
    details,
    ipAddress: '192.168.1.104',
    severity
  };
  return [newLog, ...logs];
};

// Generate Notification Helper
const createNotification = (
  notifs: NotificationItem[], 
  title: string, 
  message: string, 
  type: NotificationItem['type'] = 'system', 
  targetGroup: string = 'All Library Users'
): NotificationItem[] => {
  const newNotif: NotificationItem = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    message,
    timestamp: 'Just now',
    type,
    targetGroup,
    read: false,
    author: 'Avery Morgan (System Admin)'
  };
  return [newNotif, ...notifs];
};

export const useAppStore = create<AppState>((set, get) => ({
  // Shell UI State
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  globalSearchQuery: '',
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query }),

  // Drawers & Modals
  activeDrawer: null,
  openDrawer: (type, data) => set({ activeDrawer: { type, data } }),
  closeDrawer: () => set({ activeDrawer: null }),

  activeModal: null,
  openModal: (type, data) => set({ activeModal: { type, data } }),
  closeModal: () => set({ activeModal: null }),

  // Admin Profile & Settings
  adminProfile: initialAdminProfile,
  updateAdminProfile: (updates) => set((state) => ({ 
    adminProfile: { ...state.adminProfile, ...updates },
    auditLogs: createAuditLog(state.auditLogs, 'UPDATE_PROFILE', 'Admin Profile', 'Updated admin profile info')
  })),
  settings: initialSettings,
  updateSettings: (updates) => set((state) => ({ 
    settings: { ...state.settings, ...updates },
    auditLogs: createAuditLog(state.auditLogs, 'UPDATE_SETTINGS', 'System Settings', 'Updated library system configuration rules'),
    notifications: createNotification(state.notifications, 'System Settings Updated', 'Library configuration policies updated by administrator.')
  })),
  resetSettingsSection: (section) => set((state) => {
    let resetPartial: Partial<SystemSettings> = {};
    if (section === 'policy') {
      resetPartial = {
        maxBookingHoursPerDay: initialSettings.maxBookingHoursPerDay,
        maxAdvanceBookingDays: initialSettings.maxAdvanceBookingDays,
        gracePeriodMinutes: initialSettings.gracePeriodMinutes,
        autoReleaseNoShowMinutes: initialSettings.autoReleaseNoShowMinutes,
        penaltyThresholdForSuspension: initialSettings.penaltyThresholdForSuspension,
      };
    } else if (section === 'hours') {
      resetPartial = {
        libraryOpenTime: initialSettings.libraryOpenTime,
        libraryCloseTime: initialSettings.libraryCloseTime,
        qrRefreshIntervalSeconds: initialSettings.qrRefreshIntervalSeconds,
        autoWaitlistAllocation: initialSettings.autoWaitlistAllocation,
        maintenanceMode: initialSettings.maintenanceMode,
      };
    }
    const updatedSettings = { ...state.settings, ...resetPartial };
    return {
      settings: updatedSettings,
      auditLogs: createAuditLog(state.auditLogs, 'RESET_SETTINGS_SECTION', `Settings Section: ${section}`, `Reset ${section} configuration to factory defaults`),
      notifications: createNotification(state.notifications, 'Settings Section Reset', `Reset ${section} rules to default system settings.`)
    };
  }),

  // Floors & Zones
  floors: initialFloors,
  zones: initialZones,
  selectedFloorId: null,
  setSelectedFloorId: (floorId) => set({ selectedFloorId: floorId }),
  selectedZoneId: null,
  setSelectedZoneId: (zoneId) => set({ selectedZoneId: zoneId }),

  addFloor: (floor) => set((state) => {
    const newFloorId = `fl-${Date.now()}`;
    const newFloorObj = { ...floor, id: newFloorId };
    const floorPrefix = floor.name.includes('Floor') ? `F${floor.number}` : floor.name.substring(0, 3).toUpperCase();
    const newFloorSeats: Seat[] = Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const numStr = num < 10 ? `0${num}` : `${num}`;
      return {
        id: `seat-${newFloorId}-${num}`,
        code: `${floorPrefix}-${numStr}`,
        floorId: newFloorId,
        floorNumber: floor.number,
        floorName: floor.name,
        zoneId: 'z-1',
        zoneName: 'Main Reading Hall',
        seatType: 'Standard Desk' as const,
        status: 'available' as const,
        amenities: ['Power Outlet', 'USB Charger'],
        isAccessible: i % 4 === 0,
        row: Math.floor(i / 4) + 1,
        column: (i % 4) + 1,
      };
    });

    const updatedSeats = [...state.seats, ...newFloorSeats];
    const updatedFloors = recalculateFloors(updatedSeats, [...state.floors, newFloorObj]);

    return {
      floors: updatedFloors,
      seats: updatedSeats,
      auditLogs: createAuditLog(state.auditLogs, 'ADD_FLOOR', `Floor ${floor.name}`, `Added new floor with ${newFloorSeats.length} initial seats`),
      notifications: createNotification(state.notifications, 'New Floor Added', `Floor ${floor.name} created and integrated into system.`)
    };
  }),

  deleteFloor: (id) => set((state) => {
    const targetFloor = state.floors.find(f => f.id === id);
    if (!targetFloor) return state;
    const remainingSeats = state.seats.filter(s => s.floorId !== id && s.floorName !== targetFloor.name);
    const remainingFloors = state.floors.filter(f => f.id !== id);

    return {
      floors: recalculateFloors(remainingSeats, remainingFloors),
      seats: remainingSeats,
      selectedFloorId: state.selectedFloorId === id ? null : state.selectedFloorId,
      auditLogs: createAuditLog(state.auditLogs, 'DELETE_FLOOR', `Floor ${targetFloor.name}`, `Deleted floor and associated seats`, 'warning'),
      notifications: createNotification(state.notifications, 'Floor Deleted', `${targetFloor.name} removed from active library floor plan.`, 'warning')
    };
  }),

  updateFloor: (id, updates) => set((state) => ({
    floors: state.floors.map(f => f.id === id ? { ...f, ...updates } : f),
    auditLogs: createAuditLog(state.auditLogs, 'UPDATE_FLOOR', `Floor ${id}`, `Updated floor operational details`)
  })),

  addZone: (zone) => set((state) => ({
    zones: [...state.zones, { ...zone, id: `z-${state.zones.length + 1}` }],
    auditLogs: createAuditLog(state.auditLogs, 'ADD_ZONE', `Zone ${zone.name}`, `Added study zone`)
  })),
  updateZone: (id, updates) => set((state) => ({
    zones: state.zones.map(z => z.id === id ? { ...z, ...updates } : z)
  })),

  // Seats
  seats: initialSeats,
  seatViewMode: 'grid',
  setSeatViewMode: (mode) => set({ seatViewMode: mode }),
  selectedSeatId: 'seat-14',
  setSelectedSeatId: (seatId) => set({ selectedSeatId: seatId }),

  updateSeatStatus: (seatId, status) => set((state) => {
    const targetSeat = state.seats.find(s => s.id === seatId);
    const updatedSeats = state.seats.map(s => s.id === seatId ? { ...s, status } : s);
    const updatedFloors = recalculateFloors(updatedSeats, state.floors);

    return {
      seats: updatedSeats,
      floors: updatedFloors,
      auditLogs: createAuditLog(
        state.auditLogs, 
        'UPDATE_SEAT_STATUS', 
        `Seat ${targetSeat?.code || seatId}`, 
        `Status changed to ${status}`, 
        status === 'blocked' || status === 'maintenance' ? 'warning' : 'info'
      ),
      notifications: createNotification(
        state.notifications, 
        'Seat Status Updated', 
        `Seat ${targetSeat?.code || seatId} status updated to ${status}.`
      )
    };
  }),

  updateSeat: (id, updates) => set((state) => {
    const updatedSeats = state.seats.map(s => s.id === id ? { ...s, ...updates } : s);
    const updatedFloors = recalculateFloors(updatedSeats, state.floors);
    return {
      seats: updatedSeats,
      floors: updatedFloors,
      auditLogs: createAuditLog(state.auditLogs, 'UPDATE_SEAT', `Seat ${id}`, `Updated seat details`)
    };
  }),

  addSeat: (seat) => set((state) => {
    const newSeatObj: Seat = {
      ...seat,
      id: `seat-${Date.now()}`,
    };
    const updatedSeats = [...state.seats, newSeatObj];
    const updatedFloors = recalculateFloors(updatedSeats, state.floors);

    return {
      seats: updatedSeats,
      floors: updatedFloors,
      auditLogs: createAuditLog(state.auditLogs, 'ADD_SEAT', `Seat ${seat.code}`, `Created new seat in ${seat.floorName}`),
      notifications: createNotification(state.notifications, 'New Seat Added', `Seat ${seat.code} added to ${seat.floorName} (${seat.zoneName}).`)
    };
  }),

  // Reservations
  reservations: initialReservations,
  reservationViewMode: 'table',
  setReservationViewMode: (mode) => set({ reservationViewMode: mode }),
  selectedReservationId: null,
  setSelectedReservationId: (id) => set({ selectedReservationId: id }),

  updateReservationStatus: (id, status) => set((state) => {
    const targetRes = state.reservations.find(r => r.id === id);
    const updatedReservations = state.reservations.map(r => r.id === id ? { ...r, status } : r);
    
    let updatedSeats = state.seats;
    if (targetRes && (status === 'cancelled' || status === 'rejected' || status === 'completed')) {
      updatedSeats = state.seats.map(s => s.code === targetRes.seatCode ? { ...s, status: 'available' as const } : s);
    }

    return {
      reservations: updatedReservations,
      seats: updatedSeats,
      floors: recalculateFloors(updatedSeats, state.floors),
      auditLogs: createAuditLog(state.auditLogs, 'UPDATE_RESERVATION', `Reservation ${id}`, `Status changed to ${status}`),
      notifications: createNotification(state.notifications, 'Reservation Status Changed', `Reservation ${id} updated to ${status}.`)
    };
  }),

  updateReservation: (id, updates) => set((state) => ({
    reservations: state.reservations.map(r => r.id === id ? { ...r, ...updates } : r)
  })),

  createReservation: (resData) => {
    const newId = `RSV-${87400 + get().reservations.length + 1}`;
    const newRes: Reservation = {
      ...resData,
      id: newId,
      qrCodePayload: `NORTHSTAR-LIB-RES:${newId}:${resData.studentRegisterNo}:${resData.seatCode}`,
      timeline: [
        { title: 'Reservation created', timestamp: 'Just now', detail: 'Created by Admin', status: 'done' },
        { title: 'Awaiting student check-in', timestamp: 'Pending', detail: 'QR ready for scanning', status: 'pending' }
      ]
    };

    const updatedSeats = get().seats.map(s => 
      s.code === resData.seatCode ? { ...s, status: 'occupied' as const } : s
    );

    set((state) => ({
      reservations: [newRes, ...state.reservations],
      seats: updatedSeats,
      floors: recalculateFloors(updatedSeats, state.floors),
      auditLogs: createAuditLog(state.auditLogs, 'CREATE_RESERVATION', `Reservation ${newId}`, `Reserved Seat ${resData.seatCode} for ${resData.studentName}`),
      notifications: createNotification(state.notifications, 'Reservation Created', `Reservation ${newId} confirmed for ${resData.studentName} (Seat ${resData.seatCode}).`)
    }));
  },

  cancelReservation: (id) => set((state) => {
    const targetRes = state.reservations.find(r => r.id === id);
    const updatedReservations = state.reservations.map(r => r.id === id ? {
      ...r,
      status: 'cancelled' as const,
      checkInStatus: 'Cancelled by Student' as const,
      timeline: [
        { title: 'Reservation requested', timestamp: '09:30 - Portal', detail: 'Submitted by student', status: 'done' as const },
        { title: 'Reservation cancelled', timestamp: 'Just now - Student action', detail: 'Cancelled before arrival', status: 'done' as const }
      ]
    } : r);

    let updatedSeats = targetRes 
      ? state.seats.map(s => s.code === targetRes.seatCode ? { ...s, status: 'available' as const } : s)
      : state.seats;

    let updatedWaitingList = state.waitingList;

    // Automatic Waiting List Allocation Engine if enabled
    if (state.settings.autoWaitlistAllocation && targetRes) {
      const topWaitingCandidate = state.waitingList.find(w => w.status === 'waiting' && w.requestedFloor === targetRes.floorName);
      if (topWaitingCandidate) {
        updatedWaitingList = state.waitingList.map(w => w.id === topWaitingCandidate.id ? { ...w, status: 'assigned' as const } : w);
        updatedSeats = updatedSeats.map(s => s.code === targetRes.seatCode ? { ...s, status: 'occupied' as const } : s);
      }
    }

    return {
      reservations: updatedReservations,
      seats: updatedSeats,
      waitingList: updatedWaitingList,
      floors: recalculateFloors(updatedSeats, state.floors),
      auditLogs: createAuditLog(state.auditLogs, 'CANCEL_RESERVATION', `Reservation ${id}`, `Cancelled reservation for Seat ${targetRes?.seatCode || 'Unknown'}`),
      notifications: createNotification(state.notifications, 'Reservation Cancelled', `Reservation ${id} has been cancelled. Seat ${targetRes?.seatCode} released.`)
    };
  }),

  rejectReservation: (id) => set((state) => {
    const targetRes = state.reservations.find(r => r.id === id);
    const updatedReservations = state.reservations.map(r => r.id === id ? {
      ...r,
      status: 'rejected' as const,
      checkInStatus: 'Rejected by Admin' as const,
      timeline: [
        { title: 'Reservation requested', timestamp: '09:30 - Portal', detail: 'Submitted by student', status: 'done' as const },
        { title: 'Reservation rejected', timestamp: 'Just now - Staff action', detail: 'Rejected by library admin', status: 'done' as const }
      ]
    } : r);

    const updatedSeats = targetRes 
      ? state.seats.map(s => s.code === targetRes.seatCode ? { ...s, status: 'available' as const } : s)
      : state.seats;

    return {
      reservations: updatedReservations,
      seats: updatedSeats,
      floors: recalculateFloors(updatedSeats, state.floors),
      auditLogs: createAuditLog(state.auditLogs, 'REJECT_RESERVATION', `Reservation ${id}`, `Rejected by admin`),
      notifications: createNotification(state.notifications, 'Reservation Rejected', `Reservation ${id} rejected by staff.`, 'warning')
    };
  }),

  // Students
  students: initialStudents,
  selectedStudentId: 'std-1',
  setSelectedStudentId: (id) => set({ selectedStudentId: id }),
  updateStudentStatus: (id, status, suspensionDays) => set((state) => {
    const targetStudent = state.students.find(s => s.id === id);
    return {
      students: state.students.map(s => s.id === id ? { 
        ...s, 
        status, 
        suspensionDays: status === 'suspended' ? (suspensionDays || s.suspensionDays || 7) : undefined 
      } : s),
      auditLogs: createAuditLog(
        state.auditLogs, 
        'UPDATE_STUDENT_STATUS', 
        `Student ${targetStudent?.name || id}`, 
        `Status set to ${status} ${suspensionDays ? `(${suspensionDays} days)` : ''}`,
        status === 'suspended' ? 'warning' : 'info'
      ),
      notifications: createNotification(
        state.notifications, 
        'Student Status Changed', 
        `Student ${targetStudent?.name} status updated to ${status}.`
      )
    };
  }),
  addStudent: (studentData) => set((state) => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${state.students.length + 1}`,
      totalReservationsCount: 0,
      registeredAt: new Date().toISOString().split('T')[0],
    };

    return {
      students: [newStudent, ...state.students],
      auditLogs: createAuditLog(state.auditLogs, 'ADD_STUDENT', `Student ${studentData.name}`, `Registered student ${studentData.registerNo}`),
      notifications: createNotification(state.notifications, 'New Student Registered', `Student ${studentData.name} (${studentData.registerNo}) registered successfully.`)
    };
  }),

  // Staff
  staff: initialStaff,
  selectedStaffId: 'stf-1',
  setSelectedStaffId: (id) => set({ selectedStaffId: id }),
  inviteStaff: (staffData) => set((state) => {
    const newStaff: Staff = {
      ...staffData,
      id: `stf-${state.staff.length + 1}`,
      lastActive: 'Just invited',
      status: 'offline',
    };

    return {
      staff: [newStaff, ...state.staff],
      auditLogs: createAuditLog(state.auditLogs, 'INVITE_STAFF', `Staff ${staffData.name}`, `Invited staff as ${staffData.role}`),
      notifications: createNotification(state.notifications, 'Staff Account Invited', `Library staff ${staffData.name} invited for ${staffData.assignedFloor}.`)
    };
  }),
  updateStaffRole: (id, role) => set((state) => ({
    staff: state.staff.map(s => s.id === id ? { ...s, role } : s),
    auditLogs: createAuditLog(state.auditLogs, 'UPDATE_STAFF_ROLE', `Staff ${id}`, `Role updated to ${role}`)
  })),
  updateStaff: (id, updates) => set((state) => ({
    staff: state.staff.map(s => s.id === id ? { ...s, ...updates } : s),
    auditLogs: createAuditLog(state.auditLogs, 'UPDATE_STAFF', `Staff ${id}`, `Updated profile & operational assignments`)
  })),

  // Waiting List
  waitingList: initialWaitingList,

  assignWaitlistSeat: (id, seatCode) => set((state) => {
    const targetEntry = state.waitingList.find(w => w.id === id);
    const updatedWaitingList = state.waitingList.map(item => item.id === id ? { ...item, status: 'assigned' as const } : item);
    const updatedSeats = state.seats.map(s => s.code === seatCode ? { ...s, status: 'occupied' as const } : s);

    return {
      waitingList: updatedWaitingList,
      seats: updatedSeats,
      floors: recalculateFloors(updatedSeats, state.floors),
      auditLogs: createAuditLog(state.auditLogs, 'ALLOCATE_WAITLIST', `Waitlist Queue #${id}`, `Allocated Seat ${seatCode} to ${targetEntry?.studentName || 'Student'}`),
      notifications: createNotification(state.notifications, 'Waitlist Seat Allocated', `Seat ${seatCode} successfully assigned to ${targetEntry?.studentName}.`)
    };
  }),

  removeWaitlistSeat: (id) => set((state) => {
    const targetEntry = state.waitingList.find(w => w.id === id);
    const updatedWaitingList = state.waitingList.map(item => item.id === id ? { ...item, status: 'waiting' as const } : item);
    
    let updatedSeats = state.seats;
    if (targetEntry) {
      const matchSeat = state.seats.find(s => s.floorName === targetEntry.requestedFloor && s.status === 'occupied');
      if (matchSeat) {
        updatedSeats = state.seats.map(s => s.id === matchSeat.id ? { ...s, status: 'available' as const } : s);
      }
    }

    return {
      waitingList: updatedWaitingList,
      seats: updatedSeats,
      floors: recalculateFloors(updatedSeats, state.floors),
      auditLogs: createAuditLog(state.auditLogs, 'REMOVE_WAITLIST_SEAT', `Waitlist Queue #${id}`, `Removed seat allocation for ${targetEntry?.studentName || 'Student'}`),
      notifications: createNotification(state.notifications, 'Waitlist Seat Allocation Removed', `Seat assignment removed for ${targetEntry?.studentName}.`)
    };
  }),

  // Notifications
  notifications: initialNotifications,
  unreadNotificationCount: initialNotifications.filter(n => !n.read).length,
  markNotificationRead: (id) => set((state) => {
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return { notifications: updated, unreadNotificationCount: updated.filter(n => !n.read).length };
  }),
  markAllNotificationsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true })),
    unreadNotificationCount: 0,
  })),
  sendBroadcastNotification: (notif) => set((state) => {
    const newItem: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: 'Just now',
      read: false,
    };
    const updatedNotifs = [newItem, ...state.notifications];
    return {
      notifications: updatedNotifs,
      unreadNotificationCount: updatedNotifs.filter(n => !n.read).length,
      auditLogs: createAuditLog(state.auditLogs, 'BROADCAST_NOTIFICATION', `Audience: ${notif.targetGroup}`, `Dispatched announcement: ${notif.title}`)
    };
  }),

  // Audit Logs & Reports
  auditLogs: initialAuditLogs,
  addAuditLog: (log) => set((state) => ({
    auditLogs: [
      {
        ...log,
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...state.auditLogs
    ]
  })),
  reports: initialReports,
  generateReport: (title, type, period) => set((state) => ({
    reports: [
      {
        id: `REP-${100 + state.reports.length + 1}`,
        title,
        type,
        generatedAt: new Date().toISOString().split('T')[0],
        generatedBy: 'Avery Morgan',
        fileSize: '2.4 MB',
        recordCount: 1248,
        period,
        status: 'ready',
        downloadUrl: '#download',
        summary: `Automated ${type} analytics breakdown generated for ${period}.`,
      },
      ...state.reports
    ],
    auditLogs: createAuditLog(state.auditLogs, 'GENERATE_REPORT', `Report ${title}`, `Generated ${type} report for ${period}`)
  })),

  triggerEmergencyMassRelease: () => set((state) => {
    const occupiedCount = state.seats.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
    
    // Reset all occupied and reserved seats to available
    const updatedSeats = state.seats.map(s => ({
      ...s,
      status: s.status === 'blocked' || s.status === 'maintenance' ? s.status : ('available' as const),
      currentReservation: undefined
    }));

    // Mark all active reservations as cancelled by mass release
    const updatedReservations = state.reservations.map(r => 
      r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'late'
        ? { ...r, status: 'cancelled' as const, checkInStatus: 'Cancelled by Mass Release' as const }
        : r
    );

    // Clear active booking pointers on student profiles
    const updatedStudents = state.students.map(st => ({
      ...st,
      currentBookingId: undefined,
      currentSeatCode: undefined
    }));

    // Reset assigned waitlist entries back to waiting queue
    const updatedWaitingList = state.waitingList.map(w => ({
      ...w,
      status: w.status === 'assigned' ? ('waiting' as const) : w.status
    }));

    const updatedFloors = recalculateFloors(updatedSeats, state.floors);

    return {
      seats: updatedSeats,
      reservations: updatedReservations,
      students: updatedStudents,
      waitingList: updatedWaitingList,
      floors: updatedFloors,
      auditLogs: createAuditLog(
        state.auditLogs, 
        'EMERGENCY_MASS_RELEASE', 
        'All 8 Library Floors', 
        `Executed mass release clearing ${occupiedCount} active occupied/reserved seats across all floors`, 
        'critical'
      ),
      notifications: createNotification(
        state.notifications, 
        'Emergency Mass Seat Release Executed', 
        `Emergency override cleared ${occupiedCount} occupied seats across all 8 library floors. All seats are now available.`, 
        'emergency',
        'All Students & Staff'
      )
    };
  }),
}));
