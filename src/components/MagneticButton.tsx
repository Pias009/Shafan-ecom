"use client";

import React from "react";
import { useMagneticButton } from "@/hooks/useMagneticButton";

interface MagneticButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  /** Magnetic pull strength (0–1). Default: 0.35 */
  strength?: number;
  /** Extra wrapper className for outer positioning element */
  wrapperClassName?: string;
}

/**
 * MagneticButton — premium CTA with physics-based magnetic cursor attraction.
 * Drop-in replacement for <button>. Wraps children in a magnetic spring layer.
 *
 * Usage:
 *   <MagneticButton className="btn-primary">Shop Now</MagneticButton>
 */
export function MagneticButton({
  children,
  strength = 0.35,
  className,
  wrapperClassName,
  ...props
}: MagneticButtonProps) {
  const { ref, onMouseMove, onMouseLeave } =
    useMagneticButton<HTMLButtonElement>(strength);

  return (
    <div className={`relative inline-flex ${wrapperClassName ?? ""}`}>
      <button
        ref={ref}
        className={`relative inline-flex items-center justify-center will-change-transform ${className ?? ""}`}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}
