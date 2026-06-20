import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getCustomerByIdApi,
  updateCustomerApi,
  getCustomerSubscriptionsApi,
  getCustomerInvoicesApi,
} from '../../api/customerApi'
import { getAllTicketsApi } from '../../api/ticketApi'
import { getAllAlertsApi } from '../../api/alertApi'
import { enablePortalAccessApi } from '../../api/portalApi'
import { getAllUsersApi } from '../../api/userApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtRs = n => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const initials = n => n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  back:     'M19 12H5M12 5l-7 7 7 7',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  link:     'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  refer:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  key:      'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  check:    'M5 13l4 4L19 7',
  close:    'M18 6L6 18M6 6l12 12',
  alert:    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  ticket:   'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  invoice:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  renewal:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  note:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  save:     'M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  portal:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
}

// ── Badge helper ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Active:     { bg: '#f0fdf4', color: '#16a34a' },
  Expired:    { bg: '#fef2f2', color: '#dc2626' },
  Suspended:  { bg: '#fff7ed', color: '#d97706' },
  Lead:       { bg: '#eff6ff', color: '#1a73e8' },
  Paid:       { bg: '#f0fdf4', color: '#16a34a' },
  Pending:    { bg: '#fffbeb', color: '#d97706' },
  Overdue:    { bg: '#fef2f2', color: '#dc2626' },
  Cancelled:  { bg: '#f9fafb', color: '#6b7280' },
  Refunded:   { bg: '#f5f3ff', color: '#7c3aed' },
  Open:       { bg: '#eff6ff', color: '#1a73e8' },
  InProgress: { bg: '#fffbeb', color: '#d97706' },
  Resolved:   { bg: '#f0fdf4', color: '#16a34a' },
  Closed:     { bg: '#f9fafb', color: '#6b7280' },
  WaitingOnClient: { bg: '#fff7ed', color: '#ea580c' },
  Paused:     { bg: '#f9fafb', color: '#6b7280' },
  Waived:     { bg: '#f5f3ff', color: '#7c3aed' },
}
function Badge({ label }) {
  const c = STATUS_COLORS[label] || { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

const PRIORITY_COLORS = {
  Low:      { bg: '#f0fdf4', color: '#16a34a' },
  Medium:   { bg: '#fffbeb', color: '#d97706' },
  High:     { bg: '#fff7ed', color: '#ea580c' },
  Critical: { bg: '#fef2f2', color: '#dc2626' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 13, w = '80%', style = {} }) => (
  <div style={{ height: h, width: w, borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', ...style }} />
)

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, sub, color = '#1a73e8', loading }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ width: 38, height: 38, borderRadius: 9, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic d={icon} size={17} color={color} sw={2} />
      </div>
      <div>
        <div style={{ fontSize: 11.5, color: '#9ca3af', fontWeight: 500, marginBottom: 3 }}>{label}</div>
        {loading
          ? <Sk h={20} w={60} />
          : <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
        }
        {sub && <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Info row inside profile card ──────────────────────────────────────────────
function InfoRow({ icon, label, value, href }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <Ic d={icon} size={13} color="#6b7280" sw={2} />
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500 }}>{label}</div>
        {href
          ? <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1a73e8', textDecoration: 'none', fontWeight: 500 }}>{value}</a>
          : <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
        }
      </div>
    </div>
  )
}

// ── Table wrapper ─────────────────────────────────────────────────────────────
const TH = ({ children, right }) => (
  <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: right ? 'right' : 'left', whiteSpace: 'nowrap', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', userSelect: 'none' }}>
    {children}
  </th>
)
const TD = ({ children, right, muted, mono }) => (
  <td style={{ padding: '11px 14px', fontSize: 12.5, color: muted ? '#9ca3af' : '#374151', textAlign: right ? 'right' : 'left', fontFamily: mono ? 'monospace' : 'inherit', borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' }}>
    {children}
  </td>
)

// ── Empty table state ─────────────────────────────────────────────────────────
function EmptyState({ icon, message }) {
  return (
    <tr>
      <td colSpan={20} style={{ padding: '48px 20px', textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Ic d={icon} size={20} color="#9ca3af" sw={1.6} />
        </div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>{message}</div>
      </td>
    </tr>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ customer, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:         customer.name || '',
    email:        customer.email || '',
    phone:        customer.phone || '',
    whatsapp:     customer.whatsapp || '',
    businessName: customer.businessName || '',
    Appurl:       customer.Appurl || '',
    status:       customer.status || 'Active',
    Subscriptions: customer.Subscriptions || 'Web Application',
    serviceUser:  customer.serviceUser?._id || customer.serviceUser || '',
    referrredBy:  customer.referrredBy || '',
    notes:        customer.notes || '',
    'address.city':    customer.address?.city || '',
    'address.state':   customer.address?.state || '',
    'address.country': customer.address?.country || 'India',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.email || !form.phone || !form.serviceUser) {
      setErr('Name, email, phone and assigned user are required')
      return
    }
    setSaving(true); setErr('')
    try {
      const payload = {
        ...form,
        address: { city: form['address.city'], state: form['address.state'], country: form['address.country'] },
      }
      delete payload['address.city']; delete payload['address.state']; delete payload['address.country']
      const res = await updateCustomerApi(customer._id, payload)
      onSaved(res.data.data)
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const inp = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box', padding: '8px 11px',
    border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13,
    color: '#111827', outline: 'none', fontFamily: 'inherit', background: 'white', ...extra,
  })

  const F = ({ label, req, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
        {label}{req && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 640, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Edit Customer</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Ic d={IC.close} size={18} color="#9ca3af" />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <F label="Full Name" req>
            <input style={inp()} value={form.name} onChange={e => set('name', e.target.value)} />
          </F>
          <F label="Email" req>
            <input style={inp()} value={form.email} onChange={e => set('email', e.target.value)} type="email" />
          </F>
          <F label="Phone" req>
            <input style={inp()} value={form.phone} onChange={e => set('phone', e.target.value)} />
          </F>
          <F label="WhatsApp">
            <input style={inp()} value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} />
          </F>
          <F label="Business Name">
            <input style={inp()} value={form.businessName} onChange={e => set('businessName', e.target.value)} />
          </F>
          <F label="App / Website URL">
            <input style={inp()} value={form.Appurl} onChange={e => set('Appurl', e.target.value)} />
          </F>
          <F label="Status" req>
            <select style={inp()} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Active','Expired','Suspended','Lead'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
          <F label="Subscription Type" req>
            <select style={inp()} value={form.Subscriptions} onChange={e => set('Subscriptions', e.target.value)}>
              {['Desktop','Web Application','Mobile Application'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
          <F label="Assigned To" req>
            <select style={inp()} value={form.serviceUser} onChange={e => set('serviceUser', e.target.value)}>
              <option value="">— Select user —</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
            </select>
          </F>
          <F label="Referred By">
            <input style={inp()} value={form.referrredBy} onChange={e => set('referrredBy', e.target.value)} />
          </F>
          <F label="City">
            <input style={inp()} value={form['address.city']} onChange={e => set('address.city', e.target.value)} />
          </F>
          <F label="State">
            <input style={inp()} value={form['address.state']} onChange={e => set('address.state', e.target.value)} />
          </F>
          <div style={{ gridColumn: '1/-1' }}>
            <F label="Notes">
              <textarea style={{ ...inp(), resize: 'vertical', minHeight: 72 }} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </F>
          </div>
        </div>

        {err && <div style={{ marginTop: 14, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12.5, color: '#dc2626' }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ padding: '8px 22px', background: saving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Portal Access Modal ───────────────────────────────────────────────────────
function PortalModal({ customer, onClose, onSaved }) {
  const [enabled,  setEnabled]  = useState(customer.portalAccess || false)
  const [password, setPassword] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')

  const handleSave = async () => {
    if (enabled && !password && !customer.portalAccess) {
      setErr('Password is required to enable portal access')
      return
    }
    setSaving(true); setErr('')
    try {
      await enablePortalAccessApi(customer._id, { enabled, password: password || undefined })
      onSaved({ ...customer, portalAccess: enabled })
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update portal access')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Portal Access</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Ic d={IC.close} size={17} color="#9ca3af" />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f9fafb', borderRadius: 8, marginBottom: 16, border: '1px solid #e5e7eb' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Enable portal access</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Customer can log in at /portal</div>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: enabled ? '#1a73e8' : '#d1d5db', position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{ position: 'absolute', top: 2, left: enabled ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </button>
        </div>

        {enabled && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
              {customer.portalAccess ? 'New password (leave blank to keep current)' : 'Set password *'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={customer.portalAccess ? 'Leave blank to keep existing' : 'Min 6 characters'}
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
        )}

        {err && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, fontSize: 12.5, color: '#dc2626', border: '1px solid #fecaca' }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ padding: '8px 22px', background: saving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
export default function CustomerDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [customer,       setCustomer]       = useState(null)
  const [subscriptions,  setSubscriptions]  = useState([])
  const [invoices,       setInvoices]       = useState([])
  const [tickets,        setTickets]        = useState([])
  const [alerts,         setAlerts]         = useState([])
  const [users,          setUsers]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [tab,            setTab]            = useState('subscriptions')
  const [showEdit,       setShowEdit]       = useState(false)
  const [showPortal,     setShowPortal]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [cRes, sRes, iRes, tRes, aRes, uRes] = await Promise.allSettled([
        getCustomerByIdApi(id),
        getCustomerSubscriptionsApi(id),
        getCustomerInvoicesApi(id),
        getAllTicketsApi({ customer: id, limit: 50 }),
        getAllAlertsApi({ customer: id, limit: 50 }),
        isAdmin ? getAllUsersApi() : Promise.resolve(null),
      ])

      if (cRes.status === 'rejected') { setError('Customer not found'); setLoading(false); return }

      setCustomer(cRes.value.data.data)
      if (sRes.status === 'fulfilled') setSubscriptions(sRes.value.data.data || [])
      if (iRes.status === 'fulfilled') setInvoices(iRes.value.data.data || [])
      if (tRes.status === 'fulfilled') setTickets(tRes.value.data.data || [])
      if (aRes.status === 'fulfilled') setAlerts(aRes.value.data.data || [])
      if (uRes.status === 'fulfilled' && uRes.value) setUsers(uRes.value.data.data || [])
    } catch (e) { setError(e.response?.data?.message || 'Failed to load') }
    finally { setLoading(false) }
  }, [id, isAdmin])

  useEffect(() => { load() }, [load])

  // ── KPI derivations ──────────────────────────────────────────────────────────
  const totalRevenue   = invoices.filter(i => i.paymentStatus === 'Paid').reduce((s, i) => s + (i.totalAmount || 0), 0)
  const overduePending = invoices.filter(i => ['Overdue','Pending'].includes(i.paymentStatus)).reduce((s, i) => s + (i.totalAmount || 0), 0)
  const activeSubs     = subscriptions.filter(s => s.status === 'Active').length
  const openTickets    = tickets.filter(t => ['Open','InProgress'].includes(t.status)).length

  // ── Next renewal ─────────────────────────────────────────────────────────────
  const nextRenewal = subscriptions
    .filter(s => s.status === 'Active' && s.renewalDate && new Date(s.renewalDate) > new Date())
    .sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate))[0]

  // ── Days until renewal ───────────────────────────────────────────────────────
  const daysUntil = (d) => {
    if (!d) return null
    const diff = Math.ceil((new Date(d) - Date.now()) / 86400000)
    return diff
  }

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#dc2626', marginBottom: 12 }}>{error}</div>
      <button onClick={() => navigate('/customers')} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
        ← Back to customers
      </button>
    </div>
  )

  const c = customer

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`@keyframes sk { from{opacity:1} to{opacity:0.4} }`}</style>

      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => navigate('/customers')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
        >
          <Ic d={IC.back} size={13} color="currentColor" />
          Customers
        </button>
        <span style={{ color: '#d1d5db', fontSize: 13 }}>/</span>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
          {loading ? <Sk h={12} w={100} style={{ display: 'inline-block' }} /> : c?.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ════ LEFT — profile card ════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Profile */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {/* Colour header */}
            <div style={{ height: 68, background: 'linear-gradient(135deg, #1a73e8 0%, #1557b0 100%)' }} />
            <div style={{ padding: '0 18px 20px', marginTop: -30 }}>
              {/* Avatar */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: '#1a73e8', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, letterSpacing: '-1px',
                border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', marginBottom: 12,
              }}>
                {loading ? '??' : initials(c?.name)}
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Sk h={18} w="70%" />
                  <Sk h={13} w="55%" />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <h2 style={{ margin: '0 0 3px', fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>{c.name}</h2>
                      {c.businessName && <div style={{ fontSize: 12.5, color: '#6b7280' }}>{c.businessName}</div>}
                    </div>
                    <Badge label={c.status} />
                  </div>

                  <div style={{ margin: '12px 0', borderBottom: '1px solid #f3f4f6' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <InfoRow icon={IC.mail}     label="Email"        value={c.email}       href={`mailto:${c.email}`} />
                    <InfoRow icon={IC.phone}    label="Phone"        value={c.phone}       href={`tel:${c.phone}`} />
                    {c.whatsapp && <InfoRow icon={IC.whatsapp} label="WhatsApp" value={c.whatsapp} href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} />}
                    {c.Appurl && <InfoRow icon={IC.link} label="App URL" value={c.Appurl} href={c.Appurl.startsWith('http') ? c.Appurl : `https://${c.Appurl}`} />}
                    {(c.address?.city || c.address?.state) && (
                      <InfoRow icon={IC.location} label="Location"
                        value={[c.address.city, c.address.state, c.address.country].filter(Boolean).join(', ')}
                      />
                    )}
                    <InfoRow icon={IC.note}    label="Type"         value={c.Subscriptions} />
                    {c.serviceUser && (
                      <InfoRow icon={IC.user} label="Assigned to"
                        value={c.serviceUser.name || c.serviceUser.email}
                      />
                    )}
                    {c.referrredBy && <InfoRow icon={IC.refer} label="Referred by" value={c.referrredBy} />}
                  </div>

                  {c.notes && (
                    <>
                      <div style={{ margin: '12px 0 10px', borderBottom: '1px solid #f3f4f6' }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 5 }}>NOTES</div>
                      <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '8px 10px', borderRadius: 6, border: '1px solid #f3f4f6' }}>
                        {c.notes}
                      </div>
                    </>
                  )}

                  <div style={{ margin: '14px 0 0', borderBottom: '1px solid #f3f4f6' }} />
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Ic d={IC.portal} size={13} color="#6b7280" />
                        <span style={{ fontSize: 12.5, color: '#374151' }}>Portal access</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: c.portalAccess ? '#16a34a' : '#9ca3af' }}>
                          {c.portalAccess ? 'Enabled' : 'Disabled'}
                        </span>
                        {isAdmin && (
                          <button onClick={() => setShowPortal(true)} style={{ background: 'none', border: '1px solid gainsboro', borderRadius: 5, cursor: 'pointer', padding: '2px 8px', fontSize: 11, color: '#6b7280', fontFamily: 'inherit' }}>
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      Member since {fmt(c.createdAt)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Next renewal */}
          {!loading && nextRenewal && (
            <div style={{
              background: daysUntil(nextRenewal.renewalDate) <= 7 ? '#fef2f2' : daysUntil(nextRenewal.renewalDate) <= 30 ? '#fffbeb' : '#f0fdf4',
              border: `1px solid ${daysUntil(nextRenewal.renewalDate) <= 7 ? '#fecaca' : daysUntil(nextRenewal.renewalDate) <= 30 ? '#fde68a' : '#bbf7d0'}`,
              borderRadius: 8, padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>NEXT RENEWAL</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>{nextRenewal.softwares?.name || '—'}</div>
              <div style={{ fontSize: 12.5, color: '#374151', marginTop: 2 }}>{fmt(nextRenewal.renewalDate)}</div>
              <div style={{ fontSize: 11.5, marginTop: 4, fontWeight: 600, color: daysUntil(nextRenewal.renewalDate) <= 7 ? '#dc2626' : daysUntil(nextRenewal.renewalDate) <= 30 ? '#d97706' : '#16a34a' }}>
                {daysUntil(nextRenewal.renewalDate) <= 0 ? 'Overdue!' : `${daysUntil(nextRenewal.renewalDate)} days left`}
              </div>
              <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{fmtRs(nextRenewal.amountCharged)} · {nextRenewal.billingCycle}</div>
            </div>
          )}

          {/* Edit button */}
          {isAdmin && !loading && (
            <button
              onClick={() => setShowEdit(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '9px', background: 'white', border: '1px solid #d1d5db',
                borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                color: '#374151', fontFamily: 'inherit', transition: 'all 0.13s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.color = '#1a73e8' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
            >
              <Ic d={IC.edit} size={14} color="currentColor" /> Edit customer
            </button>
          )}
        </div>

        {/* ════ RIGHT — KPIs + tabs ════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPI row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <KPI icon={IC.invoice}  label="Total Paid"       value={fmtRs(totalRevenue)}   color="#16a34a" loading={loading} />
            <KPI icon={IC.renewal}  label="Active Subs"      value={activeSubs}             color="#1a73e8" loading={loading} />
            <KPI icon={IC.ticket}   label="Open Tickets"     value={openTickets}            color="#d97706" loading={loading} />
            <KPI icon={IC.alert}    label="Due / Overdue"    value={fmtRs(overduePending)}  color="#dc2626" loading={loading}
              sub={invoices.filter(i => ['Overdue','Pending'].includes(i.paymentStatus)).length > 0
                ? `${invoices.filter(i => ['Overdue','Pending'].includes(i.paymentStatus)).length} invoice${invoices.filter(i => ['Overdue','Pending'].includes(i.paymentStatus)).length > 1 ? 's' : ''}`
                : undefined}
            />
          </div>

          {/* Tabs */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', overflowX: 'auto' }}>
              {[
                { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.length, icon: IC.renewal },
                { id: 'invoices',      label: 'Invoices',      count: invoices.length,      icon: IC.invoice },
                { id: 'tickets',       label: 'Tickets',       count: tickets.length,       icon: IC.ticket },
                { id: 'alerts',        label: 'Alerts',        count: alerts.length,        icon: IC.alert },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '11px 16px', border: 'none', cursor: 'pointer',
                    background: tab === t.id ? 'white' : 'transparent',
                    borderBottom: tab === t.id ? '2px solid #1a73e8' : '2px solid transparent',
                    color: tab === t.id ? '#1a73e8' : '#6b7280',
                    fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                    fontFamily: 'inherit', whiteSpace: 'nowrap',
                    transition: 'all 0.13s',
                  }}
                >
                  <Ic d={t.icon} size={13} color="currentColor" sw={2} />
                  {t.label}
                  {!loading && t.count > 0 && (
                    <span style={{ background: tab === t.id ? '#eff6ff' : '#f3f4f6', color: tab === t.id ? '#1a73e8' : '#9ca3af', fontSize: 10.5, fontWeight: 700, borderRadius: 10, padding: '1px 6px' }}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Subscriptions tab ── */}
            {tab === 'subscriptions' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TH>Software</TH>
                      <TH>Billing</TH>
                      <TH>Status</TH>
                      <TH>Payment</TH>
                      <TH>Buy Date</TH>
                      <TH>Renewal</TH>
                      <TH right>Amount</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(3)].map((_, i) => (
                          <tr key={i}>
                            {[...Array(7)].map((__, j) => <TD key={j}><Sk /></TD>)}
                          </tr>
                        ))
                      : subscriptions.length === 0
                        ? <EmptyState icon={IC.renewal} message="No subscriptions found for this customer" />
                        : subscriptions.map(s => {
                            const days = daysUntil(s.renewalDate)
                            const renewColor = days != null && days <= 7 ? '#dc2626' : days != null && days <= 30 ? '#d97706' : '#374151'
                            return (
                              <tr key={s._id}>
                                <TD>
                                  <div style={{ fontWeight: 600, color: '#111827' }}>{s.softwares?.name || '—'}</div>
                                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.softwares?.type || ''}</div>
                                </TD>
                                <TD><Badge label={s.billingCycle} /></TD>
                                <TD><Badge label={s.status} /></TD>
                                <TD><Badge label={s.paymentStatus} /></TD>
                                <TD muted>{fmt(s.buyDate)}</TD>
                                <TD>
                                  <span style={{ color: renewColor, fontWeight: days != null && days <= 30 ? 600 : 400 }}>
                                    {fmt(s.renewalDate)}
                                  </span>
                                  {days != null && days <= 30 && days > 0 && (
                                    <div style={{ fontSize: 10.5, color: renewColor }}>{days}d left</div>
                                  )}
                                </TD>
                                <TD right><span style={{ fontWeight: 600 }}>{fmtRs(s.amountCharged)}</span></TD>
                              </tr>
                            )
                          })
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Invoices tab ── */}
            {tab === 'invoices' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TH>Invoice #</TH>
                      <TH>Software</TH>
                      <TH>Type</TH>
                      <TH>Period</TH>
                      <TH>Status</TH>
                      <TH>Method</TH>
                      <TH>Paid On</TH>
                      <TH right>Amount</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(4)].map((_, i) => (
                          <tr key={i}>{[...Array(8)].map((__, j) => <TD key={j}><Sk /></TD>)}</tr>
                        ))
                      : invoices.length === 0
                        ? <EmptyState icon={IC.invoice} message="No invoices found for this customer" />
                        : invoices.map(inv => (
                            <tr key={inv._id}>
                              <TD mono>
                                <span style={{ fontWeight: 600, color: '#111827' }}>{inv.invoiceNumber}</span>
                              </TD>
                              <TD>{inv.software?.name || '—'}</TD>
                              <TD><Badge label={inv.invoiceType} /></TD>
                              <TD muted>
                                {inv.periodFrom && inv.periodTo
                                  ? `${fmt(inv.periodFrom)} – ${fmt(inv.periodTo)}`
                                  : '—'}
                              </TD>
                              <TD><Badge label={inv.paymentStatus} /></TD>
                              <TD muted>{inv.paymentMethod || '—'}</TD>
                              <TD muted>{inv.paymentDate ? fmt(inv.paymentDate) : '—'}</TD>
                              <TD right>
                                <div style={{ fontWeight: 600, color: '#111827' }}>{fmtRs(inv.totalAmount)}</div>
                                {inv.discount > 0 && <div style={{ fontSize: 11, color: '#9ca3af' }}>-{fmtRs(inv.discount)} disc.</div>}
                              </TD>
                            </tr>
                          ))
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Tickets tab ── */}
            {tab === 'tickets' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TH>Ticket #</TH>
                      <TH>Title</TH>
                      <TH>Type</TH>
                      <TH>Priority</TH>
                      <TH>Status</TH>
                      <TH>Assigned</TH>
                      <TH>Opened</TH>
                      <TH>Resolved</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(3)].map((_, i) => (
                          <tr key={i}>{[...Array(8)].map((__, j) => <TD key={j}><Sk /></TD>)}</tr>
                        ))
                      : tickets.length === 0
                        ? <EmptyState icon={IC.ticket} message="No support tickets for this customer" />
                        : tickets.map(t => {
                            const pc = PRIORITY_COLORS[t.priority] || {}
                            return (
                              <tr key={t._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t._id}`)}>
                                <TD mono>
                                  <span style={{ fontWeight: 600, color: '#1a73e8' }}>{t.ticketNumber}</span>
                                </TD>
                                <TD>
                                  <div style={{ fontWeight: 500, color: '#111827', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                                </TD>
                                <TD muted>{t.type}</TD>
                                <TD>
                                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: pc.bg, color: pc.color }}>
                                    {t.priority}
                                  </span>
                                </TD>
                                <TD><Badge label={t.status} /></TD>
                                <TD muted>{t.assignedTo?.name || '—'}</TD>
                                <TD muted>{fmt(t.createdAt)}</TD>
                                <TD muted>{t.resolvedAt ? fmt(t.resolvedAt) : '—'}</TD>
                              </tr>
                            )
                          })
                    }
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Alerts tab ── */}
            {tab === 'alerts' && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <TH>Title</TH>
                      <TH>Type</TH>
                      <TH>Severity</TH>
                      <TH>Status</TH>
                      <TH>Due Date</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? [...Array(3)].map((_, i) => (
                          <tr key={i}>{[...Array(5)].map((__, j) => <TD key={j}><Sk /></TD>)}</tr>
                        ))
                      : alerts.length === 0
                        ? <EmptyState icon={IC.alert} message="No alerts for this customer" />
                        : alerts.map(a => {
                            const SEVER = {
                              Critical: { bg: '#fef2f2', color: '#dc2626' },
                              High:     { bg: '#fff7ed', color: '#ea580c' },
                              Medium:   { bg: '#fffbeb', color: '#d97706' },
                              Low:      { bg: '#f0fdf4', color: '#16a34a' },
                            }
                            const sc = SEVER[a.severity] || {}
                            const days = daysUntil(a.dueDate)
                            return (
                              <tr key={a._id}>
                                <TD>
                                  <div style={{ fontWeight: 500, color: '#111827' }}>{a.title}</div>
                                  {a.subType && <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.subType}</div>}
                                </TD>
                                <TD muted>{a.type}</TD>
                                <TD>
                                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: sc.bg, color: sc.color }}>
                                    {a.severity}
                                  </span>
                                </TD>
                                <TD><Badge label={a.status} /></TD>
                                <TD>
                                  <span style={{ color: days != null && days <= 7 ? '#dc2626' : '#374151', fontWeight: days != null && days <= 7 ? 600 : 400 }}>
                                    {fmt(a.dueDate)}
                                  </span>
                                  {days != null && days <= 14 && days > 0 && (
                                    <div style={{ fontSize: 10.5, color: '#d97706' }}>{days}d left</div>
                                  )}
                                </TD>
                              </tr>
                            )
                          })
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showEdit && (
        <EditModal
          customer={c}
          users={users}
          onClose={() => setShowEdit(false)}
          onSaved={updated => setCustomer(updated)}
        />
      )}
      {showPortal && (
        <PortalModal
          customer={c}
          onClose={() => setShowPortal(false)}
          onSaved={updated => setCustomer(prev => ({ ...prev, ...updated }))}
        />
      )}
    </div>
  )
}
