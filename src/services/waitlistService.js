import { db } from './mockDatabase';

/**
 * Waitlist Service for SeatSync
 * Handles queue management, concurrency locks, automatic seat allocation, and demo test scenarios
 */
export const waitlistService = {

  // Acquire a short-lived concurrency lock in LocalStorage
  async acquireLock(resourceKey) {
    const lockKey = 'seatsync_waitlist_allocation_lock';
    const ownerId = `tab-${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();
    const expiresAt = now + 4000; // 4 second lock

    try {
      const existing = JSON.parse(localStorage.getItem(lockKey) || 'null');
      if (existing && existing.expiresAt > now) {
        await new Promise(r => setTimeout(r, 200));
      }
      const lockData = { ownerId, resourceKey, acquiredAt: new Date().toISOString(), expiresAt };
      localStorage.setItem(lockKey, JSON.stringify(lockData));
      return ownerId;
    } catch (e) {
      return null;
    }
  },

  releaseLock() {
    localStorage.removeItem('seatsync_waitlist_allocation_lock');
  },

  // Recalculate queue positions for all waiting entries of a date & slot
  async recalculatePositions(dateStr, slotId) {
    const waitlists = (await db.read('seatsync_waitlists')) || [];
    
    // Sort waiting entries strictly by joinedAt, then tie-breaker ID
    const waitingEntries = waitlists
      .filter(w => w.bookingDate === dateStr && w.slotId === slotId && w.status === 'waiting')
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt) || a.id.localeCompare(b.id));

    let updated = false;
    waitingEntries.forEach((entry, idx) => {
      const newPos = idx + 1;
      if (entry.position !== newPos) {
        entry.position = newPos;
        updated = true;
      }
    });

    if (updated) {
      await db.write('seatsync_waitlists', waitlists);
    }

    return waitlists;
  },

  // Check if a student can join the waitlist
  async canJoinWaitlist(studentId, dateStr, slotId) {
    const bookings = (await db.read('seatsync_bookings')) || [];
    const waitlists = (await db.read('seatsync_waitlists')) || [];

    // Check if student has a confirmed or active booking for this date & slot
    const hasBooking = bookings.some(b => 
      b.studentId === studentId && 
      b.bookingDate === dateStr && 
      b.slotId === slotId && 
      (b.status === 'confirmed' || b.status === 'active')
    );
    if (hasBooking) {
      return { canJoin: false, reason: 'You already have a confirmed booking for this time slot.' };
    }

    // Check if student already has an active waitlist entry
    const activeWaitlist = waitlists.find(w => 
      w.studentId === studentId && 
      w.bookingDate === dateStr && 
      w.slotId === slotId && 
      (w.status === 'waiting' || w.status === 'allocating')
    );
    if (activeWaitlist) {
      return { canJoin: false, reason: 'You are already on the waiting list for this time slot.', existingEntry: activeWaitlist };
    }

    return { canJoin: true };
  },

  // Join the waiting list
  async joinWaitlist({ student, dateStr, slot, preferredFloorId = null, preferredZoneId = null, allowAnySeat = true, notificationPreference = 'In-App & System Notifications' }) {
    const check = await this.canJoinWaitlist(student.id, dateStr, slot.id);
    if (!check.canJoin) {
      throw new Error(check.reason);
    }

    // Confirm slot is actually full
    const seats = (await db.read('seatsync_seats')) || [];
    const bookings = (await db.read('seatsync_bookings')) || [];
    const activeSeats = seats.filter(s => s.status === 'active');
    const slotBookings = bookings.filter(b => b.bookingDate === dateStr && b.slotId === slot.id && (b.status === 'confirmed' || b.status === 'active'));
    
    if (activeSeats.length - slotBookings.length > 0) {
      throw new Error('A seat is now available for this slot! Please choose your preferred seat on the map instead.');
    }

    const waitlists = (await db.read('seatsync_waitlists')) || [];

    // Calculate position
    const currentQueue = waitlists.filter(w => w.bookingDate === dateStr && w.slotId === slot.id && w.status === 'waiting');
    const position = currentQueue.length + 1;

    const newWaitlist = {
      id: `WL-${dateStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: student.id,
      studentName: student.name,
      registrationNumber: student.collegeId || student.registrationNumber || '24AD042',
      bookingDate: dateStr,
      slotId: slot.id,
      slotLabel: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      preferredFloorId,
      preferredZoneId,
      allowAnySeat,
      position,
      status: 'waiting',
      notificationPreference,
      joinedAt: new Date().toISOString(),
      allocatedAt: null,
      allocatedSeatId: null,
      allocatedBookingId: null,
      cancelledAt: null,
      expiredAt: null,
      skippedAt: null,
      skipReason: null
    };

    waitlists.push(newWaitlist);
    await db.write('seatsync_waitlists', waitlists);

    // Create activity log
    const logs = (await db.read('seatsync_activity_logs')) || [];
    logs.push({
      userId: student.id,
      action: 'join_waitlist',
      entityId: newWaitlist.id,
      timestamp: new Date().toISOString()
    });
    await db.write('seatsync_activity_logs', logs);

    // Notification
    const notifications = (await db.read('seatsync_notifications')) || [];
    notifications.push({
      id: Date.now().toString(),
      userId: student.id,
      title: 'Added to Waiting List',
      message: `You are position #${position} for ${slot.label}. We will notify you when a seat opens up.`,
      type: 'waitlist',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    await db.write('seatsync_notifications', notifications);

    // Broadcast sync
    const channel = new BroadcastChannel('seatsync-updates');
    channel.postMessage({ type: 'WAITLIST_JOINED', waitlist: newWaitlist });

    return newWaitlist;
  },

  // Leave waiting list
  async leaveWaitlist(waitlistId, studentId) {
    const waitlists = (await db.read('seatsync_waitlists')) || [];
    const entry = waitlists.find(w => w.id === waitlistId && w.studentId === studentId);

    if (!entry) throw new Error('Waitlist entry not found');
    if (entry.status !== 'waiting') throw new Error('Only active waiting list entries can be cancelled');

    entry.status = 'cancelled';
    entry.cancelledAt = new Date().toISOString();
    await db.write('seatsync_waitlists', waitlists);

    // Recalculate remaining positions
    await this.recalculatePositions(entry.bookingDate, entry.slotId);

    // Activity log
    const logs = (await db.read('seatsync_activity_logs')) || [];
    logs.push({
      userId: studentId,
      action: 'leave_waitlist',
      entityId: waitlistId,
      timestamp: new Date().toISOString()
    });
    await db.write('seatsync_activity_logs', logs);

    // Notification
    const notifications = (await db.read('seatsync_notifications')) || [];
    notifications.push({
      id: Date.now().toString(),
      userId: studentId,
      title: 'Waiting List Cancelled',
      message: `You have left the waiting list for ${entry.slotLabel || entry.slotId}.`,
      type: 'waitlist',
      isRead: false,
      createdAt: new Date().toISOString()
    });
    await db.write('seatsync_notifications', notifications);

    // Broadcast sync
    const channel = new BroadcastChannel('seatsync-updates');
    channel.postMessage({ type: 'WAITLIST_CANCELLED', waitlistId });

    return entry;
  },

  // Get active & past waitlists for student
  async getStudentWaitlists(studentId) {
    const waitlists = (await db.read('seatsync_waitlists')) || [];
    
    // Auto expire old entries
    await this.expireInvalidEntries();

    const studentEntries = waitlists.filter(w => w.studentId === studentId);

    // Recalculate live queue stats for waiting entries
    for (const entry of studentEntries) {
      if (entry.status === 'waiting') {
        const queue = waitlists
          .filter(w => w.bookingDate === entry.bookingDate && w.slotId === entry.slotId && w.status === 'waiting')
          .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt) || a.id.localeCompare(b.id));
        const currentPos = queue.findIndex(w => w.id === entry.id) + 1;
        entry.position = currentPos > 0 ? currentPos : entry.position;
        entry.totalInQueue = queue.length;
        entry.aheadCount = Math.max(0, entry.position - 1);
      }
    }

    return studentEntries.sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  },

  // Get summary for a specific slot card
  async getWaitlistSummaryForSlot(dateStr, slotId, studentId = null) {
    const waitlists = (await db.read('seatsync_waitlists')) || [];
    const queue = waitlists
      .filter(w => w.bookingDate === dateStr && w.slotId === slotId && (w.status || '').toLowerCase() === 'waiting')
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt) || a.id.localeCompare(b.id));

    let studentPosition = null;
    let isStudentWaiting = false;
    let studentEntry = null;

    if (studentId) {
      const idx = queue.findIndex(w => w.studentId === studentId);
      if (idx !== -1) {
        studentPosition = idx + 1;
        isStudentWaiting = true;
        studentEntry = {
          ...queue[idx],
          position: studentPosition,
          totalInQueue: queue.length
        };
      } else {
        const activeEntry = waitlists.find(w => 
          w.studentId === studentId && 
          w.bookingDate === dateStr && 
          w.slotId === slotId && 
          ['waiting', 'allocating'].includes((w.status || '').toLowerCase())
        );
        if (activeEntry) {
          isStudentWaiting = true;
          studentPosition = activeEntry.position || 1;
          studentEntry = {
            ...activeEntry,
            position: studentPosition,
            totalInQueue: Math.max(queue.length, 1)
          };
        }
      }
    }

    return {
      waitlistCount: queue.length,
      studentPosition,
      isStudentWaiting,
      studentEntry
    };
  },

  // Central Automatic Seat Allocation Function
  async allocateReleasedSeat({ bookingDate, slotId, seatId, trigger = 'cancellation' }) {
    const lockOwner = await this.acquireLock(`${bookingDate}:${slotId}:${seatId}`);
    
    try {
      const seats = (await db.read('seatsync_seats')) || [];
      const bookings = (await db.read('seatsync_bookings')) || [];
      const waitlists = (await db.read('seatsync_waitlists')) || [];

      const seat = seats.find(s => s.id === seatId);
      if (!seat || seat.status !== 'active') return null; // Maintenance or blocked

      // Verify seat is not currently booked by an active/confirmed booking
      const activeBookingOnSeat = bookings.find(b => 
        b.seatId === seatId && 
        b.bookingDate === bookingDate && 
        b.slotId === slotId && 
        (b.status === 'confirmed' || b.status === 'active')
      );
      if (activeBookingOnSeat) return null; // Seat still occupied

      // Get waiting queue sorted by joinedAt
      const waitingQueue = waitlists
        .filter(w => w.bookingDate === bookingDate && w.slotId === slotId && w.status === 'waiting')
        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt) || a.id.localeCompare(b.id));

      if (waitingQueue.length === 0) return null; // No one in queue

      // Find first eligible student
      let candidate = null;
      for (const entry of waitingQueue) {
        // Floor preference check
        if (!entry.allowAnySeat && entry.preferredFloorId && entry.preferredFloorId !== seat.floorId) {
          continue;
        }
        // Zone preference check
        if (!entry.allowAnySeat && entry.preferredZoneId && entry.preferredZoneId !== seat.zoneId) {
          continue;
        }

        // Check if student already has a booking
        const alreadyBooked = bookings.some(b => 
          b.studentId === entry.studentId && 
          b.bookingDate === bookingDate && 
          b.slotId === slotId && 
          (b.status === 'confirmed' || b.status === 'active')
        );
        if (alreadyBooked) {
          entry.status = 'skipped';
          entry.skippedAt = new Date().toISOString();
          entry.skipReason = 'booking_already_exists';
          await db.write('seatsync_waitlists', waitlists);
          continue;
        }

        candidate = entry;
        break;
      }

      if (!candidate) return null;

      // Allocate seat
      candidate.status = 'allocated';
      candidate.allocatedAt = new Date().toISOString();
      candidate.allocatedSeatId = seatId;

      // Create new confirmed booking
      const newBooking = {
        id: `BK-${bookingDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        studentId: candidate.studentId,
        studentName: candidate.studentName,
        collegeId: candidate.registrationNumber || '24AD042',
        bookingDate: bookingDate,
        slotId: slotId,
        startTime: candidate.startTime || '08:45',
        endTime: candidate.endTime || '09:45',
        floorId: seat.floorId,
        seatId: seatId,
        seatNumber: seat.seatNumber,
        zoneId: seat.zoneId,
        status: 'confirmed',
        source: 'waitlist',
        waitlistId: candidate.id,
        createdAt: new Date().toISOString()
      };

      candidate.allocatedBookingId = newBooking.id;
      bookings.push(newBooking);

      await db.write('seatsync_bookings', bookings);
      await db.write('seatsync_waitlists', waitlists);

      // Recalculate positions for remaining entries
      await this.recalculatePositions(bookingDate, slotId);

      // Notifications
      const notifications = (await db.read('seatsync_notifications')) || [];
      notifications.push({
        id: Date.now().toString(),
        userId: candidate.studentId,
        title: 'Seat Automatically Allocated! 🎉',
        message: `A seat (${seat.seatNumber}) opened up and has been automatically reserved for your time slot.`,
        type: 'waitlist_allocated',
        bookingId: newBooking.id,
        isRead: false,
        createdAt: new Date().toISOString()
      });
      await db.write('seatsync_notifications', notifications);

      // Broadcast sync
      const channel = new BroadcastChannel('seatsync-updates');
      channel.postMessage({ type: 'WAITLIST_ALLOCATED', booking: newBooking, waitlist: candidate });

      return newBooking;

    } finally {
      this.releaseLock();
    }
  },

  // Auto-expire entries past their booking window
  async expireInvalidEntries() {
    const waitlists = (await db.read('seatsync_waitlists')) || [];
    const today = new Date().toISOString().split('T')[0];
    let count = 0;

    for (const w of waitlists) {
      if (w.status === 'waiting' && w.bookingDate < today) {
        w.status = 'expired';
        w.expiredAt = new Date().toISOString();
        count++;
      }
    }

    if (count > 0) {
      await db.write('seatsync_waitlists', waitlists);
    }
  },

  // Aggregate metrics for Admin & Librarian dashboards
  async getWaitlistAnalytics() {
    const waitlists = (await db.read('seatsync_waitlists')) || [];
    const total = waitlists.length;
    const active = waitlists.filter(w => w.status === 'waiting').length;
    const allocated = waitlists.filter(w => w.status === 'allocated').length;
    const cancelled = waitlists.filter(w => w.status === 'cancelled').length;
    const expired = waitlists.filter(w => w.status === 'expired').length;
    const successRate = total > 0 ? Math.round((allocated / total) * 100) : 0;

    return { total, active, allocated, cancelled, expired, successRate };
  },

  // ----------------------------------------------------
  // TEST SCENARIO & DEMO TOOLS
  // ----------------------------------------------------

  // Create controlled full-slot scenario for any slot (default slot-4 / Afternoon Slot 2 or slot-1)
  async createFullSlotScenario(dateStr, slotId = 'slot-4') {
    const seats = (await db.read('seatsync_seats')) || [];
    const bookings = (await db.read('seatsync_bookings')) || [];
    const slots = (await db.read('seatsync_slots')) || [];
    const slot = slots.find(s => s.id === slotId) || { label: 'Slot', startTime: '15:25', endTime: '16:25' };

    // Filter active seats
    const activeSeats = seats.filter(s => s.status === 'active');

    // Get current bookings for tomorrow + slotId
    const existingSlotBookings = bookings.filter(b => b.bookingDate === dateStr && b.slotId === slotId && (b.status === 'confirmed' || b.status === 'active'));

    // Find seats not yet booked for this slot
    const unbookedSeats = activeSeats.filter(s => !existingSlotBookings.some(b => b.seatId === s.id));

    let createdCount = 0;
    unbookedSeats.forEach((seat, idx) => {
      const testStudentNum = existingSlotBookings.length + idx + 1;
      const newBooking = {
        id: `BK-TEST-${dateStr.replace(/-/g, '')}-${slotId}-${String(testStudentNum).padStart(3, '0')}`,
        studentId: `test-student-${slotId}-${testStudentNum}`,
        studentName: `Mock Student ${testStudentNum}`,
        collegeId: `24TEST${String(testStudentNum).padStart(3, '0')}`,
        bookingDate: dateStr,
        slotId: slotId,
        startTime: slot.startTime,
        endTime: slot.endTime,
        floorId: seat.floorId,
        seatId: seat.id,
        seatNumber: seat.seatNumber,
        zoneId: seat.zoneId,
        status: 'confirmed',
        source: 'test_scenario',
        isTestData: true,
        testScenarioId: 'waitlist-demo-001',
        createdAt: new Date().toISOString()
      };
      bookings.push(newBooking);
      createdCount++;
    });

    await db.write('seatsync_bookings', bookings);

    // Broadcast change
    const channel = new BroadcastChannel('seatsync-updates');
    channel.postMessage({ type: 'WAITLIST_TEST_SCENARIO_CREATED', createdCount, slotId });

    return { createdCount, totalBooked: existingSlotBookings.length + createdCount, slotLabel: slot.label };
  },

  // Simulate releasing 1 seat from a slot to trigger automatic allocation
  async simulateSeatRelease(dateStr, slotId = 'slot-4') {
    const bookings = (await db.read('seatsync_bookings')) || [];
    
    // Find a test booking in this slot
    const testBooking = bookings.find(b => b.bookingDate === dateStr && b.slotId === slotId && b.status === 'confirmed' && b.isTestData);

    if (!testBooking) {
      throw new Error('No active test booking found to release for this slot. Click "Make Slot Full" first.');
    }

    testBooking.status = 'cancelled';
    await db.write('seatsync_bookings', bookings);

    // Trigger seat allocation
    const allocatedBooking = await this.allocateReleasedSeat({
      bookingDate: dateStr,
      slotId: slotId,
      seatId: testBooking.seatId,
      trigger: 'demo_release'
    });

    return { releasedSeatNumber: testBooking.seatNumber, allocatedBooking };
  },

  // Remove test scenario mock records
  async resetTestScenarioData() {
    let bookings = (await db.read('seatsync_bookings')) || [];
    let waitlists = (await db.read('seatsync_waitlists')) || [];

    const initialBookingsCount = bookings.length;
    bookings = bookings.filter(b => !b.isTestData && b.testScenarioId !== 'waitlist-demo-001');
    waitlists = waitlists.filter(w => !w.isTestData && w.testScenarioId !== 'waitlist-demo-001');

    await db.write('seatsync_bookings', bookings);
    await db.write('seatsync_waitlists', waitlists);

    // Broadcast reset
    const channel = new BroadcastChannel('seatsync-updates');
    channel.postMessage({ type: 'WAITLIST_TEST_SCENARIO_RESET' });

    return { removedCount: initialBookingsCount - bookings.length };
  }
};
