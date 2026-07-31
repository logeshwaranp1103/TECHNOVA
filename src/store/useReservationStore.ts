import { create } from 'zustand';
import type { Reservation } from '../types/reservation';
import type { WaitlistEntry } from '../types/waitlist';
import { api } from '../services/api';
import { useWaitlistStore } from './useWaitlistStore';

interface ReservationState {
  reservations: Reservation[];
  waitlist: WaitlistEntry[];
  isLoading: boolean;
  error: string | null;

  fetchReservations: () => Promise<void>;
  fetchWaitlist: () => Promise<void>;
  cancelReservation: (id: string, reason?: string) => Promise<Reservation>;
  checkInReservation: (idOrCode: string) => Promise<Reservation>;
  checkOutReservation: (id: string) => Promise<Reservation>;
  markNoShow: (id: string) => Promise<Reservation>;
}

export const useReservationStore = create<ReservationState>((set, get) => ({
  reservations: [],
  waitlist: [],
  isLoading: false,
  error: null,

  fetchReservations: async () => {
    set({ isLoading: true });
    try {
      const reservations = await api.getReservations();
      set({ reservations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchWaitlist: async () => {
    try {
      const waitlist = await api.getWaitlist();
      set({ waitlist });
    } catch {
      // Swallowed catch
    }
  },

  cancelReservation: async (id, reason) => {
    const updated = await api.cancelReservation(id, reason);
    set({
      reservations: get().reservations.map(r => (r.id === id ? updated : r)),
    });
    const timeSlot = `${updated.startTime} - ${updated.endTime}`;
    useWaitlistStore.getState().handleReservationCancellation(updated.date, timeSlot);
    return updated;
  },

  checkInReservation: async (idOrCode) => {
    const updated = await api.checkInReservation(idOrCode);
    set({
      reservations: get().reservations.map(r => (r.id === updated.id ? updated : r)),
    });
    return updated;
  },

  checkOutReservation: async (id) => {
    const updated = await api.checkOutReservation(id);
    set({
      reservations: get().reservations.map(r => (r.id === id ? updated : r)),
    });
    return updated;
  },

  markNoShow: async (id) => {
    const updated = await api.markNoShow(id);
    set({
      reservations: get().reservations.map(r => (r.id === id ? updated : r)),
    });
    return updated;
  },
}));
