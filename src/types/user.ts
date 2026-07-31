export type UserRole = 'STUDENT' | 'STAFF' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'RESTRICTED' | 'INACTIVE';

export interface UserRestriction {
  id: string;
  reason: string;
  startDate: string;
  endDate: string;
  issuedBy: string;
  active: boolean;
}

export interface User {
  id: string;
  collegeId: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  status: UserStatus;
  restrictions?: UserRestriction[];
  createdAt: string;
}
