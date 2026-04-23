"use client";

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Camera, Loader2, Check, X, AlertCircle, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { captureFromVideo } from '@/lib/face-recognition';

interface EnrollData {
  token: string;
  adminId: string;
  adminName: string;
}

export default function FaceEnrollmentPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || null;
  
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [error, setError] = useState('');
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (token && token !== 'null') {
      verifyToken();
    } else {
      setError('Invalid enrollment link');
      setLoading(false);
    }
    return () => stopCamera();
  }, [token]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`/api/admin/face/verify-token?token=${token}`);
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setEnrollData({
          token: token!,
          adminId: data.adminId,
          adminName: data.adminName
        });
        initCamera();
      } else {
        setError(data.error || 'Invalid or expired enrollment link');
      }
    } catch (err) {
      setError('Failed to verify enrollment link');
    } finally {
      setLoading(false);
    }
  };

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
        detectFaceLoop();
      }
    } catch (err) {
      console.error('Camera error:', err);
      toast.error('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const detectFaceLoop = async () => {
    // Simple face detection check
    if (videoRef.current && streamActive) {
      // In mock mode, just show face detected
      setFaceDetected(true);
    }
    if (streamActive) {
      requestAnimationFrame(detectFaceLoop);
    }
  };

  const handleEnroll = async () => {
    if (!videoRef.current || !enrollData) return;

    setEnrolling(true);
    
    try {
      const imageData = await captureFromVideo(videoRef.current, 640, 480);
      
      const res = await fetch('/api/admin/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: enrollData.adminId,
          userName: enrollData.adminName,
          imageData,
          token: enrollData.token
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEnrolled(true);
        toast.success('Face enrolled successfully!');
      } else {
        toast.error(data.error || 'Failed to enroll face');
      }
    } catch (err) {
      toast.error('Failed to enroll face');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <X size={48} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-xl font-black mb-2">Enrollment Failed</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (enrolled) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={40} className="text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">Face Enrolled!</h1>
          <p className="text-gray-400 mb-6">You can now login with face recognition.</p>
          <a 
            href="/ueadmin/login"
            className="inline-block px-8 py-3 bg-white text-black font-bold rounded-full"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-black text-white">Face Enrollment</h1>
          <p className="text-gray-400 text-sm mt-2">
            Welcome, <span className="text-white font-bold">{enrollData?.adminName}</span>
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-[320px] object-cover"
          />
          
          {faceDetected && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
              <Check size={12} /> Face Detected
            </div>
          )}
          
          {!faceDetected && streamActive && (
            <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
              <AlertCircle size={12} /> Position your face in frame
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-400 text-center">
          Position your face in the frame and click Enroll
        </div>

        <button
          onClick={handleEnroll}
          disabled={!streamActive || enrolling}
          className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-4 bg-white text-black font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-all"
        >
          {enrolling ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Enrolling...
            </>
          ) : (
            <>
              <Camera size={18} /> Enroll My Face
            </>
          )}
        </button>

        <p className="text-center text-gray-500 text-xs mt-4">
          This link can only be used once and expires in 24 hours
        </p>
      </div>
    </div>
  );
}