import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalLoginApi } from '../../api/portalApi'
import { usePortal } from '../../context/PortalContext'
import logoSvg from '../../assets/logosvg.svg'

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    {open
      ? <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      : <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    }
  </svg>
)

export default function PortalLogin() {
  const { setCustomer } = usePortal()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Email and password are required.'); return }
    setLoading(true)
    try {
      const res = await portalLoginApi(form)
      setCustomer(res.data.data)
      navigate('/portal/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
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
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '14px', background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(26,115,232,0.35)' }}>
            <img src={logoSvg} alt="Sandhya CRM" style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px' }}>Sandhya CRM</div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Customer Portal — Sign in to your account</div>
        </div>

        <div style={{
          background: 'white', borderRadius: '14px', padding: '32px',
          boxShadow: '0 4px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(226,232,240,0.7)',
        }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '13.5px', color: '#dc2626' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#1a73e8'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '26px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Your portal password"
                  style={{ ...inp, paddingRight: '44px' }}
                  onFocus={e => e.target.style.borderColor = '#1a73e8'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex' }}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '42px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#93c5fd' : 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
                color: 'white', fontSize: '14.5px', fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.15s', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              {loading && <div style={{ width: '16px', height: '16px', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'plspin 0.7s linear infinite' }} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12.5px', color: '#94a3b8' }}>
          Access is granted by your service team.
        </p>
      </div>

      <style>{`@keyframes plspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
