import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { 
  Calendar, Armchair, Users, Activity, FileText, CheckCircle2, 
  Clock, ShieldCheck, Flame, TrendingUp, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../store/useAppStore';

const occupancyTodayData = [
  { time: '08:00', seats: 120, students: 95 },
  { time: '09:00', seats: 240, students: 210 },
  { time: '10:00', seats: 350, students: 330 },
  { time: '11:00', seats: 380, students: 365 },
  { time: '12:00', seats: 310, students: 290 },
  { time: '13:00', seats: 290, students: 275 },
  { time: '14:00', seats: 410, students: 395 },
  { time: '15:00', seats: 428, students: 410 },
  { time: '16:00', seats: 390, students: 375 },
  { time: '17:00', seats: 320, students: 300 },
  { time: '18:00', seats: 240, students: 220 },
];

const occupancy7DaysData = [
  { time: 'Mon', seats: 340, students: 310 },
  { time: 'Tue', seats: 380, students: 350 },
  { time: 'Wed', seats: 410, students: 390 },
  { time: 'Thu', seats: 428, students: 410 },
  { time: 'Fri', seats: 395, students: 370 },
  { time: 'Sat', seats: 280, students: 250 },
  { time: 'Sun', seats: 220, students: 195 },
];

const occupancy30DaysData = [
  { time: 'Week 1', seats: 310, students: 285 },
  { time: 'Week 2', seats: 365, students: 340 },
  { time: 'Week 3', seats: 415, students: 395 },
  { time: 'Week 4', seats: 385, students: 360 },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { reservations, seats, students, setSelectedReservationId, openModal } = useAppStore();
  const [timeFilter, setTimeFilter] = useState<'today' | '7days' | '30days'>('today');

  const recentRes = reservations.slice(0, 5);

  const currentOccupancyData = 
    timeFilter === '7days' ? occupancy7DaysData :
    timeFilter === '30days' ? occupancy30DaysData :
    occupancyTodayData;

  const subtitleText = 
    timeFilter === '7days' ? 'Daily peak occupancy over the last 7 days' :
    timeFilter === '30days' ? 'Weekly average occupancy over the last 30 days' :
    'Hourly seat-vs-student activity across all floors';

  const totalReservations = reservations.length;
  const availableSeatsCount = seats.filter(s => s.status === 'available').length;
  const occupiedSeatsCount = seats.filter(s => s.status === 'occupied').length;
  const activeStudentsCount = students.filter(s => s.status === 'active').length;
  const availPct = seats.length > 0 ? Math.round((availableSeatsCount / seats.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-brandBlue text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-brandBlue animate-pulse" />
            Library operations overview
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy tracking-tight truncate">Welcome back, Administrator</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">A clear view of today's occupancy, reservations, and student activity across your library.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            Manage Library
          </Button>
          <Button variant="primary" size="sm" onClick={() => openModal('generateReport')} leftIcon={<FileText className="w-4 h-4" />}>
            Generate Report
          </Button>
        </div>
      </div>

      {/* Modern KPI Cards Grid (Computed from Live Store Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reservations"
          value={totalReservations.toString()}
          icon={Calendar}
          trend={{ value: "+12.4%", isPositive: true, label: "live system" }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
          sparklineData={[30, 45, 60, 50, 75, 90, 85]}
        />
        <StatCard
          title="Available Seats"
          value={availableSeatsCount.toString()}
          icon={Armchair}
          trend={{ value: `${availPct}% available`, isPositive: true, label: "right now" }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sparklineData={[90, 80, 70, 60, 50, 40, 42]}
        />
        <StatCard
          title="Occupied Seats"
          value={occupiedSeatsCount.toString()}
          icon={Users}
          trend={{ value: "Live occupancy", isNegative: false, label: "active now" }}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          sparklineData={[40, 60, 80, 95, 100, 90, 85]}
        />
        <StatCard
          title="Active Students"
          value={activeStudentsCount.toString()}
          icon={Activity}
          trend={{ value: "+14.8%", isPositive: true, label: "enrolled" }}
          iconBg="bg-teal-50"
          iconColor="text-tealAccent-600"
          sparklineData={[50, 60, 65, 75, 80, 92, 98]}
        />
      </div>

      {/* Hourly Occupancy Chart */}
      <Card
        title="Library occupancy"
        subtitle={subtitleText}
        headerAction={
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setTimeFilter('today')}
              className={clsx(
                "px-3 py-1 rounded-lg transition-all cursor-pointer font-medium",
                timeFilter === 'today' ? "bg-white font-semibold text-brandBlue shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('7days')}
              className={clsx(
                "px-3 py-1 rounded-lg transition-all cursor-pointer font-medium",
                timeFilter === '7days' ? "bg-white font-semibold text-brandBlue shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              7 days
            </button>
            <button
              onClick={() => setTimeFilter('30days')}
              className={clsx(
                "px-3 py-1 rounded-lg transition-all cursor-pointer font-medium",
                timeFilter === '30days' ? "bg-white font-semibold text-brandBlue shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              30 days
            </button>
          </div>
        }
      >
        <div className="h-80 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={currentOccupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSeats" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#94A3B8' }}
              />
              <Area type="monotone" dataKey="seats" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorSeats)" name="Occupied Seats" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Two Column Layout: Recent Reservations + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reservations Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Recent reservations"
            subtitle="Latest confirmed library bookings"
            headerAction={
              <Button variant="ghost" size="sm" onClick={() => navigate('/reservations')} rightIcon={<ChevronRight className="w-4 h-4" />}>
                View all
              </Button>
            }
          >
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase text-slate-400">
                    <th className="pb-3 px-2">Student</th>
                    <th className="pb-3 px-2">Seat</th>
                    <th className="pb-3 px-2">Time</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {recentRes.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-bold text-navy">{res.studentName}</div>
                        <div className="text-[10px] text-slate-400">{res.department}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="font-mono font-bold text-brandBlue">{res.seatCode}</span>
                        <div className="text-[10px] text-slate-400">{res.zoneName}</div>
                      </td>
                      <td className="py-3.5 px-2 font-medium text-slate-600">
                        {res.startTime} - {res.endTime}
                      </td>
                      <td className="py-3.5 px-2">
                        <Badge
                          variant={
                            res.status === 'checked-in' ? 'checked-in' :
                            res.status === 'confirmed' ? 'primary' :
                            res.status === 'late' ? 'late' :
                            res.status === 'completed' ? 'completed' :
                            (res.status === 'cancelled' || res.status === 'rejected') ? 'danger' : 'neutral'
                          }
                          dot
                        >
                          {res.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedReservationId(res.id); navigate('/reservations'); }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Live Activity Stream (1 Col) */}
        <div className="space-y-4">
          <Card title="Live activity" subtitle="Administrator activity stream">
            <div className="space-y-5 pt-1">
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-navy">Reservation approved</div>
                  <p className="text-xs text-slate-500 leading-normal mt-0.5">Avery approved Maya Patel's quiet zone booking.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">8 minutes ago</span>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-tealAccent-600 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-navy">Floor capacity updated</div>
                  <p className="text-xs text-slate-500 leading-normal mt-0.5">24 study seats added to Floor 3 West Wing.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">30 minutes ago</span>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-navy">New staff member</div>
                  <p className="text-xs text-slate-500 leading-normal mt-0.5">Priya Nair joined circulation desk team.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">1 hour ago</span>
                </div>
              </div>

              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-navy">Policy revised</div>
                  <p className="text-xs text-slate-500 leading-normal mt-0.5">Weekend reservation window updated to 4h max.</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">2 hours ago</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Library Operational Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-brandBlue rounded-xl shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Peak Usage Window</span>
            <h4 className="text-lg font-bold text-navy mt-0.5">14:00–16:00</h4>
            <p className="text-xs text-slate-500 mt-0.5">82% of seats occupied across all floors.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-tealAccent-600 rounded-xl shrink-0">
            <Armchair className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Most Reserved Floor</span>
            <h4 className="text-lg font-bold text-navy mt-0.5">Floor 2</h4>
            <p className="text-xs text-slate-500 mt-0.5">86 bookings this week, led by quiet study.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-card flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Session Duration</span>
            <h4 className="text-lg font-bold text-navy mt-0.5">2h 42m</h4>
            <p className="text-xs text-slate-500 mt-0.5">Up 18 minutes from last Thursday.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
