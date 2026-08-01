import { defaultUsers, defaultSlots, defaultFloors, defaultZones, defaultSeats } from '../data/seedData';

class MockDatabase {
  constructor() {
    this.delay = 300; // Simulated network delay
    this.init();
  }

  init() {
    if (!localStorage.getItem('seatsync_initialized')) {
      localStorage.setItem('seatsync_users', JSON.stringify(defaultUsers));
      localStorage.setItem('seatsync_slots', JSON.stringify(defaultSlots));
      localStorage.setItem('seatsync_floors', JSON.stringify(defaultFloors));
      localStorage.setItem('seatsync_zones', JSON.stringify(defaultZones));
      localStorage.setItem('seatsync_seats', JSON.stringify(defaultSeats));
      localStorage.setItem('seatsync_bookings', JSON.stringify([]));
      localStorage.setItem('seatsync_notifications', JSON.stringify([]));
      localStorage.setItem('seatsync_activity_logs', JSON.stringify([]));
      localStorage.setItem('seatsync_initialized', 'true');
    }
  }

  resetDemoData() {
    localStorage.removeItem('seatsync_initialized');
    this.init();
    // Dispatch an event to tell hooks to sync
    window.dispatchEvent(new Event('storage'));
  }

  async read(key) {
    return new Promise(resolve => {
      setTimeout(() => {
        const data = localStorage.getItem(key);
        resolve(data ? JSON.parse(data) : null);
      }, this.delay);
    });
  }

  async write(key, value) {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.setItem(key, JSON.stringify(value));
        // Force a storage event in this tab for our sync hook
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: JSON.stringify(value)
        }));
        resolve(value);
      }, this.delay);
    });
  }
}

export const db = new MockDatabase();
