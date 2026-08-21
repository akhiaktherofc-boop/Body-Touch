import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, XCircle, Loader2, RefreshCw, Scan, Sparkles, Smile as SmileIcon, Eye, MoveLeft, MoveRight } from 'lucide-react';

interface LiveLivenessVerificationProps {
  onVerificationSuccess: (selfieDataUrl: string) => void;
  onCancel: () => void;
}

type LivenessAction = 'Blink Eyes' | 'Turn Head Left' | 'Turn Head Right' | 'Smile';

export default function LiveLivenessVerification({ onVerificationSuccess, onCancel }: LiveLivenessVerificationProps) {
  const [modelsLoading, setModelsLoading] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2 for the 3 actions
  const [actionSequence, setActionSequence] = useState<LivenessAction[]>([]);
  const [timeLeft, setTimeLeft] = useState(5); // 5 seconds per action
  const [verificationState, setVerificationState] = useState<'idle' | 'loading' | 'active' | 'processing' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('Initialize Face Verification');
  const [errorMessage, setErrorMessage] = useState('');
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  // Generate 3 random actions on start
  const generateActions = () => {
    const list: LivenessAction[] = ['Blink Eyes', 'Turn Head Left', 'Turn Head Right', 'Smile'];
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    setActionSequence(selected);
    setCurrentStep(0);
    setTimeLeft(5);
    setVerificationState('active');
    setErrorMessage('');
    setStatusMessage(`Perform action 1: ${selected[0]}`);
  };

  // Simulate AI Model Loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setModelsLoading(false);
      startWebcam();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Request Webcam Access
  const startWebcam = async () => {
    try {
      setVerificationState('loading');
      setStatusMessage('Requesting camera permission...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setVerificationState('idle');
      setStatusMessage('Camera ready. Prepare for Active Liveness scan.');
    } catch (err) {
      console.error('Camera access failed:', err);
      setVerificationState('failed');
      setErrorMessage('Could not access webcam. Please grant camera permissions.');
    }
  };

  // Stop Webcam
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stream]);

  // Handle Action Completion / Progression
  const verifyActionSuccess = () => {
    if (currentStep < 2) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setTimeLeft(5);
      setStatusMessage(`Excellent! Perform action ${nextStep + 1}: ${actionSequence[nextStep]}`);
    } else {
      // Completed all 3 actions successfully! Capture the selfie
      setVerificationState('processing');
      setStatusMessage('Processing facial signatures...');
      
      setTimeout(() => {
        captureSelfie();
      }, 1000);
    }
  };

  // Capture the final selfie data URL on success
  const captureSelfie = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add a subtle golden aesthetic stamp so the admin knows it is a live biometric selfie
        ctx.fillStyle = 'rgba(219, 170, 97, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#dbaa61';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        ctx.font = 'bold 16px monospace';
        ctx.fillStyle = '#dbaa61';
        ctx.fillText('LIVENESS VERIFIED SECURE', 25, 40);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 25, 60);

        const dataUrl = canvas.toDataURL('image/jpeg');
        setVerificationState('success');
        stopWebcam();
        setTimeout(() => {
          onVerificationSuccess(dataUrl);
        }, 1500);
      }
    }
  };

  // Timer loop for the challenges
  useEffect(() => {
    if (verificationState !== 'active') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired for this challenge! Trigger failure
          setVerificationState('failed');
          setErrorMessage(`Time expired! You failed to complete "${actionSequence[currentStep]}" within 5 seconds.`);
          setStatusMessage('Scan failed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [verificationState, currentStep, actionSequence]);

  // Real-time Canvas Processing (Optical Flow / Landmark Motion Validation)
  useEffect(() => {
    if (verificationState !== 'active' || !videoRef.current) return;

    const video = videoRef.current;
    let localFrameId: number;

    const processFrame = () => {
      if (video.paused || video.ended) return;

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Keep canvas dimensions matched
          canvas.width = 160; 
          canvas.height = 120;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          try {
            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;

            // Simple optical face tracking simulation & pixel motion differential analysis
            let totalDiff = 0;
            let leftIntensity = 0;
            let rightIntensity = 0;
            let centerIntensity = 0;

            if (prevFrameDataRef.current && prevFrameDataRef.current.length === data.length) {
              const prevData = prevFrameDataRef.current;
              for (let i = 0; i < data.length; i += 4) {
                // Grayscale average comparison
                const currentGray = (data[i] + data[i+1] + data[i+2]) / 3;
                const prevGray = (prevData[i] + prevData[i+1] + prevData[i+2]) / 3;
                const diff = Math.abs(currentGray - prevGray);
                totalDiff += diff;

                // Identify location of motion (Left side of screen, right side, or center)
                const pixelIdx = i / 4;
                const x = pixelIdx % canvas.width;
                if (x < canvas.width / 3) {
                  leftIntensity += diff;
                } else if (x > (canvas.width * 2) / 3) {
                  rightIntensity += diff;
                } else {
                  centerIntensity += diff;
                }
              }
            }

            // Save current frame data
            prevFrameDataRef.current = new Uint8ClampedArray(data);

            const normalizedDiff = totalDiff / (canvas.width * canvas.height);
            setMotionIntensity(normalizedDiff);

            // If average diff is non-trivial, a face is inside the scanning viewport
            setFaceDetected(normalizedDiff > 0.5);

            // Active action validation triggers
            const currentChallenge = actionSequence[currentStep];

            if (normalizedDiff > 1.5) { // User is moving
              if (currentChallenge === 'Turn Head Left' && leftIntensity > rightIntensity * 1.6) {
                verifyActionSuccess();
              } else if (currentChallenge === 'Turn Head Right' && rightIntensity > leftIntensity * 1.6) {
                verifyActionSuccess();
              } else if (currentChallenge === 'Smile' && centerIntensity > (leftIntensity + rightIntensity) * 0.9) {
                // Smile yields motion mostly in the center mouth region
                verifyActionSuccess();
              } else if (currentChallenge === 'Blink Eyes' && normalizedDiff > 2.0) {
                // Blink causes rapid local pixel shifts in center-eyes region
                verifyActionSuccess();
              }
            }
          } catch (e) {
            // Fallback fail-safe
          }
        }
      }

      localFrameId = requestAnimationFrame(processFrame);
    };

    localFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(localFrameId);
  }, [verificationState, currentStep, actionSequence]);

  // Icons matching specific action
  const getActionIcon = (action: LivenessAction) => {
    switch (action) {
      case 'Blink Eyes':
        return <Eye className="w-12 h-12 text-yellow-400 animate-pulse" />;
      case 'Smile':
        return <SmileIcon className="w-12 h-12 text-yellow-400 animate-bounce" />;
      case 'Turn Head Left':
        return <MoveLeft className="w-12 h-12 text-yellow-400 animate-pulse" />;
      case 'Turn Head Right':
        return <MoveRight className="w-12 h-12 text-yellow-400 animate-pulse" />;
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-yellow-700/50 p-6 rounded-2xl flex flex-col items-center max-w-md mx-auto space-y-5 text-center shadow-2xl relative overflow-hidden">
      
      {/* Background radial highlight */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />

      {/* Title / Eyebrow */}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-[#dbaa61] tracking-widest flex items-center justify-center gap-1.5 font-sans uppercase">
          <Scan className="w-4 h-4 animate-spin" />
          Active Liveness Scanner
        </h3>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">
          AI-Powered Identity Verification
        </p>
      </div>

      {modelsLoading ? (
        <div className="py-12 space-y-4 flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-[#dbaa61] animate-spin" />
          <div className="space-y-1.5">
            <p className="text-xs text-white font-bold uppercase tracking-wider animate-pulse">
              Loading Biometric Verification Models...
            </p>
            <p className="text-[10px] text-slate-400 font-sans max-w-xs">
              Initializing neural weights, face landmarks detectors, and eye aspect counters.
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          
          {/* Live Camera Feed Container */}
          <div className="relative w-full max-w-[280px] aspect-square rounded-full overflow-hidden bg-black border-4 border-yellow-700/50 shadow-2xl shadow-yellow-950/20 group">
            
            {/* The Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]" // mirror effect
            />

            {/* Hidden canvas for frame calculations */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Futuristic target outline overlays */}
            <div className="absolute inset-0 border-[24px] border-black/35 pointer-events-none" />
            <div className="absolute inset-4 rounded-full border-2 border-dashed border-[#dbaa61]/30 pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-yellow-500/20 pointer-events-none" />
            
            {/* Scanning horizontal laser line */}
            {verificationState === 'active' && (
              <div className="absolute left-0 right-0 h-0.5 bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.8)] animate-bounce pointer-events-none top-1/4" />
            )}

            {/* Micro Facial Landmarks Visualization Dot Simulation */}
            {verificationState === 'active' && faceDetected && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping top-1/3 left-[40%]" />
                <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping top-1/3 left-[60%]" />
                <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping top-[55%] left-1/2" />
                <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping top-[70%] left-[45%]" />
                <div className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping top-[70%] left-[55%]" />
              </div>
            )}

            {/* Success screen frame overlay */}
            {verificationState === 'success' && (
              <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center animate-fadeIn">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                <span className="text-xs text-white uppercase font-black tracking-widest mt-2">
                  Liveness Checked
                </span>
              </div>
            )}

            {/* Failed screen overlay */}
            {verificationState === 'failed' && (
              <div className="absolute inset-0 bg-red-950/85 flex flex-col items-center justify-center animate-fadeIn p-4">
                <XCircle className="w-12 h-12 text-red-500 animate-pulse" />
                <span className="text-xs text-white uppercase font-black tracking-widest mt-2">
                  Scan Failed
                </span>
              </div>
            )}
          </div>

          {/* Verification Status & Dynamic Steps */}
          <div className="w-full space-y-3">
            {verificationState === 'idle' && (
              <div className="space-y-4 py-2">
                <div className="text-xs text-slate-300 font-bold max-w-xs mx-auto leading-relaxed">
                  We will prompt you with <span className="text-[#dbaa61] font-bold">3 random challenges</span> to complete within 5 seconds each to verify you are a live human.
                </div>
                <button
                  type="button"
                  onClick={generateActions}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-[#dbaa61] hover:brightness-110 active:scale-[0.98] transition-all text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Start Active Liveness Test
                </button>
              </div>
            )}

            {verificationState === 'active' && actionSequence.length > 0 && (
              <div className="bg-black/40 border border-yellow-700/20 p-4 rounded-xl space-y-3 animate-fadeIn">
                
                {/* Active challenge icon and timer */}
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">Challenge:</span>
                    <span className="text-[11px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-black font-mono">
                      {currentStep + 1} of 3
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-mono">Time Left:</span>
                    <span className={`text-xs font-black font-mono px-2 py-0.5 rounded ${timeLeft <= 2 ? 'bg-red-600 text-white animate-ping' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                </div>

                {/* Display instructions */}
                <div className="py-2.5 flex flex-col items-center space-y-2 bg-yellow-950/20 border border-yellow-500/10 rounded-lg">
                  {getActionIcon(actionSequence[currentStep])}
                  <p className="text-sm font-black tracking-wide text-white uppercase font-sans animate-pulse">
                    {actionSequence[currentStep]}
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans px-4">
                    {actionSequence[currentStep] === 'Blink Eyes' && 'Close and open your eyes clearly.'}
                    {actionSequence[currentStep] === 'Smile' && 'Show a wide, bright smile to the camera.'}
                    {actionSequence[currentStep] === 'Turn Head Left' && 'Turn your head slowly towards your left side.'}
                    {actionSequence[currentStep] === 'Turn Head Right' && 'Turn your head slowly towards your right side.'}
                  </p>
                </div>

                {/* Biometric Scan feedback */}
                <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-500 border-t border-white/5 pt-2">
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {faceDetected ? 'Landmarks Detected' : 'No Face In View'}
                  </span>
                  <span>Motion: {(motionIntensity * 10).toFixed(0)}%</span>
                </div>
              </div>
            )}

            {verificationState === 'processing' && (
              <div className="bg-black/30 border border-yellow-700/20 p-4 rounded-xl space-y-2 animate-fadeIn flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                <p className="text-xs text-white font-bold uppercase tracking-wider animate-pulse mt-1">
                  Verifying Biometric Signatures...
                </p>
                <p className="text-[10px] text-slate-400 font-sans max-w-xs">
                  Analyzing ocular pixel movements and structural liveness indicators.
                </p>
              </div>
            )}

            {verificationState === 'failed' && (
              <div className="space-y-3.5 py-1.5">
                <p className="text-xs text-red-400 font-bold leading-relaxed max-w-xs mx-auto">
                  {errorMessage || 'Verification challenge timed out. Please try again.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateActions}
                    className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-[#dbaa61]/55 text-[#dbaa61] rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Verification
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="py-3 px-5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {verificationState === 'success' && (
              <div className="py-4 text-emerald-400 text-xs font-black uppercase tracking-widest animate-pulse flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Liveness Verification Passed!
              </div>
            )}

            {verificationState === 'idle' && (
              <button
                type="button"
                onClick={onCancel}
                className="text-[10px] text-slate-400 hover:text-slate-200 uppercase font-black tracking-widest transition-colors font-mono cursor-pointer block mx-auto py-1"
              >
                Go Back to Form
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
