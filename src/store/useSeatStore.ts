import { create } from 'zustand';
import type { Floor, Seat, SeatStatus, SeatType } from '../types/seat';
import { api } from '../services/api';

interface SeatState {
  floors: Floor[];
  seats: Seat[];
  selectedFloorId: string;
  typeFilter: SeatType | 'ALL';
  statusFilter: SeatStatus | 'ALL';
  isLoading: boolean;
  selectedSeat: Seat | null;

  fetchData: () => Promise<void>;
  setSelectedFloorId: (floorId: string) => void;
  setTypeFilter: (type: SeatType | 'ALL') => void;
  setStatusFilter: (status: SeatStatus | 'ALL') => void;
  setSelectedSeat: (seat: Seat | null) => void;
  updateSeatStatus: (seatId: string, status: SeatStatus, notes?: string) => Promise<void>;
  bulkUpdateSeatStatus: (seatIds: string[], status: SeatStatus) => Promise<void>;
}

export const useSeatStore = create<SeatState>((set, get) => ({
  floors: [],
  seats: [],
  selectedFloorId: 'floor-1',
  typeFilter: 'ALL',
  statusFilter: 'ALL',
  isLoading: false,
  selectedSeat: null,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [floors, seats] = await Promise.all([api.getFloors(), api.getSeats()]);
      set({
        floors,
        seats,
        isLoading: false,
        selectedFloorId: get().selectedFloorId || (floors[0]?.id ?? 'floor-1'),
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setSelectedFloorId: (floorId) => set({ selectedFloorId: floorId, selectedSeat: null }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setSelectedSeat: (seat) => set({ selectedSeat: seat }),

  updateSeatStatus: async (seatId, status, notes) => {
    const updated = await api.updateSeatStatus(seatId, status, notes);
    set({
      seats: get().seats.map(s => (s.id === seatId ? updated : s)),
      selectedSeat: get().selectedSeat?.id === seatId ? updated : get().selectedSeat,
    });
  },

  bulkUpdateSeatStatus: async (seatIds, status) => {
    await api.bulkUpdateSeatStatus(seatIds, status);
    set({
      seats: get().seats.map(s => (seatIds.includes(s.id) ? { ...s, status } : s)),
    });
  },
}));
