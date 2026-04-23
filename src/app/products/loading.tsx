import React from 'react'

export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 animate-pulse">
      {/* Title Skeleton */}
      <div className="h-12 w-96 bg-black/5 rounded-2xl mb-4"></div>
      <div className="h-6 w-64 bg-black/5 rounded-xl mb-12"></div>

      {/* Slider Skeleton */}
      <div className="h-[400px] w-full bg-black/5 rounded-[2.5rem] mb-12"></div>

      {/* Filter Button Skeleton */}
      <div className="flex justify-center mb-8">
        <div className="h-12 w-48 bg-black/5 rounded-full"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[4/5] bg-black/5 rounded-3xl w-full"></div>
            <div className="h-4 w-3/4 bg-black/5 rounded-lg"></div>
            <div className="h-4 w-1/2 bg-black/5 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
