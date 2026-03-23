"use client";

import { useEffect, useState, useRef, Suspense, lazy, ComponentType } from "react";
import { Loader2 } from "lucide-react";

interface LazyLoaderProps<T extends ComponentType<any>> {
  component: () => Promise<{ default: T } | { [key: string]: T }>;
  fallback?: React.ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
  [key: string]: any;
}

/**
 * Advanced lazy loading component with intersection observer
 * Supports delayed loading, visibility detection, and smooth transitions
 */
export function LazyLoader<T extends ComponentType<any>>({
  component,
  fallback,
  delay = 0,
  threshold = 0.1,
  rootMargin = "50px",
  ...props
}: LazyLoaderProps<T>) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  useEffect(() => {
    if (isVisible && !hasLoaded) {
      const loadComponent = async () => {
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        try {
          const module = await component();
          // Handle both default and named exports
          const componentToRender = 'default' in module && module.default
            ? module.default
            : Object.values(module).find((exp: any) => typeof exp === 'function') as ComponentType<any>;
          
          if (componentToRender) {
            setComponent(() => componentToRender);
            setHasLoaded(true);
          } else {
            throw new Error('No component found in module');
          }
        } catch (error) {
          console.error("Failed to load component:", error);
        }
      };

      loadComponent();
    }
  }, [isVisible, hasLoaded, component, delay]);

  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div ref={ref} className="lazy-loader-container">
      {Component ? (
        <Suspense fallback={fallback || defaultFallback}>
          <Component {...props} />
        </Suspense>
      ) : (
        <div className="lazy-placeholder">
          {fallback || defaultFallback}
        </div>
      )}
    </div>
  );
}

/**
 * Helper to create lazy components with proper typing
 * Supports both default and named exports
 */
const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | { [key: string]: T }>
) => {
  return lazy(async () => {
    const module = await importFn();
    // If module has default export, use it
    if ('default' in module && module.default) {
      return module as { default: T };
    }
    // Otherwise, try to find a named export with the same name as the file
    // This is a fallback for named exports
    const moduleAny = module as any;
    for (const key in moduleAny) {
      if (typeof moduleAny[key] === 'function' && key !== 'default') {
        return { default: moduleAny[key] as T };
      }
    }
    throw new Error('No component found in module');
  });
};

/**
 * Helper for named exports - explicitly maps named export to default
 */
const createNamedLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ [key: string]: any }>,
  exportName: string
) => {
  return lazy(async () => {
    const module = await importFn();
    return { default: module[exportName] as T };
  });
};

/**
 * Pre-configured lazy loaders for common components
 * Components use named exports, so we need to map them to default
 */
export const LazyHero = createNamedLazyComponent(() => import("@/components/Hero"), "Hero");
export const LazyProductCard = createNamedLazyComponent(() => import("@/components/ProductCard"), "ProductCard");
export const LazyProductsSlider = createNamedLazyComponent(() => import("@/components/ProductsSlider"), "ProductsSlider");
export const LazyCategorySection = createNamedLazyComponent(() => import("@/components/CategorySection"), "CategorySection");
export const LazyOfferBannersSection = createNamedLazyComponent(() => import("@/components/OfferBannersSection"), "OfferBannersSection");
export const LazyBlogShowcase = createNamedLazyComponent(() => import("@/components/BlogShowcase"), "BlogShowcase");
export const LazyBrandMarquee = createNamedLazyComponent(() => import("@/components/BrandMarquee"), "BrandMarquee");
export const LazyAuthModal = createNamedLazyComponent(() => import("@/components/AuthModal"), "AuthModal");
export const LazyProductQuickViewModal = createNamedLazyComponent(() => import("@/components/ProductQuickViewModal"), "ProductQuickViewModal");

/**
 * Hook for progressive image loading
 */
export function useProgressiveImage(src: string, placeholder?: string) {
  const [source, setSource] = useState(placeholder || src);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setSource(src);
      setIsLoaded(true);
    };
    
    img.onerror = () => {
      console.warn(`Failed to load image: ${src}`);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, placeholder]);

  return { src: source, isLoaded };
}

/**
 * Hook for chunked data loading
 */
export function useChunkedData<T>(
  data: T[],
  chunkSize: number = 10,
  initialChunks: number = 2
) {
  const [visibleCount, setVisibleCount] = useState(chunkSize * initialChunks);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + chunkSize, data.length));
      setIsLoading(false);
    }, 300);
  };

  const visibleData = data.slice(0, visibleCount);
  const hasMore = visibleCount < data.length;

  return {
    visibleData,
    loadMore,
    isLoading,
    hasMore,
    total: data.length,
    loadedCount: visibleCount,
  };
}

/**
 * Virtualized list for large datasets
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 100,
  overscan = 5,
  containerHeight = 500,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  containerHeight?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  return (
    <div
      ref={containerRef}
      className="overflow-auto relative"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top: actualIndex * itemHeight,
                width: '100%',
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}