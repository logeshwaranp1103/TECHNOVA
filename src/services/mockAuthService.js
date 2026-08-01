import { db } from './mockDatabase';

export const authService = {
  async login(collegeId, password) {
    db.init();
    const users = (await db.read('seatsync_users')) || [];
    const cleanId = (collegeId || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = users.find(u => 
      u.collegeId?.toLowerCase() === cleanId && 
      u.passwordHash === cleanPass
    );
    
    if (!user) {
      throw new Error('Invalid College ID or password');
    }
    
    if (user.accountStatus !== 'active') {
      throw new Error('Account is restricted or inactive');
    }

    // Save current session
    localStorage.setItem('seatsync_current_user', JSON.stringify(user));
    return user;
  },

  async logout() {
    localStorage.removeItem('seatsync_current_user');
    window.dispatchEvent(new Event('storage'));
    return true;
  },

  getCurrentUser() {
    const data = localStorage.getItem('seatsync_current_user');
    return data ? JSON.parse(data) : null;
  }
};
