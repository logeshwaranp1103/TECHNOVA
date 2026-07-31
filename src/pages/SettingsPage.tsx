import React, { useState } from 'react';
import { 
  Save, AlertOctagon, RotateCcw, Clock, ShieldCheck, Cpu, 
  Zap, Bell, Lock, CheckCircle2, RefreshCw, Sliders, Sparkles, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../store/useAppStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, resetSettingsSection, triggerEmergencyMassRelease, seats } = useAppStore();
  const [formData, setFormData] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState<'policy' | 'hours' | 'emergency'>('policy');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [massReleaseSummary, setMassReleaseSummary] = useState<{
    timestamp: string;
    releasedCount: number;
    floorsCount: number;
    actor: string;
  } | null>(null);

  const validateForm = (): boolean => {
    if (formData.maxBookingHoursPerDay < 1 || formData.maxBookingHoursPerDay > 24) {
      toast.error('Max Booking Hours must be between 1 and 24 hours');
      return false;
    }
    if (formData.maxAdvanceBookingDays < 1 || formData.maxAdvanceBookingDays > 30) {
      toast.error('Max Advance Booking Days must be between 1 and 30 days');
      return false;
    }
    if (formData.gracePeriodMinutes < 5 || formData.gracePeriodMinutes > 60) {
      toast.error('Check-in Grace Period must be between 5 and 60 minutes');
      return false;
    }
    if (formData.autoReleaseNoShowMinutes < 5 || formData.autoReleaseNoShowMinutes > 60) {
      toast.error('Auto-Release No-Show Expiry must be between 5 and 60 minutes');
      return false;
    }
    if (formData.qrRefreshIntervalSeconds < 5 || formData.qrRefreshIntervalSeconds > 120) {
      toast.error('QR Refresh Interval must be between 5 and 120 seconds');
      return false;
    }
    if (formData.penaltyThresholdForSuspension < 1 || formData.penaltyThresholdForSuspension > 10) {
      toast.error('Penalty Suspension Threshold must be between 1 and 10 missed check-ins');
      return false;
    }
    if (formData.libraryOpenTime && formData.libraryCloseTime && formData.libraryOpenTime >= formData.libraryCloseTime) {
      toast.error('Library Opening Time must be earlier than Closing Time');
      return false;
    }
    return true;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    updateSettings(formData);
    toast.success('System settings & configuration saved successfully');
  };

  const handleResetSectionDefaults = (section: 'policy' | 'hours') => {
    resetSettingsSection(section);
    const latestState = useAppStore.getState().settings;
    setFormData({ ...latestState });
    toast.success(`Reset ${section === 'policy' ? 'Reservation Policies' : 'Hours & Hardware'} to factory defaults`);
  };

  const handleApplyPreset = (mode: 'exam' | 'standard' | 'strict') => {
    if (mode === 'exam') {
      const examConfig = {
        maxBookingHoursPerDay: 6,
        maxAdvanceBookingDays: 7,
        gracePeriodMinutes: 15,
        autoReleaseNoShowMinutes: 15,
        libraryOpenTime: '00:00',
        libraryCloseTime: '23:59',
        qrRefreshIntervalSeconds: 30,
        penaltyThresholdForSuspension: 3,
        autoWaitlistAllocation: true,
        maintenanceMode: false,
      };
      setFormData(examConfig);
      updateSettings(examConfig);
      toast.success('Applied "Exam Period Mode" preset (24/7 Hours, 6h Max Booking)');
    } else if (mode === 'standard') {
      const stdConfig = {
        maxBookingHoursPerDay: 4,
        maxAdvanceBookingDays: 3,
        gracePeriodMinutes: 20,
        autoReleaseNoShowMinutes: 20,
        libraryOpenTime: '08:00',
        libraryCloseTime: '22:00',
        qrRefreshIntervalSeconds: 30,
        penaltyThresholdForSuspension: 3,
        autoWaitlistAllocation: true,
        maintenanceMode: false,
      };
      setFormData(stdConfig);
      updateSettings(stdConfig);
      toast.success('Applied "Standard Library Operating Mode" preset');
    } else if (mode === 'strict') {
      const strictConfig = {
        maxBookingHoursPerDay: 3,
        maxAdvanceBookingDays: 2,
        gracePeriodMinutes: 10,
        autoReleaseNoShowMinutes: 10,
        libraryOpenTime: '08:00',
        libraryCloseTime: '20:00',
        qrRefreshIntervalSeconds: 15,
        penaltyThresholdForSuspension: 2,
        autoWaitlistAllocation: true,
        maintenanceMode: false,
      };
      setFormData(strictConfig);
      updateSettings(strictConfig);
      toast.success('Applied "Strict Access & Enforcement Mode" preset (10m Grace Period)');
    }
  };

  const handleTriggerEmergencyRelease = () => {
    if (!adminPassword) {
      toast.error('Please enter Administrator Password to authorize emergency release');
      return;
    }

    const occupiedCount = seats.filter(s => s.status === 'occupied' || s.status === 'reserved').length;
    triggerEmergencyMassRelease();

    setMassReleaseSummary({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      releasedCount: occupiedCount || 374,
      floorsCount: 8,
      actor: 'Avery Morgan (System Admin)'
    });

    toast.success(`Emergency Mass Release executed! Cleared ${occupiedCount || 374} seats across 8 floors.`);
    setIsEmergencyModalOpen(false);
    setAdminPassword('');
  };

  return (
    <div className="space-y-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy">System Settings & Configuration</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure library operating hours, reservation policies, auto-release timers, and QR scanner rules.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormData({ ...settings })}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Reset Unsaved Changes
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" />}
            className="shadow-md hover:shadow-lg transition-all"
          >
            Save All Settings
          </Button>
        </div>
      </div>

      {/* System Gateway Health Status Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">QR Turnstile Gateways</span>
            <span className="font-bold text-navy">Online (99.9% Up)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-brandBlue flex items-center justify-center shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Auto Allocator Engine</span>
            <span className="font-bold text-navy">{formData.autoWaitlistAllocation ? 'Active' : 'Disabled'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">QR Security Anti-Spoof</span>
            <span className="font-mono font-bold text-navy">{formData.qrRefreshIntervalSeconds}s Refresh</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Maintenance Mode</span>
            <span className="font-bold text-navy">{formData.maintenanceMode ? 'ACTIVE (Locked)' : 'Normal Mode'}</span>
          </div>
        </div>
      </div>

      {/* Preset Quick Configuration Modes */}
      <div className="p-5 bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/60 rounded-2xl border border-brandBlue/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-navy">
            <Sparkles className="w-4 h-4 text-brandBlue" />
            <span>Operational Mode Presets</span>
          </div>
          <span className="text-[11px] text-slate-500">Apply pre-configured rule sets instantly</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleApplyPreset('standard')}
            className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-brandBlue hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="font-bold text-navy text-xs">Standard Operating Mode</div>
            <p className="text-[11px] text-slate-500 mt-0.5">08:00 - 22:00 • 4h Limit • 20m Grace</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('exam')}
            className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-brandBlue hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="font-bold text-brandBlue text-xs">Exam Period Mode (24/7)</div>
            <p className="text-[11px] text-slate-500 mt-0.5">24/7 Operating Hours • 6h Limit • 15m Grace</p>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('strict')}
            className="p-3 bg-white rounded-xl border border-slate-200 text-left hover:border-brandBlue hover:shadow-xs transition-all cursor-pointer"
          >
            <div className="font-bold text-amber-700 text-xs">Strict Access Mode</div>
            <p className="text-[11px] text-slate-500 mt-0.5">08:00 - 20:00 • 3h Limit • 10m Grace</p>
          </button>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'policy', label: 'Reservation Policies', icon: Sliders },
          { id: 'hours', label: 'Hours & Hardware', icon: Clock },
          { id: 'emergency', label: 'Emergency Overrides', icon: AlertOctagon },
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-brandBlue text-white shadow-xs'
                  : 'text-slate-600 hover:text-navy hover:bg-slate-100/80'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Tab 1: Reservation Policies */}
        {activeTab === 'policy' && (
          <Card 
            title="Reservation Policy Rules" 
            subtitle="Control booking durations, advance windows, and student limits"
            headerAction={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleResetSectionDefaults('policy')}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-slate-500 hover:text-brandBlue text-xs"
              >
                Reset Section Defaults
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Max Booking Hours Per Day (Hours) *"
                type="number"
                min={1}
                max={24}
                value={formData.maxBookingHoursPerDay}
                onChange={(e) => setFormData({ ...formData, maxBookingHoursPerDay: Number(e.target.value) })}
                helperText="Maximum total study hours a student can reserve in 24 hours (1 - 24 hours)"
              />

              <Input
                label="Max Advance Booking Days (Days) *"
                type="number"
                min={1}
                max={30}
                value={formData.maxAdvanceBookingDays}
                onChange={(e) => setFormData({ ...formData, maxAdvanceBookingDays: Number(e.target.value) })}
                helperText="How far in advance students can book seats (1 - 30 days)"
              />

              <Input
                label="Check-in Grace Period (Minutes) *"
                type="number"
                min={5}
                max={60}
                value={formData.gracePeriodMinutes}
                onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                helperText="Window allowed before a booking is flagged as late (5 - 60 minutes)"
              />

              <Input
                label="Auto-Release No-Show Expiry (Minutes) *"
                type="number"
                min={5}
                max={60}
                value={formData.autoReleaseNoShowMinutes}
                onChange={(e) => setFormData({ ...formData, autoReleaseNoShowMinutes: Number(e.target.value) })}
                helperText="Seat automatically released to waiting list after expiry (5 - 60 minutes)"
              />
            </div>
          </Card>
        )}

        {/* Tab 2: Hours & Hardware */}
        {activeTab === 'hours' && (
          <Card 
            title="Operating Hours & QR Scanner Configuration" 
            subtitle="Set opening schedules and dynamic turnstile QR refresh intervals"
            headerAction={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleResetSectionDefaults('hours')}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-slate-500 hover:text-brandBlue text-xs"
              >
                Reset Section Defaults
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Library Opening Time *"
                type="time"
                value={formData.libraryOpenTime}
                onChange={(e) => setFormData({ ...formData, libraryOpenTime: e.target.value })}
              />

              <Input
                label="Library Closing Time *"
                type="time"
                value={formData.libraryCloseTime}
                onChange={(e) => setFormData({ ...formData, libraryCloseTime: e.target.value })}
              />

              <Input
                label="QR Code Security Refresh Interval (Seconds) *"
                type="number"
                min={5}
                max={120}
                value={formData.qrRefreshIntervalSeconds}
                onChange={(e) => setFormData({ ...formData, qrRefreshIntervalSeconds: Number(e.target.value) })}
                helperText="Anti-screenshot security refresh rate for turnstile scanners (5 - 120 seconds)"
              />

              <Input
                label="Penalty Suspension Threshold (No-shows) *"
                type="number"
                min={1}
                max={10}
                value={formData.penaltyThresholdForSuspension}
                onChange={(e) => setFormData({ ...formData, penaltyThresholdForSuspension: Number(e.target.value) })}
                helperText="Number of missed check-ins before account restriction (1 - 10 missed check-ins)"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-navy">Auto Waitlist Allocation Engine</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Automatically reassign released seats to waiting list queue candidates</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoWaitlistAllocation}
                  onChange={(e) => setFormData({ ...formData, autoWaitlistAllocation: e.target.checked })}
                  className="w-5 h-5 text-brandBlue rounded focus:ring-brandBlue border-slate-300 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-xs font-bold text-navy">Maintenance Lockout Mode</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Temporarily disable new self-service student bookings across all floors</div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.maintenanceMode}
                  onChange={(e) => setFormData({ ...formData, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 text-brandBlue rounded focus:ring-brandBlue border-slate-300 cursor-pointer"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Tab 3: Emergency Overrides */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <Card title="Emergency System Override" subtitle="High-priority actions for maintenance or evacuations">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-red-50/80 border border-red-200 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <AlertOctagon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-navy">Emergency Mass Seat Release</div>
                      <div className="text-xs text-slate-600 mt-0.5">Instantly clear all occupied and reserved seats across all 8 floors.</div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => setIsEmergencyModalOpen(true)}
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    Trigger Mass Release
                  </Button>
                </div>
              </div>
            </Card>

            {/* Emergency Action Execution Summary Card */}
            {massReleaseSummary && (
              <div className="p-6 bg-red-950 text-white rounded-2xl shadow-xl border border-red-800 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-red-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                    <h4 className="text-sm font-bold text-red-200 uppercase tracking-wider">Emergency Execution Data Summary</h4>
                  </div>
                  <span className="text-xs font-mono text-red-300 bg-red-900/80 px-2.5 py-1 rounded-lg border border-red-700">
                    Logged at {massReleaseSummary.timestamp}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 bg-red-900/40 rounded-xl border border-red-800/60 space-y-1">
                    <span className="text-red-300 font-semibold block text-[10px] uppercase">Seats Cleared</span>
                    <span className="text-xl font-bold text-white block">{massReleaseSummary.releasedCount} Seats</span>
                    <span className="text-[10px] text-red-300/80">Set to Available state</span>
                  </div>

                  <div className="p-3.5 bg-red-900/40 rounded-xl border border-red-800/60 space-y-1">
                    <span className="text-red-300 font-semibold block text-[10px] uppercase">Scope of Action</span>
                    <span className="text-xl font-bold text-white block">{massReleaseSummary.floorsCount} Floors</span>
                    <span className="text-[10px] text-red-300/80">Ground Floor to Floor 7</span>
                  </div>

                  <div className="p-3.5 bg-red-900/40 rounded-xl border border-red-800/60 space-y-1">
                    <span className="text-red-300 font-semibold block text-[10px] uppercase">Turnstile Security</span>
                    <span className="text-xl font-bold text-emerald-400 block">Unlocked</span>
                    <span className="text-[10px] text-red-300/80">100% Evacuation Pass</span>
                  </div>

                  <div className="p-3.5 bg-red-900/40 rounded-xl border border-red-800/60 space-y-1">
                    <span className="text-red-300 font-semibold block text-[10px] uppercase">Authorized By</span>
                    <span className="text-sm font-bold text-white block truncate">{massReleaseSummary.actor}</span>
                    <span className="text-[10px] text-red-300/80">Verified Admin Session</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Emergency Confirmation Modal */}
      <Modal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        title="Confirm Emergency Mass Release"
        subtitle="Warning: High impact system action"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEmergencyModalOpen(false)}>
              Cancel Override
            </Button>
            <Button variant="danger" size="sm" onClick={handleTriggerEmergencyRelease}>
              Execute Emergency Release
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold">Are you absolutely sure?</strong>
              <span>This action will instantly cancel all active seat reservations and clear all check-in turnstile locks across the library.</span>
            </div>
          </div>

          <div className="pt-2">
            <Input
              label="Administrator Password Authorization *"
              type="password"
              placeholder="Enter admin password (e.g. admin123)..."
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              helperText="Security verification required to execute mass release override"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
