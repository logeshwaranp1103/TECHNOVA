import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8" />
      </div>
      <h1 className="font-heading text-4xl font-black text-white tracking-tight">404 — Page Not Found</h1>
      <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
        The requested library portal route does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link to="/">
          <Button variant="accent" size="md" className="font-bold" leftIcon={<ArrowLeft className="w-4 h-4 text-slate-950" />}>
            Back to Home / Portal
          </Button>
        </Link>
      </div>
    </div>
  );
};
