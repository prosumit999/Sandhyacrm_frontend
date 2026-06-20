import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalForgotPasswordApi } from '../../api/portalApi'
import logoSvg from '../../assets/logosvg.svg'

export default function PortalForgotPassword() {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState('')
  const [devReset, setDevReset] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await portalForgotPasswordApi({ email: email.trim() })
      if (res.data?.resetUrl) setDevReset(res.data.resetUrl)
      setSent(true)
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', height: '42px', border: '1px solid #e2e8f0', borderRadius: '8px',
    padding: '0 14px', fontSize: '14px', color: '#0f172a', background: 'white',
    outline: 'none', boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    transition: 'border-color 0.15s',
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
          {!sent ? (
            <>
              <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Forgot your password?</h2>
              <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', lineHeight: 1.55 }}>
                Enter the email address linked to your portal account and we'll send you a reset link.
              </p>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="you@company.com"
                    required
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#1a73e8'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', height: '42px', borderRadius: '8px', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
                    color: 'white', fontSize: '14px', fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  }}
                >
                  {loading && <div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'pfspin 0.7s linear infinite' }} />}
                  {loading ? 'Sending...' : 'Send reset link'}
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
              <h2 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Check your inbox</h2>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                If an account with <strong style={{ color: '#0f172a' }}>{email}</strong> exists, a password reset link has been sent. Check your spam folder if you don't see it within a minute.
              </p>
              <button
                onClick={() => setSent(false)}
                style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Try a different email
              </button>
              {devReset && (
                <div style={{ marginTop: '14px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#713f12', textAlign: 'left' }}>
                  <strong>Dev mode:</strong> SMTP not active.{' '}
                  <a href={devReset} style={{ color: '#1a73e8', wordBreak: 'break-all' }}>Click here to reset password</a>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/portal/login')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none',
              color: '#64748b', fontSize: '13px', cursor: 'pointer', marginTop: '20px',
              fontFamily: 'inherit', padding: 0,
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to sign in
          </button>
        </div>
      </div>

      <style>{`@keyframes pfspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
