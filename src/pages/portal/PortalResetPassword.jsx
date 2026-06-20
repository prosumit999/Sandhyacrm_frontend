import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { portalResetPasswordApi } from '../../api/portalApi'
import logoSvg from '../../assets/logosvg.svg'

const EyeIcon = ({ open }) => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    {open
      ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    }
  </svg>
)

function PasswordField({ label, value, onChange, placeholder, show, onToggle }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: '42px', borderRadius: '8px',
            border: `1px solid ${focused ? '#1a73e8' : '#e2e8f0'}`,
            padding: '0 40px 0 14px', fontSize: '14px', color: '#0f172a',
            outline: 'none', boxSizing: 'border-box',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            transition: 'border-color 0.15s',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}

export default function PortalResetPassword() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [pw,       setPw]       = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [showConf, setShowConf] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [done,     setDone]     = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (pw.length < 8)       { setError('Password must be at least 8 characters.'); return }
    if (pw !== confirm)      { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await portalResetPasswordApi(token, { password: pw })
      setDone(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(150deg, #f0f4ff 0%, #e8efff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(26,115,232,0.35)' }}>
            <img src={logoSvg} alt="Sandhya CRM" style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Sandhya CRM</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Customer Portal</div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px', padding: '32px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(226,232,240,0.7)',
        }}>
          {!done ? (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Set a new password</h2>
              <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', lineHeight: 1.55 }}>
                Must be at least 8 characters.
              </p>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <PasswordField
                  label="New password"
                  value={pw}
                  onChange={e => { setPw(e.target.value); setError('') }}
                  placeholder="At least 8 characters"
                  show={showPw}
                  onToggle={() => setShowPw(v => !v)}
                />
                <PasswordField
                  label="Confirm new password"
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setError('') }}
                  placeholder="Repeat your new password"
                  show={showConf}
                  onToggle={() => setShowConf(v => !v)}
                />
                {confirm.length > 0 && pw !== confirm && (
                  <p style={{ margin: '-10px 0 12px', fontSize: '12px', color: '#dc2626' }}>Passwords do not match</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', height: '42px', borderRadius: '8px', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
                    color: 'white', fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", marginTop: '6px',
                  }}
                >
                  {loading && <div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'prspin 0.7s linear infinite' }} />}
                  {loading ? 'Resetting...' : 'Reset password'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%', background: '#f0fdf4',
                border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Password reset!</h2>
              <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Your portal password has been updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/portal/login')}
                style={{
                  width: '100%', height: '42px', borderRadius: '8px', border: 'none',
                  cursor: 'pointer', background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
                  color: 'white', fontSize: '14px', fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes prspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
