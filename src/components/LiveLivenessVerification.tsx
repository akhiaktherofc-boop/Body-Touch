import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, XCircle, Loader2, Scan, Info, ExternalLink, RefreshCw, Smartphone, Check, RotateCw, Trash2, ShieldCheck, Zap } from 'lucide-react';

interface LiveLivenessVerificationProps {
  onVerificationSuccess: (selfieDataUrl: string) => void;
  onCancel: () => void;
}

export default function LiveLivenessVerification({ onVerificationSuccess, onCancel }: LiveLivenessVerificationProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verificationState, setVerificationState] = useState<'idle' | 'loading' | 'active' | 'success' | 'failed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showFlash, setShowFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isIframe = window.self !== window.top;

  // Sync / Listen for verification data if running inside popup window bypass
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'LIVENESS_SUCCESS') {
        setVerificationState('success');
        setCapturedImage(event.data.selfie);
        setTimeout(() => {
          onVerificationSuccess(event.data.selfie);
        }, 1200);
      }
    };

    const interval = setInterval(() => {
      const storedSelfie = localStorage.getItem('bt_last_verified_selfie');
      if (storedSelfie) {
        localStorage.removeItem('bt_last_verified_selfie'); // Consume token
        setVerificationState('success');
        setCapturedImage(storedSelfie);
        setTimeout(() => {
          onVerificationSuccess(storedSelfie);
        }, 1200);
      }
    }, 1000);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, [onVerificationSuccess]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Bind the camera stream to the video element safely and keep it synchronized
  useEffect(() => {
    if (!stream || verificationState !== 'active') return;

    const video = videoRef.current;
    if (video) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch(e => console.warn("Video play request failed, waiting for user trigger:", e));
      }
    }

    // Interval to ensure the video is playing and stream is active
    const interval = setInterval(() => {
      const activeVideo = videoRef.current;
      if (activeVideo && stream) {
        if (activeVideo.srcObject !== stream) {
          activeVideo.srcObject = stream;
        }
        if (activeVideo.paused) {
          activeVideo.play().catch(err => {
            console.warn("Autoplay was blocked or interrupted:", err);
          });
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [stream, verificationState]);

  // Request Webcam Access with robust fallback layers
  const startWebcam = async () => {
    try {
      setVerificationState('loading');
      setErrorMessage('');
      setCapturedImage(null);
      
      // Stop any existing streams first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      let mediaStream: MediaStream;
      try {
        // Attempt front-facing ideal resolution stream
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'user', 
            width: { ideal: 640 }, 
            height: { ideal: 480 } 
          },
          audio: false
        });
      } catch (firstErr) {
        console.warn('Advanced camera constraints failed, trying basic front camera...', firstErr);
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
          });
        } catch (secondErr) {
          console.warn('FacingMode constraint failed, falling back to generic video...', secondErr);
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }
      
      setStream(mediaStream);
      setVerificationState('active');
    } catch (err: any) {
      console.error('Camera hardware access failed completely:', err);
      setVerificationState('failed');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('ক্যামেরা ব্যবহারের অনুমতি দেওয়া হয়নি। অনুগ্রহ করে ব্রাউজারের অ্যাড্রেস বার থেকে ক্যামেরার পারমিশন (Allow) নিশ্চিত করুন।');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('আপনার ডিভাইসে কোনো সচল ক্যামেরা খুঁজে পাওয়া যায়নি।');
      } else {
        setErrorMessage(`ক্যামেরা চালু করা সম্ভব হয়নি (${err.message || 'Unknown Error'})। অনুগ্রহ করে ফোনের ক্যামেরা সচল আছে কিনা দেখুন।`);
      }
    }
  };

  // Capture photo from active stream
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Flash effect trigger
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 150);

      // Match canvas dimensions to the video resolution
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      // Flip horizontally for natural mirror selfie
      ctx.translate(width, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(video, 0, 0, width, height);

      // Reset transformations
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(dataUrl);
        setVerificationState('success');
        
        // Stop stream tracks immediately to free camera
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      } catch (e: any) {
        console.error("Canvas export failed:", e);
        setErrorMessage("ফটো ক্যাপচার করতে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        setVerificationState('failed');
      }
    }
  };

  // Handle native camera capture fallback
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationState('loading');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setCapturedImage(dataUrl);
          setVerificationState('success');
        } else {
          setErrorMessage("ফটো লোড করা সম্ভব হয়নি।");
          setVerificationState('failed');
        }
      };
      reader.onerror = () => {
        setErrorMessage("ফাইল রিডার ত্রুটি।");
        setVerificationState('failed');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onVerificationSuccess(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setVerificationState('idle');
    startWebcam();
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="bg-[#0c0f1d] border border-yellow-600/35 p-6 rounded-2xl flex flex-col items-center max-w-sm mx-auto space-y-4 text-center shadow-2xl relative overflow-hidden">
      
      {/* Background glowing line */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />

      {/* Hidden inputs for native camera file capture with capture="user" (strictly forces front system camera app on mobile, preventing gallery uploads) */}
      <input 
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="user"
        onChange={handleNativeCapture}
        className="hidden"
      />

      {/* Title Header */}
      <div className="space-y-1">
        <h3 className="text-sm font-black text-[#dbaa61] tracking-widest flex items-center justify-center gap-1.5 font-mono uppercase">
          <Scan className="w-4 h-4 text-yellow-400 animate-pulse" />
          Live Selfie Verification
        </h3>
        <p className="text-[9.5px] text-slate-400 uppercase tracking-widest font-mono font-black">
          REAL-TIME CAMERA PREVIEW
        </p>
      </div>

      <div className="w-full flex flex-col items-center space-y-4">
        
        {/* Camera/Preview viewport with WebKit 3D acceleration fixes */}
        <div 
          className="relative w-full max-w-[260px] aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-yellow-600/40 shadow-xl shadow-black/80 flex items-center justify-center"
          style={{ WebkitTransform: 'translate3d(0,0,0)', transform: 'translate3d(0,0,0)' }}
        >
          {/* Real-time Flash Effect Overlay */}
          <div className={`absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none ${showFlash ? 'opacity-100' : 'opacity-0'}`} />

          {/* REAL LIVE CAMERA STREAM */}
          {verificationState === 'active' && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  transform: 'scaleX(-1) translate3d(0,0,0)', 
                  WebkitTransform: 'scaleX(-1) translate3d(0,0,0)', 
                  objectFit: 'cover', 
                  width: '100%', 
                  height: '100%',
                  display: 'block' 
                }}
                className="bg-slate-950" 
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning indicator */}
              <div className="absolute inset-x-0 h-0.5 bg-yellow-500/80 shadow-[0_0_8px_#eab308] animate-bounce pointer-events-none top-1/3" />
            </>
          )}

          {/* Captured selfie image preview */}
          {capturedImage && (
            <img 
              src={capturedImage} 
              className="w-full h-full object-cover" 
              alt="Captured Selfie" 
              referrerPolicy="no-referrer"
            />
          )}

          {/* Biometric overlay frame */}
          <div className="absolute inset-4 border border-yellow-500/20 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-yellow-500/60" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-yellow-500/60" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-yellow-500/60" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-yellow-500/60" />
          </div>

          {/* Connection loading state */}
          {verificationState === 'loading' && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center">
              <Loader2 className="w-8 h-8 text-[#dbaa61] animate-spin mb-2" />
              <span className="text-[10px] text-slate-300 uppercase font-black tracking-widest">
                Camera Opening...
              </span>
            </div>
          )}

          {/* Default idle camera graphic placeholder */}
          {verificationState === 'idle' && !capturedImage && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center p-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-2.5 animate-pulse">
                <Camera className="w-6 h-6 text-[#dbaa61]" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Camera Ready</p>
            </div>
          )}

          {/* Error overlay */}
          {verificationState === 'failed' && (
            <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center p-4 text-center">
              <XCircle className="w-10 h-10 text-red-500 animate-pulse mb-2" />
              <span className="text-[10px] text-white uppercase font-black tracking-widest">
                Failed to Open
              </span>
            </div>
          )}
        </div>

        {/* Action Controls & Interactive Buttons */}
        <div className="w-full space-y-3">
          
          {/* IDLE VIEW: Start triggers */}
          {verificationState === 'idle' && !capturedImage && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
                মডেলের ভেরিফিকেশন সম্পন্ন করতে আপনার ডিভাইসের ক্যামেরা দিয়ে একটি সরাসরি সেলফি ছবি ক্যাপচার করতে হবে।
              </p>

              <div className="flex flex-col gap-2 pt-1">
                {/* Single, Beautifully Styled Golden Button to Open Camera */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-[#dbaa61] hover:from-yellow-400 hover:to-yellow-500 active:scale-[0.98] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 shrink-0 text-slate-950" />
                  ক্যামেরা খুলুন (Open Camera)
                </button>
              </div>
            </div>
          )}

          {/* ACTIVE VIEW: Shutter clicker */}
          {verificationState === 'active' && !capturedImage && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.97] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
              >
                <Zap className="w-4 h-4 text-yellow-300 shrink-0 fill-current" />
                ক্যাপচার করুন (CAPTURE SELFIE)
              </button>

              <button
                type="button"
                onClick={() => {
                  stopWebcam();
                  setVerificationState('idle');
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 text-[10.5px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                বাতিল করুন
              </button>
            </div>
          )}

          {/* SUCCESS VIEW: Captured Image Confirm / Retake */}
          {capturedImage && (
            <div className="space-y-3 animate-fadeIn">
              <div className="bg-emerald-950/20 border border-emerald-500/25 p-3 rounded-xl">
                <p className="text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> সেলফি সফলভাবে ক্যাপচার হয়েছে!
                </p>
                <p className="text-[10px] text-slate-300 font-bold mt-1">
                  ছবিটি স্পষ্ট এবং আলো ঠিক থাকলে নিচে নিশ্চিত করুন।
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  নিশ্চিত করুন (Confirm)
                </button>

                <button
                  type="button"
                  onClick={handleRetake}
                  className="py-3 px-4 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <RotateCw className="w-4 h-4 shrink-0" />
                  আবার তুলুন
                </button>
              </div>
            </div>
          )}

          {/* FAILED STATE VIEW */}
          {verificationState === 'failed' && (
            <div className="space-y-3">
              <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-xl text-left text-red-300 space-y-1 text-xs">
                <p className="font-bold flex items-center gap-1 text-red-400">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  ভেরিফিকেশন ব্যর্থ হয়েছে
                </p>
                <p className="text-[10px] leading-relaxed font-bold text-slate-300">
                  {errorMessage || "ক্যামেরা এক্সেস করা সম্ভব হয়নি।"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-[#dbaa61] text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-4 h-4" />
                  ফোনের ক্যামেরা ব্যবহার করুন (রিমোট ফিক্স)
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationState('idle');
                      setErrorMessage('');
                    }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    পুনরায় চেষ্টা করুন
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl text-[10.5px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Back Button */}
          {verificationState === 'idle' && !capturedImage && (
            <button
              type="button"
              onClick={onCancel}
              className="text-[9px] text-slate-500 hover:text-slate-300 uppercase font-black tracking-widest font-mono cursor-pointer block mx-auto py-1 animate-pulse"
            >
              বন্ধ করুন (Go Back)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
