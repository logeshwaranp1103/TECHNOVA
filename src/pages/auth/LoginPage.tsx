import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Sparkles, Lock, User as UserIcon, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

const loginSchema = z.object({
  collegeId: z.string().min(3, 'Staff ID is required'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const [demoError, setDemoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      collegeId: 'STF1002',
      password: 'password123',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setDemoError(null);
      const validation = loginSchema.safeParse(values);
      if (!validation.success) {
        setDemoError(validation.error.issues[0]?.message || 'Invalid input');
        return;
      }

      await login(values.collegeId, values.password);
      navigate('/staff/dashboard');
    } catch (err: any) {
      setDemoError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Dynamic Floating Gradient Ambient Lights */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] rounded-full bg-teal-500/15 blur-[120px] pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-2xl shadow-blue-500/30 mb-4 ring-4 ring-white/10">
          <Sparkles className="w-9 h-9 fill-white" />
        </div>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          SeatSync <span className="text-teal-400 font-bold">OS</span>
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 font-medium max-w-sm mx-auto">
          Enterprise Smart Library & Desk Occupancy Console
        </p>

        {/* Feature Highlights Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-300">
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            ⚡ AI Grace Period Engine
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            📷 Desk QR Scanner
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            📊 Floor Heatmaps
          </span>
        </div>
      </div>

      {/* Auth Form Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-2xl shadow-blue-950/50 rounded-3xl border border-white/20 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {(error || demoError) && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || demoError}</span>
              </div>
            )}

            <Input
              label="Staff ID / Portal ID"
              placeholder="e.g. STF1002"
              leftIcon={<UserIcon className="w-4 h-4 text-slate-400" />}
              error={errors.collegeId?.message}
              {...register('collegeId')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                <span>Remember session</span>
              </label>
              <Link to="/forgot-password" className="font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-lg shadow-blue-600/30 rounded-xl"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Staff Console
            </Button>
          </form>

          {/* Quick Demo Staff Login Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Quick One-Click Demo Staff Account
            </p>
            <button
              type="button"
              onClick={() => {
                setValue('collegeId', 'STF1002');
                setValue('password', 'password123');
              }}
              className="inline-flex items-center justify-center gap-2.5 p-3 w-full rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-xs font-bold text-slate-800 cursor-pointer shadow-xs hover:shadow-md"
            >
              <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Fill Senior Staff Account (Elena Rostova - STF1002)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
