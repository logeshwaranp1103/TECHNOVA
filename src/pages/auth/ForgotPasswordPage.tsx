import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-100 sm:px-10">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="text-center mb-4">
                <h3 className="font-heading text-xl font-bold text-slate-900">Reset Password</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered campus email to receive a password reset code.
                </p>
              </div>

              <Input
                label="Campus Email Address"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                required
              />

              <Button type="submit" variant="primary" size="lg" className="w-full font-bold">
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900">
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Check Your Email</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                We've dispatched a password reset link to <strong className="text-slate-900">{email}</strong>. Please follow the instructions to set a new password.
              </p>
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Link to="/reset-password">
                  <Button variant="accent" size="md" className="w-full">
                    Proceed to Reset Form (Demo)
                  </Button>
                </Link>
                <Link to="/login" className="text-xs text-slate-500 hover:underline">
                  Return to Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
