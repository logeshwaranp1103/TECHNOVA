import React, { useEffect, useState } from 'react';
import type { SystemPolicy } from '../../types/policy';
import { api } from '../../services/api';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  SlidersHorizontal,
  Timer,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const PolicySettingsPage: React.FC = () => {
  const [policy, setPolicy] = useState<SystemPolicy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadPolicies = async () => {
      setIsLoading(true);
      try {
        const p = await api.getPolicies();
        setPolicy(p);
      } finally {
        setIsLoading(false);
      }
    };
    loadPolicies();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setIsSaving(true);
    try {
      await api.updatePolicies(policy);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !policy) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading system policies...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 max-w-4xl">
      <PageHeader
        title="System Policy & Rule Configuration"
        subtitle="Configure library operational policies, grace periods, penalty thresholds, and waitlist response windows."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Waitlist Response Window Card - Highlighted Requirement */}
        <Card className="p-6 border-l-4 border-l-blue-600 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 leading-none">
                Waitlist Response Window (Minutes)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Time window a notified waitlist student has to accept or decline before their offer automatically expires and advances to the next student in queue.
              </p>
            </div>
          </div>

          <div className="pt-2 max-w-xs">
            <Input
              type="number"
              min={1}
              max={120}
              label="Response Window Length (Minutes)"
              value={policy.waitlistResponseWindowMinutes || 15}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  waitlistResponseWindowMinutes: parseInt(e.target.value, 10) || 15,
                })
              }
            />
          </div>
        </Card>

        {/* Core Library Reservation Rules Card */}
        <Card className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/80">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 leading-none">
                Core Library Reservation Rules
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                System limits for booking duration, check-in grace periods, and user caps.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              type="number"
              min={1}
              max={12}
              label="Max Reservation Duration (Hours)"
              value={policy.maxReservationDurationHours}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  maxReservationDurationHours: parseInt(e.target.value, 10) || 4,
                })
              }
            />

            <Input
              type="number"
              min={5}
              max={60}
              label="Check-In Grace Period (Minutes)"
              value={policy.checkInGracePeriodMinutes}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  checkInGracePeriodMinutes: parseInt(e.target.value, 10) || 15,
                })
              }
            />

            <Input
              type="number"
              min={5}
              max={120}
              label="Cancellation Window (Minutes)"
              value={policy.cancellationWindowMinutes}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  cancellationWindowMinutes: parseInt(e.target.value, 10) || 30,
                })
              }
            />

            <Input
              type="number"
              min={1}
              max={10}
              label="No-Show Penalty Threshold"
              value={policy.noShowPenaltyThreshold}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  noShowPenaltyThreshold: parseInt(e.target.value, 10) || 3,
                })
              }
            />

            <Input
              type="number"
              min={1}
              max={5}
              label="Max Active Bookings Per User"
              value={policy.maxActiveReservationsPerUser}
              onChange={(e) =>
                setPolicy({
                  ...policy,
                  maxActiveReservationsPerUser: parseInt(e.target.value, 10) || 2,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
            <Input
              type="text"
              label="Library Operating Open Time"
              value={policy.libraryOpenTime}
              onChange={(e) => setPolicy({ ...policy, libraryOpenTime: e.target.value })}
            />
            <Input
              type="text"
              label="Library Operating Close Time"
              value={policy.libraryCloseTime}
              onChange={(e) => setPolicy({ ...policy, libraryCloseTime: e.target.value })}
            />
          </div>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> System policies saved successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Changes apply instantly across all library desk services.
            </span>
          )}

          <Button type="submit" variant="primary" size="md" className="font-bold gap-2" disabled={isSaving}>
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save System Policy'}
          </Button>
        </div>
      </form>
    </div>
  );
};
