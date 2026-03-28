import React, { useState } from 'react'
import Router from 'next/router'

export default function KuwaitLogin() {
  const [email, setEmail] = useState('kuwait-admin@example.com')
  const [password, setPassword] = useState('demoadmin')
  const [error, setError] = useState<string | null>(null)
  const [developerLoading, setDeveloperLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simple demo auth check against hard-coded credentials
    if (email === 'kuwait-admin@example.com' && password === 'demoadmin') {
      // In a real app, you'd obtain a session token here
      Router.push('/admin/kuwait')
    } else {
      setError('Invalid credentials (demo)')
    }
  }

  const handleDeveloperLogin = () => {
    setDeveloperLoading(true)
    // Directly redirect to admin page without any verification
    // No email verification needed for developer role
    Router.push('/admin/kuwait')
  }

  return (
    <div style={{ maxWidth: 420, margin: 'auto', paddingTop: 40 }}>
      <h2>Kuwait Admin Login (Demo)</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Login</button>
        
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
          <button
            type="button"
            onClick={handleDeveloperLogin}
            disabled={developerLoading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: developerLoading ? 'not-allowed' : 'pointer',
              opacity: developerLoading ? 0.7 : 1
            }}
          >
            {developerLoading ? 'Logging in as Developer...' : '🚀 Login as Developer (No Verification)'}
          </button>
          <p style={{ marginTop: 8, fontSize: 11, color: '#666', textAlign: 'center' }}>
            Bypasses all authentication checks for development and testing
          </p>
        </div>
      </form>
      <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        Demo credentials:
        <br /> Email: kuwait-admin@example.com
        <br /> Password: demoadmin
      </p>
    </div>
  )
}
