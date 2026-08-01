import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { waitlistService } from '../services/waitlistService';
import { bookingService } from '../services/bookingService';
import { 
  Wrench, Zap, Trash2, RefreshCw, AlertTriangle, ChevronDown, ChevronUp 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WaitlistDemoPanel({ onScenarioChange }) {
  const [collapsed, setCollapsed] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetSlotId, setTargetSlotId] = useState('slot-4'); // Default to Afternoon Slot 2 (slot-4)

  const tomorrowDateStr = bookingService.getTomorrowDateStr();

  const handleCreateFullSlot = async (slotId) => {
    setLoadingAction(true);
    try {
      const res = await waitlistService.createFullSlotScenario(tomorrowDateStr, slotId);
      toast.success(`${res.slotLabel} is now fully booked! (${res.totalBooked}/40 seats reserved)`);
      if (onScenarioChange) onScenarioChange();
      setConfirmModalOpen(false);
    } catch (err) {
      toast.error('Failed to create full slot scenario');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSimulateSeatRelease = async (slotId = targetSlotId) => {
    setLoadingAction(true);
    try {
      const res = await waitlistService.simulateSeatRelease(tomorrowDateStr, slotId);
      toast.success(`Seat ${res.releasedSeatNumber} released! Auto-allocation triggered.`);
      if (onScenarioChange) onScenarioChange();
    } catch (err) {
      toast.error(err.message || 'Could not simulate seat release');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetTestData = async () => {
    setLoadingAction(true);
    try {
      const res = await waitlistService.resetTestScenarioData();
      toast.success(`Cleared ${res.removedCount} test records.`);
      if (onScenarioChange) onScenarioChange();
    } catch (err) {
      toast.error('Failed to clear test data');
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <Card className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl shadow-sm overflow-hidden mb-6">
      <CardContent className="p-4 space-y-3">
        
        {/* Panel Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Wrench size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-navy uppercase tracking-wider block">Waiting List Test Scenario</span>
              <span className="text-[10px] text-slate-500">Controlled test tool for hackathon evaluation & auto allocation testing</span>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-500 hover:text-navy p-1"
          >
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>

        {/* Panel Controls */}
        {!collapsed && (
          <div className="space-y-3 pt-2 border-t border-amber-200/60 animate-in fade-in">
            <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-tight flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <span>
                Select a slot below to fill all 40 seats for testing the <strong>"Join Waiting List"</strong> workflow and automatic seat allocation.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => { setTargetSlotId('slot-4'); setConfirmModalOpen(true); }}
                disabled={loadingAction}
                className="h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs rounded-xl"
              >
                <Zap size={14} className="mr-1.5" /> Fill Afternoon Slot 2 (40/40)
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => { setTargetSlotId('slot-1'); setConfirmModalOpen(true); }}
                disabled={loadingAction}
                className="h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs rounded-xl"
              >
                <Zap size={14} className="mr-1.5" /> Fill Morning Slot 1 (40/40)
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleSimulateSeatRelease(targetSlotId)}
                disabled={loadingAction}
                className="h-9 text-xs font-bold bg-white text-blue-700 border-blue-300 hover:bg-blue-50 rounded-xl"
              >
                <RefreshCw size={14} className={`mr-1.5 ${loadingAction ? 'animate-spin' : ''}`} /> Release 1 Seat (Trigger Auto Allocation)
              </Button>

              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleResetTestData}
                disabled={loadingAction}
                className="h-9 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <Trash2 size={14} className="mr-1.5" /> Reset Test Scenario Data
              </Button>
            </div>
          </div>
        )}

      </CardContent>

      {/* CONFIRMATION DIALOG */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-navy flex items-center gap-2">
              <Zap size={20} className="text-amber-500" /> Create Full-Slot Test Scenario?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              This will generate fictional student bookings to occupy all 40 seats in <strong>{targetSlotId === 'slot-4' ? 'Afternoon Slot 2 (3:25 PM – 4:25 PM)' : 'Morning Slot 1 (08:45 AM – 09:45 AM)'}</strong> for tomorrow. Existing real bookings will remain untouched.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)} disabled={loadingAction}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateFullSlot(targetSlotId)} disabled={loadingAction} className="bg-amber-500 hover:bg-amber-600 text-white font-bold">
              {loadingAction ? 'Creating...' : 'Fill Slot Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
