import React from 'react'

export default function AdminLoading() {
  return (
    <div className="w-full h-full flex flex-col gap-8 animate-pulse p-4">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-10 w-64 bg-black/5 rounded-2xl"></div>
        <div className="h-10 w-32 bg-black/5 rounded-2xl"></div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-black/5 rounded-3xl"></div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="h-[400px] w-full bg-black/5 rounded-[2.5rem]"></div>
    </div>
  )
}
