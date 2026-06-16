import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createUserApi } from '../../api/userApi'

const ROLES = [
  { value: 'SuperAdmin', label: 'Super Admin', desc: 'Full system access, can manage all users and settings.' },
  { value: 'Admin', label: 'Admin', desc: 'Can manage customers, billing, and reports.' },
  { value: 'Standard', label: 'Standard', desc: 'Read/write access to assigned areas only.' },
]

const DEPARTMENTS = ['Engineering', 'Sales', 'Support', 'Finance', 'Operations', 'Management']

const s = {
  page: {
    minHeight: '100vh',
    background: '#f3f4f6',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif",
    padding: '32px 24px',
  },
  header: {
    maxWidth: '740px',
    margin: '0 auto 28px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
  },
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    fontSize: '13px', color: '#6b7280', background: 'none', border: 'none',
    cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit',
    transition: 'color 0.15s',
  },
  pageTitle: { fontSize: '24px', fontWeight: 700, color: '#111827', margin: '4px 0 2px', letterSpacing: '-0.3px' },
  pageSubtitle: { fontSize: '13.5px', color: '#6b7280', margin: 0 },
  card: {
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    maxWidth: '740px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  section: { padding: '28px 32px' },
  sectionDivider: { height: '1px', background: '#f3f4f6', margin: '0 32px' },
  sectionTitle: {
    fontSize: '12px', fontWeight: 600, color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: '0.7px', margin: '0 0 20px',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' },
  required: { color: '#dc2626', marginLeft: '2px' },
  input: {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13.5px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  select: {
    width: '100%', padding: '10px 14px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13.5px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit', cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
  },
  fieldWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  eyeBtn: {
    position: 'absolute', right: '11px', background: 'none', border: 'none',
    padding: 0, cursor: 'pointer', color: '#9ca3af', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  inputPw: {
    width: '100%', padding: '10px 40px 10px 14px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '13.5px', color: '#111827',
    outline: 'none', boxSizing: 'border-box', background: 'white',
    transition: 'border-color 0.15s', fontFamily: 'inherit',
  },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  roleCard: (selected) => ({
    border: selected ? '2px solid #1a73e8' : '1.5px solid #e5e7eb',
    borderRadius: '8px', padding: '14px 14px 12px',
    cursor: 'pointer', background: selected ? '#eff6ff' : 'white',
    transition: 'all 0.14s', position: 'relative',
  }),
  roleLabel: (selected) => ({
    fontSize: '13px', fontWeight: 600, color: selected ? '#1a73e8' : '#111827',
    marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px',
  }),
  roleDesc: { fontSize: '11.5px', color: '#6b7280', lineHeight: 1.5 },
  footer: {
    padding: '20px 32px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: '6px',
    fontSize: '13.5px', fontWeight: 500, color: '#374151', background: 'white',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s, background 0.15s',
  },
  submitBtn: {
    padding: '10px 22px', background: '#1a73e8', border: 'none',
    borderRadius: '6px', fontSize: '13.5px', fontWeight: 600, color: 'white',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
    display: 'flex', alignItems: 'center', gap: '7px',
  },
  error: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px',
    padding: '9px 14px', fontSize: '13px', color: '#dc2626', margin: '0 32px 2px',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
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

export default function CreateUser() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', role: 'Standard', password: '', confirm: '' })
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
      const payload = { name: form.name, email: form.email, phone: form.phone, role: form.role, password: form.password }
      if (form.department) payload.department = form.department
      await createUserApi(payload)
      navigate('/users')
    } catch (err) {
      if (err.response?.status === 409) {
        setError('A user with this email address already exists.')
      } else {
        setError(err.response?.data?.message || 'Failed to create user. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <button
            style={s.backBtn}
            onClick={() => navigate('/users')}
            onMouseOver={e => e.currentTarget.style.color = '#111827'}
            onMouseOut={e => e.currentTarget.style.color = '#6b7280'}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Users
          </button>
          <p style={s.pageTitle}>Create New User</p>
          <p style={s.pageSubtitle}>Add a new team member to Sandhya CRM.</p>
        </div>
      </div>

      <motion.form
        style={s.card}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        {/* ── Personal Info ── */}
        <div style={s.section}>
          <p style={s.sectionTitle}>Personal Information</p>
          <div style={s.row}>
            <div style={s.formGroup}>
              <label style={s.label}>Full Name <span style={s.required}>*</span></label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={form.name}
                onChange={set('name')}
                onFocus={focusInput}
                onBlur={blurInput}
                required
                style={s.input}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Email Address <span style={s.required}>*</span></label>
              <input
                type="email"
                placeholder="e.g. priya@company.com"
                value={form.email}
                onChange={set('email')}
                onFocus={focusInput}
                onBlur={blurInput}
                required
                style={s.input}
              />
            </div>
          </div>
          <div style={s.row}>
            <div style={s.formGroup}>
              <label style={s.label}>Phone Number <span style={s.required}>*</span></label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={set('phone')}
                onFocus={focusInput}
                onBlur={blurInput}
                required
                style={s.input}
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Department <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: '12px' }}>(optional)</span></label>
              <select
                value={form.department}
                onChange={set('department')}
                onFocus={focusInput}
                onBlur={blurInput}
                style={s.select}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={s.sectionDivider} />

        {/* ── Account Role ── */}
        <div style={s.section}>
          <p style={s.sectionTitle}>Account Role</p>
          <div style={s.roleGrid}>
            {ROLES.map(r => (
              <div
                key={r.value}
                style={s.roleCard(form.role === r.value)}
                onClick={() => setForm(f => ({ ...f, role: r.value }))}
              >
                {form.role === r.value && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill="#1a73e8" />
                      <path d="M7 12.5l3.5 3.5 6-7" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <p style={s.roleLabel(form.role === r.value)}>{r.label}</p>
                <p style={s.roleDesc}>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={s.sectionDivider} />

        {/* ── Security ── */}
        <div style={s.section}>
          <p style={s.sectionTitle}>Security</p>
          <div style={s.row}>
            <div style={s.formGroup}>
              <label style={s.label}>Password <span style={s.required}>*</span></label>
              <div style={s.fieldWrap}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  required
                  style={s.inputPw}
                />
                <button type="button" style={s.eyeBtn} onClick={() => setShowPw(p => !p)}>
                  <EyeIcon open={showPw} />
                </button>
              </div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Confirm Password <span style={s.required}>*</span></label>
              <div style={s.fieldWrap}>
                <input
                  type={showCf ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={form.confirm}
                  onChange={set('confirm')}
                  onFocus={focusInput}
                  onBlur={blurInput}
                  required
                  style={s.inputPw}
                />
                <button type="button" style={s.eyeBtn} onClick={() => setShowCf(p => !p)}>
                  <EyeIcon open={showCf} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <motion.div style={s.error} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}

        {/* ── Footer ── */}
        <div style={s.footer}>
          <button
            type="button"
            style={s.cancelBtn}
            onClick={() => navigate('/users')}
            onMouseOver={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db' }}
            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e5e7eb' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={loading ? { ...s.submitBtn, background: '#93c5fd', cursor: 'not-allowed' } : s.submitBtn}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#1557b0' }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#1a73e8' }}
          >
            {loading && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}
                style={{ animation: 'cuSpin 0.75s linear infinite', flexShrink: 0 }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>

        <style>{`
          @keyframes cuSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          input::placeholder { color: #9ca3af; font-size: 13px; }
        `}</style>
      </motion.form>
    </div>
  )
}
