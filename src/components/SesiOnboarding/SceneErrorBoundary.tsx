"use client";

import { Component, type ReactNode } from "react";

type Props = { fallback: ReactNode; children: ReactNode };
type State = { hasError: boolean };

// Catches WebGL init/context-loss errors from the 3D Canvas subtree (low-end
// or unsupported devices) and swaps in a non-WebGL fallback instead of
// crashing the whole onboarding overlay.
export class SceneErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[SesiOnboarding] 3D scene failed, falling back:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
