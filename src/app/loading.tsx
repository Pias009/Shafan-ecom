import React from 'react'

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32">
        <div className="animate-pulse space-y-8">
          {/* Hero skeleton */}
          <div className="h-[300px] sm:h-[400px] bg-gray-100 rounded-3xl" />
          {/* Products skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-100 rounded-2xl" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
