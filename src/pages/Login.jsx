import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { 
  Eye, EyeOff, BookOpen, User, Lock, ShieldCheck, Sparkles, 
  MapPin, Clock, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, 
  RotateCcw, Info, Key, ArrowRight, UserCheck, ShieldAlert, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../services/mockDatabase';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Role selector state
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'librarian' | 'admin'
  const [collegeId, setCollegeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals & Panels
  const [showDemoPanel, setShowDemoPanel] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // Live status card statistics
  const [statusStats, setStatusStats] = useState({ available: 39, occupied: 1, total: 40, pct: 2 });

  useEffect(() => {
    // Load remembered ID if present
    const savedId = localStorage.getItem('seatsync_remembered_id');
    if (savedId) {
      setCollegeId(savedId);
      setRememberMe(true);
    }

    // Fetch live library stats for status card
    const loadStatus = async () => {
      try {
        const seats = (await db.read('seatsync_seats')) || [];
        const bookings = (await db.read('seatsync_bookings')) || [];
        const total = seats.length || 40;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'active');
        const occupied = confirmedBookings.length || 1;
        const available = Math.max(0, total - occupied);
        const pct = Math.round((occupied / total) * 100);
        setStatusStats({ available, occupied, total, pct });
      } catch (err) {
        // Fallback
        setStatusStats({ available: 39, occupied: 1, total: 40, pct: 2 });
      }
    };
    loadStatus();
  }, []);

  // Update role info
  const roleConfig = {
    student: {
      title: 'Student Login',
      subtitle: 'Sign in to manage your seat reservations.',
      idLabel: 'College ID / Registration No',
      idPlaceholder: 'e.g. 24AD042',
      demoId: '24AD042',
      demoPass: 'Student@123',
      icon: User
    },
    librarian: {
      title: 'Librarian Login',
      subtitle: 'Sign in to manage seats and library operations.',
      idLabel: 'Librarian ID',
      idPlaceholder: 'e.g. LIB-001',
      demoId: 'LIB-001',
      demoPass: 'Admin@123',
      icon: UserCheck
    },
    admin: {
      title: 'Administrator Login',
      subtitle: 'Sign in to manage users, settings and reports.',
      idLabel: 'Admin ID',
      idPlaceholder: 'e.g. ADM-001',
      demoId: 'ADM-001',
      demoPass: 'Admin@123',
      icon: ShieldCheck
    }
  };

  const currentConfig = roleConfig[selectedRole];

  const handleKeyDown = (e) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true);
    } else {
      setCapsLockOn(false);
    }
  };

  const handleAutoFill = (roleKey) => {
    setSelectedRole(roleKey);
    const config = roleConfig[roleKey];
    setCollegeId(config.demoId);
    setPassword(config.demoPass);
    setErrorMessage('');
    toast.success(`${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)} demo credentials auto-filled`);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!collegeId.trim() || !password.trim()) {
      setErrorMessage('Please enter both your ID and password.');
      toast.error('Please enter both your ID and password.');
      return;
    }

    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('seatsync_remembered_id', collegeId.trim());
      } else {
        localStorage.removeItem('seatsync_remembered_id');
      }

      await login(collegeId.trim(), password.trim());
      
      toast.success('Sign in successful!');
      
      // Determine destination based on logged in role
      if (selectedRole === 'librarian') navigate('/librarian/dashboard');
      else if (selectedRole === 'admin') navigate('/admin/dashboard');
      else navigate('/student/dashboard');

    } catch (error) {
      const msg = error.message || 'The ID or password entered is incorrect.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPrototypeData = () => {
    localStorage.clear();
    setResetModalOpen(false);
    toast.success('Prototype database reset successfully');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-navy">
      
      {/* 1. LEFT BRAND PANEL (Desktop 54% Width) */}
      <div className="hidden lg:flex w-[54%] bg-navy text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        
        {/* Decorative Ambient Shapes */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-brandBlue/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-tealAccent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-brandBlue text-white flex items-center justify-center shadow-lg shadow-brandBlue/30">
              <BookOpen size={26} />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-white block">SeatSync</span>
              <span className="text-[11px] font-semibold text-tealAccent uppercase tracking-wider block">Smart Library Seat Reservation</span>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight">
              Reserve smarter.<br />
              <span className="text-tealAccent">Study better.</span>
            </h1>
            <p className="text-slate-300 text-sm xl:text-base max-w-lg leading-relaxed">
              Find your ideal library study space, select convenient time slots, and confirm your seat reservation in seconds.
            </p>
          </div>

          {/* Product Benefits List */}
          <div className="pt-4 space-y-3.5 max-w-md">
            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <span>Real-time seat availability across study zones</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-brandBlue/20 text-tealAccent flex items-center justify-center shrink-0">
                <Layers size={18} />
              </div>
              <span>Interactive visual floor map with table layout</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-200 font-medium bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <span>Quick QR-based check-in pass & active session tracking</span>
            </div>
          </div>
        </div>


      </div>

      {/* MOBILE BRAND HEADER (Only visible on Mobile <1024px) */}
      <div className="lg:hidden bg-navy text-white p-6 space-y-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brandBlue text-white flex items-center justify-center">
            <BookOpen size={20} />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white block">SeatSync</span>
            <span className="text-[10px] font-semibold text-tealAccent uppercase block">Smart Library Reservation</span>
          </div>
        </div>
        <p className="text-xs text-slate-300">Reserve your study seat in seconds with live availability.</p>
      </div>

      {/* 4. RIGHT PANEL - LOGIN FORM AREA (Desktop 46% Width) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-[460px] space-y-6">
          
          {/* Card Container */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
            
            {/* Header */}
            <div className="space-y-1 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-navy tracking-tight">Welcome Back</h2>
              <p className="text-xs text-slate-500">{currentConfig.subtitle}</p>
            </div>

            {/* 5. ROLE SELECTOR SEGMENTED CONTROL */}
            <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-3 gap-1">
              {[
                { key: 'student', label: 'Student', icon: User },
                { key: 'librarian', label: 'Librarian', icon: UserCheck },
                { key: 'admin', label: 'Admin', icon: ShieldCheck }
              ].map(role => {
                const Icon = role.icon;
                const isActive = selectedRole === role.key;
                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => { setSelectedRole(role.key); setErrorMessage(''); }}
                    className={`
                      py-2 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
                      ${isActive 
                        ? 'bg-brandBlue text-white shadow-sm' 
                        : 'text-slate-600 hover:text-navy hover:bg-slate-200/60'
                      }
                    `}
                  >
                    <Icon size={14} />
                    <span>{role.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errorMessage}</span>
              </div>
            )}

            {/* 6. FORM FIELDS */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* College / Staff ID Input */}
              <div className="space-y-1.5">
                <Label htmlFor="collegeId" className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <currentConfig.icon size={14} className="text-brandBlue" />
                  {currentConfig.idLabel}
                </Label>
                <div className="relative">
                  <Input
                    id="collegeId"
                    type="text"
                    autoComplete="username"
                    placeholder={currentConfig.idPlaceholder}
                    value={collegeId}
                    onChange={(e) => { setCollegeId(e.target.value); setErrorMessage(''); }}
                    className="h-11 text-xs pl-3 pr-3 rounded-xl border-slate-200 focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20 font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Lock size={14} className="text-brandBlue" /> Password
                  </Label>
                  <button 
                    type="button" 
                    onClick={() => setForgotModalOpen(true)}
                    className="text-xs text-brandBlue font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onKeyDown={handleKeyDown}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                    className="h-11 text-xs pl-3 pr-10 rounded-xl border-slate-200 focus:border-brandBlue focus:ring-2 focus:ring-brandBlue/20 font-medium"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy p-1"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {capsLockOn && (
                  <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> Caps Lock is ON
                  </p>
                )}
              </div>

              {/* 7. REMEMBER ME */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded text-brandBlue focus:ring-brandBlue border-slate-300"
                  />
                  <span>Remember my ID</span>
                </label>
              </div>

              {/* 8. SIGN IN BUTTON */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-brandBlue hover:bg-brandBlue/90 text-white font-bold text-sm shadow-md shadow-brandBlue/20 rounded-xl transition-all"
              >
                {loading ? 'Signing In...' : 'Sign In'} <ArrowRight size={16} className="ml-1" />
              </Button>
            </form>

            {/* 9. COLLAPSIBLE DEMO ACCOUNTS PANEL */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <button 
                type="button"
                onClick={() => setShowDemoPanel(!showDemoPanel)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-navy bg-slate-50 p-2.5 rounded-xl border border-slate-200/80"
              >
                <span className="flex items-center gap-2">
                  <Key size={14} className="text-brandBlue" /> Prototype Demo Credentials
                </span>
                {showDemoPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDemoPanel && (
                <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80 animate-in fade-in duration-150">
                  
                  {/* Student Demo */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-navy block text-[11px]">Student Demo</span>
                      <span className="text-[10px] text-slate-500 font-mono">24AD042 • Student@123</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleAutoFill('student')} className="h-7 text-xs font-bold text-brandBlue hover:bg-blue-50 px-2.5">
                      Auto-fill
                    </Button>
                  </div>

                  {/* Librarian Demo */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-navy block text-[11px]">Librarian Demo</span>
                      <span className="text-[10px] text-slate-500 font-mono">LIB-001 • Admin@123</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleAutoFill('librarian')} className="h-7 text-xs font-bold text-brandBlue hover:bg-blue-50 px-2.5">
                      Auto-fill
                    </Button>
                  </div>

                  {/* Admin Demo */}
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div>
                      <span className="font-bold text-navy block text-[11px]">Admin Demo</span>
                      <span className="text-[10px] text-slate-500 font-mono">ADM-001 • Admin@123</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleAutoFill('admin')} className="h-7 text-xs font-bold text-brandBlue hover:bg-blue-50 px-2.5">
                      Auto-fill
                    </Button>
                  </div>

                </div>
              )}
            </div>

            {/* 11. TRUST & PRIVACY FOOTNOTE */}
            <div className="pt-2 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Info size={13} className="text-slate-400" />
              <span>Frontend demo — data stored locally in browser.</span>
              <button type="button" onClick={() => setPrivacyModalOpen(true)} className="text-brandBlue underline font-medium">Info</button>
            </div>

          </div>

          {/* 10. PROTOTYPE RESET LINK */}
          <div className="text-center pt-1">
            <button 
              type="button" 
              onClick={() => setResetModalOpen(true)}
              className="text-xs text-slate-400 hover:text-destructive flex items-center justify-center gap-1.5 mx-auto font-medium transition-colors"
            >
              <RotateCcw size={13} /> Reset Prototype Data
            </button>
          </div>

        </div>
      </div>

      {/* FORGOT PASSWORD SIMULATED MODAL */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy flex items-center justify-center gap-2">
              <Info size={20} className="text-brandBlue" /> Password Recovery Notice
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              This frontend prototype does not connect to a live email service or server-side password recovery API.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-left space-y-2 border border-slate-200 my-2">
            <p className="font-semibold text-navy">Recommended Demo Credentials:</p>
            <p className="font-mono text-slate-600">Student: <strong>24AD042</strong> / <strong>Student@123</strong></p>
            <p className="font-mono text-slate-600">Librarian: <strong>LIB-001</strong> / <strong>Admin@123</strong></p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" className="w-full text-xs" onClick={() => setForgotModalOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* RESET DATA CONFIRMATION MODAL */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center justify-center gap-2">
              <ShieldAlert size={22} /> Reset Prototype Database?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              This will clear all current bookings, activity logs, and local modifications and restore the original seed data.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Keep Current Data
            </Button>
            <Button variant="destructive" onClick={handleResetPrototypeData}>
              Reset Prototype Data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PRIVACY / DEMO INFO MODAL */}
      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy flex items-center gap-2">
              <Info size={18} className="text-brandBlue" /> Prototype Architecture
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed py-2">
            <p>
              SeatSync is running as a <strong>100% frontend prototype</strong>. All state (users, seats, slots, bookings, notifications) is persisted strictly inside your browser's <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">LocalStorage</code>.
            </p>
            <p>
              Cross-tab synchronization uses the browser's <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">BroadcastChannel</code> API. No server calls or external network requests are executed.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setPrivacyModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
