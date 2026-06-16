import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { registerApi } from '../../api/authApi'

function TeamIllustration() {
  return (
    <svg viewBox="0 0 280 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '270px' }}>
      {/* Central figure */}
      <circle cx="140" cy="88" r="28" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1.2" />
      <circle cx="140" cy="80" r="11" fill="#93c5fd" />
      <path d="M116 110 Q140 100 164 110" fill="#93c5fd" />

      {/* Left figure */}
      <circle cx="72" cy="104" r="22" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.2" />
      <circle cx="72" cy="97" r="9" fill="#86efac" />
      <path d="M53 121 Q72 113 91 121" fill="#86efac" />

      {/* Right figure */}
      <circle cx="208" cy="104" r="22" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1.2" />
      <circle cx="208" cy="97" r="9" fill="#c4b5fd" />
      <path d="M189 121 Q208 113 227 121" fill="#c4b5fd" />

      {/* Connection lines */}
      <line x1="94" y1="104" x2="112" y2="96" stroke="#dde4ee" strokeWidth="1.2" strokeDasharray="4 3" />
      <line x1="168" y1="96" x2="186" y2="104" stroke="#dde4ee" strokeWidth="1.2" strokeDasharray="4 3" />

      {/* Plus badge */}
      <circle cx="140" cy="152" r="18" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
      <path d="M140 144 L140 160M132 152 L148 152" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" />

      {/* Decorative dots */}
      <circle cx="42" cy="68" r="5" fill="#bfdbfe" />
      <circle cx="238" cy="68" r="5" fill="#e9d5ff" />
      <circle cx="140" cy="26" r="4" fill="#dbeafe" />
      <circle cx="50" cy="168" r="3.5" fill="#e8edf5" />
      <circle cx="230" cy="168" r="3.5" fill="#e8edf5" />
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
    minHeight: '540px',
  },
  left: {
    flex: '0 0 420px',
    padding: '44px 48px 40px',
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
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' },
  logoIcon: {
    width: '34px', height: '34px', background: '#1a73e8', borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  logoText: { fontSize: '13.5px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.8px' },
  h1: { fontSize: '25px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.4px', lineHeight: 1.2 },
  subtitle: { fontSize: '13.5px', color: '#6b7280', margin: '5px 0 0', lineHeight: 1.55 },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  formGroup: { marginTop: '12px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '5px' },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  fieldWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputPw: {
    width: '100%', padding: '10px 38px 10px 14px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  eyeBtn: {
    position: 'absolute', right: '10px', background: 'none', border: 'none',
    padding: 0, cursor: 'pointer', color: '#9ca3af',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  btn: {
    width: '100%', padding: '11px', background: '#1a73e8', color: 'white',
    border: 'none', borderRadius: '6px', fontSize: '13.5px', fontWeight: 600,
    cursor: 'pointer', marginTop: '18px', letterSpacing: '0.1px',
    transition: 'background 0.15s', display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '8px', fontFamily: 'inherit',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
    padding: '8px 12px', fontSize: '12.5px', color: '#dc2626',
    marginTop: '12px', display: 'flex', alignItems: 'center', gap: '7px',
  },
  loginRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: '5px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f3f4f6',
  },
  loginText: { fontSize: '13px', color: '#9ca3af' },
  loginLink: { fontSize: '13px', color: '#1a73e8', fontWeight: 500, textDecoration: 'none' },
  footer: { fontSize: '11.5px', color: '#9ca3af', marginTop: '20px', textAlign: 'center' },
  illTitle: { fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: '20px 0 8px', textAlign: 'center', letterSpacing: '-0.2px' },
  illText: { fontSize: '13px', color: '#64748b', textAlign: 'center', lineHeight: 1.65, margin: 0, maxWidth: '210px' },
}

const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setError(null) }
  const focusInput = (e) => { e.target.style.borderColor = '#1a73e8' }
  const blurInput = (e) => { e.target.style.borderColor = '#d1d5db' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await registerApi({ name: form.name, email: form.email, phone: form.phone, password: form.password })
      navigate('/login', { state: { registered: true } })
    } catch (err) {
      if (err.response?.status === 409) {
        setError('An account with this email address already exists.')
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

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

          <h1 style={s.h1}>Create your account</h1>
          <p style={s.subtitle}>Join your team on Sandhya CRM.</p>

          {error && (
            <motion.div style={s.error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div style={s.row2}>
              <div style={s.formGroup}>
                <label style={s.label}>Full Name</label>
                <input type="text" placeholder="Priya Sharma" value={form.name}
                  onChange={set('name')} onFocus={focusInput} onBlur={blurInput}
                  required style={s.input} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Phone Number</label>
                <input type="tel" placeholder="+91 98765 43210" value={form.phone}
                  onChange={set('phone')} onFocus={focusInput} onBlur={blurInput}
                  required style={s.input} />
              </div>
            </div>

            <div style={s.formGroup}>
              <label style={s.label}>Email Address</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={set('email')} onFocus={focusInput} onBlur={blurInput}
                required style={s.input} />
            </div>

            <div style={s.row2}>
              <div style={s.formGroup}>
                <label style={s.label}>Password</label>
                <div style={s.fieldWrap}>
                  <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={form.password} onChange={set('password')}
                    onFocus={focusInput} onBlur={blurInput} required style={s.inputPw} />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPw(p => !p)}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Confirm Password</label>
                <div style={s.fieldWrap}>
                  <input type={showCf ? 'text' : 'password'} placeholder="Re-enter password"
                    value={form.confirm} onChange={set('confirm')}
                    onFocus={focusInput} onBlur={blurInput} required style={s.inputPw} />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowCf(p => !p)}>
                    <EyeIcon open={showCf} />
                  </button>
                </div>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}
                  style={{ animation: 'regSpin 0.75s linear infinite', flexShrink: 0 }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <div style={s.loginRow}>
              <span style={s.loginText}>Already have an account?</span>
              <Link
                to="/login"
                style={s.loginLink}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign in
              </Link>
            </div>
          </form>
        </div>

        {/* ── Divider ── */}
        <div style={s.divider} />

        {/* ── Right: Illustration ── */}
        <div style={s.right}>
          <TeamIllustration />
          <p style={s.illTitle}>Join your team.</p>
          <p style={s.illText}>
            Collaborate with your team to manage customers, track subscriptions, and close faster.
          </p>
        </div>
      </motion.div>

      <p style={s.footer}>© 2026, Sandhya Softtech Pvt. Ltd. All Rights Reserved.</p>

      <style>{`
        @keyframes regSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #9ca3af; font-size: 13px; }
      `}</style>
    </div>
  )
}
