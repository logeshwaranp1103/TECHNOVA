import { useReservationStore } from '../store/useReservationStore';
import { useSeatStore } from '../store/useSeatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

let intervalId: number | null = null;

export const startSimulationEngine = () => {
  if (intervalId) return;

  intervalId = window.setInterval(async () => {
    const { currentUser } = useAuthStore.getState();
    const { reservations, markNoShow, checkOutReservation } = useReservationStore.getState();
    const { seats, updateSeatStatus } = useSeatStore.getState();
    const { triggerNotification } = useNotificationStore.getState();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Check for expired check-in grace periods (Auto No-Show)
    for (const res of reservations) {
      if (res.status === 'UPCOMING' && res.checkInGraceExpiry) {
        if (new Date(res.checkInGraceExpiry) < now) {
          await markNoShow(res.id);
          if (currentUser) {
            triggerNotification({
              userId: currentUser.id,
              type: 'EXPIRY_WARNING',
              title: 'Reservation Auto-Cancelled (No-Show)',
              message: `Reservation for Seat ${res.seatNumber} was cancelled as check-in grace period expired.`,
            });
          }
        }
      }

      // 2. Check for completed sessions (End Time Reached for today)
      if (res.status === 'CHECKED_IN' && res.endTime && res.date === todayStr) {
        if (res.endTime <= currentTimeStr) {
          await checkOutReservation(res.id);
          if (currentUser) {
            triggerNotification({
              userId: currentUser.id,
              type: 'BOOKING_CONFIRMATION',
              title: 'Session Completed',
              message: `Session at Seat ${res.seatNumber} has ended. Seat is now released.`,
            });
          }
        }
      }
    }

    // 3. Dynamic Seat Status Flips for Demo Realism (Only on unassigned available seats)
    if (Math.random() < 0.15 && seats.length > 0) {
      const activeSeatIds = new Set(reservations.filter(r => r.status === 'CHECKED_IN' || r.status === 'UPCOMING').map(r => r.seatId));
      const availSeats = seats.filter(s => s.status === 'AVAILABLE' && !activeSeatIds.has(s.id));
      if (availSeats.length > 0) {
        const randomSeat = availSeats[Math.floor(Math.random() * availSeats.length)];
        updateSeatStatus(randomSeat.id, 'OCCUPIED');
      }
    }
  }, 6000);
};

export const stopSimulationEngine = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
