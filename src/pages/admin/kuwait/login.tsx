import React, { useState, useEffect } from 'react'
import Router from 'next/router'

export default function KuwaitLogin() {
  // Use environment variables for demo credentials, fallback to defaults
  const demoEmail = process.env.NEXT_PUBLIC_KUWAIT_ADMIN_EMAIL || 'kuwait-admin@example.com'
  const demoPassword = process.env.NEXT_PUBLIC_KUWAIT_ADMIN_PASSWORD || 'demoadmin'
  
  const [email, setEmail] = useState(demoEmail)
  const [password, setPassword] = useState(demoPassword)
  const [error, setError] = useState<string | null>(null)
  const [developerLoading, setDeveloperLoading] = useState(false)
  const [showDeveloperLogin, setShowDeveloperLogin] = useState(false)
  
  useEffect(() => {
    // Check if we're in development/localhost environment
    const isLocalhost = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.includes('local');
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    setShowDeveloperLogin(isLocalhost || isDevelopment);
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Simple demo auth check against environment-based credentials
    if (email === demoEmail && password === demoPassword) {
      // In a real app, you'd obtain a session token here
      Router.push('/admin/kuwait')
    } else {
      setError('Invalid credentials (demo)')
    }
  }

  const handleDeveloperLogin = async () => {
    setDeveloperLoading(true)
    try {
      // Call developer login API endpoint with enhanced security
      const res = await fetch("/api/auth/developer-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Developer login API succeeded - redirect to Kuwait admin panel
        Router.push('/admin/kuwait')
      } else {
        setError(data.error || "Developer login is disabled in production")
        setDeveloperLoading(false)
      }
    } catch (err: any) {
      setError(err.message || "Developer login failed")
      setDeveloperLoading(false)
    }
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
        
        {showDeveloperLogin && (
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
              {developerLoading ? 'Logging in as Developer...' : '🚀 Login as Developer (Development Only)'}
            </button>
            <p style={{ marginTop: 8, fontSize: 11, color: '#666', textAlign: 'center' }}>
              Developer access only available in localhost/development environment
            </p>
          </div>
        )}
      </form>
      <p style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
        Demo credentials:
        <br /> Email: {demoEmail}
        <br /> Password: {demoPassword.replace(/./g, '•')}
        <br />
        <small style={{ fontSize: 10, color: '#999' }}>
          Note: This is a demo login. In production, connect to proper authentication.
        </small>
      </p>
    </div>
  )
}
