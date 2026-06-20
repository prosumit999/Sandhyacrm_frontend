import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  getAllCustomersApi, createCustomerApi, updateCustomerApi, deleteCustomerApi,
} from '../../api/customerApi'
import { getAllUsersApi } from '../../api/userApi'
import { enablePortalAccessApi } from '../../api/portalApi'
import { toastSuccess, toastError } from '../../utils/toast'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const initials = name => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  search:   'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  plus:     'M12 5v14M5 12h14',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:    'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  eye:      'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 110 6 3 3 0 010-6z',
  close:    'M18 6L6 18M6 6l12 12',
  chevronL: 'M15 18l-6-6 6-6',
  chevronR: 'M9 18l6-6-6-6',
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  filter:   'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  spinner:  'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  key:      'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1a73e8', display: 'inline-block' }}>
      {status}
    </span>
  )
}

// ── Subscription type badge ───────────────────────────────────────────────────
function SubTypeBadge({ type }) {
  const color = '#1a73e8', bg = '#eff6ff'
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: bg, color, display: 'inline-block', whiteSpace: 'nowrap' }}>
      {type}
    </span>
  )
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
const Sk = ({ w = '80%' }) => <div style={{ height: 12, width: w, borderRadius: 3, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />

// ── Input ─────────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box', padding: '8px 11px',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
  color: '#111827', outline: 'none', fontFamily: 'inherit', background: 'white',
  transition: 'border-color 0.14s', ...extra,
})

