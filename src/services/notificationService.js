import { db } from './mockDatabase';

export const notificationService = {
  async getNotifications(userId) {
    const notifs = (await db.read('seatsync_notifications')) || [];
    return notifs
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async markAsRead(notificationId) {
    const notifs = (await db.read('seatsync_notifications')) || [];
    const n = notifs.find(item => item.id === notificationId);
    if (n) {
      n.isRead = true;
      await db.write('seatsync_notifications', notifs);
    }
  },

  async markAsUnread(notificationId) {
    const notifs = (await db.read('seatsync_notifications')) || [];
    const n = notifs.find(item => item.id === notificationId);
    if (n) {
      n.isRead = false;
      await db.write('seatsync_notifications', notifs);
    }
  },
  
  async markAllAsRead(userId) {
    const notifs = (await db.read('seatsync_notifications')) || [];
    notifs.forEach(n => {
      if (n.userId === userId) n.isRead = true;
    });
    await db.write('seatsync_notifications', notifs);
  },

  async markAllAsUnread(userId) {
    const notifs = (await db.read('seatsync_notifications')) || [];
    notifs.forEach(n => {
      if (n.userId === userId) n.isRead = false;
    });
    await db.write('seatsync_notifications', notifs);
  },

  async removeNotification(notificationId) {
    let notifs = (await db.read('seatsync_notifications')) || [];
    notifs = notifs.filter(n => n.id !== notificationId);
    await db.write('seatsync_notifications', notifs);
  },

  async clearReadNotifications(userId) {
    let notifs = (await db.read('seatsync_notifications')) || [];
    notifs = notifs.filter(n => !(n.userId === userId && n.isRead));
    await db.write('seatsync_notifications', notifs);
  },

  async bulkMarkAsRead(notificationIds) {
    const notifs = (await db.read('seatsync_notifications')) || [];
    notifs.forEach(n => {
      if (notificationIds.includes(n.id)) n.isRead = true;
    });
    await db.write('seatsync_notifications', notifs);
  },

  async bulkRemove(notificationIds) {
    let notifs = (await db.read('seatsync_notifications')) || [];
    notifs = notifs.filter(n => !notificationIds.includes(n.id));
    await db.write('seatsync_notifications', notifs);
  }
};
