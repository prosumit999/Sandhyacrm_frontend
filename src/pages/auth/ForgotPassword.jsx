import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { forgotPasswordApi } from '../../api/authApi'

function MailIllustration() {
  return (
    <svg viewBox="0 0 280 210" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '270px' }}>
      {/* Envelope body */}
      <rect x="28" y="58" width="224" height="140" rx="12" fill="white" stroke="#dde4ee" strokeWidth="1.5" />
      {/* Envelope flap crease */}
      <path d="M28 70 L140 132 L252 70" stroke="#dde4ee" strokeWidth="1.5" fill="none" />
      {/* Bottom fold lines */}
      <path d="M28 198 L108 134" stroke="#e8edf5" strokeWidth="1.2" />
      <path d="M252 198 L172 134" stroke="#e8edf5" strokeWidth="1.2" />
      {/* Message lines inside */}
      <rect x="80" y="148" width="120" height="7" rx="3.5" fill="#e8edf5" />
      <rect x="95" y="162" width="90" height="7" rx="3.5" fill="#e8edf5" />
      <rect x="105" y="176" width="70" height="7" rx="3.5" fill="#e8edf5" />
      {/* Send arrow badge */}
      <circle cx="200" cy="45" r="22" fill="#dbeafe" />
      <path d="M190 45 L210 45" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M204 38 L212 45 L204 52" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Decorative dots */}
      <circle cx="50" cy="35" r="5" fill="#bfdbfe" />
      <circle cx="244" cy="168" r="7" fill="#dbeafe" />
      <circle cx="258" cy="42" r="3.5" fill="#93c5fd" />
      <circle cx="35" cy="170" r="4" fill="#e8edf5" />
    </svg>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#ececec',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.09)',
    width: '100%',
    maxWidth: '900px',
    display: 'flex',
    overflow: 'hidden',
    minHeight: '480px',
  },
  left: {
    flex: '0 0 400px',
    padding: '52px 48px 48px',
    display: 'flex',
    flexDirection: 'column',
  },
  divider: { width: '1px', background: '#e5e7eb', flexShrink: 0 },
  right: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 44px',
    background: '#f8faff',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '44px' },
  logoIcon: {
    width: '34px', height: '34px', background: '#1a73e8', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { fontSize: '13.5px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.8px' },
  h1: { fontSize: '27px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.15 },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: '6px 0 0', lineHeight: 1.55 },
  input: {
    width: '100%', padding: '11px 15px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13.5px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  btn: {
    width: '100%', padding: '12px', background: '#1a73e8', color: 'white',
    border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', marginTop: '20px', letterSpacing: '0.1px',
    transition: 'background 0.15s', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px', fontFamily: 'inherit',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
    padding: '9px 12px', fontSize: '12.5px', color: '#dc2626',
    marginTop: '14px', display: 'flex', alignItems: 'center', gap: '7px',
  },
  backLink: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    fontSize: '13px', color: '#6b7280', textDecoration: 'none',
    marginTop: '18px', cursor: 'pointer', background: 'none', border: 'none',
    padding: 0, fontFamily: 'inherit', transition: 'color 0.15s',
  },
  footer: { fontSize: '11.5px', color: '#9ca3af', marginTop: '22px', textAlign: 'center' },
  illTitle: { fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '20px 0 8px', textAlign: 'center', letterSpacing: '-0.2px' },
  illText: { fontSize: '13px', color: '#64748b', textAlign: 'center', lineHeight: 1.65, margin: 0, maxWidth: '220px' },
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await forgotPasswordApi(email)
      if (res.data?.resetToken) setDevToken(res.data.resetToken)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const focusInput = (e) => { e.target.style.borderColor = '#1a73e8' }
  const blurInput = (e) => { e.target.style.borderColor = '#d1d5db' }

  return (
    <div style={s.page}>
      <motion.div
        style={s.card}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* ── Left: Form ── */}
        <div style={s.left}>

          <div style={s.logo}>
            <div style={s.logoIcon}>
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span style={s.logoText}>SANDHYA CRM</span>
          </div>

          {!sent ? (
            <>
              <h1 style={s.h1}>Forgot password?</h1>
              <p style={s.subtitle}>Enter your account email and we'll send you a reset link.</p>

              {error && (
                <motion.div style={s.error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} style={{ marginTop: '26px' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  required
                  style={s.input}
                />

                <button
                  type="submit"
                  disabled={loading}
                  style={loading ? { ...s.btn, background: '#93c5fd', cursor: 'not-allowed' } : s.btn}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#1557b0' }}
                  onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#1a73e8' }}
                >
                  {loading && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}
                      style={{ animation: 'fpSpin 0.75s linear infinite', flexShrink: 0 }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  )}
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px',
              }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 style={s.h1}>Check your email</h1>
              <p style={{ ...s.subtitle, marginTop: '8px' }}>
                We've sent a password reset link to <strong style={{ color: '#111827' }}>{email}</strong>.
              </p>
              <p style={{ ...s.subtitle, marginTop: '10px', fontSize: '13px' }}>
                Didn't receive it?{' '}
                <button
                  onClick={() => setSent(false)}
                  style={{ background: 'none', border: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '13px', fontWeight: 500, padding: 0, fontFamily: 'inherit' }}
                >
                  Try again
                </button>
              </p>
              {devToken && (
                <div style={{ marginTop: '14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#713f12' }}>
                  <strong>Dev mode:</strong> Email not sent via SMTP.{' '}
                  <a href={`/reset-password/${devToken}`} style={{ color: '#1a73e8', wordBreak: 'break-all' }}>
                    Click here to reset password
                  </a>
                </div>
              )}
            </motion.div>
          )}

          <button
            style={s.backLink}
            onClick={() => navigate('/login')}
            onMouseOver={e => e.currentTarget.style.color = '#111827'}
            onMouseOut={e => e.currentTarget.style.color = '#6b7280'}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to sign in
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={s.divider} />

        {/* ── Right: Illustration ── */}
        <div style={s.right}>
          <MailIllustration />
          <p style={s.illTitle}>Check your inbox.</p>
          <p style={s.illText}>
            We'll email you a secure link to reset your password in just a few clicks.
          </p>
        </div>
      </motion.div>

      <p style={s.footer}>© 2026, Sandhya Softtech Pvt. Ltd. All Rights Reserved.</p>

      <style>{`
        @keyframes fpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #9ca3af; font-size: 13.5px; }
      `}</style>
    </div>
  )
}
