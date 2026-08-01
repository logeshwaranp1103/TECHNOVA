export const defaultUsers = [
  {
    id: 1,
    name: 'Subash P',
    collegeId: '24AD042',
    email: 'subash@college.edu',
    passwordHash: 'Student@123',
    department: 'Computer Science',
    year: '3rd Year',
    role: 'student',
    accountStatus: 'active',
    noShowCount: 0
  },
  {
    id: 2,
    name: 'Librarian Sarah',
    collegeId: 'LIB-001',
    email: 'sarah.lib@college.edu',
    passwordHash: 'Admin@123',
    department: 'Library Staff',
    role: 'librarian',
    accountStatus: 'active'
  },
  {
    id: 3,
    name: 'Admin System',
    collegeId: 'ADM-001',
    email: 'admin@college.edu',
    passwordHash: 'Admin@123',
    department: 'IT',
    role: 'admin',
    accountStatus: 'active'
  }
];

export const defaultSlots = [
  {
    id: "slot-1",
    label: "Morning Slot 1",
    startTime: "08:45",
    endTime: "09:45",
    active: true
  },
  {
    id: "slot-2",
    label: "Morning Slot 2",
    startTime: "10:00",
    endTime: "11:00",
    active: true
  },
  {
    id: "slot-3",
    label: "Afternoon Slot 1",
    startTime: "13:30",
    endTime: "14:30",
    active: true
  },
  {
    id: "slot-4",
    label: "Afternoon Slot 2",
    startTime: "15:25",
    endTime: "16:25",
    active: true
  }
];

export const defaultFloors = [
  { id: 'f1', name: 'Ground Floor', description: 'Main reading hall' }
];

export const defaultZones = [
  { id: 'z1', floorId: 'f1', name: 'Quiet Zone A' },
  { id: 'z2', floorId: 'f1', name: 'Collaborative Space' }
];

// Generate 40 seats for demo
export const defaultSeats = Array.from({ length: 40 }).map((_, i) => ({
  id: `s${i + 1}`,
  floorId: 'f1',
  zoneId: i < 20 ? 'z1' : 'z2',
  seatNumber: i < 20 ? `QZ-A${i + 1}` : `CS-B${i - 19}`,
  hasPowerSocket: i % 3 === 0,
  isAccessible: i === 0 || i === 20,
  status: 'active' // active, blocked, maintenance
}));

// Default Mock Waitlists for Demonstration
export const defaultWaitlists = [
  {
    id: "WL-20260801-001",
    studentId: 1,
    studentName: "Subash P",
    registrationNumber: "24AD042",
    bookingDate: "2026-08-01",
    slotId: "slot-4",
    slotLabel: "Afternoon Slot 2",
    startTime: "15:25",
    endTime: "16:25",
    preferredFloorId: "f1",
    preferredZoneId: null,
    allowAnySeat: true,
    position: 1,
    status: "waiting",
    joinedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    allocatedAt: null,
    allocatedSeatId: null,
    allocatedBookingId: null,
    cancelledAt: null,
    expiredAt: null,
    skippedAt: null,
    skipReason: null
  }
];
