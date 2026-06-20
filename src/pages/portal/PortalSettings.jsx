import { useState } from 'react'
import { usePortal } from '../../context/PortalContext'
import { portalUpdateMeApi, portalChangePasswordApi } from '../../api/portalApi'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
      {children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Field({ label, required, children, hint }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#9ca3af' }}>{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, readOnly }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1px solid ${focused ? '#1a73e8' : '#d1d5db'}`,
        borderRadius: 7, padding: '9px 11px', fontSize: 13, outline: 'none',
        background: readOnly ? '#f9fafb' : 'white',
        color: readOnly ? '#9ca3af' : '#111827',
        fontFamily: 'inherit', cursor: readOnly ? 'default' : 'text',
      }}
    />
  )
}

function PasswordInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid ${focused ? '#1a73e8' : '#d1d5db'}`,
          borderRadius: 7, padding: '9px 38px 9px 11px', fontSize: 13, outline: 'none',
          fontFamily: 'inherit', color: '#111827',
        }}
      />
      <button type="button" onClick={() => setShow(v => !v)} style={{
        position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af',
        padding: 3, display: 'flex', alignItems: 'center',
      }}>
        {show
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        }
      </button>
    </div>
  )
}

function Alert({ type, children }) {
  const s = type === 'success'
    ? { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' }
    : { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' }
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`, borderRadius: 7,
      padding: '10px 14px', fontSize: 13, color: s.color, marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      {type === 'success'
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      }
      {children}
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', height: 'fit-content' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PortalSettings() {
  const { customer, setCustomer } = usePortal()

  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ name: customer?.name || '', phone: customer?.phone || '' })
  const [saving,   setSaving]   = useState(false)
  const [profOk,   setProfOk]   = useState('')
  const [profErr,  setProfErr]  = useState('')

  const [pw,       setPw]       = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwOk,     setPwOk]     = useState('')
  const [pwErr,    setPwErr]    = useState('')

  const startEdit = () => {
    setForm({ name: customer?.name || '', phone: customer?.phone || '' })
    setProfOk(''); setProfErr('')
    setEditing(true)
  }
  const cancelEdit = () => { setEditing(false); setProfOk(''); setProfErr('') }

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { setProfErr('Name is required.'); return }
    setSaving(true); setProfOk(''); setProfErr('')
    try {
      const res = await portalUpdateMeApi({ name: form.name.trim(), phone: form.phone.trim() })
      const updated = res.data?.data
      if (updated) setCustomer(prev => ({ ...prev, ...updated }))
      setProfOk('Profile updated successfully.')
      setEditing(false)
    } catch (e) {
      setProfErr(e?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwOk(''); setPwErr('')
    if (!pw.current)            { setPwErr('Please enter your current password.'); return }
    if (!pw.next)               { setPwErr('Please enter a new password.'); return }
    if (pw.next.length < 8)     { setPwErr('New password must be at least 8 characters.'); return }
    if (pw.next !== pw.confirm) { setPwErr('New passwords do not match.'); return }
    setPwSaving(true)
    try {
      await portalChangePasswordApi({ currentPassword: pw.current, newPassword: pw.next })
      setPwOk('Password changed successfully.')
      setPw({ current: '', next: '', confirm: '' })
    } catch (e) {
      setPwErr(e?.response?.data?.message || 'Failed to change password.')
    } finally {
      setPwSaving(false)
    }
  }

  const c = customer || {}

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#111827' }}>

      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Account Settings</h1>
        <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9ca3af' }}>Manage your profile and password</p>
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── My Profile ── */}
        <Card title="My Profile" subtitle="Update your name and phone">
          <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6', marginBottom: 14 }}>
            <span style={{ width: 80, fontSize: 11.5, fontWeight: 600, color: '#9ca3af', flexShrink: 0 }}>Email</span>
            <span style={{ fontSize: 12.5, color: '#6b7280', wordBreak: 'break-all' }}>{c.email}</span>
          </div>

          {profOk && <Alert type="success">{profOk}</Alert>}

          {!editing ? (
            <>
              {[
                ['Name',  c.name  || '—'],
                ['Phone', c.phone || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ width: 80, fontSize: 11.5, fontWeight: 600, color: '#9ca3af', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 13, color: val === '—' ? '#d1d5db' : '#111827' }}>{val}</span>
                </div>
              ))}
              <button onClick={startEdit} style={{ marginTop: 16, padding: '8px 18px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}>
                Edit Profile
              </button>
            </>
          ) : (
            <>
              {profErr && <Alert type="error">{profErr}</Alert>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
                <Field label="Full name" required>
                  <TextInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                </Field>
                <Field label="Phone">
                  <TextInput value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                </Field>
                <Field label="Email" hint="Contact support to change email.">
                  <TextInput value={c.email} readOnly />
                </Field>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveProfile} disabled={saving}
                  style={{ padding: '8px 16px', background: saving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={cancelEdit}
                  style={{ padding: '8px 14px', border: '1px solid #e5e7eb', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </Card>

        {/* ── Change Password ── */}
        <Card title="Change Password" subtitle="At least 8 characters">
          {pwOk && <Alert type="success">{pwOk}</Alert>}
          {pwErr && <Alert type="error">{pwErr}</Alert>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Current password" required>
              <PasswordInput value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Current password" />
            </Field>
            <Field label="New password" required>
              <PasswordInput value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="At least 8 characters" />
              {pw.next.length > 0 && pw.next.length < 8 && (
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#dc2626' }}>Must be at least 8 characters</p>
              )}
            </Field>
            <Field label="Confirm new password" required>
              <PasswordInput value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password" />
              {pw.confirm.length > 0 && pw.next !== pw.confirm && (
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#dc2626' }}>Passwords do not match</p>
              )}
            </Field>
          </div>
          <button onClick={handleChangePassword} disabled={pwSaving}
            style={{ marginTop: 18, padding: '9px 20px', background: pwSaving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {pwSaving ? 'Changing…' : 'Change Password'}
          </button>
        </Card>

        {/* ── Account Information ── */}
        <Card title="Account Information" subtitle="Read-only account details">
          {[
            ['Business',   c.businessName       || '—'],
            ['Subscribed', c.Subscriptions       || '—'],
            ['City',       c.address?.city       || '—'],
            ['State',      c.address?.state      || '—'],
            ['Member since', fmtDate(c.createdAt)],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
              <span style={{ width: 90, fontSize: 11.5, fontWeight: 600, color: '#9ca3af', flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 13, color: val === '—' ? '#d1d5db' : '#374151' }}>{val}</span>
            </div>
          ))}
          <p style={{ margin: '14px 0 0', fontSize: 11.5, color: '#9ca3af', lineHeight: 1.6 }}>
            To update business details or email, contact your account manager or raise a support ticket.
          </p>
        </Card>

      </div>
    </div>
  )
}
