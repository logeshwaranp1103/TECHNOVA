export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED';

export type SeatType = 'SILENT_STUDY' | 'GROUP_TABLE' | 'COMPUTER_DESK' | 'ERGONOMIC_RECLINER';

export interface Floor {
  id: string;
  floorNumber: number;
  name: string;
  description: string;
  totalSeats: number;
  isActive: boolean;
}

export interface Seat {
  id: string;
  seatNumber: string;
  floorId: string;
  status: SeatStatus;
  type: SeatType;
  hasPowerOutlet: boolean;
  hasMonitor: boolean;
  isNearWindow: boolean;
  gridRow: number;
  gridCol: number;
  notes?: string;
}
