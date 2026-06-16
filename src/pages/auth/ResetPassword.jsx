import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { resetPasswordApi } from '../../api/authApi'

function ShieldIllustration() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '270px' }}>
      {/* Shield */}
      <path d="M140 22 L220 52 L220 110 C220 152 180 180 140 196 C100 180 60 152 60 110 L60 52 Z"
        fill="white" stroke="#dde4ee" strokeWidth="1.5" />
      {/* Shield inner tint */}
      <path d="M140 38 L206 63 L206 110 C206 144 172 168 140 182 C108 168 74 144 74 110 L74 63 Z"
        fill="#f0f6ff" />
      {/* Lock body */}
      <rect x="115" y="110" width="50" height="38" rx="7" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.2" />
      {/* Lock shackle */}
      <path d="M123 110 L123 97 C123 85 157 85 157 97 L157 110" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Keyhole */}
      <circle cx="140" cy="124" r="5" fill="#3b82f6" />
      <rect x="137.5" y="127" width="5" height="9" rx="2" fill="#3b82f6" />
      {/* Check badge */}
      <circle cx="200" cy="48" r="18" fill="#dcfce7" stroke="#bbf7d0" strokeWidth="1" />
      <path d="M192 48 L197 53 L208 42" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Decorative dots */}
      <circle cx="55" cy="40" r="5" fill="#bfdbfe" />
      <circle cx="238" cy="160" r="7" fill="#dbeafe" />
      <circle cx="252" cy="44" r="3" fill="#93c5fd" />
      <circle cx="42" cy="155" r="4" fill="#e8edf5" />
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
    minHeight: '500px',
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
  fieldWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  input: {
    width: '100%', padding: '11px 40px 11px 15px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13.5px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute', right: '11px', background: 'none', border: 'none',
    padding: 0, cursor: 'pointer', color: '#9ca3af', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  label: { display: 'block', fontSize: '12.5px', fontWeight: 500, color: '#374151', marginBottom: '6px' },
  formGroup: { marginTop: '16px' },
  btn: {
    width: '100%', padding: '12px', background: '#1a73e8', color: 'white',
    border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', marginTop: '22px', letterSpacing: '0.1px',
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

const EyeIcon = ({ open }) => open ? (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!success) return
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); navigate('/login'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [success, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await resetPasswordApi(token, password)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  const focusInput = (e) => { e.target.style.borderColor = '#1a73e8' }
  const blurInput = (e) => { e.target.style.borderColor = error ? '#fecaca' : '#d1d5db' }

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

          {!success ? (
            <>
              <h1 style={s.h1}>Set new password</h1>
              <p style={s.subtitle}>Choose a strong password for your account. Minimum 8 characters.</p>

              {error && (
                <motion.div style={s.error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} style={{ marginTop: '26px' }}>
                <div style={s.formGroup}>
                  <label style={s.label}>New password</label>
                  <div style={s.fieldWrap}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null) }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      required
                      style={s.input}
                    />
                    <button type="button" style={s.eyeBtn} onClick={() => setShowPw(p => !p)}>
                      <EyeIcon open={showPw} />
                    </button>
                  </div>
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>Confirm new password</label>
                  <div style={s.fieldWrap}>
                    <input
                      type={showCf ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                      required
                      style={s.input}
                    />
                    <button type="button" style={s.eyeBtn} onClick={() => setShowCf(p => !p)}>
                      <EyeIcon open={showCf} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={loading ? { ...s.btn, background: '#93c5fd', cursor: 'not-allowed' } : s.btn}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#1557b0' }}
                  onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#1a73e8' }}
                >
                  {loading && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}
                      style={{ animation: 'rpSpin 0.75s linear infinite', flexShrink: 0 }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  )}
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '22px',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h1 style={s.h1}>Password updated!</h1>
              <p style={{ ...s.subtitle, marginTop: '8px' }}>
                Your password has been reset. Redirecting to sign in in {countdown}s…
              </p>
              <button
                style={{ ...s.btn, marginTop: '22px' }}
                onClick={() => navigate('/login')}
              >
                Go to sign in now
              </button>
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
          <ShieldIllustration />
          <p style={s.illTitle}>Secure your account.</p>
          <p style={s.illText}>
            Create a strong, unique password that you don't use for any other services.
          </p>
        </div>
      </motion.div>

      <p style={s.footer}>© 2026, Sandhya Softtech Pvt. Ltd. All Rights Reserved.</p>

      <style>{`
        @keyframes rpSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #9ca3af; font-size: 13.5px; }
      `}</style>
    </div>
  )
}
