import type { 
  Student, LibraryStaff, Seat, Zone, Floor, Reservation, 
  WaitingListEntry, AuditLog, NotificationItem, ReportItem, SystemSettings, AdminProfile,
  StudentStatus, StaffRole, StaffStatus 
} from '../types';

export const initialAdminProfile: AdminProfile = {
  id: 'ADM-001',
  name: 'Avery Morgan',
  role: 'Chief Library Administrator',
  email: 'avery.morgan@northstar.edu',
  phone: '+1 (555) 019-2834',
  lastLogin: 'Today, 08:30 AM',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  twoFactorEnabled: true,
};

export const initialSettings: SystemSettings = {
  maxBookingHoursPerDay: 4,
  maxAdvanceBookingDays: 7,
  gracePeriodMinutes: 15,
  penaltyThresholdForSuspension: 3,
  qrRefreshIntervalSeconds: 30,
  autoReleaseNoShowMinutes: 20,
  libraryOpenTime: '08:00',
  libraryCloseTime: '22:00',
  autoWaitlistAllocation: true,
  maintenanceMode: false,
  emergencyBroadcastActive: false,
};

// Generate 8 Floors
export const initialFloors: Floor[] = [
  { id: 'fl-0', number: 0, name: 'Ground Floor', buildingWing: 'North Wing', totalSeats: 328, occupiedSeats: 164, reservedSeats: 42, availableSeats: 104, blockedSeats: 10, maintenanceSeats: 8, totalZonesCount: 4, supervisorName: 'Elena Torres', status: 'open' },
  { id: 'fl-1', number: 1, name: 'Floor 1 - Quiet Zone', buildingWing: 'East Wing', totalSeats: 302, occupiedSeats: 140, reservedSeats: 38, availableSeats: 112, blockedSeats: 8, maintenanceSeats: 4, totalZonesCount: 3, supervisorName: 'Samuel Reed', status: 'open' },
  { id: 'fl-2', number: 2, name: 'Floor 2 - Research Hub', buildingWing: 'Main Atrium', totalSeats: 318, occupiedSeats: 180, reservedSeats: 45, availableSeats: 83, blockedSeats: 6, maintenanceSeats: 4, totalZonesCount: 4, supervisorName: 'Hannah Brooks', status: 'open' },
  { id: 'fl-3', number: 3, name: 'Floor 3 - Digital Media Lab', buildingWing: 'West Wing', totalSeats: 300, occupiedSeats: 135, reservedSeats: 50, availableSeats: 105, blockedSeats: 5, maintenanceSeats: 5, totalZonesCount: 3, supervisorName: 'Jonah Williams', status: 'open' },
  { id: 'fl-4', number: 4, name: 'Floor 4 - Graduate Commons', buildingWing: 'North Wing', totalSeats: 250, occupiedSeats: 110, reservedSeats: 30, availableSeats: 100, blockedSeats: 6, maintenanceSeats: 4, totalZonesCount: 3, supervisorName: 'Marcus Vance', status: 'open' },
  { id: 'fl-5', number: 5, name: 'Floor 5 - Faculty & Periodicals', buildingWing: 'East Wing', totalSeats: 220, occupiedSeats: 95, reservedSeats: 25, availableSeats: 90, blockedSeats: 5, maintenanceSeats: 5, totalZonesCount: 3, supervisorName: 'Sarah Jenkins', status: 'open' },
  { id: 'fl-6', number: 6, name: 'Floor 6 - Special Collections', buildingWing: 'South Tower', totalSeats: 180, occupiedSeats: 70, reservedSeats: 20, availableSeats: 85, blockedSeats: 3, maintenanceSeats: 2, totalZonesCount: 2, supervisorName: 'David Chen', status: 'restricted' },
  { id: 'fl-7', number: 7, name: 'Floor 7 - Silent Sanctuary', buildingWing: 'Sky Deck', totalSeats: 150, occupiedSeats: 90, reservedSeats: 15, availableSeats: 40, blockedSeats: 3, maintenanceSeats: 2, totalZonesCount: 3, supervisorName: 'Rachel Kim', status: 'open' },
];

