/**
 * Performance monitoring and analytics system
 * Tracks Core Web Vitals, custom metrics, and performance bottlenecks
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  userAgent: string;
  connection?: string;
  timestamp: number;
  sessionId: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private sessionId: string;
  private isEnabled: boolean = true;
  private reportEndpoint: string = '/api/performance/metrics';
  private sampleRate: number = 0.1; // 10% of users

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandling();
    
    // Only enable for a sample of users
    this.isEnabled = Math.random() < this.sampleRate;
    
    if (this.isEnabled && typeof window !== 'undefined') {
      this.setupPerformanceObservers();
      this.setupCoreWebVitals();
      this.setupCustomMetrics();
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandling(): void {
    if (typeof window === 'undefined') return;

    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      this.trackMetric('js_error', {
        message: String(message),
        source,
        lineno,
        colno,
        error: error?.toString(),
        stack: error?.stack,
      });

      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackMetric('unhandled_rejection', {
        reason: event.reason?.toString(),
      });
    });
  }

  private setupPerformanceObservers(): void {
    // Long Tasks observer
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.trackMetric('long_task', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', longTaskObserver);
      } catch (e) {
        console.debug('Long task observation not supported');
      }

      // Layout Shift observer
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              this.trackMetric('layout_shift', {
                value: entry.value,
                sources: entry.sources?.map((s: any) => ({
                  node: s.node?.nodeName,
                  rect: s.previousRect,
                })),
              });
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', layoutShiftObserver);
      } catch (e) {
        console.debug('Layout shift observation not supported');
      }
    }
  }

  private setupCoreWebVitals(): void {
    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as any[];
      const lastEntry = entries[entries.length - 1];
      this.trackMetric('lcp', {
        value: lastEntry.startTime,
        element: lastEntry.element?.tagName,
        url: lastEntry.url,
        size: lastEntry.size,
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        this.trackMetric('fid', {
          value: entry.duration,
          name: entry.name,
          startTime: entry.startTime,
          processingStart: entry.processingStart,
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // CLS (Cumulative Layout Shift) - already handled by layout-shift observer
  }

  private setupCustomMetrics(): void {
    // Time to First Byte
    if (performance.getEntriesByType('navigation').length > 0) {
      const navEntry = performance.getEntriesByType('navigation')[0] as any;
      this.trackMetric('ttfb', {
        value: navEntry.responseStart - navEntry.requestStart,
      });
    }

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.trackMetric('fcp', {
          value: entry.startTime,
          name: entry.name,
        });
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Resource timing
    const resourceObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (entry.initiatorType === 'script' || entry.initiatorType === 'css') {
          this.trackMetric('resource_load', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType,
          });
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  }

  trackMetric(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value: metadata?.value || 0,
      unit: metadata?.unit || 'ms',
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Batch and send metrics periodically
    if (this.metrics.length >= 10) {
      this.flushMetrics();
    }
  }

  trackCustomTiming(name: string, startTime: number): () => void {
    if (!this.isEnabled) return () => {};

    return () => {
      const duration = performance.now() - startTime;
      this.trackMetric(`custom_${name}`, {
        value: duration,
        startTime,
        endTime: performance.now(),
      });
    };
  }

  trackApiCall(endpoint: string, startTime: number, success: boolean, status?: number): void {
    const duration = performance.now() - startTime;
    this.trackMetric('api_call', {
      endpoint,
      duration,
      success,
      status,
      timestamp: Date.now(),
    });
  }

  trackPageLoad(page: string, loadTime: number): void {
    this.trackMetric('page_load', {
      page,
      loadTime,
      timestamp: Date.now(),
    });
  }

  async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const report: PerformanceReport = {
      metrics: [...this.metrics],
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    // Send to backend
    try {
      await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
        keepalive: true, // Ensure delivery even if page is unloading
      });
      
      // Clear sent metrics
      this.metrics = [];
    } catch (error) {
      console.debug('Failed to send performance metrics:', error);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
    this.isEnabled = Math.random() < this.sampleRate;
  }

  // Cleanup observers
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.flushMetrics();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  const trackComponentMount = (componentName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      monitor.trackMetric('component_mount', {
        component: componentName,
        duration,
      });
    };
  };

  const trackInteraction = (action: string, metadata?: Record<string, any>) => {
    monitor.trackMetric('interaction', {
      action,
      ...metadata,
    });
  };

  return {
    trackMetric: monitor.trackMetric.bind(monitor),
    trackComponentMount,
    trackInteraction,
    trackCustomTiming: monitor.trackCustomTiming.bind(monitor),
    trackApiCall: monitor.trackApiCall.bind(monitor),
    flushMetrics: monitor.flushMetrics.bind(monitor),
  };
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceMonitor.flushMetrics();
  });

  // Flush every 30 seconds
  setInterval(() => {
    performanceMonitor.flushMetrics();
  }, 30000);
}