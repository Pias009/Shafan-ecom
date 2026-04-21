import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm text-black">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Banner Skeleton */}
        <div className="h-[200px] w-full bg-black/5 animate-pulse rounded-2xl mb-12"></div>

        {/* Filter Button Skeleton */}
        <div className="flex justify-center mb-8">
          <div className="h-12 w-40 bg-black/5 animate-pulse rounded-full"></div>
        </div>

        {/* Products Grid Skeleton */}
        <div className="space-y-24 mt-20">
          {[1, 2].map((section) => (
            <div key={section} className="space-y-10">
              <div className="flex items-center gap-6 border-b border-black/5 pb-6">
                <div className="h-10 w-48 bg-black/5 animate-pulse rounded-lg"></div>
                <div className="h-[1px] flex-1 bg-black/10"></div>
                <div className="h-4 w-20 bg-black/5 animate-pulse rounded-full"></div>
              </div>

              <div className="grid gap-x-8 gap-y-12 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="aspect-[4/5] w-full bg-black/5 animate-pulse rounded-2xl"></div>
                    <div className="h-4 w-3/4 bg-black/5 animate-pulse rounded-lg"></div>
                    <div className="h-4 w-1/2 bg-black/5 animate-pulse rounded-lg opacity-60"></div>
                    <div className="h-6 w-1/3 bg-black/5 animate-pulse rounded-lg mt-2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