// ── Portal access modal ───────────────────────────────────────────────────────
function PortalAccessModal({ customer, onClose, onSaved }) {
  const [enabled, setEnabled]   = useState(customer.portalAccess || false)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [busy, setBusy]         = useState(false)
  const [err, setErr]           = useState('')
  const [ok, setOk]             = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (enabled && !customer.portalAccess && !password) {
      return setErr('A password is required when enabling portal access for the first time.')
    }
    setBusy(true); setErr('')
    try {
      await enablePortalAccessApi(customer._id, { enable: enabled, password: password || undefined })
      setOk(true)
      setTimeout(() => { onSaved(); onClose() }, 1000)
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const inp = { width: '100%', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: 'white' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '10px', width: '100%', maxWidth: '420px', padding: '24px 26px', boxShadow: '0 16px 48px rgba(0,0,0,0.16)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Portal Access — {customer.name}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}>
            <Ic d={IC.close} size={16} />
          </button>
        </div>

        {ok && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', padding: '9px 12px', fontSize: '12.5px', color: '#16a34a', marginBottom: '14px' }}>
            ✓ Portal access updated successfully
          </div>
        )}
        {err && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '7px', padding: '9px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '14px' }}>{err}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>Enable portal access</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>
                {enabled ? 'Customer can log into the portal' : 'Portal access is disabled'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(v => !v)}
              style={{ width: '42px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: enabled ? '#1a73e8' : '#d1d5db', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', top: '3px', left: enabled ? '21px' : '3px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>

          {enabled && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>
                {customer.portalAccess ? 'New Password (leave blank to keep current)' : 'Set Password *'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  style={{ ...inp, paddingRight: '40px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={customer.portalAccess ? 'Leave blank to keep current' : 'Set a secure password'}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width="16" height="16">
                    {showPw
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                    }
                  </svg>
                </button>
              </div>
              <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '5px' }}>
                Portal login URL: <strong style={{ color: '#1a73e8' }}>/portal/login</strong> — share this with the customer.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={busy}
              style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', background: busy ? '#93c5fd' : '#1a73e8', color: 'white', fontFamily: 'inherit' }}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Confirm delete dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ name, onConfirm, onCancel, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '24px', width: '360px', maxWidth: '90vw' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Delete Customer?</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '22px', lineHeight: 1.5 }}>
          This will permanently delete <strong style={{ color: '#111827' }}>{name}</strong> and all associated records. This cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#dc2626', color: 'white', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ADD / EDIT MODAL
// =============================================================================
const BLANK = { name: '', email: '', phone: '', whatsapp: '', businessName: '', Appurl: '', Subscriptions: '', serviceUser: '', address: { city: '', state: '', country: 'India' }, referrredBy: '', notes: '' }

function CustomerModal({ mode, initial, onClose, onSaved, users, currentUserId, isAdmin }) {
  const [form, setForm]           = useState(initial || BLANK)
  const [err,  setErr]            = useState('')
  const [busy, setBusy]           = useState(false)
  const [portalEnabled, setPortalEnabled] = useState(initial?.portalAccess || false)
  const [portalPassword, setPortalPassword] = useState('')
  const [showPortalPw, setShowPortalPw]   = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setAddr = (k, v) => setForm(f => ({ ...f, address: { ...f.address, [k]: v } }))

  const focusBorder  = e => e.target.style.borderColor = '#1a73e8'
  const blurBorder   = e => e.target.style.borderColor = '#d1d5db'

  const handleSubmit = async e => {
    e.preventDefault()
    setErr('')
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.Subscriptions || !form.serviceUser) {
      setErr('Name, email, phone, subscription type, and assigned staff are required.')
      return
    }
    if (portalEnabled && !initial?.portalAccess && !portalPassword) {
      setErr('A portal password is required when enabling portal access.')
      return
    }
    setBusy(true)
    try {
      let customerId
      if (mode === 'create') {
        const res = await createCustomerApi(form)
        customerId = res.data.data._id
      } else {
        await updateCustomerApi(initial._id, form)
        customerId = initial._id
      }
      // Set portal access if toggled on or password was changed
      if (portalEnabled || (initial?.portalAccess && !portalEnabled)) {
        await enablePortalAccessApi(customerId, {
          enable: portalEnabled,
          password: portalPassword || undefined,
        })
      }
      onSaved()
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 50 }}>
      <div style={{ width: '480px', maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>{mode === 'create' ? 'Add Customer' : 'Edit Customer'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {err && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '9px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '16px' }}>{err}</div>
          )}

          {/* ── Personal Info ── */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Full Name" required>
              <input value={form.name} onChange={e => set('name', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. Ramesh Sharma" style={inp()} />
            </Field>
            <Field label="Business Name">
              <input value={form.businessName} onChange={e => set('businessName', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. Sharma Enterprises" style={inp()} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Phone" required>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="+91 98765 43210" style={inp()} />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="If different from phone" style={inp()} />
            </Field>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Field label="Email" required>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="email@example.com" style={inp()} />
            </Field>
          </div>

          {/* ── Address ── */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0 12px' }}>Address</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="City">
              <input value={form.address?.city || ''} onChange={e => setAddr('city', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="Amravati" style={inp()} />
            </Field>
            <Field label="State">
              <input value={form.address?.state || ''} onChange={e => setAddr('state', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="Maharashtra" style={inp()} />
            </Field>
            <Field label="Country">
              <input value={form.address?.country || 'India'} onChange={e => setAddr('country', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="India" style={inp()} />
            </Field>
          </div>

          {/* ── Account ── */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0 12px' }}>Account Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Subscription Type" required>
              <select value={form.Subscriptions} onChange={e => set('Subscriptions', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inp({ background: 'white' })}>
                <option value="">Select type</option>
                <option>Desktop</option>
                <option>Web Application</option>
                <option>Mobile Application</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status || 'Active'} onChange={e => set('status', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inp({ background: 'white' })}>
                <option>Active</option>
                <option>Lead</option>
                <option>Expired</option>
                <option>Suspended</option>
              </select>
            </Field>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Field label="Assigned Staff" required>
              {isAdmin ? (
                <select value={form.serviceUser} onChange={e => set('serviceUser', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inp({ background: 'white' })}>
                  <option value="">Select staff member</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              ) : (
                <input value={users.find(u => u._id === currentUserId)?.name || 'You'} disabled style={inp({ background: '#f9fafb', color: '#6b7280' })} />
              )}
            </Field>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Field label="App / Website URL">
              <input value={form.Appurl} onChange={e => set('Appurl', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="https://example.com" style={inp()} />
            </Field>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Field label="Referred By">
              <input value={form.referrredBy} onChange={e => set('referrredBy', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. Vijay Patil" style={inp()} />
            </Field>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="Any internal notes…" rows={3} style={inp({ resize: 'vertical', lineHeight: 1.5 })} />
            </Field>
          </div>

          {/* ── Portal Access ── */}
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0 12px' }}>Customer Portal</div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>Enable portal access</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  {portalEnabled ? 'Customer can log in at /portal/login' : 'Portal access is disabled for this customer'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPortalEnabled(v => !v)}
                style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: portalEnabled ? '#1a73e8' : '#d1d5db', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }}
              >
                <span style={{ position: 'absolute', top: '3px', left: portalEnabled ? '19px' : '3px', width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>

            {portalEnabled && (
              <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 14px', background: '#fafbff' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                  {initial?.portalAccess ? 'New Password (leave blank to keep current)' : 'Set Portal Password *'}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPortalPw ? 'text' : 'password'}
                    value={portalPassword}
                    onChange={e => setPortalPassword(e.target.value)}
                    placeholder={initial?.portalAccess ? 'Leave blank to keep current password' : 'Create a password for the customer'}
                    style={{ ...inp(), paddingRight: '40px' }}
                    onFocus={focusBorder}
                    onBlur={blurBorder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPortalPw(v => !v)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width="15" height="15">
                      {showPortalPw
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65" />
                        : <><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>
                      }
                    </svg>
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>
                  Share the portal URL with the customer: <span style={{ color: '#1a73e8', fontWeight: 500 }}>/portal/login</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }} />

        </form>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button type="submit" form="noop" onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#93c5fd' : '#1a73e8', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#1557b0' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#1a73e8' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Saving…' : mode === 'create' ? 'Add Customer' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  CUSTOMERS LIST PAGE
// =============================================================================
export default function Customers() {
  const { user }  = useSelector(s => s.auth)
  const navigate  = useNavigate()
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)
  const isSuperAdmin = user?.role === 'SuperAdmin'

  const [customers,  setCustomers]  = useState([])
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 })

  // Filters
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Modal state
  const [modal, setModal]         = useState(null)   // null | { mode: 'create'|'edit', initial?: customer }
  const [delTarget, setDelTarget] = useState(null)   // customer to delete
  const [delBusy,   setDelBusy]   = useState(false)
  const [portalTarget, setPortalTarget] = useState(null) // customer for portal access

  // Fetch customers
  const fetchCustomers = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 20 }
      if (search) params.search = search
      if (status) params.status = status
      const res = await getAllCustomersApi(params)
      setCustomers(res.data.data || [])
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 1 })
    } catch (_) { }
    finally { setLoading(false) }
  }, [search, status])

  // Fetch staff users (for dropdown — admin only)
  useEffect(() => {
    if (isAdmin) {
      getAllUsersApi({ limit: 100 }).then(r => setUsers(r.data.data || [])).catch(() => {})
    } else {
      setUsers([{ _id: user?._id, name: user?.name, email: user?.email }])
    }
  }, [isAdmin, user])

  useEffect(() => { fetchCustomers(1) }, [fetchCustomers])

  // Search with debounce-like: trigger on Enter or blur
  const applySearch = () => setSearch(searchInput)

  const handleModalSaved = () => {
    const isEdit = modal?.mode === 'edit'
    setModal(null)
    fetchCustomers(pagination.page)
    toastSuccess(isEdit ? 'Customer updated successfully' : 'Customer added successfully')
  }

  const handleDelete = async () => {
    setDelBusy(true)
    try {
      await deleteCustomerApi(delTarget._id)
      setDelTarget(null)
      fetchCustomers(pagination.page)
      toastSuccess('Customer deleted')
    } catch (e) {
      toastError(e?.response?.data?.message || 'Failed to delete customer')
    }
    finally { setDelBusy(false) }
  }

  const openEdit = (c) => {
    setModal({
      mode: 'edit',
      initial: {
        ...c,
        serviceUser: c.serviceUser?._id || c.serviceUser || '',
        address: c.address || { city: '', state: '', country: 'India' },
      }
    })
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Customers</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>
            {loading ? 'Loading…' : `${pagination.total} total customer${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', maxWidth: '340px' }}>
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none', display: 'flex' }}>
            <Ic d={IC.search} size={14} />
          </span>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applySearch()}
            onBlur={applySearch}
            placeholder="Search name, email, phone, business…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px 8px 32px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: '#111827', outline: 'none', fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = '#1a73e8'}
          />
        </div>

        {/* Status filter */}
        <select value={status} onChange={e => { setStatus(e.target.value) }}
          style={{ padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: status ? '#111827' : '#9ca3af', outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
          <option value="">All Status</option>
          <option>Active</option>
          <option>Lead</option>
          <option>Expired</option>
          <option>Suspended</option>
        </select>

        {(search || status) && (
          <button onClick={() => { setSearch(''); setSearchInput(''); setStatus('') }}
            style={{ padding: '8px 12px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '12.5px', color: '#6b7280', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '18px 20px', height: '150px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {isAdmin && <PlusCard label="Add Customer" onClick={() => setModal({ mode: 'create', initial: { ...BLANK } })} />}
          {customers.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '52px 0', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>
              {search || status ? 'No customers match the filters.' : 'No customers found.'}
            </div>
          ) : customers.map(c => (
            <CustomerCard key={c._id} c={c} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin}
              onView={() => navigate(`/customers/${c._id}`)}
              onEdit={() => openEdit(c)}
              onPortal={() => setPortalTarget(c)}
              onDelete={() => setDelTarget(c)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', marginTop: '8px' }}>
          <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <PagBtn disabled={pagination.page <= 1} onClick={() => fetchCustomers(pagination.page - 1)} icon={IC.chevronL} />
            {[...Array(pagination.pages)].map((_, i) => {
              const pg = i + 1; const active = pg === pagination.page
              if (pagination.pages > 7 && Math.abs(pg - pagination.page) > 2 && pg !== 1 && pg !== pagination.pages) return null
              return (
                <button key={pg} onClick={() => fetchCustomers(pg)}
                  style={{ width: '30px', height: '30px', border: `1px solid ${active ? '#1a73e8' : 'gainsboro'}`, borderRadius: '5px', fontSize: '12.5px', fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? '#eff6ff' : 'white', color: active ? '#1a73e8' : '#374151', fontFamily: 'inherit' }}>
                  {pg}
                </button>
              )
            })}
            <PagBtn disabled={pagination.page >= pagination.pages} onClick={() => fetchCustomers(pagination.page + 1)} icon={IC.chevronR} />
          </div>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && (
        <CustomerModal
          mode={modal.mode}
          initial={modal.initial}
          onClose={() => setModal(null)}
          onSaved={handleModalSaved}
          users={users}
          currentUserId={user?._id}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Delete confirm ── */}
      {delTarget && (
        <ConfirmDialog
          name={delTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
          loading={delBusy}
        />
      )}

      {/* ── Portal access modal ── */}
      {portalTarget && (
        <PortalAccessModal
          customer={portalTarget}
          onClose={() => setPortalTarget(null)}
          onSaved={() => { fetchCustomers(pagination.page); toastSuccess('Portal access updated') }}
        />
      )}

      <style>{`
        @keyframes sk   { from{opacity:1} to{opacity:0.45} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}

// ── Plus card (add new) ───────────────────────────────────────────────────────
function PlusCard({ label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#eff6ff' : 'white', border: `2px dashed ${hov ? '#1a73e8' : '#d1d5db'}`, borderRadius: '8px', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: hov ? '#1a73e8' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        <Ic d={IC.plus} size={18} color={hov ? 'white' : '#9ca3af'} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? '#1a73e8' : '#6b7280', transition: 'color 0.15s' }}>{label}</span>
    </div>
  )
}

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ c, isAdmin, isSuperAdmin, onView, onEdit, onPortal, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: `1px solid ${hov ? '#bfdbfe' : 'gainsboro'}`, borderRadius: '8px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'default', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: hov ? '0 4px 16px rgba(26,115,232,0.08)' : 'none' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1a73e8" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
          {c.businessName && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.businessName}</div>}
        </div>
        <StatusBadge status={c.status} />
      </div>

      {/* Contact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {c.phone && <div style={{ fontSize: '12.5px', color: '#374151' }}>{c.phone}</div>}
        {c.email && <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SubTypeBadge type={c.Subscriptions} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ActionBtn icon={IC.eye}  title="View Detail"   onClick={onView} />
          {isAdmin && <ActionBtn icon={IC.edit} title="Edit Customer" onClick={onEdit} />}
          {isAdmin && <ActionBtn icon={IC.key} title={c.portalAccess ? 'Manage Portal Access (Enabled)' : 'Enable Portal Access'} onClick={onPortal} active={c.portalAccess} />}
          {isSuperAdmin && <ActionBtn icon={IC.trash} title="Delete" onClick={onDelete} danger />}
        </div>
      </div>
    </div>
  )
}

// ── Small reusable action icon button ─────────────────────────────────────────
function ActionBtn({ icon, title, onClick, danger, active }) {
  const [hov, setHov] = useState(false)
  const accentColor = danger ? '#dc2626' : active ? '#16a34a' : '#1a73e8'
  const accentBg    = danger ? '#fef2f2' : active ? '#f0fdf4' : '#eff6ff'
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${(hov || active) ? accentColor : 'gainsboro'}`,
        borderRadius: '5px', cursor: 'pointer',
        background: (hov || active) ? accentBg : 'white',
        color: (hov || active) ? accentColor : '#6b7280',
        transition: 'all 0.12s', padding: 0,
      }}
    >
      <Ic d={icon} size={13} color="currentColor" />
    </button>
  )
}

// ── Pagination arrow button ───────────────────────────────────────────────────
function PagBtn({ disabled, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gainsboro', borderRadius: '5px', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#374151', fontFamily: 'inherit' }}>
      <Ic d={icon} size={13} color={disabled ? '#d1d5db' : '#374151'} />
    </button>
  )
}
