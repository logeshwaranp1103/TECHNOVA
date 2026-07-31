import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-500 flex items-center justify-center mb-4">
        <ShieldAlert className="w-9 h-9" />
      </div>
      <h1 className="font-heading text-3xl font-bold tracking-tight">403 — Access Restricted</h1>
      <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
        You do not have authorization to view this area or the requested resource is unavailable.
      </p>
      <div className="mt-6">
        <Button variant="accent" size="md" className="font-bold" onClick={() => navigate('/staff/dashboard')} leftIcon={<ArrowLeft className="w-4 h-4 text-slate-950" />}>
          Return to Staff Dashboard
        </Button>
      </div>
    </div>
  );
};
