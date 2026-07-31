import type { User } from '../types/user';
import type { Floor, Seat, SeatStatus } from '../types/seat';
import type { Reservation } from '../types/reservation';
import type { WaitlistEntry } from '../types/waitlist';
import type { SystemNotification } from '../types/notification';
import type { SystemPolicy } from '../types/policy';
import { STORAGE_KEYS, initializeSeedData } from './seedData';

// Ensure localStorage is seeded on load
initializeSeedData();

// Helper for simulated network delay
const delay = (ms = 200): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const getItem = <T>(key: string): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : ([] as unknown as T);
};

const setItem = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // --- AUTH SERVICES ---
  async login(collegeId: string, _password: string): Promise<User> {
    await delay(250);
    const users: User[] = getItem(STORAGE_KEYS.USERS);
    const user = users.find(u => u.collegeId.toLowerCase() === collegeId.toLowerCase());
    if (!user) {
      throw new Error('Invalid Staff ID or Password.');
    }
    if (user.status === 'INACTIVE') {
      throw new Error('Account deactivated. Please contact library admin.');
    }
    setItem(STORAGE_KEYS.CURRENT_USER, user);
    return user;
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(100);
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  async setCurrentUser(user: User): Promise<void> {
    await delay(100);
    setItem(STORAGE_KEYS.CURRENT_USER, user);
  },

  // --- FLOORS & SEATS ---
  async getFloors(): Promise<Floor[]> {
    await delay(150);
    return getItem<Floor[]>(STORAGE_KEYS.FLOORS);
  },

  async getSeats(): Promise<Seat[]> {
    await delay(150);
    return getItem<Seat[]>(STORAGE_KEYS.SEATS);
  },

  async updateSeatStatus(seatId: string, status: SeatStatus, notes?: string): Promise<Seat> {
    await delay(200);
    const seats = getItem<Seat[]>(STORAGE_KEYS.SEATS);
    const idx = seats.findIndex(s => s.id === seatId);
    if (idx === -1) throw new Error('Seat not found');
    seats[idx].status = status;
    if (notes !== undefined) {
      seats[idx].notes = notes;
    } else if (status === 'AVAILABLE' || status === 'OCCUPIED' || status === 'RESERVED') {
      delete seats[idx].notes;
    }
    setItem(STORAGE_KEYS.SEATS, seats);
    return seats[idx];
  },

  async bulkUpdateSeatStatus(seatIds: string[], status: SeatStatus): Promise<void> {
    await delay(250);
    const seats = getItem<Seat[]>(STORAGE_KEYS.SEATS);
    seats.forEach(s => {
      if (seatIds.includes(s.id)) {
        s.status = status;
        if (status === 'AVAILABLE' || status === 'OCCUPIED' || status === 'RESERVED') {
          delete s.notes;
        }
      }
    });
    setItem(STORAGE_KEYS.SEATS, seats);
  },

  // --- RESERVATIONS ---
  async getReservations(): Promise<Reservation[]> {
    await delay(150);
    return getItem<Reservation[]>(STORAGE_KEYS.RESERVATIONS);
  },

  async cancelReservation(id: string, _reason?: string): Promise<Reservation> {
    await delay(200);
    const reservations = getItem<Reservation[]>(STORAGE_KEYS.RESERVATIONS);
    const idx = reservations.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Reservation not found');

    reservations[idx].status = 'CANCELLED';
    setItem(STORAGE_KEYS.RESERVATIONS, reservations);

    // Release seat
    const seats = getItem<Seat[]>(STORAGE_KEYS.SEATS);
    const sIdx = seats.findIndex(s => s.id === reservations[idx].seatId);
    if (sIdx !== -1) {
      seats[sIdx].status = 'AVAILABLE';
      setItem(STORAGE_KEYS.SEATS, seats);
    }

    return reservations[idx];
  },

  async checkInReservation(idOrCode: string): Promise<Reservation> {
    await delay(250);
    const reservations = getItem<Reservation[]>(STORAGE_KEYS.RESERVATIONS);
    const idx = reservations.findIndex(r => r.id === idOrCode || r.bookingCode === idOrCode);
    if (idx === -1) throw new Error('Invalid Booking Code or QR Data');

    const res = reservations[idx];
    if (res.status === 'CHECKED_IN') throw new Error('Reservation is already checked in!');
    if (res.status === 'CANCELLED' || res.status === 'NO_SHOW') {
      throw new Error(`Cannot check in. Reservation is ${res.status}.`);
    }

    res.status = 'CHECKED_IN';
    res.checkedInAt = new Date().toISOString();
    setItem(STORAGE_KEYS.RESERVATIONS, reservations);

    // Update seat to OCCUPIED
    const seats = getItem<Seat[]>(STORAGE_KEYS.SEATS);
    const sIdx = seats.findIndex(s => s.id === res.seatId);
    if (sIdx !== -1) {
      seats[sIdx].status = 'OCCUPIED';
      setItem(STORAGE_KEYS.SEATS, seats);
    }

    return res;
  },

  async checkOutReservation(id: string): Promise<Reservation> {
    await delay(200);
    const reservations = getItem<Reservation[]>(STORAGE_KEYS.RESERVATIONS);
    const idx = reservations.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Reservation not found');

    const res = reservations[idx];
    res.status = 'COMPLETED';
    res.checkedOutAt = new Date().toISOString();
    setItem(STORAGE_KEYS.RESERVATIONS, reservations);

    // Release seat
    const seats = getItem<Seat[]>(STORAGE_KEYS.SEATS);
    const sIdx = seats.findIndex(s => s.id === res.seatId);
    if (sIdx !== -1) {
      seats[sIdx].status = 'AVAILABLE';
      setItem(STORAGE_KEYS.SEATS, seats);
    }

    return res;
  },

  async markNoShow(id: string): Promise<Reservation> {
    await delay(200);
    const reservations = getItem<Reservation[]>(STORAGE_KEYS.RESERVATIONS);
    const idx = reservations.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Reservation not found');

    const res = reservations[idx];
    res.status = 'NO_SHOW';
    setItem(STORAGE_KEYS.RESERVATIONS, reservations);

    // Release seat
    const seats = getItem<Seat[]>(STORAGE_KEYS.SEATS);
    const sIdx = seats.findIndex(s => s.id === res.seatId);
    if (sIdx !== -1) {
      seats[sIdx].status = 'AVAILABLE';
      setItem(STORAGE_KEYS.SEATS, seats);
    }

    return res;
  },

  // --- WAITLIST ---
  async getWaitlist(): Promise<WaitlistEntry[]> {
    await delay(150);
    return getItem<WaitlistEntry[]>(STORAGE_KEYS.WAITLIST);
  },

  async updateWaitlistEntry(entry: WaitlistEntry): Promise<WaitlistEntry> {
    await delay(150);
    const list = getItem<WaitlistEntry[]>(STORAGE_KEYS.WAITLIST);
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx !== -1) {
      list[idx] = entry;
    } else {
      list.push(entry);
    }
    setItem(STORAGE_KEYS.WAITLIST, list);
    return entry;
  },

  async createReservation(reservation: Reservation): Promise<Reservation> {
    await delay(150);
    const list = getItem<Reservation[]>(STORAGE_KEYS.RESERVATIONS);
    setItem(STORAGE_KEYS.RESERVATIONS, [reservation, ...list]);
    return reservation;
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string): Promise<SystemNotification[]> {
    await delay(100);
    const all = getItem<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS);
    return all.filter(n => n.userId === userId);
  },

  async markNotificationRead(id: string): Promise<void> {
    await delay(100);
    const notifications = getItem<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS);
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx].isRead = true;
      setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
  },

  async addNotification(notif: SystemNotification): Promise<void> {
    const notifications = getItem<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS);
    setItem(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifications]);
  },

  // --- POLICIES ---
  async getPolicies(): Promise<SystemPolicy> {
    await delay(100);
    return getItem<SystemPolicy>(STORAGE_KEYS.POLICIES);
  },

  async updatePolicies(policy: SystemPolicy): Promise<SystemPolicy> {
    await delay(150);
    setItem(STORAGE_KEYS.POLICIES, policy);
    return policy;
  },
};