// Generate 25 Zones
export const initialZones: Zone[] = [
  { id: 'z-1', floorId: 'fl-0', floorName: 'Ground Floor', name: 'Main Reading Hall', code: 'G-RH', totalSeats: 116, occupiedSeats: 62, reservedSeats: 18, availableSeats: 36, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Spacious central hall with high ceilings and natural window light.', amenities: ['Power Outlet', 'USB Charger', 'Window View'] },
  { id: 'z-2', floorId: 'fl-0', floorName: 'Ground Floor', name: 'Silent Zone', code: 'G-SZ', totalSeats: 72, occupiedSeats: 40, reservedSeats: 12, availableSeats: 20, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Zero-talking policy with sound-dampening acoustic dividers.', amenities: ['Power Outlet', 'Ergonomic Chair'] },
  { id: 'z-3', floorId: 'fl-0', floorName: 'Ground Floor', name: 'Discussion Zone', code: 'G-DZ', totalSeats: 48, occupiedSeats: 24, reservedSeats: 8, availableSeats: 16, noiseLevel: 'collaborative', openingHours: '08:00-22:00', description: 'Collaborative round tables for group projects and study sessions.', amenities: ['Power Outlet', 'Monitor Screen'] },
  { id: 'z-4', floorId: 'fl-0', floorName: 'Ground Floor', name: 'Research Area', code: 'G-RA', totalSeats: 52, occupiedSeats: 26, reservedSeats: 4, availableSeats: 22, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Dedicated reference workstations near catalog archives.', amenities: ['Power Outlet', 'Ethernet'] },
  { id: 'z-5', floorId: 'fl-0', floorName: 'Ground Floor', name: 'Computer Lab 01', code: 'G-CL', totalSeats: 40, occupiedSeats: 12, reservedSeats: 0, availableSeats: 10, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'High-performance desktop PCs loaded with engineering software.', amenities: ['Monitor Screen', 'Ethernet', 'Power Outlet'] },

  { id: 'z-6', floorId: 'fl-1', floorName: 'Floor 1 - Quiet Zone', name: 'North Quiet Study', code: 'F1-NQS', totalSeats: 100, occupiedSeats: 45, reservedSeats: 15, availableSeats: 40, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Single study carrels along the north glass facade.', amenities: ['Power Outlet', 'Window View'] },
  { id: 'z-7', floorId: 'fl-1', floorName: 'Floor 1 - Quiet Zone', name: 'East Commons', code: 'F1-EC', totalSeats: 102, occupiedSeats: 50, reservedSeats: 13, availableSeats: 39, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Open desk layout with soft LED desk lamps.', amenities: ['Power Outlet', 'USB Charger'] },
  { id: 'z-8', floorId: 'fl-1', floorName: 'Floor 1 - Quiet Zone', name: 'Group Study Pods A', code: 'F1-GSP', totalSeats: 100, occupiedSeats: 45, reservedSeats: 10, availableSeats: 33, noiseLevel: 'collaborative', openingHours: '08:00-22:00', description: 'Enclosed acoustic glass pods equipped with whiteboard walls.', amenities: ['Monitor Screen', 'Power Outlet'] },

  { id: 'z-9', floorId: 'fl-2', floorName: 'Floor 2 - Research Hub', name: 'Thesis Lounge', code: 'F2-TL', totalSeats: 80, occupiedSeats: 50, reservedSeats: 10, availableSeats: 20, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Reserved area for master and PhD thesis candidates.', amenities: ['Ergonomic Chair', 'Power Outlet'] },
  { id: 'z-10', floorId: 'fl-2', floorName: 'Floor 2 - Research Hub', name: 'Periodicals Reading', code: 'F2-PR', totalSeats: 78, occupiedSeats: 40, reservedSeats: 15, availableSeats: 23, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Comfortable armchair seating next to physical journal stacks.', amenities: ['USB Charger', 'Window View'] },
  { id: 'z-11', floorId: 'fl-2', floorName: 'Floor 2 - Research Hub', name: 'Data Science Lab', code: 'F2-DSL', totalSeats: 80, occupiedSeats: 50, reservedSeats: 10, availableSeats: 20, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Dual-monitor stations for data processing and analysis.', amenities: ['Monitor Screen', 'Ethernet'] },
  { id: 'z-12', floorId: 'fl-2', floorName: 'Floor 2 - Research Hub', name: 'Collaborative Corner', code: 'F2-CC', totalSeats: 80, occupiedSeats: 40, reservedSeats: 10, availableSeats: 20, noiseLevel: 'collaborative', openingHours: '08:00-22:00', description: 'Flexible seating arrangement for interdisciplinary teams.', amenities: ['Power Outlet', 'Monitor Screen'] },

  { id: 'z-13', floorId: 'fl-3', floorName: 'Floor 3 - Digital Media Lab', name: 'Audio/Video Suite', code: 'F3-AV', totalSeats: 90, occupiedSeats: 40, reservedSeats: 15, availableSeats: 35, noiseLevel: 'media', openingHours: '08:00-22:00', description: 'Soundproof editing bays with studio headphones.', amenities: ['Monitor Screen', 'Ethernet'] },
  { id: 'z-14', floorId: 'fl-3', floorName: 'Floor 3 - Digital Media Lab', name: 'VR Simulation Lab', code: 'F3-VR', totalSeats: 100, occupiedSeats: 50, reservedSeats: 20, availableSeats: 30, noiseLevel: 'collaborative', openingHours: '08:00-22:00', description: 'High-end graphics computers with VR headsets.', amenities: ['Monitor Screen', 'Power Outlet'] },
  { id: 'z-15', floorId: 'fl-3', floorName: 'Floor 3 - Digital Media Lab', name: '3D Modeling Hub', code: 'F3-3D', totalSeats: 110, occupiedSeats: 45, reservedSeats: 15, availableSeats: 40, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'CAD and 3D printing preparation workstations.', amenities: ['Monitor Screen', 'Ethernet'] },

  { id: 'z-16', floorId: 'fl-4', floorName: 'Floor 4 - Graduate Commons', name: 'PhD Research Suites', code: 'F4-PRS', totalSeats: 80, occupiedSeats: 40, reservedSeats: 10, availableSeats: 30, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Lockable study carrels for doctoral fellows.', amenities: ['Ergonomic Chair', 'Power Outlet'] },
  { id: 'z-17', floorId: 'fl-4', floorName: 'Floor 4 - Graduate Commons', name: 'Seminar Lounge', code: 'F4-SL', totalSeats: 90, occupiedSeats: 40, reservedSeats: 10, availableSeats: 40, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Soft lounge seating for academic reading groups.', amenities: ['USB Charger'] },
  { id: 'z-18', floorId: 'fl-4', floorName: 'Floor 4 - Graduate Commons', name: 'Graduate Quiet Hall', code: 'F4-GQH', totalSeats: 80, occupiedSeats: 30, reservedSeats: 10, availableSeats: 30, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Deep focus zone for intensive exam preparation.', amenities: ['Power Outlet'] },

  { id: 'z-19', floorId: 'fl-5', floorName: 'Floor 5 - Faculty & Periodicals', name: 'Faculty Corner', code: 'F5-FC', totalSeats: 70, occupiedSeats: 30, reservedSeats: 10, availableSeats: 30, noiseLevel: 'quiet', openingHours: '08:00-22:00', description: 'Quiet work alcove reserved for university professors.', amenities: ['Power Outlet', 'Ergonomic Chair'] },
  { id: 'z-20', floorId: 'fl-5', floorName: 'Floor 5 - Faculty & Periodicals', name: 'Rare Books Reading', code: 'F5-RB', totalSeats: 75, occupiedSeats: 35, reservedSeats: 8, availableSeats: 32, noiseLevel: 'silent', openingHours: '08:00-20:00', description: 'Climate-controlled reading space for rare manuscript study.', amenities: ['Power Outlet'] },
  { id: 'z-21', floorId: 'fl-5', floorName: 'Floor 5 - Faculty & Periodicals', name: 'Microfilm Archives', code: 'F5-MA', totalSeats: 75, occupiedSeats: 30, reservedSeats: 7, availableSeats: 28, noiseLevel: 'silent', openingHours: '08:00-20:00', description: 'Microfilm readers and digital archive scanners.', amenities: ['Monitor Screen'] },

  { id: 'z-22', floorId: 'fl-6', floorName: 'Floor 6 - Special Collections', name: 'Special Collection Desk', code: 'F6-SCD', totalSeats: 90, occupiedSeats: 35, reservedSeats: 10, availableSeats: 45, noiseLevel: 'silent', openingHours: '09:00-18:00', description: 'Supervised seating with handling materials provided.', amenities: ['Power Outlet'] },
  { id: 'z-23', floorId: 'fl-6', floorName: 'Floor 6 - Special Collections', name: 'Archival Vault Study', code: 'F6-AVS', totalSeats: 90, occupiedSeats: 35, reservedSeats: 10, availableSeats: 40, noiseLevel: 'silent', openingHours: '09:00-18:00', description: 'High-security room for historic manuscript review.', amenities: ['Power Outlet'] },

  { id: 'z-24', floorId: 'fl-7', floorName: 'Floor 7 - Silent Sanctuary', name: 'Zen Study Gallery', code: 'F7-ZSG', totalSeats: 75, occupiedSeats: 45, reservedSeats: 8, availableSeats: 22, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Minimalist noise-cancelled individual cubicles with outdoor skyline view.', amenities: ['Window View', 'Ergonomic Chair'] },
  { id: 'z-25', floorId: 'fl-7', floorName: 'Floor 7 - Silent Sanctuary', name: 'Skyline Terrace Desk', code: 'F7-STD', totalSeats: 75, occupiedSeats: 45, reservedSeats: 7, availableSeats: 18, noiseLevel: 'silent', openingHours: '08:00-22:00', description: 'Perimeter desk row facing panoramic campus vistas.', amenities: ['Power Outlet', 'Window View'] },
];

// Generate 500 Students
export const generateStudents = (): Student[] => {
  const departments = ['Computer Science', 'Architecture', 'Economics', 'History', 'Biology', 'Electrical Engineering', 'Business Admin', 'Law', 'Mechanical Engineering', 'Mathematics'];
  const years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgrad'];
  const firstNames = ['Aisha', 'Daniel', 'Sofia', 'Marcus', 'Nora', 'Maya', 'Jonah', 'Elena', 'Samuel', 'Hannah', 'Oliver', 'Liam', 'Emma', 'Lucas', 'Mia', 'Ethan', 'Charlotte', 'Noah', 'Amelia', 'Benjamin', 'Chloe', 'Alexander', 'Grace', 'William', 'Zoe', 'James', 'Ella', 'Henry', 'Lily', 'Sebastian'];
  const lastNames = ['Raman', 'Kim', 'Alvarez', 'Bell', 'Okafor', 'Patel', 'Reed', 'Cruz', 'Nair', 'Brooks', 'Torres', 'Chen', 'Wright', 'Osei', 'Williams', 'Davis', 'Miller', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark'];
  const avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
  ];

  const students: Student[] = [];
  for (let i = 1; i <= 500; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[(i * 3) % lastNames.length];
    const dept = departments[i % departments.length];
    const yr = years[i % years.length];
    const regNo = `STU-2024-${String(i).padStart(4, '0')}`;
    const status: StudentStatus = i % 25 === 0 ? 'restricted' : (i % 40 === 0 ? 'suspended' : 'active');
    
    students.push({
      id: `std-${i}`,
      registerNo: regNo,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@northstar.edu`,
      phone: `+44 7700 90${String(i).padStart(4, '0')}`,
      department: dept,
      academicYear: yr,
      status,
      suspensionDays: status === 'suspended' ? (i % 3 === 0 ? 14 : i % 5 === 0 ? 30 : 7) : undefined,
      penaltyCount: i % 15 === 0 ? 2 : (i % 25 === 0 ? 3 : 0),
      avatarUrl: avatars[i % avatars.length],
      currentBookingId: i <= 150 ? `RSV-${87400 + i}` : undefined,
      currentSeatCode: i <= 150 ? `G-${(i % 30) + 1}` : undefined,
      totalReservationsCount: 12 + (i % 45),
      registeredAt: `2024-09-${String((i % 28) + 1).padStart(2, '0')}`,
    });
  }
  return students;
};

export const initialStudents = generateStudents();

// Generate 50 Staff Members
export const generateStaff = (): LibraryStaff[] => {
  const roles: StaffRole[] = ['Library Manager', 'Floor Supervisor', 'Reservation Officer', 'Support Staff'];
  const floors = ['Ground Floor', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'All Floors'];
  const names = [
    'Priya Nair', 'Samuel Reed', 'Elena Torres', 'Jonah Williams', 'Hannah Brooks',
    'Marcus Vance', 'Sarah Jenkins', 'David Chen', 'Rachel Kim', 'Victor Hugo',
    'Amara Okafor', 'Brian Cox', 'Clara Schumann', 'Diego Rivera', 'Evelyn Salt'
  ];

  const staff: LibraryStaff[] = [];
  for (let i = 1; i <= 50; i++) {
    const name = names[(i - 1) % names.length] + (i > 15 ? ` ${Math.floor(i / 15)}` : '');
    const emailName = name.toLowerCase().replace(/[^a-z]/g, '.');
    const role = roles[i % roles.length];
    const status: StaffStatus = i % 7 === 0 ? 'restricted' : (i % 9 === 0 ? 'on-leave' : 'available');

    staff.push({
      id: `stf-${i}`,
      employeeId: `LIB-10${String(i).padStart(2, '0')}`,
      name,
      email: `${emailName}@northstar.edu`,
      phone: `+44 7911 12${String(i).padStart(4, '0')}`,
      role,
      assignedFloor: floors[i % floors.length],
      shiftHours: i % 2 === 0 ? '08:00 - 16:00' : '14:00 - 22:00',
      lastActive: status === 'available' ? `${(i * 3) % 20 + 1} min ago` : (status === 'restricted' ? 'Yesterday' : 'On Leave'),
      status,
      permissionsCount: role === 'Library Manager' ? 16 : (role === 'Floor Supervisor' ? 12 : 8),
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + i}?w=100&auto=format&fit=crop&q=80`,
    });
  }
  return staff;
};

export const initialStaff = generateStaff();

// Generate 1000 Seats across Floors & Zones
export const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const seatTypes: Seat['seatType'][] = ['Standard Desk', 'Silent Box', 'Group Pod', 'Computer Station', 'Window Bench'];
  let seatCounter = 1;

  initialFloors.forEach((floor) => {
    const floorZones = initialZones.filter(z => z.floorId === floor.id);
    const seatsPerZone = Math.floor(floor.totalSeats / floorZones.length);

    floorZones.forEach((zone) => {
      for (let s = 1; s <= seatsPerZone; s++) {
        const codePrefix = floor.number === 0 ? 'G' : `F${floor.number}`;
        const seatCode = `${codePrefix}-${s}`;

        let status: Seat['status'] = 'available';
        if (s % 3 === 0) status = 'occupied';
        else if (s % 7 === 0) status = 'reserved';
        else if (s % 23 === 0) status = 'blocked';
        else if (s % 37 === 0) status = 'maintenance';

        const hasRes = status === 'occupied' || status === 'reserved';

        seats.push({
          id: `seat-${seatCounter}`,
          code: seatCode,
          floorId: floor.id,
          floorNumber: floor.number,
          floorName: floor.name,
          zoneId: zone.id,
          zoneName: zone.name,
          status,
          seatType: seatTypes[s % seatTypes.length],
          amenities: ['Power Outlet', s % 2 === 0 ? 'USB Charger' : 'Window View'],
          isAccessible: s % 5 === 0,
          row: Math.ceil(s / 10),
          column: ((s - 1) % 10) + 1,
          currentReservation: hasRes ? {
            id: `RSV-${87400 + (s % 50)}`,
            studentId: `std-${(s % 100) + 1}`,
            studentName: initialStudents[(s % 100)].name,
            department: initialStudents[(s % 100)].department,
            startTime: '10:00',
            endTime: '14:00',
            checkedInAt: status === 'occupied' ? '10:14' : undefined,
          } : undefined,
        });

        seatCounter++;
      }
    });
  });
  return seats;
};

export const initialSeats = generateSeats();

// Generate 1000 Reservations
export const generateReservations = (): Reservation[] => {
  const reservations: Reservation[] = [];
  const statuses: Reservation['status'][] = ['confirmed', 'checked-in', 'late', 'completed', 'rejected', 'cancelled', 'no-show'];

  for (let i = 1; i <= 1000; i++) {
    const student = initialStudents[i % initialStudents.length];
    const seat = initialSeats[i % initialSeats.length];
    const status = statuses[i % statuses.length];
    const rsvId = `RSV-${87400 + i}`;
    
    let checkInStatus: Reservation['checkInStatus'] = 'Checked In';
    if (status === 'confirmed') checkInStatus = 'Pending - 15m';
    else if (status === 'late') checkInStatus = 'Late arrival';
    else if (status === 'completed') checkInStatus = 'Checked out';
    else if (status === 'rejected') checkInStatus = 'Rejected by Admin';
    else if (status === 'cancelled') checkInStatus = 'Cancelled by Student';
    else if (status === 'no-show') checkInStatus = 'Not checked in';

    let timeline: Reservation['timeline'] = [];
    if (status === 'checked-in') {
      timeline = [
        { title: 'Reservation confirmed', timestamp: '09:42 - Self-service', detail: 'Slot allocated automatically', status: 'done' },
        { title: 'QR scanned at turnstile', timestamp: '10:14 - Ground Gate 2', detail: 'Location verified', status: 'done' },
        { title: 'Student checked-in', timestamp: '10:14 - On-time', detail: 'Seat occupancy confirmed', status: 'done' },
        { title: 'Session active', timestamp: 'In progress', detail: '1h 46m remaining', status: 'done' },
      ];
    } else if (status === 'completed') {
      timeline = [
        { title: 'Reservation confirmed', timestamp: '09:42 - Self-service', detail: 'Slot allocated automatically', status: 'done' },
        { title: 'QR scanned at turnstile', timestamp: '10:14 - Ground Gate 2', detail: 'Location verified', status: 'done' },
        { title: 'Student checked-in', timestamp: '10:14 - On-time', detail: 'Seat occupancy confirmed', status: 'done' },
        { title: 'Session completed', timestamp: '14:00 - Normal exit', detail: 'Turnstile checkout verified', status: 'done' },
      ];
    } else if (status === 'late') {
      timeline = [
        { title: 'Reservation confirmed', timestamp: '09:42 - Self-service', detail: 'Slot allocated automatically', status: 'done' },
        { title: 'Late check-in recorded', timestamp: '10:35 - Late entry', detail: '15m grace period exceeded', status: 'done' },
        { title: 'Session active', timestamp: 'In progress', detail: 'Ends at 14:00', status: 'done' },
      ];
    } else if (status === 'no-show') {
      timeline = [
        { title: 'Reservation confirmed', timestamp: '09:42 - Self-service', detail: 'Slot allocated automatically', status: 'done' },
        { title: 'Grace period expired', timestamp: '10:15 - Timeout', detail: 'No check-in within 15 mins', status: 'done' },
        { title: 'Reservation auto-cancelled', timestamp: '10:15 - System release', detail: 'Seat released to available pool', status: 'done' },
      ];
    } else if (status === 'cancelled') {
      timeline = [
        { title: 'Reservation requested', timestamp: '09:30 - Self-service', detail: 'Booking submitted', status: 'done' },
        { title: 'Reservation cancelled', timestamp: '09:50 - Student action', detail: 'Cancelled by student before arrival', status: 'done' },
      ];
    } else if (status === 'rejected') {
      timeline = [
        { title: 'Reservation requested', timestamp: '09:30 - Self-service', detail: 'Booking submitted', status: 'done' },
        { title: 'Reservation rejected', timestamp: '09:45 - Staff action', detail: 'Rejected by library manager', status: 'done' },
      ];
    } else {
      timeline = [
        { title: 'Reservation confirmed', timestamp: '09:42 - Self-service', detail: 'Slot allocated automatically', status: 'done' },
        { title: 'Awaiting student check-in', timestamp: 'Pending - 15m window', detail: 'QR code ready for scanning', status: 'pending' },
      ];
    }

    const dayNum = (i % 31) + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    const dateStr = `2026-07-${dayStr}`;

    reservations.push({
      id: rsvId,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentRegisterNo: student.registerNo,
      department: student.department,
      academicYear: student.academicYear,
      seatId: seat.id,
      seatCode: seat.code,
      floorName: initialFloors.find(f => f.id === seat.floorId)?.name || 'Ground Floor',
      zoneName: seat.zoneName,
      date: dateStr,
      startTime: '10:00',
      endTime: '14:00',
      durationHours: 4,
      status,
      checkInStatus,
      checkedInTime: status === 'checked-in' || status === 'completed' ? '10:14' : undefined,
      createdMethod: i % 4 === 0 ? 'Self-service app' : (i % 4 === 1 ? 'QR reservation' : 'Staff created'),
      qrCodePayload: `NORTHSTAR-LIB-RES:${rsvId}:${student.registerNo}:${seat.code}`,
      timeline,
    });
  }
  return reservations;
};

export const initialReservations = generateReservations();

// Waiting List initial data
export const initialWaitingList: WaitingListEntry[] = [
  { id: 'wl-1', studentId: 'std-201', studentName: 'Priya Shah', studentEmail: 'priya.shah@northstar.edu', registerNo: 'STU-2024-0201', requestedFloor: 'Floor 1 - Quiet Zone', requestedZone: 'North Quiet Study', seatTypePreference: 'Silent Box', waitTimeMinutes: 18, requestTime: '10:30 AM', priorityScore: 92, status: 'waiting' },
  { id: 'wl-2', studentId: 'std-202', studentName: 'Lee Nguyen', studentEmail: 'lee.nguyen@northstar.edu', registerNo: 'STU-2024-0202', requestedFloor: 'Ground Floor', requestedZone: 'Main Reading Hall', seatTypePreference: 'Standard Desk', waitTimeMinutes: 12, requestTime: '10:36 AM', priorityScore: 85, status: 'waiting' },
  { id: 'wl-3', studentId: 'std-203', studentName: 'Tanya Mehta', studentEmail: 'tanya.mehta@northstar.edu', registerNo: 'STU-2024-0203', requestedFloor: 'Floor 2 - Research Hub', requestedZone: 'Data Science Lab', seatTypePreference: 'Computer Station', waitTimeMinutes: 25, requestTime: '10:23 AM', priorityScore: 96, status: 'waiting' },
  { id: 'wl-4', studentId: 'std-204', studentName: 'Carlos Rossi', studentEmail: 'carlos.rossi@northstar.edu', registerNo: 'STU-2024-0204', requestedFloor: 'Floor 3 - Digital Media Lab', requestedZone: 'Audio/Video Suite', seatTypePreference: 'Group Pod', waitTimeMinutes: 5, requestTime: '10:43 AM', priorityScore: 78, status: 'waiting' },
  { id: 'wl-5', studentId: 'std-205', studentName: 'Zainab Ali', studentEmail: 'zainab.ali@northstar.edu', registerNo: 'STU-2024-0205', requestedFloor: 'Floor 7 - Silent Sanctuary', requestedZone: 'Zen Study Gallery', seatTypePreference: 'Window Bench', waitTimeMinutes: 32, requestTime: '10:16 AM', priorityScore: 99, status: 'waiting' },
];

// Audit Logs initial data
export const initialAuditLogs: AuditLog[] = [
  { id: 'log-101', timestamp: '2026-07-31 10:45:12', actorName: 'Avery Morgan', actorRole: 'Administrator', action: 'Reservation Approved', targetResource: 'RSV-87421 (Maya Patel)', details: 'Approved manual quiet zone booking request.', ipAddress: '192.168.1.45', severity: 'info' },
  { id: 'log-102', timestamp: '2026-07-31 10:38:00', actorName: 'System Engine', actorRole: 'Automated Bot', action: 'Floor Capacity Updated', targetResource: 'Floor 3 - West Wing', details: 'Added 24 study seats to active inventory.', ipAddress: '127.0.0.1', severity: 'info' },
  { id: 'log-103', timestamp: '2026-07-31 10:22:15', actorName: 'Priya Nair', actorRole: 'Library Manager', action: 'Staff Joined', targetResource: 'Jonah Williams', details: 'Assigned floor supervisor permissions to Floor 3.', ipAddress: '192.168.1.88', severity: 'info' },
  { id: 'log-104', timestamp: '2026-07-31 09:15:30', actorName: 'Avery Morgan', actorRole: 'Administrator', action: 'Policy Revised', targetResource: 'Reservation Rules', details: 'Updated weekend reservation window to 4 hours maximum.', ipAddress: '192.168.1.45', severity: 'warning' },
  { id: 'log-105', timestamp: '2026-07-31 08:30:10', actorName: 'System Engine', actorRole: 'Automated Bot', action: 'No-Show Auto Cancelled', targetResource: 'RSV-87350 (Daniel Kim)', details: 'Auto-released seat G-22 due to 20-min check-in expiry.', ipAddress: '127.0.0.1', severity: 'error' },
];

// Notifications initial data
export const initialNotifications: NotificationItem[] = [
  { id: 'notif-1', title: 'High Occupancy Alert - Floor 2', message: 'Floor 2 Research Hub has reached 94% occupancy capacity.', timestamp: '10 mins ago', type: 'warning', targetGroup: 'All Staff', read: false, author: 'System Monitor' },
  { id: 'notif-2', title: 'System Maintenance Scheduled', message: 'Library QR scanners will undergo firmware updates at 23:00 tonight.', timestamp: '1 hour ago', type: 'system', targetGroup: 'All Administrators & Staff', read: false, author: 'IT Operations' },
  { id: 'notif-3', title: 'Exam Period Policy Broadcast', message: 'Extended 24/7 operating hours begin next Monday on Ground Floor.', timestamp: '3 hours ago', type: 'broadcast', targetGroup: 'All Students & Staff', read: true, author: 'Avery Morgan' },
  { id: 'notif-4', title: 'Emergency Drill Reminder', message: 'Scheduled fire alarm test on Floor 6 at 15:00 today.', timestamp: 'Yesterday', type: 'emergency', targetGroup: 'Floor 6 Visitors', read: true, author: 'Safety Office' },
];

// Reports initial data
export const initialReports: ReportItem[] = [
  { id: 'rep-01', title: 'Monthly Library Seat Utilization Report', type: 'occupancy', generatedAt: '2026-07-31 08:00', generatedBy: 'Avery Morgan', fileSize: '2.4 MB', downloadUrl: '#', recordCount: 14200, period: 'July 2026' },
  { id: 'rep-02', title: 'Student No-Show & Penalty Audit', type: 'noshow', generatedAt: '2026-07-30 18:30', generatedBy: 'Priya Nair', fileSize: '1.1 MB', downloadUrl: '#', recordCount: 380, period: 'Last 30 Days' },
  { id: 'rep-03', title: 'Peak Hours Load & Queue Analysis', type: 'peakhours', generatedAt: '2026-07-28 12:00', generatedBy: 'System Automated', fileSize: '4.8 MB', downloadUrl: '#', recordCount: 28900, period: 'Q2 2026' },
  { id: 'rep-04', title: 'Staff Verification & QR Audit Log', type: 'staff_activity', generatedAt: '2026-07-25 09:15', generatedBy: 'Avery Morgan', fileSize: '850 KB', downloadUrl: '#', recordCount: 5400, period: 'Weekly' },
];
