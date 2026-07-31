export type ReservationStatus = 
  | 'UPCOMING'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Reservation {
  id: string;
  bookingCode: string;
  userId: string;
  userName: string;
  userCollegeId: string;
  seatId: string;
  seatNumber: string;
  floorId: string;
  floorName: string;
  date: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: ReservationStatus;
  checkInGraceExpiry: string; // ISO string timestamp
  checkedInAt?: string;
  checkedOutAt?: string;
  createdAt: string;
  qrCodeData: string;
}
