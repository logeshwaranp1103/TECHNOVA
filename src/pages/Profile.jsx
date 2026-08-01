import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  User, Mail, ShieldAlert, Key, Activity, BookOpen, Clock, AlertTriangle,
  Lock, CheckCircle2, ShieldCheck, Eye, EyeOff, Sparkles, Info, Building2, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password visibility toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const userStats = await dashboardService.getStudentStats(user.id);
        setStats(userStats);
      } catch (err) {
        console.warn('Failed to load profile stats:', err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 8) {
      return toast.error('New password must be at least 8 characters long');
    }

    setLoading(true);
    try {
      // Simulate API update call
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const noShowCount = user?.noShowCount || 0;
  const completedCount = stats?.completedReservations ?? stats?.completed_reservations ?? 0;
  const studyHours = Math.round(stats?.totalStudyHours ?? stats?.total_study_hours ?? 0);

  // Derive standing badge and text
  const getStandingInfo = () => {
    if (user?.accountStatus === 'restricted') {
      return {
        label: 'Account Restricted',
        badgeClass: 'bg-red-100 text-red-800 border-red-300',
        barColor: 'bg-red-500',
        text: 'Booking restricted due to no-shows.'
      };
    }
    if (noShowCount >= 2) {
      return {
        label: 'Warning State',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        barColor: 'bg-amber-500',
        text: '1 no-show away from booking restriction.'
      };
    }
    if (noShowCount === 1) {
      return {
        label: 'Good Standing',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        barColor: 'bg-brandBlue',
        text: '2 warnings remaining before restriction.'
      };
    }
    return {
      label: 'Excellent Standing',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      barColor: 'bg-emerald-500',
      text: 'Perfect library attendance record.'
    };
  };

  const standing = getStandingInfo();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 animate-in fade-in duration-300">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link to="/student/dashboard" className="hover:text-brandBlue transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-navy font-bold">My Profile</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-navy tracking-tight">My Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage your account information, security, and library activity.
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          {user?.accountStatus === 'restricted' ? (
            <Badge className="bg-red-50 text-red-700 border-red-200 font-bold text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-xs">
              <AlertTriangle size={14} className="text-red-500" /> Restricted Student
            </Badge>
          ) : (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs px-3 py-1.5 flex items-center gap-1.5 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active Student
            </Badge>
          )}
        </div>
      </div>

      {/* 2. RESPONSIVE TWO-COLUMN LAYOUT */}
      {/* Mobile order: 1. Profile Card -> 2. Personal Info -> 3. Statistics -> 4. Password */}
      {/* Desktop layout: Left Column (Profile & Statistics) | Right Column (Personal Info & Password) */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        
        {/* ITEM 1: PROFILE CARD */}
        <Card className="lg:col-start-1 lg:row-start-1 border-2 border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="bg-gradient-to-r from-navy via-slate-900 to-indigo-950 h-24 relative flex justify-center">
            <div className="absolute -bottom-10">
              <div className="w-20 h-20 rounded-full bg-white p-1 shadow-md border border-slate-200 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-brandBlue to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-inner">
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
              </div>
            </div>
          </div>

          <CardContent className="pt-12 pb-6 px-6 text-center space-y-4">
            <div>
              <h2 className="text-xl font-bold text-navy tracking-tight">{user?.name || 'Student Name'}</h2>
              <p className="text-xs font-semibold text-brandBlue font-mono mt-0.5">{user?.collegeId || 'ID: STU-0000'}</p>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100/80 px-3 py-1 rounded-full font-medium border border-slate-200">
              <GraduationCap size={13} className="text-brandBlue" />
              <span>{user?.department || 'Undergraduate Student'}</span>
            </div>

            {/* Account Status Pill */}
            <div className="pt-1">
              {user?.accountStatus === 'restricted' ? (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl text-left flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Booking privileges restricted</p>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Restricted until {user.restrictedUntil ? format(new Date(user.restrictedUntil), 'PPP') : '7 days from offense'}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 text-emerald-900 text-xs rounded-xl flex items-center justify-center gap-2 font-medium">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <span>Full Library Access Granted</span>
                </div>
              )}
            </div>

            {/* Profile Quick Details */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Mail size={13} className="text-slate-400" /> Email
                </span>
                <span className="font-semibold text-navy truncate max-w-[170px]" title={user?.email}>{user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Building2 size={13} className="text-slate-400" /> Library Pass
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ITEM 2: PERSONAL INFORMATION CARD */}
        <Card className="lg:col-start-2 lg:row-start-1 border-2 border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-brandBlue border border-blue-200">
                <User size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-navy">Personal Information</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Your registered student details verified with university records.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  Full Name <Lock size={11} className="text-slate-400" />
                </Label>
                <Input 
                  value={user?.name || ''} 
                  readOnly 
                  tabIndex={-1}
                  className="bg-slate-100/70 border-slate-200 text-navy font-semibold text-xs h-10 cursor-not-allowed select-none" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  College ID <Lock size={11} className="text-slate-400" />
                </Label>
                <Input 
                  value={user?.collegeId || ''} 
                  readOnly 
                  tabIndex={-1}
                  className="bg-slate-100/70 border-slate-200 text-navy font-mono font-bold text-xs h-10 cursor-not-allowed select-none" 
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  Student Email <Lock size={11} className="text-slate-400" />
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                  <Input 
                    value={user?.email || ''} 
                    readOnly 
                    tabIndex={-1}
                    className="bg-slate-100/70 border-slate-200 text-navy font-medium text-xs h-10 pl-9 cursor-not-allowed select-none" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  Account Standing <Lock size={11} className="text-slate-400" />
                </Label>
                <Input 
                  value={user?.accountStatus === 'restricted' ? 'Restricted Account' : 'Active Student'} 
                  readOnly 
                  tabIndex={-1}
                  className="bg-slate-100/70 border-slate-200 text-navy font-semibold text-xs h-10 cursor-not-allowed select-none capitalize" 
                />
              </div>
            </div>

            {/* Read-Only Notice Banner */}
            <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-950 shadow-xs">
              <Info size={16} className="text-brandBlue shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-blue-900">Need to update your personal details?</p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Personal details are managed centrally by the university registry. To request changes to your name or email, please visit the Library Administration desk with your student ID card.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ITEM 3: STATISTICS CARD */}
        <Card className="lg:col-start-1 lg:row-start-2 border-2 border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Activity size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-navy">Library Standing & Activity</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Lifetime booking stats & attendance reliability.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Stat Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-brandBlue flex items-center justify-center mx-auto mb-2 border border-blue-200">
                  <BookOpen size={16} />
                </div>
                <span className="block text-xl font-black text-navy">{completedCount}</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Sessions</span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                  <Clock size={16} />
                </div>
                <span className="block text-xl font-black text-navy">{studyHours}h</span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Study Time</span>
              </div>
            </div>

            {/* Attendance & No-Show Reliability Bar */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-slate-500" /> No-Show Count
                </span>
                <Badge variant="outline" className={`text-[11px] font-bold px-2 py-0.5 ${standing.badgeClass}`}>
                  {noShowCount} / 3
                </Badge>
              </div>

              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${standing.barColor}`}
                    style={{ width: `${Math.min((noShowCount / 3) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
                  <span>{standing.label}</span>
                  <span className="text-slate-400 font-mono text-[10px]">{Math.round((noShowCount / 3) * 100)}% risk</span>
                </p>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
                💡 Accumulating 3 no-shows results in an automated 7-day seat booking restriction.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ITEM 4: PASSWORD CHANGE CARD */}
        <Card className="lg:col-start-2 lg:row-start-2 border-2 border-slate-200/90 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Key size={18} />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-navy">Security & Password</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Update your password to keep your account secure.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              {/* Current Password */}
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-xs font-semibold text-slate-700">
                  Current Password
                </Label>
                <div className="relative">
                  <Input 
                    id="currentPassword"
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-10 text-xs pr-10 border-slate-300 focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-slate-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="newPassword"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="h-10 text-xs pr-10 border-slate-300 focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="confirmPassword"
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="h-10 text-xs pr-10 border-slate-300 focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              {newPassword.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                  <div className={`flex items-center gap-1.5 font-medium ${newPassword.length >= 8 ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={newPassword.length >= 8 ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>At least 8 characters long</span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-medium ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-700' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-slate-300'} />
                    <span>Passwords match</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto h-10 px-5 text-xs font-bold bg-brandBlue hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Key size={14} />
                  {loading ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
