export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'blocked' | 'maintenance';
export type ReservationStatus = 'confirmed' | 'checked-in' | 'late' | 'completed' | 'cancelled' | 'rejected' | 'no-show';
export type StudentStatus = 'active' | 'restricted' | 'suspended' | 'pending';
export type StaffRole = 'Library Manager' | 'Floor Supervisor' | 'Reservation Officer' | 'Support Staff' | 'Administrator';
export type StaffStatus = 'available' | 'restricted' | 'online' | 'offline' | 'on-leave';
export type NoiseLevel = 'silent' | 'quiet' | 'collaborative' | 'media';
export type Amenity = 'Power Outlet' | 'USB Charger' | 'Window View' | 'Monitor Screen' | 'Ethernet' | 'Ergonomic Chair' | 'Standing Desk';
export type ReportType = 'occupancy' | 'noshow' | 'peakhours' | 'staff_activity' | 'seat_utilization';
export type LogSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Student {
  id: string;
  registerNo: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  academicYear: string;
  status: StudentStatus;
  suspensionDays?: number;
  suspendedUntil?: string;
  penaltyCount: number;
  avatarUrl: string;
  currentBookingId?: string;
  currentSeatCode?: string;
  totalReservationsCount: number;
  registeredAt: string;
}

export interface LibraryStaff {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  assignedFloor: string;
  shiftHours: string;
  lastActive: string;
  status: StaffStatus;
  permissionsCount: number;
  avatarUrl: string;
}

export interface Seat {
  id: string;
  code: string;
  floorId: string;
  floorNumber: number;
  floorName: string;
  zoneId: string;
  zoneName: string;
  status: SeatStatus;
  seatType: 'Standard Desk' | 'Silent Box' | 'Group Pod' | 'Computer Station' | 'Window Bench';
  amenities: Amenity[];
  isAccessible: boolean;
  row: number;
  column: number;
  currentReservation?: {
    id: string;
    studentId: string;
    studentName: string;
    department: string;
    startTime: string;
    endTime: string;
    checkedInAt?: string;
  };
}

export interface Zone {
  id: string;
  floorId: string;
  floorName: string;
  name: string;
  code: string;
  totalSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  availableSeats: number;
  noiseLevel: NoiseLevel;
  openingHours: string;
  description: string;
  amenities: Amenity[];
}

export interface Floor {
  id: string;
  number: number;
  name: string;
  buildingWing: string;
  totalSeats: number;
  occupiedSeats: number;
  reservedSeats: number;
  availableSeats: number;
  blockedSeats: number;
  maintenanceSeats: number;
  totalZonesCount: number;
  supervisorName: string;
  status: 'open' | 'restricted' | 'closed';
}

export interface Reservation {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentRegisterNo: string;
  department: string;
  academicYear: string;
  seatId: string;
  seatCode: string;
  floorName: string;
  zoneName: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  status: ReservationStatus;
  checkInStatus: 'Checked In' | 'Pending - 15m' | 'Late arrival' | 'Checked out' | 'Not checked in' | 'Cancelled by Student' | 'Rejected by Admin' | 'Cancelled by Mass Release';
  checkedInTime?: string;
  createdMethod: 'Self-service app' | 'QR reservation' | 'Staff created' | 'Kiosk auto';
  qrCodePayload: string;
  timeline: {
    title: string;
    timestamp: string;
    detail: string;
    status: 'done' | 'pending' | 'warning' | 'alert';
  }[];
}

export interface WaitingListEntry {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  registerNo: string;
  requestedFloor: string;
  requestedZone: string;
  seatTypePreference: string;
  waitTimeMinutes: number;
  requestTime: string;
  priorityScore: number;
  status: 'waiting' | 'assigned' | 'expired' | 'cancelled';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetResource: string;
  details: string;
  ipAddress: string;
  severity: LogSeverity;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'system' | 'broadcast' | 'warning' | 'emergency';
  targetGroup: string;
  read: boolean;
  author: string;
}

export interface ReportItem {
  id: string;
  title: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  fileSize: string;
  downloadUrl: string;
  recordCount: number;
  period: string;
  status?: string;
  summary?: string;
}

export interface SystemSettings {
  maxBookingHoursPerDay: number;
  maxAdvanceBookingDays: number;
  gracePeriodMinutes: number;
  penaltyThresholdForSuspension: number;
  qrRefreshIntervalSeconds: number;
  autoReleaseNoShowMinutes: number;
  libraryOpenTime: string;
  libraryCloseTime: string;
  autoWaitlistAllocation: boolean;
  maintenanceMode: boolean;
  emergencyBroadcastActive: boolean;
}

export interface AdminProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  lastLogin: string;
  avatarUrl: string;
  twoFactorEnabled: boolean;
}
