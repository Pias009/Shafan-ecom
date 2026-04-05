"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export default function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.set(logoRef.current, { y: -200, opacity: 0, scale: 0.5 });
      gsap.set(dropletRef.current, { y: -300, opacity: 0, scale: 0.3 });
      gsap.set(rippleRef.current, { scale: 0, opacity: 0 });
      gsap.set(textRef.current, { y: 30, opacity: 0 });

      tl.to(dropletRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "power2.in",
      });

      tl.to(dropletRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.15,
        ease: "power2.out",
      });

      tl.to(rippleRef.current, {
        scale: 3,
        opacity: 0.6,
        duration: 0.4,
        ease: "power2.out",
      }, "-=0.1");

      tl.to(rippleRef.current, {
        scale: 5,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out",
      });

      tl.to(logoRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)",
      }, "-=0.4");

      tl.to(logoRef.current, {
        scale: 1.08,
        duration: 0.3,
        ease: "power2.out",
      });

      tl.to(logoRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.in",
      });

      tl.to(textRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      }, "-=0.2");

      tl.to({}, { duration: 0.8 });

      tl.to(logoContainerRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
      });

      tl.to(containerRef.current, {
        rotationX: 90,
        transformOrigin: "top center",
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut",
        onComplete: onLoadingComplete,
      }, "-=0.3");

    }, containerRef);

    return () => ctx.revert();
  }, [onLoadingComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-neutral-950"
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-white to-neutral-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-black opacity-80" />

      <div
        ref={logoContainerRef}
        className="relative flex flex-col items-center"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div ref={dropletRef} className="absolute -top-8">
          <div className="w-6 h-8 relative">
            <div 
              className="absolute inset-0 bg-gradient-to-b from-neutral-300 to-neutral-500 dark:from-neutral-400 dark:to-neutral-600"
              style={{
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
              }}
            />
            <div 
              className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full"
              style={{ filter: "blur(1px)" }}
            />
          </div>
        </div>

        <div
          ref={rippleRef}
          className="absolute top-16 w-20 h-8 border-2 border-neutral-300 dark:border-neutral-600 rounded-full opacity-0"
          style={{ transform: "rotateX(75deg)" }}
        />

        <div ref={logoRef} className="relative mb-6">
          <div className="w-24 h-24 relative flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-2xl opacity-10 blur-xl"
              style={{ transform: "translateY(8px)" }}
            />
            <div className="absolute inset-0 bg-neutral-900 dark:bg-white rounded-2xl shadow-2xl" />
            <span className="relative text-5xl font-bold text-white dark:text-neutral-900 tracking-tight">
              S
            </span>
          </div>
        </div>

        <div ref={textRef} className="text-center">
          <h1 className="text-2xl font-light tracking-[0.3em] text-neutral-800 dark:text-neutral-200 mb-2">
            SHANFA GLOBAL
          </h1>
          <p className="text-xs tracking-[0.2em] text-neutral-400 dark:text-neutral-500 uppercase">
            Premium Store
          </p>
        </div>

        <div className="mt-10 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-600 rounded-full animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}