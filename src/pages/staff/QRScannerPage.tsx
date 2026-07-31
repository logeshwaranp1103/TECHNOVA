import React, { useState, useEffect, useRef } from 'react';
import { useReservationStore } from '../../store/useReservationStore';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { QrCode, CheckCircle2, AlertCircle, Scan, Camera, CameraOff, Video } from 'lucide-react';
import type { Reservation } from '../../types/reservation';

export const QRScannerPage: React.FC = () => {
  const { reservations, fetchReservations, checkInReservation } = useReservationStore();
  const [manualCode, setManualCode] = useState('');
  const [selectedDemoRes, setSelectedDemoRes] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; res?: Reservation } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Device Camera Permission & Stream States
  const [cameraPermission, setCameraPermission] = useState<'IDLE' | 'GRANTED' | 'DENIED'>('IDLE');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const requestCameraAccess = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraPermission('DENIED');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      setCameraPermission('GRANTED');
    } catch {
      setCameraPermission('DENIED');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraPermission('IDLE');
  };

  useEffect(() => {
    if (cameraPermission === 'GRANTED' && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraPermission, cameraStream]);

  // Clean up media stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  const upcomingReservations = reservations.filter((r) => r.status === 'UPCOMING');

  const handleScanCode = async (codeToScan: string) => {
    if (!codeToScan) return;
    setIsScanning(true);
    setScanResult(null);

    setTimeout(async () => {
      try {
        const res = await checkInReservation(codeToScan);
        setScanResult({
          success: true,
          message: `Check-in Verified! Seat ${res.seatNumber} is now OCCUPIED by ${res.userName}.`,
          res,
        });
        setManualCode('');
      } catch (err: any) {
        setScanResult({
          success: false,
          message: err.message || 'Invalid or expired QR pass.',
        });
      } finally {
        setIsScanning(false);
      }
    }, 1200);
  };

  const demoOptions = [
    { value: '', label: '-- Select Sample Upcoming Booking to Simulate Scan --' },
    ...upcomingReservations.map((r) => ({
      value: r.bookingCode,
      label: `${r.bookingCode} | Seat ${r.seatNumber} (${r.userName})`,
    })),
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <PageHeader
        title="Desk QR Scanner & Optical Check-in Terminal"
        subtitle="Point student digital QR passes at the optical scanner beam or enter booking credentials manually."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Futuristic Camera Viewport with Device Permission Prompt */}
        <Card className="flex flex-col items-center justify-center p-8 bg-slate-950 text-white relative overflow-hidden min-h-[380px] rounded-3xl border border-white/10 shadow-2xl">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none z-10" />

          {/* Live Video Element (Rendered when permission is GRANTED) */}
          {cameraPermission === 'GRANTED' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover opacity-80 z-0"
            />
          )}

          {/* Camera Permission Prompt (IDLE state) */}
          {cameraPermission === 'IDLE' && (
            <div className="relative z-20 text-center max-w-xs space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto shadow-lg">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-white">Camera Access Required</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Please allow access to your device's camera to scan student QR codes in real-time.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold shadow-lg rounded-xl cursor-pointer"
                onClick={requestCameraAccess}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Video className="w-4 h-4 shrink-0" />
                  Allow Camera Access
                </span>
              </Button>
            </div>
          )}

          {/* Camera Denied / Error Prompt */}
          {cameraPermission === 'DENIED' && (
            <div className="relative z-20 text-center max-w-xs space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg">
                <CameraOff className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-rose-400">Camera Access Denied</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Camera permission was denied or no camera device was detected. You can use manual entry or simulation controls.
                </p>
              </div>
              <Button
                variant="secondary"
                size="md"
                className="w-full font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl cursor-pointer"
                onClick={requestCameraAccess}
              >
                Retry Permission Request
              </Button>
            </div>
          )}

          {/* Viewfinder Overlays (Rendered when camera is GRANTED) */}
          {cameraPermission === 'GRANTED' && (
            <>
              {/* Animated Laser Scanning Beam */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-teal-500 via-emerald-400 to-blue-500 shadow-[0_0_15px_#2dd4bf] animate-laser top-1/2 pointer-events-none z-20" />

              {/* Reticle Brackets Viewfinder */}
              <div className="w-56 h-56 rounded-3xl border-2 border-teal-400/40 bg-teal-500/5 flex items-center justify-center p-4 relative ring-1 ring-white/10 shadow-inner z-20">
                {/* Corner Bracket Accents */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-teal-400" />

                <Scan
                  className={`w-20 h-20 text-teal-400 transition-all ${
                    isScanning ? 'scale-110 opacity-100 animate-pulse' : 'opacity-70'
                  }`}
                />
              </div>

              <div className="flex items-center justify-between w-full px-4 mt-6 relative z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                  <p className="text-xs font-mono font-medium text-slate-300">
                    {isScanning ? 'Decoding Pass Signal...' : 'Live Device Camera Active'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-[11px] font-mono text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Turn Off
                </button>
              </div>
            </>
          )}
        </Card>

        {/* Scan Actions & Manual Fallback */}
        <Card className="space-y-6 p-6 flex flex-col justify-between rounded-3xl border border-slate-200/90 shadow-md">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Terminal Controls</h3>
              </div>
              <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 uppercase tracking-wider">
                Ready
              </span>
            </div>

            {/* Quick Demo Simulator Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Simulate Camera Target Pass
              </label>
              <Select
                options={demoOptions}
                value={selectedDemoRes}
                onChange={(e) => {
                  setSelectedDemoRes(e.target.value);
                  if (e.target.value) handleScanCode(e.target.value);
                }}
              />
            </div>

            {/* Manual Entry Fallback */}
            <div className="pt-1 space-y-3">
              <Input
                label="Manual Booking Code or QR Data String"
                placeholder="e.g. RES-2026-8812"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <Button
                variant="primary"
                size="md"
                className="w-full font-bold shadow-md rounded-xl"
                isLoading={isScanning}
                onClick={() => handleScanCode(manualCode)}
              >
                Submit Manual Check-in
              </Button>
            </div>
          </div>

          {/* Feedback Result Alert */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl text-xs font-medium border flex items-start gap-3.5 transition-all animate-in fade-in slide-in-from-bottom-2 ${
                scanResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
                  : 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-extrabold text-sm">{scanResult.success ? 'Pass Verified & Checked In!' : 'Check-in Error'}</p>
                <p className="mt-1 leading-relaxed text-slate-700 font-medium">{scanResult.message}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
