import { db } from './mockDatabase';
import { bookingService } from './bookingService';

export const dashboardService = {
  async getStudentStats(studentId) {
    const bookings = await bookingService.getMyBookings(studentId);
    const tomorrowStr = bookingService.getTomorrowDateStr();

    const tomorrowsBookings = bookings.filter(
      b => b.bookingDate === tomorrowStr && b.status === 'confirmed'
    ).length;

    const completedReservations = bookings.filter(b => b.status === 'completed').length;
    const cancelledReservations = bookings.filter(b => b.status === 'cancelled').length;
    const activeBooking = bookings.find(b => b.status === 'active') || null;
    const upcomingBooking = bookings.find(b => b.status === 'confirmed') || null;

    // Fetch activity logs for student
    const logs = (await db.read('seatsync_activity_logs')) || [];
    const studentLogs = logs
      .filter(l => l.userId === studentId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);

    return {
      tomorrowsBookings,
      activeBooking,
      upcomingBooking,
      completedReservations,
      cancelledReservations,
      totalStudyHours: completedReservations * 1,
      recentActivity: studentLogs
    };
  },

  async getLibraryInfo() {
    const seats = (await db.read('seatsync_seats')) || [];
    const floors = (await db.read('seatsync_floors')) || [];
    const activeSeatsCount = seats.filter(s => s.status === 'active').length;

    return {
      status: 'Open',
      operatingHours: '08:00 AM – 10:00 PM',
      totalFloors: floors.length,
      totalSeats: activeSeatsCount,
      notice: 'Quiet Study Hours are in effect in Zone A from 6:00 PM onwards.'
    };
  }
};
