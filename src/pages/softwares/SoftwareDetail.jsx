import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getSoftwareByIdApi,
  updateSoftwareApi,
  deleteSoftwareApi,
  getSoftwareCustomersApi,
} from '../../api/softwareApi'
import axiosInstance from '../../api/axios'

// ─── constants ────────────────────────────────────────────────────────────────
const SW_TYPES      = ['Desktop', 'Mobile', 'Web', 'SAAS', 'API', 'PAAS']
const SW_STATUSES   = ['Live', 'Broken', 'Maintenance', 'Development', 'Paused']
const BILLING       = ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly', 'OneTime']
const BUILT_FOR     = ['Client', 'SAAS', 'Internal']

// ─── formatters ───────────────────────────────────────────────────────────────
const fmtINR  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
function daysDiff(d) {
  if (!d) return null
  return Math.ceil((new Date(d) - new Date()) / 86400000)
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

// ─── badges ───────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = {
    Live:        { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    Broken:      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    Maintenance: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    Development: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Paused:      { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  }
  const s = m[status] || m.Paused
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{status}</span>
}
function TypeBadge({ type }) {
  return <span style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{type}</span>
}
function BuiltForBadge({ val }) {
  const m = {
    Client:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    SAAS:     { bg: '#fdf4ff', color: '#86198f', border: '#f0abfc' },
    Internal: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
  }
  const s = m[val] || m.Internal
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{val}</span>
}
function PaymentBadge({ status }) {
  const m = {
    Paid:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    Pending: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    Overdue: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    Waived:  { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  }
  const s = m[status] || m.Pending
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>{status}</span>
}

// ─── infra expiry indicator ────────────────────────────────────────────────────
function ExpiryRow({ label, provider, date }) {
  const d = daysDiff(date)
  const dotColor = d === null ? '#d1d5db' : d <= 7 ? '#dc2626' : d <= 30 ? '#f59e0b' : '#16a34a'
  const tagBg    = d === null ? null : d <= 7 ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
                                      : d <= 30 ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a' }
                                      : { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</div>
        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{provider || <span style={{ color: '#d1d5db' }}>No provider set</span>}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {date ? (
          <>
            <div style={{ fontSize: 12, color: '#374151' }}>{fmtDate(date)}</div>
            {tagBg && (
              <span style={{ background: tagBg.bg, color: tagBg.color, border: `1px solid ${tagBg.border}`, borderRadius: 3, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>
                {d <= 0 ? 'Expired' : `${d}d`}
              </span>
            )}
          </>
        ) : (
          <span style={{ fontSize: 11, color: '#d1d5db' }}>No date</span>
        )}
      </div>
    </div>
  )
}

// ─── card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, children, action }) {
  return (
    <div style={{ border: '1px solid gainsboro', borderRadius: 8, background: 'white', overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '11px 16px', borderBottom: '1px solid gainsboro', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
          {action}
        </div>
      )}
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

function InfoLine({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: 140, fontSize: 12, fontWeight: 600, color: '#6b7280', flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', flex: 1 }}>{children}</span>
    </div>
  )
}

// ─── skeleton ─────────────────────────────────────────────────────────────────
const skAnim = `@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`
function Sk({ w = '100%', h = 14 }) {
  return <div style={{ width: w, height: h, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite' }} />
}

// ─── form helpers ─────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  )
}
function FInput({ style, ...props }) {
  const [f, setF] = useState(false)
  return (
    <input {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', ...style }}
    />
  )
}
function FSelect({ children, style, ...props }) {
  const [f, setF] = useState(false)
  return (
    <select {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', ...style }}
    >
      {children}
    </select>
  )
}
function FTextarea({ style, ...props }) {
  const [f, setF] = useState(false)
  return (
    <textarea {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', resize: 'vertical', ...style }}
    />
  )
}
function FRow({ children, cols = 1 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 12 }}>{children}</div>
}
function SHdr({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 0 8px', borderBottom: '1px solid gainsboro', marginBottom: 12 }}>{children}</div>
}

// ─── tech stack input ──────────────────────────────────────────────────────────
function TechStackInput({ value, onChange }) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !value.includes(v)) onChange([...value, v])
    setInput('')
  }
  const remove = (t) => onChange(value.filter(x => x !== t))
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <FInput value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="e.g. React, Node.js, MongoDB" style={{ flex: 1 }} />
        <button type="button" onClick={add}
          style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '0 14px', fontSize: 13, cursor: 'pointer', color: '#374151', whiteSpace: 'nowrap' }}>
          Add
        </button>
      </div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {value.map(t => (
            <span key={t} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              {t}
              <button type="button" onClick={() => remove(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── url link ─────────────────────────────────────────────────────────────────
function UrlLink({ label, url, icon }) {
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1px solid gainsboro', borderRadius: 7, textDecoration: 'none', color: '#111827', background: 'white' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.background = '#f8fbff' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'gainsboro'; e.currentTarget.style.background = 'white' }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#1a73e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</div>
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
    </a>
  )
}

function DocBlock({ label, children, mono }) {
  if (!children) return null
  return (
    <div style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 7, background: '#f9fafb' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-wrap', fontFamily: mono ? 'monospace' : 'inherit' }}>{children}</div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// =============================================================================
export default function SoftwareDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useSelector(s => s.auth)
  const isAdmin    = ['Admin', 'SuperAdmin'].includes(user?.role)
  const isSuperAdmin = user?.role === 'SuperAdmin'

  const [sw,           setSw]           = useState(null)
  const [customers,    setCustomers]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [custLoading,  setCustLoading]  = useState(true)
  const [notFound,     setNotFound]     = useState(false)

  // edit drawer
  const [drawerOpen,  setDrawerOpen]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [drawerErr,   setDrawerErr]   = useState('')
  const [teamUsers,   setTeamUsers]   = useState([])

  const emptyForm = {
    name: '', type: 'Web', description: '', price: '', billingCycle: 'Yearly',
    version: '', status: 'Live', builtFor: 'Client', techStack: [],
    documentationUrl: '', setupCommand: '', envNotes: '', deploymentNotes: '',
    credentialVaultUrl: '', hostingLoginRef: '', domainLoginRef: '', cloudConsoleRef: '', credentialNotes: '',
    liveUrl: '', playStoreUrl: '', appStoreUrl: '', downloadUrl: '', githubRepoUrl: '',
    hostingProvider: '', hostingExpiryDate: '',
    domainProvider: '', domainExpiryDate: '',
    sslExpiryDate: '', developer: '', managedBy: '',
  }
  const [form, setForm] = useState(emptyForm)

  // delete modal
  const [deleteOpen,    setDeleteOpen]    = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteErr,     setDeleteErr]     = useState('')

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    getSoftwareByIdApi(id)
      .then(res => {
        const data = res.data?.data || res.data
        setSw(data)
        setForm({
          name:              data.name              || '',
          type:              data.type              || 'Web',
          description:       data.description       || '',
          price:             data.price             ?? '',
          billingCycle:      data.billingCycle      || 'Yearly',
          version:           data.version           || '',
          status:            data.status            || 'Live',
          builtFor:          data.builtFor          || 'Client',
          techStack:         data.techStack         || [],
          documentationUrl:  data.documentationUrl  || '',
          setupCommand:      data.setupCommand      || '',
          envNotes:          data.envNotes          || '',
          deploymentNotes:   data.deploymentNotes   || '',
          credentialVaultUrl:data.credentialVaultUrl|| '',
          hostingLoginRef:   data.hostingLoginRef   || '',
          domainLoginRef:    data.domainLoginRef    || '',
          cloudConsoleRef:   data.cloudConsoleRef   || '',
          credentialNotes:   data.credentialNotes   || '',
          liveUrl:           data.liveUrl           || '',
          playStoreUrl:      data.playStoreUrl      || '',
          appStoreUrl:       data.appStoreUrl       || '',
          downloadUrl:       data.downloadUrl       || '',
          githubRepoUrl:     data.githubRepoUrl     || '',
          hostingProvider:   data.hostingProvider   || '',
          hostingExpiryDate: data.hostingExpiryDate ? data.hostingExpiryDate.slice(0, 10) : '',
          domainProvider:    data.domainProvider    || '',
          domainExpiryDate:  data.domainExpiryDate  ? data.domainExpiryDate.slice(0, 10) : '',
          sslExpiryDate:     data.sslExpiryDate     ? data.sslExpiryDate.slice(0, 10) : '',
          developer:         data.developer?._id    || data.developer || '',
          managedBy:         data.managedBy?._id    || data.managedBy || '',
        })
      })
      .catch(err => {
        if (err?.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))

    setCustLoading(true)
    getSoftwareCustomersApi(id)
      .then(res => setCustomers(res.data?.data || []))
      .catch(() => setCustomers([]))
      .finally(() => setCustLoading(false))
  }, [id])

  const openEdit = () => {
    setDrawerErr('')
    setDrawerOpen(true)
    axiosInstance.get('/users', { params: { limit: 100 } })
      .then(res => setTeamUsers(res.data?.data || []))
      .catch(() => {})
  }

  const handleSave = async () => {
    if (!form.name.trim())  { setDrawerErr('Name is required.'); return }
    if (!form.type)         { setDrawerErr('Type is required.'); return }
    if (!form.price)        { setDrawerErr('Price is required.'); return }
    if (!form.developer)    { setDrawerErr('Developer is required.'); return }
    setSaving(true); setDrawerErr('')
    try {
      const body = {
        ...form,
        price: Number(form.price),
        techStack: form.techStack,
        hostingExpiryDate: form.hostingExpiryDate || undefined,
        domainExpiryDate:  form.domainExpiryDate  || undefined,
        sslExpiryDate:     form.sslExpiryDate     || undefined,
        managedBy:         form.managedBy         || undefined,
      }
      const res = await updateSoftwareApi(id, body)
      setSw(res.data?.data || res.data)
      setDrawerOpen(false)
    } catch (err) {
      setDrawerErr(err?.response?.data?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleteLoading(true); setDeleteErr('')
    try {
      await deleteSoftwareApi(id)
      navigate('/softwares')
    } catch (err) {
      setDeleteErr(err?.response?.data?.message || 'Failed to delete.')
      setDeleteLoading(false)
    }
  }

  // ── loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <style>{skAnim}</style>
        <div style={{ marginBottom: 20 }}><Sk w={120} h={13} /></div>
        <div style={{ marginBottom: 20 }}>
          <Sk w={260} h={26} /><div style={{ height: 8 }} /><Sk w={180} h={13} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2].map(i => <div key={i} style={{ border: '1px solid gainsboro', borderRadius: 8, padding: 16 }}><Sk h={100} /></div>)}
          </div>
          <div style={{ border: '1px solid gainsboro', borderRadius: 8, padding: 16 }}><Sk h={180} /></div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 8, padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Software Not Found</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>This software record doesn't exist or was deleted.</div>
          <button onClick={() => navigate('/softwares')} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            ← Back to Softwares
          </button>
        </div>
      </div>
    )
  }

  const hasUrls = sw?.liveUrl || sw?.playStoreUrl || sw?.appStoreUrl || sw?.downloadUrl || sw?.githubRepoUrl

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <style>{skAnim}</style>

      {/* ── breadcrumb ── */}
      <button onClick={() => navigate('/softwares')}
        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 13, cursor: 'pointer', padding: '0 0 14px', display: 'flex', alignItems: 'center', gap: 4 }}
        onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'}
        onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
      >
        ← Softwares
      </button>

      {/* ── page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>{sw?.name}</h1>
            {sw?.version && <span style={{ fontSize: 13, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 4, padding: '2px 8px', fontFamily: 'monospace' }}>{sw.version}</span>}
            <TypeBadge type={sw?.type} />
            <BuiltForBadge val={sw?.builtFor} />
            <StatusBadge status={sw?.status} />
          </div>
          {sw?.description && <p style={{ margin: 0, fontSize: 13, color: '#6b7280', maxWidth: 600 }}>{sw.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {isAdmin && (
            <button onClick={openEdit}
              style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 16px', fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
              Edit Software
            </button>
          )}
          {isSuperAdmin && (
            <button onClick={() => setDeleteOpen(true)}
              style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 6, padding: '8px 16px', fontSize: 13, color: '#dc2626', cursor: 'pointer', fontWeight: 500 }}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* ── main 2-col grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 14 }}>

        {/* left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Overview */}
          <Card title="Overview">
            <InfoLine label="Price">
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{fmtINR(sw?.price)}</span>
              <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 6 }}>/ {sw?.billingCycle}</span>
            </InfoLine>
            <InfoLine label="Type"><TypeBadge type={sw?.type} /></InfoLine>
            <InfoLine label="Built For"><BuiltForBadge val={sw?.builtFor} /></InfoLine>
            <InfoLine label="Status"><StatusBadge status={sw?.status} /></InfoLine>
            {sw?.version && <InfoLine label="Version"><span style={{ fontFamily: 'monospace', fontSize: 13, color: '#374151' }}>{sw.version}</span></InfoLine>}
            <InfoLine label="Added On">{fmtDate(sw?.createdAt)}</InfoLine>
            <InfoLine label="Last Updated">{fmtDate(sw?.updatedAt)}</InfoLine>
          </Card>

          {/* Tech Stack */}
          <Card title="Tech Stack">
            {sw?.techStack?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {sw.techStack.map(t => (
                  <span key={t} style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 4, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: '#d1d5db' }}>No tech stack defined.</span>
            )}
          </Card>

          {(sw?.documentationUrl || sw?.setupCommand || sw?.envNotes || sw?.deploymentNotes) && (
            <Card title="Documentation">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <UrlLink label="Documentation URL" url={sw?.documentationUrl} icon="Doc" />
                <DocBlock label="Setup Command" mono>{sw?.setupCommand}</DocBlock>
                <DocBlock label="Environment Notes">{sw?.envNotes}</DocBlock>
                <DocBlock label="Deployment Notes">{sw?.deploymentNotes}</DocBlock>
              </div>
            </Card>
          )}

          {(sw?.credentialVaultUrl || sw?.hostingLoginRef || sw?.domainLoginRef || sw?.cloudConsoleRef || sw?.credentialNotes) && (
            <Card title="Access References">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <UrlLink label="Credential Vault" url={sw?.credentialVaultUrl} icon="Vault" />
                <DocBlock label="Hosting Login Ref">{sw?.hostingLoginRef}</DocBlock>
                <DocBlock label="Domain Login Ref">{sw?.domainLoginRef}</DocBlock>
                <DocBlock label="Cloud Console Ref">{sw?.cloudConsoleRef}</DocBlock>
                <DocBlock label="Credential Notes">{sw?.credentialNotes}</DocBlock>
              </div>
            </Card>
          )}

          {/* Team */}
          <Card title="Team">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ label: 'Developer', user: sw?.developer }, { label: 'Managed By', user: sw?.managedBy }].map(({ label, user: u }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid gainsboro', borderRadius: 7 }}>
                  {u ? (
                    <>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      <div style={{ fontSize: 13, color: '#d1d5db' }}>Not assigned</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* right column — infrastructure */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card title="Infrastructure">
            <ExpiryRow label="Hosting"  provider={sw?.hostingProvider} date={sw?.hostingExpiryDate} />
            <ExpiryRow label="Domain"   provider={sw?.domainProvider}  date={sw?.domainExpiryDate} />
            <ExpiryRow label="SSL Cert" provider={null}                date={sw?.sslExpiryDate} />
            <div style={{ marginTop: 12, padding: '8px 10px', background: '#f9fafb', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> Green — more than 30 days</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} /> Amber — within 30 days</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} /> Red — within 7 days</div>
            </div>
          </Card>

          {/* quick stats */}
          <Card title="Subscribers">
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{custLoading ? '—' : customers.length}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Active subscribers</div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── URLs ── */}
      {hasUrls && (
        <div style={{ border: '1px solid gainsboro', borderRadius: 8, background: 'white', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '11px 16px', borderBottom: '1px solid gainsboro', background: '#f9fafb' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>URLs & Links</span>
          </div>
          <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            <UrlLink label="Live / Web URL"      url={sw?.liveUrl}      icon="🌐" />
            <UrlLink label="GitHub Repository"   url={sw?.githubRepoUrl} icon="{}" />
            <UrlLink label="Play Store"          url={sw?.playStoreUrl} icon="▶" />
            <UrlLink label="App Store"           url={sw?.appStoreUrl}  icon="" />
            <UrlLink label="Download"            url={sw?.downloadUrl}  icon="⬇" />
          </div>
        </div>
      )}

      {/* ── active subscribers table ── */}
      <div style={{ border: '1px solid gainsboro', borderRadius: 8, background: 'white', overflow: 'hidden' }}>
        <div style={{ padding: '11px 16px', borderBottom: '1px solid gainsboro', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Subscribers</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{custLoading ? '…' : `${customers.length} customer${customers.length !== 1 ? 's' : ''}`}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>
              {['Customer', 'Business', 'Phone', 'Email', 'Renewal Date', 'Payment'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {custLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {[140, 120, 100, 160, 100, 70].map((w, j) => (
                    <td key={j} style={{ padding: '10px 14px', borderBottom: '1px solid gainsboro' }}>
                      <div style={{ width: w, height: 12, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                  No active subscribers for this software.
                </td>
              </tr>
            ) : (
              customers.map((c, i) => {
                const d = c.renewalDate ? daysDiff(c.renewalDate) : null
                const tagStyle = d === null ? null
                  : d <= 0  ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: 'Overdue' }
                  : d <= 7  ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: `${d}d` }
                  : d <= 30 ? { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: `${d}d` }
                  : { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: `${d}d` }
                return (
                  <tr key={c._id || i} style={{ borderBottom: '1px solid gainsboro' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {initials(c.name)}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{c.businessName || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{c.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: '#374151' }}>{fmtDate(c.renewalDate)}</div>
                      {tagStyle && <span style={{ background: tagStyle.bg, color: tagStyle.color, border: `1px solid ${tagStyle.border}`, borderRadius: 3, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>{tagStyle.label}</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}><PaymentBadge status={c.paymentStatus} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 400, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Delete Software?</h3>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#374151' }}>You are about to delete <strong>{sw?.name}</strong>.</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>This cannot be undone. Software with active subscriptions cannot be deleted.</p>
            {deleteErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{deleteErr}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setDeleteOpen(false); setDeleteErr('') }} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}>
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT DRAWER
      ══════════════════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>

            <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Edit Software</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{sw?.name}</div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <SHdr>Basic Info</SHdr>
              <FRow cols={2}>
                <div><Label required>Name</Label><FInput value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                <div><Label>Version</Label><FInput value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} placeholder="e.g. v2.1.0" /></div>
              </FRow>
              <FRow cols={2}>
                <div>
                  <Label required>Type</Label>
                  <FSelect value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {SW_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </FSelect>
                </div>
                <div>
                  <Label required>Status</Label>
                  <FSelect value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {SW_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </FSelect>
                </div>
              </FRow>
              <FRow cols={2}>
                <div>
                  <Label required>Price (INR)</Label>
                  <FInput type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
                </div>
                <div>
                  <Label>Billing Cycle</Label>
                  <FSelect value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}>
                    {BILLING.map(b => <option key={b} value={b}>{b}</option>)}
                  </FSelect>
                </div>
              </FRow>
              <FRow>
                <div>
                  <Label>Built For</Label>
                  <FSelect value={form.builtFor} onChange={e => setForm(f => ({ ...f, builtFor: e.target.value }))}>
                    {BUILT_FOR.map(b => <option key={b} value={b}>{b}</option>)}
                  </FSelect>
                </div>
              </FRow>
              <FRow>
                <div>
                  <Label>Description</Label>
                  <FTextarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
                </div>
              </FRow>

              <SHdr>Tech Stack</SHdr>
              <FRow>
                <div>
                  <Label>Technologies</Label>
                  <TechStackInput value={form.techStack} onChange={v => setForm(f => ({ ...f, techStack: v }))} />
                </div>
              </FRow>

              <SHdr>Documentation</SHdr>
              <FRow>
                <div><Label>Documentation URL</Label><FInput value={form.documentationUrl} onChange={e => setForm(f => ({ ...f, documentationUrl: e.target.value }))} placeholder="https://docs.example.com/project" /></div>
              </FRow>
              <FRow>
                <div><Label>Setup Command</Label><FInput value={form.setupCommand} onChange={e => setForm(f => ({ ...f, setupCommand: e.target.value }))} placeholder="npm install && npm run dev" style={{ fontFamily: 'monospace' }} /></div>
              </FRow>
              <FRow>
                <div><Label>Environment Notes</Label><FTextarea rows={3} value={form.envNotes} onChange={e => setForm(f => ({ ...f, envNotes: e.target.value }))} placeholder="Required env keys, service accounts, local setup notes…" /></div>
              </FRow>
              <FRow>
                <div><Label>Deployment Notes</Label><FTextarea rows={3} value={form.deploymentNotes} onChange={e => setForm(f => ({ ...f, deploymentNotes: e.target.value }))} placeholder="Build command, deploy platform, branch, rollback notes…" /></div>
              </FRow>

              <SHdr>Access References</SHdr>
              <FRow>
                <div><Label>Credential Vault URL</Label><FInput value={form.credentialVaultUrl} onChange={e => setForm(f => ({ ...f, credentialVaultUrl: e.target.value }))} placeholder="https://vault.example.com/item/software" /></div>
              </FRow>
              <FRow cols={2}>
                <div><Label>Hosting Login Ref</Label><FInput value={form.hostingLoginRef} onChange={e => setForm(f => ({ ...f, hostingLoginRef: e.target.value }))} placeholder="Vault item or account name" /></div>
                <div><Label>Domain Login Ref</Label><FInput value={form.domainLoginRef} onChange={e => setForm(f => ({ ...f, domainLoginRef: e.target.value }))} placeholder="Registrar account reference" /></div>
              </FRow>
              <FRow>
                <div><Label>Cloud Console Ref</Label><FInput value={form.cloudConsoleRef} onChange={e => setForm(f => ({ ...f, cloudConsoleRef: e.target.value }))} placeholder="AWS/GCP/Azure account or project id" /></div>
              </FRow>
              <FRow>
                <div><Label>Credential Notes</Label><FTextarea rows={3} value={form.credentialNotes} onChange={e => setForm(f => ({ ...f, credentialNotes: e.target.value }))} placeholder="Where credentials are stored, access owner, MFA notes. Do not paste passwords here." /></div>
              </FRow>

              <SHdr>URLs</SHdr>
              <FRow>
                <div><Label>Live / Web URL</Label><FInput value={form.liveUrl} onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))} placeholder="https://" /></div>
              </FRow>
              <FRow>
                <div><Label>GitHub Repo URL</Label><FInput value={form.githubRepoUrl} onChange={e => setForm(f => ({ ...f, githubRepoUrl: e.target.value }))} placeholder="https://github.com/org/repo" /></div>
              </FRow>
              <FRow cols={2}>
                <div><Label>Play Store</Label><FInput value={form.playStoreUrl} onChange={e => setForm(f => ({ ...f, playStoreUrl: e.target.value }))} placeholder="https://play.google.com/…" /></div>
                <div><Label>App Store</Label><FInput value={form.appStoreUrl} onChange={e => setForm(f => ({ ...f, appStoreUrl: e.target.value }))} placeholder="https://apps.apple.com/…" /></div>
              </FRow>
              <FRow>
                <div><Label>Download URL</Label><FInput value={form.downloadUrl} onChange={e => setForm(f => ({ ...f, downloadUrl: e.target.value }))} placeholder="https://" /></div>
              </FRow>

              <SHdr>Infrastructure</SHdr>
              <FRow cols={2}>
                <div><Label>Hosting Provider</Label><FInput value={form.hostingProvider} onChange={e => setForm(f => ({ ...f, hostingProvider: e.target.value }))} placeholder="AWS, GCP, DigitalOcean…" /></div>
                <div><Label>Hosting Expiry</Label><FInput type="date" value={form.hostingExpiryDate} onChange={e => setForm(f => ({ ...f, hostingExpiryDate: e.target.value }))} /></div>
              </FRow>
              <FRow cols={2}>
                <div><Label>Domain Provider</Label><FInput value={form.domainProvider} onChange={e => setForm(f => ({ ...f, domainProvider: e.target.value }))} placeholder="GoDaddy, Namecheap…" /></div>
                <div><Label>Domain Expiry</Label><FInput type="date" value={form.domainExpiryDate} onChange={e => setForm(f => ({ ...f, domainExpiryDate: e.target.value }))} /></div>
              </FRow>
              <FRow>
                <div><Label>SSL Expiry</Label><FInput type="date" value={form.sslExpiryDate} onChange={e => setForm(f => ({ ...f, sslExpiryDate: e.target.value }))} /></div>
              </FRow>

              <SHdr>Team</SHdr>
              <FRow cols={2}>
                <div>
                  <Label required>Developer</Label>
                  <FSelect value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))}>
                    <option value="">— Select —</option>
                    {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </FSelect>
                </div>
                <div>
                  <Label>Managed By</Label>
                  <FSelect value={form.managedBy} onChange={e => setForm(f => ({ ...f, managedBy: e.target.value }))}>
                    <option value="">— Unassigned —</option>
                    {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </FSelect>
                </div>
              </FRow>

              {drawerErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginTop: 4 }}>
                  {drawerErr}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid gainsboro', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDrawerOpen(false)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
