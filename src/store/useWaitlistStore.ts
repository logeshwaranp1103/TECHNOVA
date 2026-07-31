import { create } from 'zustand';
import type { WaitlistEntry } from '../types/waitlist';
import type { SystemPolicy } from '../types/policy';
import type { Reservation } from '../types/reservation';
import { api } from '../services/api';

interface WaitlistState {
  entries: WaitlistEntry[];
  policy: SystemPolicy | null;
  isLoading: boolean;

  fetchData: () => Promise<void>;
  updatePolicyWindow: (minutes: number) => Promise<void>;
  handleReservationCancellation: (date: string, timeSlot: string) => Promise<void>;
  simulateAccept: (entryId: string) => Promise<void>;
  simulateDecline: (entryId: string) => Promise<void>;
  checkAutoExpiries: () => Promise<void>;
}

export const useWaitlistStore = create<WaitlistState>((set, get) => ({
  entries: [],
  policy: null,
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [entries, policy] = await Promise.all([
        api.getWaitlist(),
        api.getPolicies(),
      ]);
      set({ entries, policy, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  updatePolicyWindow: async (minutes: number) => {
    const current = get().policy;
    if (!current) return;
    const updated = { ...current, waitlistResponseWindowMinutes: minutes };
    await api.updatePolicies(updated);
    set({ policy: updated });
  },

  handleReservationCancellation: async (date: string, timeSlot: string) => {
    let { entries, policy } = get();
    if (!policy) {
      policy = await api.getPolicies();
    }
    const responseWindowMinutes = policy?.waitlistResponseWindowMinutes || 15;

    // Filter matching date & time slot queue in WAITING status, sorted by FCFS joinedAt
    const waitingQueue = entries
      .filter((e) => e.date === date && e.preferredTimeSlot === timeSlot && e.status === 'WAITING')
      .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

    if (waitingQueue.length > 0) {
      const nextCandidate = waitingQueue[0];
      const now = new Date();
      const expiry = new Date(now.getTime() + responseWindowMinutes * 60 * 1000);

      const updatedEntry: WaitlistEntry = {
        ...nextCandidate,
        status: 'NOTIFIED',
        notifiedAt: now.toISOString(),
        responseExpiry: expiry.toISOString(),
      };

      const updatedEntries = entries.map((e) => (e.id === nextCandidate.id ? updatedEntry : e));
      await api.updateWaitlistEntry(updatedEntry);
      set({ entries: updatedEntries });

      // Trigger notification
      await api.addNotification({
        id: `notif-${Date.now()}`,
        userId: nextCandidate.userId,
        type: 'WAITLIST_OFFERED',
        title: 'Waitlist seat offered',
        message: `A seat is now available for ${date} (${timeSlot}). Accept or decline within ${responseWindowMinutes} minutes.`,
        isRead: false,
        createdAt: now.toISOString(),
      });
    } else {
      // Waiting list exhausted
      await api.addNotification({
        id: `notif-${Date.now()}`,
        userId: 'system',
        type: 'WAITLIST_EXHAUSTED',
        title: 'Waiting list exhausted — seat now open',
        message: `Waiting list for ${date} (${timeSlot}) is now empty. Seat is open for general booking.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  },

  simulateAccept: async (entryId: string) => {
    const { entries } = get();
    const entry = entries.find((e) => e.id === entryId);

    // Guard against race conditions (if timer expired or already answered)
    if (!entry || entry.status !== 'NOTIFIED') return;

    const now = new Date();
    const updatedEntry: WaitlistEntry = {
      ...entry,
      status: 'ACCEPTED',
    };

    // Auto-create reservation for student
    const newReservation: Reservation = {
      id: `res-wl-${Date.now().toString().slice(-4)}`,
      seatId: 's-101', // Assigned matching seat
      seatNumber: 'F1-01',
      floorId: entry.floorId || 'floor-1',
      floorName: entry.floorName || 'Ground Floor',
      userId: entry.userId,
      userName: entry.userName,
      userCollegeId: entry.userCollegeId,
      userRole: 'STUDENT',
      date: entry.date,
      startTime: entry.preferredTimeSlot.split('-')[0]?.trim() || '15:00',
      endTime: entry.preferredTimeSlot.split('-')[1]?.trim() || '18:00',
      status: 'UPCOMING',
      purpose: 'Waitlist Auto-Resolution',
      createdAt: now.toISOString(),
    };

    await api.createReservation(newReservation);
    await api.updateWaitlistEntry(updatedEntry);

    const updatedEntries = entries.map((e) => (e.id === entryId ? updatedEntry : e));
    set({ entries: updatedEntries });

    // Trigger notification
    await api.addNotification({
      id: `notif-${Date.now()}`,
      userId: entry.userId,
      type: 'WAITLIST_ACCEPTED',
      title: 'Waitlist seat accepted',
      message: `Reservation confirmed for ${entry.userName} on ${entry.date} (${entry.preferredTimeSlot}).`,
      isRead: false,
      createdAt: now.toISOString(),
    });
  },

  simulateDecline: async (entryId: string) => {
    const { entries } = get();
    const entry = entries.find((e) => e.id === entryId);

    // Guard against race conditions
    if (!entry || entry.status !== 'NOTIFIED') return;

    const now = new Date();
    const updatedEntry: WaitlistEntry = {
      ...entry,
      status: 'DECLINED',
    };

    await api.updateWaitlistEntry(updatedEntry);
    const updatedEntries = entries.map((e) => (e.id === entryId ? updatedEntry : e));
    set({ entries: updatedEntries });

    await api.addNotification({
      id: `notif-${Date.now()}`,
      userId: entry.userId,
      type: 'WAITLIST_EXPIRED',
      title: 'Waitlist seat declined/expired — offering to next student',
      message: `Offer for ${entry.userName} declined. Offering slot ${entry.date} (${entry.preferredTimeSlot}) to next student in queue.`,
      isRead: false,
      createdAt: now.toISOString(),
    });

    // Advance queue to next student for same date + time slot
    await get().handleReservationCancellation(entry.date, entry.preferredTimeSlot);
  },

  checkAutoExpiries: async () => {
    const { entries } = get();
    const nowMs = Date.now();

    const expiredEntries = entries.filter(
      (e) =>
        e.status === 'NOTIFIED' &&
        e.responseExpiry &&
        new Date(e.responseExpiry).getTime() <= nowMs
    );

    for (const entry of expiredEntries) {
      // Re-check status to avoid race condition
      const freshEntry = get().entries.find((e) => e.id === entry.id);
      if (!freshEntry || freshEntry.status !== 'NOTIFIED') continue;

      const updatedEntry: WaitlistEntry = {
        ...freshEntry,
        status: 'EXPIRED',
      };

      await api.updateWaitlistEntry(updatedEntry);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === entry.id ? updatedEntry : e)),
      }));

      await api.addNotification({
        id: `notif-${Date.now()}`,
        userId: entry.userId,
        type: 'WAITLIST_EXPIRED',
        title: 'Waitlist seat declined/expired — offering to next student',
        message: `Response window expired for ${entry.userName}. Offering slot ${entry.date} (${entry.preferredTimeSlot}) to next in queue.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Advance queue
      await get().handleReservationCancellation(entry.date, entry.preferredTimeSlot);
    }
  },
}));
