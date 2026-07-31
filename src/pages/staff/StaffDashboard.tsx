import React, { useEffect } from 'react';
import { useSeatStore } from '../../store/useSeatStore';
import { useReservationStore } from '../../store/useReservationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { QrCode, RefreshCw, Layers, Users, Armchair, AlertTriangle, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StaffDashboard: React.FC = () => {
  const { floors, seats, fetchData: fetchSeats } = useSeatStore();
  const { reservations, fetchReservations } = useReservationStore();
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSeats();
    fetchReservations();
  }, [fetchSeats, fetchReservations]);

  const activeCheckedInCount = reservations.filter((r) => r.status === 'CHECKED_IN').length;
  const noShowCount = reservations.filter((r) => r.status === 'NO_SHOW').length;
  const upcomingCount = reservations.filter((r) => r.status === 'UPCOMING').length;
  const totalOccupiedSeats = seats.filter((s) => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
  const globalOccupancyPct = seats.length ? Math.round((totalOccupiedSeats / seats.length) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 fill-blue-300" />
              <span>Live Campus Library Engine Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.name || 'Staff Officer'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Real-time monitoring console tracking {seats.length} study carrels across {floors.length} main library floors.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="md"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md font-semibold"
              onClick={() => fetchSeats()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Sync State
            </Button>
            <Button
              variant="accent"
              size="md"
              className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-bold shadow-lg shadow-teal-500/25"
              onClick={() => navigate('/staff/scan')}
              leftIcon={<QrCode className="w-4 h-4 text-slate-950" />}
            >
              Open QR Scanner
            </Button>
          </div>
        </div>
      </div>

      <PageHeader
        title="Live Library Occupancy & Analytics"
        subtitle="Real-time occupancy tracking per floor, floor capacity progress meters, and desk check-in metrics."
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-t-4 border-t-blue-600 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Checked-in</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="font-heading text-3xl sm:text-4xl font-extrabold text-blue-600 mt-3">{activeCheckedInCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Currently studying in hall</span>
          </div>
        </Card>

        <Card className="border-t-4 border-t-emerald-500 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Occupancy</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Armchair className="w-5 h-5" />
            </div>
          </div>
          <p className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">{globalOccupancyPct}%</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
            <span>{seats.length - totalOccupiedSeats} seats available now</span>
          </div>
        </Card>

        <Card className="border-t-4 border-t-amber-500 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming Bookings</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="font-heading text-3xl sm:text-4xl font-extrabold text-amber-600 mt-3">{upcomingCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-amber-700">
            <span>Awaiting student check-in</span>
          </div>
        </Card>

        <Card className="border-t-4 border-t-rose-500 relative overflow-hidden group hover:shadow-lg transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue No-Shows</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="font-heading text-3xl sm:text-4xl font-extrabold text-rose-600 mt-3">{noShowCount}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-rose-600 cursor-pointer hover:underline" onClick={() => navigate('/staff/no-shows')}>
            <span>Action required in monitor →</span>
          </div>
        </Card>
      </div>

      {/* Floor-by-Floor Live Occupancy Meters */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Floor Capacity Progress Heatmap
          </h3>
          <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => navigate('/staff/seats')}>
            Manage Physical Seats →
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {floors.map((floor) => {
            const floorSeats = seats.filter((s) => s.floorId === floor.id);
            const total = floorSeats.length || 30;
            const occupiedCount = floorSeats.filter((s) => s.status === 'OCCUPIED' || s.status === 'RESERVED').length;
            const pct = Math.round((occupiedCount / total) * 100);

            return (
              <Card key={floor.id} className="space-y-4 hover:shadow-md transition-all border border-slate-200/90">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-blue-600 flex items-center justify-center font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{floor.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{total} registered desks</p>
                    </div>
                  </div>
                  <span
                    className={`font-heading font-black text-sm px-3 py-1 rounded-xl border transition-all ${
                      pct >= 90
                        ? 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs'
                        : pct >= 75
                        ? 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs'
                    }`}
                  >
                    {pct}% Capacity
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5 border border-slate-200/70">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        pct >= 90
                          ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                          : pct >= 75
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {occupiedCount} in use / reserved
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {total - occupiedCount} free desks
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
