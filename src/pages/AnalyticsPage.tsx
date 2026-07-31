import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { LineChart as LineChartIcon, Flame, Clock, Users } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';

const peakHoursData = [
  { time: '08:00', occupancy: 28 },
  { time: '09:00', occupancy: 52 },
  { time: '10:00', occupancy: 78 },
  { time: '11:00', occupancy: 85 },
  { time: '12:00', occupancy: 68 },
  { time: '13:00', occupancy: 74 },
  { time: '14:00', occupancy: 94 },
  { time: '15:00', occupancy: 98 },
  { time: '16:00', occupancy: 88 },
  { time: '17:00', occupancy: 72 },
  { time: '18:00', occupancy: 54 },
];

const zoneDistributionData = [
  { name: 'Main Reading Hall', value: 328, color: '#2563EB' },
  { name: 'Silent Zone', value: 302, color: '#14B8A6' },
  { name: 'Research Hub', value: 318, color: '#16A34A' },
  { name: 'Digital Media Lab', value: 300, color: '#F59E0B' },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-navy">Analytics Dashboard</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">In-depth statistical insights on seat utilization, peak hours, reservation durations, and occupancy trends.</p>
      </div>

      {/* KPI Stats (24px gap) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Overall Occupancy Rate"
          value="76.4%"
          icon={LineChartIcon}
          trend={{ value: "+5.2% vs last week", isPositive: true }}
          iconBg="bg-blue-50"
          iconColor="text-brandBlue"
        />
        <StatCard
          title="Peak Time Load"
          value="98%"
          icon={Flame}
          subtitle="At 15:00 today"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Avg Booking Duration"
          value="2h 42m"
          icon={Clock}
          trend={{ value: "+18m vs target", isPositive: true }}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="No-Show Rate"
          value="3.2%"
          icon={Users}
          trend={{ value: "-1.1% improved", isPositive: true }}
          iconBg="bg-teal-50"
          iconColor="text-tealAccent-600"
        />
      </div>

      {/* Charts Grid (24px gap) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Hourly Chart */}
        <Card title="Hourly Seat Occupancy Rate (%)" subtitle="Identifies highest demand hours across library floors">
          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="occupancy" fill="#2563EB" radius={[6, 6, 0, 0]} name="Occupancy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Zone Distribution Pie Chart */}
        <Card title="Seat Capacity Share by Zone" subtitle="Breakdown of available seats across major zones">
          <div className="h-80 w-full flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zoneDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {zoneDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
