export type NotificationType = 
  | 'BOOKING_CONFIRMATION'
  | 'UPCOMING_REMINDER'
  | 'CHECKIN_REMINDER'
  | 'CANCELLATION'
  | 'EXPIRY_WARNING'
  | 'WAITLIST_PROMOTION'
  | 'WAITLIST_OFFERED'
  | 'WAITLIST_ACCEPTED'
  | 'WAITLIST_EXPIRED'
  | 'WAITLIST_EXHAUSTED'
  | 'ANNOUNCEMENT';

export interface SystemNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}
