import { db } from './mockDatabase';
import { addDays, format } from 'date-fns';
import { waitlistService } from './waitlistService';

export const bookingService = {

  getTomorrowDateStr() {
    const tomorrow = addDays(new Date(), 1);
    return format(tomorrow, 'yyyy-MM-dd');
  },

  async getFloors() {
    const floors = await db.read('seatsync_floors');
    return floors;
  },

  async getSlotsAvailability(dateStr) {
    const slots = await db.read('seatsync_slots');
    const bookings = await db.read('seatsync_bookings');
    const seats = await db.read('seatsync_seats');
    const activeSeatsCount = seats.filter(s => s.status === 'active').length;

    return slots.map(slot => {
      if (!slot.active) {
        return { ...slot, availableCount: 0, totalCount: activeSeatsCount, isFullyBooked: true };
      }
      const slotBookings = bookings.filter(b => b.bookingDate === dateStr && b.slotId === slot.id && b.status === 'confirmed');
      const availableCount = activeSeatsCount - slotBookings.length;
      return {
        ...slot,
        availableCount,
        totalCount: activeSeatsCount,
        isFullyBooked: availableCount <= 0
      };
    });
  },

  async getSeatsForSlot(floorId, dateStr, slotId) {
    const seats = await db.read('seatsync_seats');
    const bookings = await db.read('seatsync_bookings');

    const floorSeats = seats.filter(s => s.floorId === floorId);

    return floorSeats.map(seat => {
      let uiStatus = 'Available';

      if (seat.status === 'blocked') uiStatus = 'Blocked';
      else if (seat.status === 'maintenance') uiStatus = 'Under Maintenance';
      else {
        const isBooked = bookings.some(b =>
          b.seatId === seat.id &&
          b.bookingDate === dateStr &&
          b.slotId === slotId &&
          b.status === 'confirmed'
        );
        if (isBooked) uiStatus = 'Occupied';
      }

      return {
        ...seat,
        ui_status: uiStatus
      };
    });
  },

  async createBooking(student, dateStr, slot, floorId, seatId) {
    const bookings = await db.read('seatsync_bookings');

    // Check if student already booked for this date and slot
    const hasBookedSlot = bookings.some(b =>
      b.studentId === student.id &&
      b.bookingDate === dateStr &&
      b.slotId === slot.id &&
      b.status === 'confirmed'
    );
    if (hasBookedSlot) {
      throw new Error('You have already booked a seat for this time slot.');
    }

    // Check if seat is already taken
    const isSeatTaken = bookings.some(b =>
      b.seatId === seatId &&
      b.bookingDate === dateStr &&
      b.slotId === slot.id &&
      b.status === 'confirmed'
    );
    if (isSeatTaken) {
      throw new Error('This seat was just booked by another student. Please select another seat.');
    }

    const seats = await db.read('seatsync_seats');
    const seat = seats.find(s => s.id === seatId);

    // Create booking
    const newBooking = {
      id: `BK-${dateStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      studentId: student.id,
      studentName: student.name,
      collegeId: student.collegeId,
      bookingDate: dateStr,
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      floorId: floorId,
      seatId: seatId,
      seatNumber: seat.seatNumber,
      zoneId: seat.zoneId,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    await db.write('seatsync_bookings', bookings);

    // Activity log
    const logs = await db.read('seatsync_activity_logs');
    logs.push({
      userId: student.id,
      action: 'create_booking',
      entityId: newBooking.id,
      timestamp: new Date().toISOString()
    });
    await db.write('seatsync_activity_logs', logs);

    // Notification
    const notifs = await db.read('seatsync_notifications');
    notifs.push({
      id: Date.now().toString(),
      userId: student.id,
      title: 'Booking Confirmed',
      message: `Your booking for seat ${seat.seatNumber} is confirmed for ${slot.label}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });
    await db.write('seatsync_notifications', notifs);

    return newBooking;
  },

  async getMyBookings(studentId) {
    const bookings = await db.read('seatsync_bookings');
    return bookings.filter(b => b.studentId === studentId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async cancelBooking(bookingId, studentId) {
    const bookings = await db.read('seatsync_bookings');
    const booking = bookings.find(b => b.id === bookingId && b.studentId === studentId);

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'confirmed') throw new Error('Only confirmed bookings can be cancelled');

    booking.status = 'cancelled';
    await db.write('seatsync_bookings', bookings);

    const logs = await db.read('seatsync_activity_logs');
    logs.push({ userId: studentId, action: 'cancel_booking', entityId: bookingId, timestamp: new Date().toISOString() });
    await db.write('seatsync_activity_logs', logs);

    // Trigger automatic allocation for waiting list
    try {
      await waitlistService.allocateReleasedSeat({
        bookingDate: booking.bookingDate,
        slotId: booking.slotId,
        seatId: booking.seatId,
        trigger: 'cancellation'
      });
    } catch (err) {
      console.warn('Auto-allocation warning on booking cancellation:', err);
    }

    return booking;
  },

  async checkoutBooking(bookingId, studentId) {
    const bookings = await db.read('seatsync_bookings');
    const booking = bookings.find(b => b.id === bookingId && b.studentId === studentId);

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'active') throw new Error('Only active bookings can be checked out');

    booking.status = 'completed';
    booking.checkedOutAt = new Date().toISOString();
    await db.write('seatsync_bookings', bookings);

    const logs = await db.read('seatsync_activity_logs');
    logs.push({ userId: studentId, action: 'check_out', entityId: bookingId, timestamp: new Date().toISOString() });
    await db.write('seatsync_activity_logs', logs);

    return booking;
  },

  async checkinBooking(bookingId, studentId) {
    const bookings = await db.read('seatsync_bookings');
    const booking = bookings.find(b => b.id === bookingId && b.studentId === studentId);

    if (!booking) throw new Error('Booking not found');
    if (booking.status !== 'confirmed') throw new Error('Invalid status for check-in');

    booking.status = 'active';
    booking.checkedInAt = new Date().toISOString();
    await db.write('seatsync_bookings', bookings);

    const logs = await db.read('seatsync_activity_logs');
    logs.push({ userId: studentId, action: 'check_in', entityId: bookingId, timestamp: new Date().toISOString() });
    await db.write('seatsync_activity_logs', logs);

    return booking;
  }
};
