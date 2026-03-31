import React, { useState } from 'react'
import Router from 'next/router'

export default function KuwaitLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleMasterLogin = async () => {
    setLoading(true)
    setError(null)
    Router.push('/admin/kuwait')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white tracking-tight">SHAFAN</h1>
          <p className="text-gray-500 text-sm mt-1">Kuwait Admin</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          
          <button
            onClick={handleMasterLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm tracking-wider hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">👑</span>
            {loading ? "Accessing..." : "Master Admin Access"}
          </button>
        </div>
        
        <p className="text-center text-gray-600 text-xs mt-6">
          Restricted access only
        </p>
      </div>
    </div>
  )
}
