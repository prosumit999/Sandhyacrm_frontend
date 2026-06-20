import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toastSuccess, toastError } from '../../utils/toast'
import {
  getAllSoftwaresApi, createSoftwareApi, updateSoftwareApi, deleteSoftwareApi,
} from '../../api/softwareApi'
import { getAllUsersApi } from '../../api/userApi'
import { getAllTeamsApi } from '../../api/teamApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR  = n => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const daysLeft = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

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
  link:     'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
  server:   'M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6M4 13h16M4 13v4a2 2 0 002 2h12a2 2 0 002-2v-4',
  x:        'M18 6L6 18M6 6l12 12',
  spinner:  'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  warn:     'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
}

// ── Badge maps — all primary blue ─────────────────────────────────────────────
const PRIMARY_BADGE = { color: '#1a73e8', bg: '#eff6ff' }
const STATUS_CFG = { Live: PRIMARY_BADGE, Broken: PRIMARY_BADGE, Maintenance: PRIMARY_BADGE, Development: PRIMARY_BADGE, Paused: PRIMARY_BADGE }
const TYPE_CFG   = { Desktop: PRIMARY_BADGE, Mobile: PRIMARY_BADGE, Web: PRIMARY_BADGE, SAAS: PRIMARY_BADGE, API: PRIMARY_BADGE, PAAS: PRIMARY_BADGE }
const BUILT_CFG  = { Client: PRIMARY_BADGE, SAAS: PRIMARY_BADGE, Internal: PRIMARY_BADGE }

function Badge({ label, cfg }) {
  const { color, bg } = cfg || { color: '#6b7280', bg: '#f3f4f6' }
  return <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: bg, color, display: 'inline-block', whiteSpace: 'nowrap' }}>{label}</span>
}

