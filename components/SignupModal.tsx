import React, { useEffect, useState } from 'react'

type SignUpPayload = { name: string; email: string; password: string }
type LoginPayload = { email: string; password: string }

type Props = {
  open: boolean
  onClose: () => void
  onSubmitSignup?: (payload: SignUpPayload) => void
  onSubmitLogin?: (payload: LoginPayload) => void
}

const SignupModal: React.FC<Props> = ({ open, onClose, onSubmitSignup, onSubmitLogin }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [signup, setSignup] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [login, setLogin] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  // ESC closes modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!signup.name || !signup.email || !signup.password) {
      setError('Please fill all fields')
      return
    }
    if (signup.password !== signup.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    onSubmitSignup?.({ name: signup.name, email: signup.email, password: signup.password })
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!login.email || !login.password) {
      setError('Please fill all fields')
      return
    }
    setError(null)
    onSubmitLogin?.({ email: login.email, password: login.password })
  }

  const overlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '2px solid #000',
    color: '#000',
  } as React.CSSProperties

  const Card = (
    <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <button aria-label="Close" onClick={onClose} style={{ position: 'absolute', top: 8, right: 8, border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer' }}>×</button>
      {mode === 'signup' ? (
        <form onSubmit={handleSignup} className="signup-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Sign Up</h2>
          <input placeholder="Name" value={signup.name} onChange={(e) => setSignup({ ...signup, name: e.target.value })} style={inputStyle} />
          <input type="email" placeholder="Email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} style={inputStyle} />
          <input type="password" placeholder="Password" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} style={inputStyle} />
          <input type="password" placeholder="Confirm Password" value={signup.confirmPassword} onChange={(e) => setSignup({ ...signup, confirmPassword: e.target.value })} style={inputStyle} />
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit" style={{ padding: '10px', border: '2px solid #000', background: '#fff', cursor: 'pointer' }}>Create Account</button>
          <div>
            Already have an account?{' '}
            <button type="button" onClick={() => setMode('login')} style={ { ...inputStyle, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', color: '#000', textDecoration: 'underline' } }>
              Login
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="login-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Login</h2>
          <input type="email" placeholder="Email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} style={inputStyle} />
          <input type="password" placeholder="Password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} style={inputStyle} />
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit" style={{ padding: '10px', border: '2px solid #000', background: '#fff', cursor: 'pointer' }}>Login</button>
          <div>
            Don't have an account?{' '}
            <button type="button" onClick={() => setMode('signup')} style={ { ...inputStyle, border: 'none', padding: 0, background: 'transparent', cursor: 'pointer', color: '#000', textDecoration: 'underline' } }>
              Sign up
            </button>
          </div>
        </form>
      )}
    </div>
  )

  return (
    <div onClick={overlayClick} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <section aria-label={mode === 'signup' ? 'Sign up' : 'Login'} style={{ background: '#fff', border: '2px solid #000', padding: 24, borderRadius: 8, width: 'min(90vw, 420px)' }}>
        {Card}
      </section>
    </div>
  )
}

export default SignupModal
