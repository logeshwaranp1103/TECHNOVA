import usersData from '../mocks/users.json';
import floorsData from '../mocks/floors.json';
import seatsData from '../mocks/seats.json';
import reservationsData from '../mocks/reservations.json';
import waitlistData from '../mocks/waitlist.json';
import notificationsData from '../mocks/notifications.json';
import policiesData from '../mocks/policies.json';

const STORAGE_KEYS = {
  USERS: 'SeatSync_users',
  FLOORS: 'SeatSync_floors',
  SEATS: 'SeatSync_seats',
  RESERVATIONS: 'SeatSync_reservations',
  WAITLIST: 'SeatSync_waitlist',
  NOTIFICATIONS: 'SeatSync_notifications',
  POLICIES: 'SeatSync_policies',
  CURRENT_USER: 'SeatSync_current_user',
};

export const initializeSeedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FLOORS)) {
    localStorage.setItem(STORAGE_KEYS.FLOORS, JSON.stringify(floorsData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SEATS)) {
    localStorage.setItem(STORAGE_KEYS.SEATS, JSON.stringify(seatsData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.RESERVATIONS)) {
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservationsData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.WAITLIST)) {
    localStorage.setItem(STORAGE_KEYS.WAITLIST, JSON.stringify(waitlistData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notificationsData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.POLICIES)) {
    localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(policiesData));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    // Default logged in as Staff Elena Rostova
    const staffUser = usersData.find((u) => u.role === 'STAFF') || usersData[0];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(staffUser));
  }
};

export { STORAGE_KEYS };
