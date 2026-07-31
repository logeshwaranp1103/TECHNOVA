export interface SystemPolicy {
  maxReservationDurationHours: number;
  checkInGracePeriodMinutes: number;
  cancellationWindowMinutes: number;
  noShowPenaltyThreshold: number;
  maxActiveReservationsPerUser: number;
  waitlistResponseWindowMinutes: number;
  libraryOpenTime: string; // e.g. "08:00"
  libraryCloseTime: string; // e.g. "22:00"
}
