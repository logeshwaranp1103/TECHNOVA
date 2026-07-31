export interface WaitlistEntry {
  id: string;
  userId: string;
  userName: string;
  userCollegeId: string;
  floorId: string;
  floorName: string;
  date: string;
  preferredTimeSlot: string;
  queuePosition: number;
  joinedAt: string;
  status: 'WAITING' | 'NOTIFIED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  notifiedAt?: string;
  responseExpiry?: string;
}
