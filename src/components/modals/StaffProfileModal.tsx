import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import {
  User,
  Mail,
  Building,
  Award,
  CheckCircle2,
  LogOut,
  Clock,
  Edit2,
  Save,
} from 'lucide-react';

export interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, logout } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState('Main Reading Hall & Desk Ops');
  const [dutyStatus, setDutyStatus] = useState<'ACTIVE' | 'BREAK'>('ACTIVE');
  const [isSaving, setIsSaving] = useState(false);

  if (!currentUser) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name,
        email,
      });
      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Staff profile details updated successfully.',
      });
      setIsEditing(false);
    } catch {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not save profile updates.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Staff Desk Officer Profile" size="md">
      <div className="space-y-3">
        {/* Banner Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white border border-white/10 shadow-lg">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3.5 text-left">
            <div className="relative shrink-0">
              <Avatar src={currentUser.avatar} name={currentUser.name} size="md" className="ring-2 ring-white/20 shadow-lg" />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  dutyStatus === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
                title={dutyStatus === 'ACTIVE' ? 'Active On-Duty' : 'On Break'}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base text-white truncate">{currentUser.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 uppercase tracking-wider shrink-0">
                  Senior Staff
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-300">ID: {currentUser.collegeId}</p>
              <p className="text-[11px] text-slate-400 font-medium truncate">{department}</p>
            </div>
          </div>

          {/* Shift Duty Status Toggle Bar */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Shift Status:</span>
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setDutyStatus('ACTIVE')}
                className={`px-2.5 py-0.5 rounded-md font-bold transition-all text-[11px] cursor-pointer ${
                  dutyStatus === 'ACTIVE' ? 'bg-emerald-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                🟢 On Duty
              </button>
              <button
                type="button"
                onClick={() => setDutyStatus('BREAK')}
                className={`px-2.5 py-0.5 rounded-md font-bold transition-all text-[11px] cursor-pointer ${
                  dutyStatus === 'BREAK' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                ☕ On Break
              </button>
            </div>
          </div>
        </div>

        {/* Quick Shift Metrics */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-heading font-extrabold text-slate-900 text-sm">6.5 Hrs</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider block">Shift Time</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-center gap-1 text-emerald-600 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-heading font-extrabold text-slate-900 text-sm">142</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider block">Scans Done</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
              <Award className="w-3.5 h-3.5" />
              <span className="font-heading font-extrabold text-slate-900 text-sm">4.9 ★</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider block">Rating</span>
          </div>
        </div>

        {/* Profile Details & Form */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <h4 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">Staff Account Info</h4>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Edit Profile
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Full Name</span>
                </div>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Campus Email</span>
                </div>
                <span className="font-semibold text-slate-900 font-mono text-[11px]">{currentUser.email || 'elena.rostova@university.edu'}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">Assigned Dept</span>
                </div>
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">{department}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-2.5 animate-in fade-in">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-3.5 h-3.5 text-slate-400" />}
                required
              />

              <Input
                label="Campus Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-3.5 h-3.5 text-slate-400" />}
                required
              />

              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                leftIcon={<Building className="w-3.5 h-3.5 text-slate-400" />}
                required
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="destructive"
            size="sm"
            className="font-bold text-[11px] px-3 py-1 shadow-2xs"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              logout();
            }}
          >
            Sign Out
          </Button>

          <Button variant="secondary" size="sm" className="font-semibold text-[11px] px-3 py-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
