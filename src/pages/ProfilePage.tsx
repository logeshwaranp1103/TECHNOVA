import React, { useState } from 'react';
import { Smartphone, Laptop, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const ProfilePage: React.FC = () => {
  const { adminProfile, updateAdminProfile } = useAppStore();
  const [profileData, setProfileData] = useState({ ...adminProfile });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile(profileData);
    toast.success('Admin profile updated successfully');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.current || !passwordData.new) {
      toast.error('Please fill in password fields');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password updated successfully');
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-brandBlue/10 border-4 border-brandBlue/20 flex items-center justify-center shadow-sm shrink-0">
            <User className="w-10 h-10 text-brandBlue" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-navy truncate">{adminProfile.name}</h2>
              <Badge variant="high" dot>Super Administrator</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">{adminProfile.role} • {adminProfile.email}</p>
            <span className="text-[11px] text-slate-400 mt-1 block font-medium">Last active: {adminProfile.lastLogin}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details Form */}
        <Card title="Personal Details" subtitle="Update account information and contact info">
          <form onSubmit={handleProfileSave} className="space-y-5">
            <Input
              label="Full Name"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            />

            <Input
              label="Email Address"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            />

            <Input
              label="Phone Number"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            />

            <Input
              label="Role Designation"
              disabled
              value={profileData.role}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm">
                Save Profile Details
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Form */}
        <Card title="Security & Password" subtitle="Update administrator password and security credentials">
          <form onSubmit={handlePasswordChange} className="space-y-5">
            <Input
              label="Current Password *"
              type="password"
              placeholder="••••••••"
              value={passwordData.current}
              onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
            />

            <Input
              label="New Password *"
              type="password"
              placeholder="••••••••"
              value={passwordData.new}
              onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
            />

            <Input
              label="Confirm New Password *"
              type="password"
              placeholder="••••••••"
              value={passwordData.confirm}
              onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
            />

            <div className="pt-2">
              <Button type="submit" variant="navy" size="sm" leftIcon={<Lock className="w-4 h-4" />}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Active Session Devices */}
      <Card title="Active Signed-in Sessions" subtitle="Devices currently authenticated to your admin account">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-brandBlue rounded-xl shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy">Windows 11 Admin Workstation (Current Session)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Chrome Browser • IP 192.168.1.45</div>
              </div>
            </div>
            <Badge variant="high" dot>Active Now</Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-200 text-slate-700 rounded-xl shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-navy">iPhone 15 Pro Admin App</div>
                <div className="text-[11px] text-slate-500 mt-0.5">iOS App • IP 192.168.1.88</div>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-medium">2 hours ago</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
