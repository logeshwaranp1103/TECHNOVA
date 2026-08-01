import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [collegeId, setCollegeId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!collegeId) return toast.error('College ID is required');
    
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('OTP sent successfully');
      toast('Demo OTP: 123456', { icon: 'ℹ️' });
      setStep(2);
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp !== '123456') return toast.error('Invalid OTP. Use 123456 for demo.');
    setStep(3);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-lightBg p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border p-8 space-y-6">
        <div>
          <Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-navy">Reset Password</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {step === 1 && "Enter your College ID to receive a verification code."}
            {step === 2 && "Enter the 6-digit verification code sent to your email."}
            {step === 3 && "Create a new strong password for your account."}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collegeId">College ID</Label>
              <Input
                id="collegeId"
                placeholder="e.g. 24AD042"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <p className="text-xs text-brandBlue italic">Use 123456 for demo simulation.</p>
            </div>
            <Button type="submit" className="w-full">
              Verify Code
            </Button>
            <div className="text-center">
              <button type="button" onClick={handleSendOtp} className="text-sm text-brandBlue hover:underline">
                Resend Code
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
