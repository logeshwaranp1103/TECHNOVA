import React, { useEffect } from 'react';
import { useReservationStore } from '../../store/useReservationStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { UserX } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/dateUtils';

export const NoShowsMonitorPage: React.FC = () => {
  const { reservations, fetchReservations, markNoShow } = useReservationStore();

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Highlight reservations where checkInGraceExpiry has passed or marked NO_SHOW
  const noShowList = reservations.filter(
    (r) => r.status === 'NO_SHOW' || (r.status === 'UPCOMING' && new Date(r.checkInGraceExpiry) < new Date())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Late Arrivals & No-Shows Monitor"
        subtitle="Live monitor highlighting reservations past the check-in grace period threshold for immediate penalty enforcement."
      />

      <div className="space-y-4">
        {noShowList.length > 0 ? (
          noShowList.map((res) => (
            <Card key={res.id} className="border-l-4 border-l-red-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-red-900 text-base">
                    Seat {res.seatNumber} ({res.floorName.split('-')[0].trim()})
                  </h4>
                  <Badge status={res.status} size="sm" />
                </div>

                <p className="text-xs text-slate-700 font-semibold">
                  Student: {res.userName} ({res.userCollegeId})
                </p>

                <p className="text-xs text-slate-500">
                  Slot: {formatTime(res.startTime)} - {formatTime(res.endTime)} | Date: {formatDate(res.date)}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                {res.status !== 'NO_SHOW' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    leftIcon={<UserX className="w-4 h-4" />}
                    onClick={() => markNoShow(res.id)}
                  >
                    Confirm No-Show & Release Seat
                  </Button>
                )}
              </div>
            </Card>
          ))
        ) : (
          <EmptyState
            title="No Overdue No-Shows"
            description="All student reservations are currently checked in or within their grace period."
          />
        )}
      </div>
    </div>
  );
};
