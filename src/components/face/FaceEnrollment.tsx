"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, Loader2, Check, X, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { loadModels, detectFace, getFaceEmbedding, captureFromVideo } from '@/lib/face-recognition';

interface FaceEnrollmentProps {
  userId: string;
  userName: string;
  onEnrolled?: () => void;
}

export function FaceEnrollment({ userId, userName, onEnrolled }: FaceEnrollmentProps) {
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'enrolled' | 'failed'>('idle');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, []);

  const initCamera = async () => {
    try {
      await loadModels();
      setModelsLoaded(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
        
        detectFaceInLoop();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const detectFaceInLoop = async () => {
    if (!videoRef.current || !streamActive) return;
    
    try {
      const detection = await detectFace(videoRef.current);
      setFaceDetected(!!detection);
    } catch (error) {
      console.error('Detection error:', error);
    }
    
    if (streamActive) {
      requestAnimationFrame(detectFaceInLoop);
    }
  };

  const handleEnroll = async () => {
    if (!videoRef.current || !faceDetected) {
      toast.error('No face detected! Please position your face in front of the camera.');
      return;
    }

    setEnrolling(true);
    
    try {
      const imageData = await captureFromVideo(videoRef.current, 640, 480);
      
      const res = await fetch('/api/admin/face/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          imageData
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEnrollmentStatus('enrolled');
        toast.success('Face enrolled successfully!');
        onEnrolled?.();
      } else {
        setEnrollmentStatus('failed');
        toast.error(data.error || 'Failed to enroll face');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      setEnrollmentStatus('failed');
      toast.error('Failed to enroll face');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black">Face Enrollment</h3>
        <div className="flex items-center gap-2">
          {modelsLoaded ? (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Check size={12} /> Models Ready
            </span>
          ) : (
            <span className="text-xs text-black/40 flex items-center gap-1">
              <Loader2 size={12} className="animate-spin" /> Loading...
            </span>
          )}
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-[320px] object-cover"
        />
        
        {/* Face detection overlay */}
        {faceDetected && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
            <Check size={12} /> Face Detected
          </div>
        )}
        
        {!faceDetected && streamActive && (
          <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
            <AlertCircle size={12} /> No Face
          </div>
        )}
        
        {/* Enrollment status */}
        {enrollmentStatus === 'enrolled' && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="bg-white rounded-full p-4">
              <Check size={32} className="text-green-500" />
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="text-sm text-black/60">
        {enrollmentStatus === 'enrolled' ? (
          <p>Your face is enrolled. You can now use face login.</p>
        ) : (
          <p>Position your face in the frame and click Enroll. Make sure your face is well-lit and visible.</p>
        )}
      </div>

      <button
        onClick={handleEnroll}
        disabled={!modelsLoaded || !faceDetected || enrolling || enrollmentStatus === 'enrolled'}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/90 transition-all"
      >
        {enrolling ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Enrolling...
          </>
        ) : enrollmentStatus === 'enrolled' ? (
          <>
            <Check size={18} /> Enrolled
          </>
        ) : (
          <>
            <Camera size={18} /> Enroll My Face
          </>
        )}
      </button>
    </div>
  );
}