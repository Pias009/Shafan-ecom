"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Check, X, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadModels, isMockMode } from '@/lib/face-recognition';
import Link from 'next/link';

interface FaceLoginProps {
  onSuccess?: (userId: string) => void;
  onFaceMatched?: (userId: string) => void;
}

export function FaceLogin({ onSuccess, onFaceMatched }: FaceLoginProps) {
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [matchResult, setMatchResult] = useState<{ matched: boolean; userId?: string; userName?: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      await loadModels();
      setMockMode(isMockMode());
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera permissions.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Camera error: ' + error.message);
      }
    }
  };

  const handleScan = async () => {
    if (mockMode) {
      setScanning(true);
      await new Promise(r => setTimeout(r, 1500));
      setScanning(false);
      toast.error('Face login not configured. Please enroll your face first.');
      return;
    }

    if (!cameraReady || !videoRef.current) {
      toast.error('Camera not ready. Please wait.');
      return;
    }

    setScanning(true);
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      
      const res = await fetch('/api/admin/face/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });

      const data = await res.json();

      if (res.ok && data.matched) {
        setMatchResult({ matched: true, userId: data.userId, userName: data.userName });
        toast.success(`Welcome back, ${data.userName}!`);
        onFaceMatched?.(data.userId);
        onSuccess?.(data.userId);
      } else {
        setMatchResult({ matched: false });
        toast.error(data.message || 'Face not recognized. Please try again or use password login.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify face');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black flex items-center gap-2">
          <Shield size={20} />
          Face Login
        </h3>
        <div className="flex items-center gap-2">
          {mockMode ? (
            <span className="text-xs text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
              Test Mode
            </span>
          ) : cameraReady ? (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check size={12} /> Ready
            </span>
          ) : (
            <span className="text-xs text-gray-500">Loading...</span>
          )}
        </div>
      </div>

      {/* Camera */}
      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-[280px] object-cover ${cameraReady ? 'block' : 'hidden'}`}
        />
        
        {!cameraReady && !cameraError && (
          <div className="w-full h-[280px] flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Loader2 size={48} className="mx-auto mb-2 animate-spin text-blue-400" />
              <p className="text-sm">Starting camera...</p>
              <p className="text-xs text-gray-500 mt-1">Allow camera access</p>
            </div>
          </div>
        )}
        
        {cameraError && (
          <div className="w-full h-[280px] flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <AlertCircle size={48} className="mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-400">{cameraError}</p>
              <button 
                onClick={startCamera}
                className="mt-3 px-4 py-2 bg-white/10 rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {/* Face detected indicator */}
        {cameraReady && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
            <Camera size={12} /> Camera Active
          </div>
        )}
      </div>

      <div className="text-sm text-black/60">
        {mockMode ? (
          <p>Face login is in test mode. Contact super admin to enroll your face.</p>
        ) : matchResult?.matched ? (
          <p>Face recognized! Redirecting...</p>
        ) : matchResult !== null ? (
          <p>Face not recognized. Try again or use password.</p>
        ) : cameraError ? (
          <p>Camera issue. Try password login.</p>
        ) : (
          <p>Position your face in the camera.</p>
        )}
      </div>

      <button
        onClick={handleScan}
        disabled={!cameraReady || scanning || !!matchResult?.matched}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-all"
      >
        {scanning ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Scanning...
          </>
        ) : mockMode ? (
          <>
            <AlertCircle size={18} /> Test Mode
          </>
        ) : (
          <>
            <Camera size={18} /> Scan Face
          </>
        )}
      </button>

      <div className="text-center">
        <Link 
          href="/ueadmin/login" 
          className="text-xs text-black/40 hover:text-black/60 underline"
        >
          Or use password login
        </Link>
      </div>
    </div>
  );
}

export default FaceLogin;