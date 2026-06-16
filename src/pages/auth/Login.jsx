import { useState } from 'react'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser, clearError } from '../../store/slices/authSlice'
import { portalLoginApi } from '../../api/portalApi'
import { usePortal } from '../../context/PortalContext'

function EyeOpen() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width="17" height="17">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeClosed() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width="17" height="17">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

function DashboardIllustration() {
  return (
    <svg viewBox="0 0 360 300" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '320px' }}>
      {/* Main window shadow */}
      <rect x="24" y="28" width="312" height="244" rx="14" fill="#e8ecf4" />

      {/* Main window */}
      <rect x="20" y="24" width="312" height="244" rx="14" fill="white" stroke="#dde3ed" strokeWidth="1.2" />

      {/* Titlebar */}
      <rect x="20" y="24" width="312" height="42" rx="14" fill="#f6f8fb" />
      <rect x="20" y="52" width="312" height="14" fill="#f6f8fb" />

      {/* Traffic lights */}
      <circle cx="44" cy="45" r="5" fill="#ff6b6b" />
      <circle cx="60" cy="45" r="5" fill="#ffa94d" />
      <circle cx="76" cy="45" r="5" fill="#51cf66" />

      {/* Search bar in header */}
      <rect x="130" y="37" width="120" height="16" rx="8" fill="#edf0f5" />
      <circle cx="143" cy="45" r="4" fill="#c5cdd8" />
      <rect x="151" y="42" width="60" height="6" rx="3" fill="#d5dae3" />

      {/* Avatar */}
      <circle cx="306" cy="45" r="12" fill="#dbeafe" />
      <circle cx="306" cy="42" r="5" fill="#93c5fd" />
      <path d="M297 57 Q306 52 315 57" fill="#93c5fd" />

      {/* Left sidebar */}
      <rect x="20" y="66" width="64" height="202" fill="#f6f8fb" rx="0" />

      {/* Sidebar menu items */}
      <rect x="30" y="80" width="44" height="7" rx="3.5" fill="#3b82f6" />
      <rect x="30" y="98" width="44" height="7" rx="3.5" fill="#e2e8f0" />
      <rect x="30" y="116" width="44" height="7" rx="3.5" fill="#e2e8f0" />
      <rect x="30" y="134" width="44" height="7" rx="3.5" fill="#e2e8f0" />
      <rect x="30" y="152" width="44" height="7" rx="3.5" fill="#e2e8f0" />

      {/* Main content area */}
      {/* Stat cards row */}
      <rect x="90" y="78" width="70" height="54" rx="8" fill="#eff6ff" />
      <rect x="100" y="88" width="20" height="6" rx="3" fill="#bfdbfe" />
      <rect x="100" y="99" width="32" height="10" rx="5" fill="#3b82f6" />
      <rect x="100" y="114" width="24" height="5" rx="2.5" fill="#93c5fd" />

      <rect x="170" y="78" width="70" height="54" rx="8" fill="#f0fdf4" />
      <rect x="180" y="88" width="20" height="6" rx="3" fill="#bbf7d0" />
      <rect x="180" y="99" width="32" height="10" rx="5" fill="#16a34a" />
      <rect x="180" y="114" width="24" height="5" rx="2.5" fill="#86efac" />

      <rect x="250" y="78" width="68" height="54" rx="8" fill="#faf5ff" />
      <rect x="260" y="88" width="20" height="6" rx="3" fill="#e9d5ff" />
      <rect x="260" y="99" width="32" height="10" rx="5" fill="#7c3aed" />
      <rect x="260" y="114" width="24" height="5" rx="2.5" fill="#c4b5fd" />

      {/* Chart */}
      <rect x="90" y="142" width="148" height="110" rx="8" fill="#fafbfd" stroke="#edf0f5" strokeWidth="1" />

      {/* Chart grid lines */}
      <line x1="104" y1="228" x2="224" y2="228" stroke="#f0f2f7" strokeWidth="1" />
      <line x1="104" y1="210" x2="224" y2="210" stroke="#f0f2f7" strokeWidth="1" />
      <line x1="104" y1="192" x2="224" y2="192" stroke="#f0f2f7" strokeWidth="1" />
      <line x1="104" y1="174" x2="224" y2="174" stroke="#f0f2f7" strokeWidth="1" />

      {/* Chart bars */}
      <rect x="108" y="198" width="14" height="30" rx="4" fill="#bfdbfe" />
      <rect x="128" y="185" width="14" height="43" rx="4" fill="#3b82f6" />
      <rect x="148" y="205" width="14" height="23" rx="4" fill="#bfdbfe" />
      <rect x="168" y="178" width="14" height="50" rx="4" fill="#3b82f6" />
      <rect x="188" y="194" width="14" height="34" rx="4" fill="#bfdbfe" />
      <rect x="208" y="183" width="14" height="45" rx="4" fill="#3b82f6" />

      {/* Chart label */}
      <rect x="100" y="152" width="50" height="7" rx="3.5" fill="#e2e8f0" />

      {/* Contact list */}
      <rect x="248" y="142" width="80" height="110" rx="8" fill="#fafbfd" stroke="#edf0f5" strokeWidth="1" />

      <rect x="258" y="152" width="60" height="6" rx="3" fill="#e2e8f0" />

      {/* Contact rows */}
      <circle cx="263" cy="176" r="8" fill="#dbeafe" />
      <rect cx="258" cy="171" width="1" height="1" />
      <rect x="276" y="171" width="40" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="276" y="180" width="28" height="4" rx="2" fill="#e2e8f0" />

      <circle cx="263" cy="204" r="8" fill="#fce7f3" />
      <rect x="276" y="199" width="38" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="276" y="208" width="22" height="4" rx="2" fill="#e2e8f0" />

      <circle cx="263" cy="232" r="8" fill="#d1fae5" />
      <rect x="276" y="227" width="44" height="5" rx="2.5" fill="#cbd5e1" />
      <rect x="276" y="236" width="30" height="4" rx="2" fill="#e2e8f0" />
    </svg>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'white',
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
    minHeight: '520px',
    border: '1px solid gainsboro'
  },
  left: {
    flex: '0 0 400px',
    padding: '52px 48px 48px',
    display: 'flex',
    flexDirection: 'column',
  },
  divider: {
    width: '1px',
    background: '#e5e7eb',
    flexShrink: 0,
  },
  right: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 44px',
    background: '#f8faff',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '44px',
  },
  logoIcon: {
    width: '34px',
    height: '34px',
    background: '#1a73e8',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '13.5px',
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '0.8px',
  },
  h1: {
    fontSize: '27px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.4px',
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '6px 0 0',
    lineHeight: 1.5,
  },
  inputWrap: {
    position: 'relative',
    marginTop: '12px',
  },
  input: {
    width: '100%',
    padding: '11px 15px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13.5px',
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  inputPwIcon: {
    position: 'absolute',
    right: '13px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1,
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '9px 12px',
    fontSize: '12.5px',
    color: '#dc2626',
    marginTop: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '14px',
  },
  checkLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    cursor: 'pointer',
  },
  checkText: {
    fontSize: '13px',
    color: '#6b7280',
    userSelect: 'none',
  },
  forgotLink: {
    fontSize: '13px',
    color: '#1a73e8',
    textDecoration: 'none',
    fontWeight: 500,
    cursor: 'pointer',
  },
  registerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    marginTop: '20px',
    paddingTop: '18px',
    borderTop: '1px solid #f3f4f6',
  },
  registerText: { fontSize: '13px', color: '#9ca3af' },
  registerLink: {
    fontSize: '13px', color: '#1a73e8', fontWeight: 500,
    textDecoration: 'none', cursor: 'pointer',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#1a73e8',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '20px',
    letterSpacing: '0.1px',
    transition: 'background 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'inherit',
  },
  btnDisabled: {
    background: '#93c5fd',
    cursor: 'not-allowed',
  },
  footer: {
    fontSize: '11.5px',
    color: '#9ca3af',
    marginTop: '22px',
    textAlign: 'center',
    letterSpacing: '0.1px',
  },
  illTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1e293b',
    margin: '20px 0 8px',
    textAlign: 'center',
    letterSpacing: '-0.2px',
  },
  illText: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.65,
    margin: 0,
    maxWidth: '230px',
  },
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError,   setAuthError]   = useState('')

  const dispatch = useDispatch()
  const navigate  = useNavigate()
  const { setCustomer } = usePortal()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    // 1. Try CRM staff login
    try {
      const result = await dispatch(loginUser({ email, password }))
      if (loginUser.fulfilled.match(result)) {
        navigate('/dashboard')
        return
      }
    } catch {}

    // 2. CRM login failed — try customer portal login
    try {
      const res = await portalLoginApi({ email, password })
      const customerData = res.data?.data || res.data
      setCustomer(customerData)
      navigate('/portal/dashboard')
    } catch (err) {
      setAuthError(err.response?.data?.message || 'Invalid email or password.')
      setAuthLoading(false)
    }
  }

  const clearErr = () => {
    dispatch(clearError())
    setAuthError('')
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

          {/* Logo */}
          <div style={s.logo}>
            <div style={s.logoIcon}>
              <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span style={s.logoText}>SANDHYA CRM</span>
          </div>

          {/* Heading */}
          <h1 style={s.h1}>Sign in</h1>
          <p style={s.subtitle}>to access Sandhya CRM</p>

          {/* Error */}
          {authError && (
            <motion.div
              style={s.error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {authError}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ marginTop: '26px' }}>

            <input
              type="email"
              placeholder="Email address or mobile number"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearErr() }}
              onFocus={focusInput}
              onBlur={blurInput}
              required
              style={s.input}
            />

            <div style={s.inputWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearErr() }}
                onFocus={focusInput}
                onBlur={blurInput}
                required
                style={{ ...s.input, paddingRight: '42px', marginTop: 0 }}
              />
              <button
                type="button"
                style={s.inputPwIcon}
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>

            <div style={s.row}>
              <label style={s.checkLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ width: '14px', height: '14px', accentColor: '#1a73e8', cursor: 'pointer' }}
                />
                <span style={s.checkText}>Stay signed in</span>
              </label>
              <Link
                to="/forgot-password"
                style={s.forgotLink}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={authLoading ? { ...s.btn, ...s.btnDisabled } : s.btn}
              onMouseOver={e => { if (!authLoading) e.currentTarget.style.background = '#1557b0' }}
              onMouseOut={e => { if (!authLoading) e.currentTarget.style.background = '#1a73e8' }}
            >
              {authLoading && (
                <svg
                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth={2.5}
                  style={{ animation: 'loginSpin 0.75s linear infinite', flexShrink: 0 }}
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              )}
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={s.registerRow}>
              <span style={s.registerText}>New team member?</span>
              <Link
                to="/register"
                style={s.registerLink}
                onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Create account
              </Link>
            </div>
          </form>
        </div>

        {/* ── Vertical divider ── */}
        <div style={s.divider} />

        {/* ── Right: Illustration ── */}
        <div style={s.right}>
          <DashboardIllustration />
          <p style={s.illTitle}>Manage smarter, close faster.</p>
          <p style={s.illText}>
            One workspace for your leads, contacts, pipeline, and reports.
          </p>
        </div>

      </motion.div>

      <p style={s.footer}>
        © 2026, Sandhya Softtech Pvt. Ltd. All Rights Reserved.
      </p>

      <style>{`
        @keyframes loginSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input[type="email"]::placeholder,
        input[type="password"]::placeholder,
        input[type="text"]::placeholder {
          color: #9ca3af;
          font-size: 13.5px;
        }
      `}</style>
    </div>
  )
}