// ── Infra expiry indicator ────────────────────────────────────────────────────
function InfraIndicator({ label, date }) {
  const d = daysLeft(date)
  if (d === null) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1a73e8', flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: '#1a73e8', background: '#eff6ff', padding: '1px 6px', borderRadius: '3px' }}>
        {d <= 0 ? 'Expired' : `${d}d`}
      </span>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ w = '80%', h = 12 }) => (
  <div style={{ height: h, width: w, borderRadius: 3, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ── Form helpers ──────────────────────────────────────────────────────────────
function Field({ label, required, span, children }) {
  return (
    <div style={span ? { gridColumn: `span ${span}` } : {}}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}
const inpStyle = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box', padding: '8px 11px',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
  color: '#111827', outline: 'none', fontFamily: 'inherit', background: 'white',
  transition: 'border-color 0.14s', ...extra,
})
const focusBorder = e => { e.target.style.borderColor = '#1a73e8' }
const blurBorder  = e => { e.target.style.borderColor = '#d1d5db' }

// ── Tech stack tag input ──────────────────────────────────────────────────────
function TechStackInput({ value = [], onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setInput('')
  }
  const remove = tag => onChange(value.filter(t => t !== tag))
  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          onFocus={focusBorder} onBlur={blurBorder}
          placeholder="e.g. React, Node.js (press Enter)"
          style={inpStyle({ flex: 1 })}
        />
        <button type="button" onClick={add}
          style={{ padding: '8px 12px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '12.5px', color: '#374151', cursor: 'pointer', background: 'white', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {value.map(tag => (
            <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 500, padding: '3px 8px', borderRadius: '4px', background: '#f3f4f6', color: '#374151', border: '1px solid gainsboro' }}>
              {tag}
              <button type="button" onClick={() => remove(tag)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex', lineHeight: 1 }}>
                <Ic d={IC.x} size={11} color="#9ca3af" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Confirm delete ────────────────────────────────────────────────────────────
function ConfirmDialog({ name, onConfirm, onCancel, loading, error }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '24px', width: '380px', maxWidth: '90vw' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Delete Software?</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>
          Permanently delete <strong style={{ color: '#111827' }}>{name}</strong>? This cannot be undone. Software with active subscriptions cannot be deleted.
        </div>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '14px' }}>{error}</div>}
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
//  ADD / EDIT DRAWER
// =============================================================================
const BLANK = {
  name: '', type: '', description: '', price: '', billingCycle: 'Yearly',
  status: 'Live', builtFor: 'Client', version: '',
  techStack: [],
  liveUrl: '', playStoreUrl: '', appStoreUrl: '', downloadUrl: '',
  hostingProvider: '', hostingExpiryDate: '', domainProvider: '',
  domainExpiryDate: '', sslExpiryDate: '',
  developer: '', managedBy: '', team: '',
}

function SoftwareDrawer({ mode, initial, onClose, onSaved, users, teams }) {
  const [form, setForm] = useState(() => {
    if (!initial) return BLANK
    return {
      ...BLANK, ...initial,
      developer:         initial.developer?._id || initial.developer || '',
      managedBy:         initial.managedBy?._id  || initial.managedBy  || '',
      team:              initial.team?._id        || initial.team        || '',
      price:             initial.price ?? '',
      hostingExpiryDate: initial.hostingExpiryDate ? initial.hostingExpiryDate.slice(0, 10) : '',
      domainExpiryDate:  initial.domainExpiryDate  ? initial.domainExpiryDate.slice(0, 10)  : '',
      sslExpiryDate:     initial.sslExpiryDate     ? initial.sslExpiryDate.slice(0, 10)     : '',
      techStack:         initial.techStack || [],
    }
  })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async e => {
    e.preventDefault()
    setErr('')
    if (!form.name.trim() || !form.type || !form.price || !form.developer) {
      setErr('Name, type, price, and developer are required.')
      return
    }
    setBusy(true)
    try {
      const payload = { ...form, price: Number(form.price) }
      if (!payload.hostingExpiryDate) delete payload.hostingExpiryDate
      if (!payload.domainExpiryDate)  delete payload.domainExpiryDate
      if (!payload.sslExpiryDate)     delete payload.sslExpiryDate
      if (!payload.managedBy)         delete payload.managedBy
      if (!payload.team)              delete payload.team
      if (mode === 'create') { await createSoftwareApi(payload) }
      else                   { await updateSoftwareApi(initial._id, payload) }
      onSaved()
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Something went wrong.')
    } finally { setBusy(false) }
  }

  const SectionLabel = ({ label }) => (
    <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '20px 0 12px' }}>{label}</div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 50 }}>
      <div style={{ width: '520px', maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>{mode === 'create' ? 'Add Software' : 'Edit Software'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {err && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '9px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '16px' }}>{err}</div>
          )}

          {/* ── Basic Info ── */}
          <SectionLabel label="Basic Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Software Name" required span={2}>
              <input value={form.name} onChange={e => set('name', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. Sandhya ERP" style={inpStyle()} />
            </Field>
            <Field label="Type" required>
              <select value={form.type} onChange={e => set('type', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                <option value="">Select type</option>
                {['Desktop', 'Mobile', 'Web', 'SAAS', 'API', 'PAAS'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                {['Live', 'Development', 'Maintenance', 'Paused', 'Broken'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Built For">
              <select value={form.builtFor} onChange={e => set('builtFor', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                {['Client', 'SAAS', 'Internal'].map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Version">
              <input value={form.version} onChange={e => set('version', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. v2.1.0" style={inpStyle()} />
            </Field>
            <Field label="Price (₹)" required>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="0" min="0" style={inpStyle()} />
            </Field>
            <Field label="Billing Cycle">
              <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                {['Monthly', 'Quarterly', 'HalfYearly', 'Yearly', 'OneTime'].map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Description" span={2}>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="Brief description of the software…" rows={3} style={inpStyle({ resize: 'vertical', lineHeight: 1.5 })} />
            </Field>
          </div>

          {/* ── Tech Stack ── */}
          <SectionLabel label="Technology Stack" />
          <TechStackInput value={form.techStack} onChange={v => set('techStack', v)} />

          {/* ── URLs ── */}
          <SectionLabel label="URLs" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Live / Web URL">
              <input value={form.liveUrl} onChange={e => set('liveUrl', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="https://app.example.com" style={inpStyle()} />
            </Field>
            <Field label="Download URL">
              <input value={form.downloadUrl} onChange={e => set('downloadUrl', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="https://…" style={inpStyle()} />
            </Field>
            <Field label="Play Store URL">
              <input value={form.playStoreUrl} onChange={e => set('playStoreUrl', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="https://play.google.com/…" style={inpStyle()} />
            </Field>
            <Field label="App Store URL">
              <input value={form.appStoreUrl} onChange={e => set('appStoreUrl', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="https://apps.apple.com/…" style={inpStyle()} />
            </Field>
          </div>

          {/* ── Infrastructure ── */}
          <SectionLabel label="Infrastructure" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Hosting Provider">
              <input value={form.hostingProvider} onChange={e => set('hostingProvider', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. AWS, DigitalOcean" style={inpStyle()} />
            </Field>
            <Field label="Hosting Expiry">
              <input type="date" value={form.hostingExpiryDate} onChange={e => set('hostingExpiryDate', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle()} />
            </Field>
            <Field label="Domain Provider">
              <input value={form.domainProvider} onChange={e => set('domainProvider', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} placeholder="e.g. GoDaddy, Namecheap" style={inpStyle()} />
            </Field>
            <Field label="Domain Expiry">
              <input type="date" value={form.domainExpiryDate} onChange={e => set('domainExpiryDate', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle()} />
            </Field>
            <Field label="SSL Expiry" span={2}>
              <input type="date" value={form.sslExpiryDate} onChange={e => set('sslExpiryDate', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle()} />
            </Field>
          </div>

          {/* ── Team ── */}
          <SectionLabel label="Team & Ownership" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Developer" required>
              <select value={form.developer} onChange={e => set('developer', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                <option value="">Select developer</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Managed By">
              <select value={form.managedBy} onChange={e => set('managedBy', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                <option value="">Select manager</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Assigned Team" span={2}>
              <select value={form.team} onChange={e => set('team', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} style={inpStyle({ background: 'white' })}>
                <option value="">No team assigned</option>
                {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              {teams.length === 0 && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>No teams found. Create teams in User Management → Teams.</div>}
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#93c5fd' : '#1a73e8', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#1557b0' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#1a73e8' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Saving…' : mode === 'create' ? 'Add Software' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  ACTION BUTTON
// =============================================================================
function ActionBtn({ icon, title, onClick, danger }) {
  const [hov, setHov] = useState(false)
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${hov ? (danger ? '#dc2626' : '#1a73e8') : 'gainsboro'}`, borderRadius: '5px', cursor: 'pointer', background: hov ? (danger ? '#fef2f2' : '#eff6ff') : 'white', color: hov ? (danger ? '#dc2626' : '#1a73e8') : '#6b7280', transition: 'all 0.12s', padding: 0 }}>
      <Ic d={icon} size={13} color="currentColor" />
    </button>
  )
}

function PagBtn({ disabled, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gainsboro', borderRadius: '5px', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#374151', fontFamily: 'inherit' }}>
      <Ic d={icon} size={13} color={disabled ? '#d1d5db' : '#374151'} />
    </button>
  )
}

// ── Plus card ─────────────────────────────────────────────────────────────────
function PlusCard({ label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#eff6ff' : 'white', border: `2px dashed ${hov ? '#1a73e8' : '#d1d5db'}`, borderRadius: '8px', padding: '18px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: '140px', gap: '10px', transition: 'all 0.15s' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: hov ? '#1a73e8' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        <Ic d={IC.plus} size={18} color={hov ? 'white' : '#9ca3af'} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? '#1a73e8' : '#9ca3af', transition: 'color 0.15s' }}>{label}</span>
    </div>
  )
}

// ── Software card ─────────────────────────────────────────────────────────────
function SoftwareCard({ sw, isAdmin, isSuperAdmin, onView, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '18px 20px', boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.07)' : 'none', transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{sw.name}</div>
          {sw.version && <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>v{sw.version}</div>}
        </div>
        <Badge label={sw.status} cfg={STATUS_CFG[sw.status]} />
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <Badge label={sw.type}     cfg={TYPE_CFG[sw.type]}   />
        <Badge label={sw.builtFor} cfg={BUILT_CFG[sw.builtFor]} />
      </div>

      {/* Description */}
      {sw.description && (
        <div style={{ fontSize: '12.5px', color: '#6b7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {sw.description}
        </div>
      )}

      {/* Price + Developer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{fmtINR(sw.price)}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{sw.billingCycle}</div>
        </div>
        {sw.developer?.name && (
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
            <div style={{ fontWeight: 500, color: '#374151' }}>{sw.developer.name}</div>
            <div>Developer</div>
          </div>
        )}
      </div>

      {/* Infra */}
      {(sw.hostingExpiryDate || sw.domainExpiryDate || sw.sslExpiryDate) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <InfraIndicator label="Host"   date={sw.hostingExpiryDate} />
          <InfraIndicator label="Domain" date={sw.domainExpiryDate} />
          <InfraIndicator label="SSL"    date={sw.sslExpiryDate} />
        </div>
      )}

      {/* Tech stack */}
      {sw.techStack?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {sw.techStack.slice(0, 4).map(t => (
            <span key={t} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '3px', background: '#f3f4f6', color: '#374151', border: '1px solid gainsboro' }}>{t}</span>
          ))}
          {sw.techStack.length > 4 && <span style={{ fontSize: '11px', color: '#9ca3af' }}>+{sw.techStack.length - 4}</span>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px', paddingTop: '4px', borderTop: '1px solid #f3f4f6' }}>
        <ActionBtn icon={IC.eye}   title="View Detail"   onClick={onView} />
        {isAdmin    && <ActionBtn icon={IC.edit}  title="Edit"         onClick={onEdit} />}
        {isSuperAdmin && <ActionBtn icon={IC.trash} title="Delete"     onClick={onDelete} color="#dc2626" bg="#fef2f2" />}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
export default function Softwares() {
  const { user }     = useSelector(s => s.auth)
  const navigate     = useNavigate()
  const isAdmin      = ['Admin', 'SuperAdmin'].includes(user?.role)
  const isSuperAdmin = user?.role === 'SuperAdmin'

  const [softwares,  setSoftwares]  = useState([])
  const [users,      setUsers]      = useState([])
  const [teams,      setTeams]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 })

  // Filters
  const [filterType,     setFilterType]     = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterBuiltFor, setFilterBuiltFor] = useState('')

  // Modal / drawer
  const [drawer,    setDrawer]    = useState(null)   // null | { mode, initial? }
  const [delTarget, setDelTarget] = useState(null)
  const [delBusy,   setDelBusy]   = useState(false)
  const [delError,  setDelError]  = useState('')

  const fetchSoftwares = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 20 }
      if (filterType)     params.type     = filterType
      if (filterStatus)   params.status   = filterStatus
      if (filterBuiltFor) params.builtFor = filterBuiltFor
      const res = await getAllSoftwaresApi(params)
      setSoftwares(res.data.data || [])
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 1 })
    } catch (_) { }
    finally { setLoading(false) }
  }, [filterType, filterStatus, filterBuiltFor])

  useEffect(() => {
    getAllUsersApi({ limit: 100 }).then(r => setUsers(r.data.data || [])).catch(() => {})
    getAllTeamsApi().then(r => setTeams(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => { fetchSoftwares(1) }, [fetchSoftwares])

  const handleSaved = () => {
    const isEdit = drawer?.mode === 'edit'
    setDrawer(null); fetchSoftwares(pagination.page)
    toastSuccess(isEdit ? 'Software updated' : 'Software added')
  }

  const handleDelete = async () => {
    setDelBusy(true); setDelError('')
    try {
      await deleteSoftwareApi(delTarget._id)
      setDelTarget(null)
      fetchSoftwares(pagination.page)
      toastSuccess('Software deleted')
    } catch (ex) {
      setDelError(ex.response?.data?.message || 'Failed to delete.')
      toastError(ex.response?.data?.message || 'Failed to delete software')
    } finally { setDelBusy(false) }
  }

  const openEdit = sw => setDrawer({
    mode: 'edit',
    initial: {
      ...sw,
      developer: sw.developer?._id || sw.developer || '',
      managedBy: sw.managedBy?._id  || sw.managedBy  || '',
      team:      sw.team?._id       || sw.team       || '',
      hostingExpiryDate: sw.hostingExpiryDate ? sw.hostingExpiryDate.slice(0, 10) : '',
      domainExpiryDate:  sw.domainExpiryDate  ? sw.domainExpiryDate.slice(0, 10)  : '',
      sslExpiryDate:     sw.sslExpiryDate     ? sw.sslExpiryDate.slice(0, 10)     : '',
    }
  })

  const hasFilters = filterType || filterStatus || filterBuiltFor
  const clearFilters = () => { setFilterType(''); setFilterStatus(''); setFilterBuiltFor('') }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Softwares</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>
            {loading ? 'Loading…' : `${pagination.total} software product${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'All Types',   value: filterType,     set: setFilterType,     opts: ['Desktop', 'Mobile', 'Web', 'SAAS', 'API', 'PAAS'] },
          { label: 'All Status',  value: filterStatus,   set: setFilterStatus,   opts: ['Live', 'Development', 'Maintenance', 'Paused', 'Broken'] },
          { label: 'All Targets', value: filterBuiltFor, set: setFilterBuiltFor, opts: ['Client', 'SAAS', 'Internal'] },
        ].map(({ label, value, set, opts }) => (
          <select key={label} value={value} onChange={e => set(e.target.value)}
            style={{ padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: value ? '#111827' : '#9ca3af', outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
            <option value="">{label}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {hasFilters && (
          <button onClick={clearFilters}
            style={{ padding: '8px 12px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '12.5px', color: '#6b7280', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '18px 20px', height: '150px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {isAdmin && <PlusCard label="Add Software" onClick={() => setDrawer({ mode: 'create' })} />}
          {softwares.length === 0 && !isAdmin ? (
            <div style={{ gridColumn: '1/-1', padding: '52px 0', textAlign: 'center', color: '#9ca3af' }}>
              {hasFilters ? 'No software matches the filters.' : 'No software found.'}
            </div>
          ) : softwares.map(sw => (
            <SoftwareCard key={sw._id} sw={sw} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin}
              onView={() => navigate(`/softwares/${sw._id}`)}
              onEdit={() => openEdit(sw)}
              onDelete={() => { setDelTarget(sw); setDelError('') }}
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
            <PagBtn disabled={pagination.page <= 1} onClick={() => fetchSoftwares(pagination.page - 1)} icon={IC.chevronL} />
            {[...Array(pagination.pages)].map((_, i) => {
              const pg = i + 1; const active = pg === pagination.page
              if (pagination.pages > 7 && Math.abs(pg - pagination.page) > 2 && pg !== 1 && pg !== pagination.pages) return null
              return (
                <button key={pg} onClick={() => fetchSoftwares(pg)}
                  style={{ width: 30, height: 30, border: `1px solid ${active ? '#1a73e8' : 'gainsboro'}`, borderRadius: '5px', fontSize: '12.5px', fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? '#eff6ff' : 'white', color: active ? '#1a73e8' : '#374151', fontFamily: 'inherit' }}>
                  {pg}
                </button>
              )
            })}
            <PagBtn disabled={pagination.page >= pagination.pages} onClick={() => fetchSoftwares(pagination.page + 1)} icon={IC.chevronR} />
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawer && (
        <SoftwareDrawer
          mode={drawer.mode}
          initial={drawer.initial}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
          users={users}
          teams={teams}
        />
      )}

      {/* Delete confirm */}
      {delTarget && (
        <ConfirmDialog
          name={delTarget.name}
          onConfirm={handleDelete}
          onCancel={() => { setDelTarget(null); setDelError('') }}
          loading={delBusy}
          error={delError}
        />
      )}

      <style>{`
        @keyframes sk   { from{opacity:1} to{opacity:0.45} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
