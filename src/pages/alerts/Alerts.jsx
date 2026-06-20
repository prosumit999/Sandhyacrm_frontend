import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { toastSuccess } from '../../utils/toast'
import {
  getAllAlertsApi,
  createAlertApi,
  updateAlertApi,
  resolveAlertApi,
  snoozeAlertApi,
  dismissAlertApi,
  deleteAlertApi,
} from '../../api/alertApi'
import axiosInstance from '../../api/axios'

// ─── constants ───────────────────────────────────────────────────────────────
const ALERT_TYPES   = ['Client', 'Infra', 'Marketing', 'Internal']
const ALERT_STATUS  = ['Pending', 'Sent', 'Resolved', 'Snoozed', 'Dismissed']
const SEVERITIES    = ['Info', 'Warning', 'Urgent']
const SUB_TYPES_BY_TYPE = {
  Client:    ['SubscriptionRenewal', 'PaymentOverdue', 'Custom'],
  Infra:     ['DomainExpiry', 'HostingExpiry', 'SSLExpiry', 'Custom'],
  Marketing: ['AdBudgetLow', 'AdPaused', 'Custom'],
  Internal:  ['Custom'],
}
const ALL_SUB_TYPES = ['SubscriptionRenewal','PaymentOverdue','DomainExpiry','HostingExpiry','SSLExpiry','AdBudgetLow','AdPaused','Custom']

const SUB_TYPE_LABELS = {
  SubscriptionRenewal: 'Sub Renewal',
  PaymentOverdue: 'Payment Overdue',
  DomainExpiry: 'Domain Expiry',
  HostingExpiry: 'Hosting Expiry',
  SSLExpiry: 'SSL Expiry',
  AdBudgetLow: 'Ad Budget Low',
  AdPaused: 'Ad Paused',
  Custom: 'Custom',
}

const TODAY_STR = new Date().toISOString().slice(0, 10)

// ─── helpers ─────────────────────────────────────────────────────────────────
function daysDiff(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}


const PRIMARY_BADGE = { bg: '#eff6ff', color: '#1a73e8', border: '#bfdbfe' }

// ─── badge components ─────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  return (
    <span style={{ background: PRIMARY_BADGE.bg, color: PRIMARY_BADGE.color, border: `1px solid ${PRIMARY_BADGE.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {severity}
    </span>
  )
}

function StatusBadge({ status }) {
  return (
    <span style={{ background: PRIMARY_BADGE.bg, color: PRIMARY_BADGE.color, border: `1px solid ${PRIMARY_BADGE.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span style={{ background: PRIMARY_BADGE.bg, color: PRIMARY_BADGE.color, border: `1px solid ${PRIMARY_BADGE.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {type}
    </span>
  )
}

function DueBadge({ dateStr }) {
  const d = daysDiff(dateStr)
  if (d === null) return null
  const label = d < 0 ? 'Overdue' : d === 0 ? 'Today' : `${d}d`
  return <span style={{ background: PRIMARY_BADGE.bg, color: PRIMARY_BADGE.color, border: `1px solid ${PRIMARY_BADGE.border}`, borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600, marginLeft: 4 }}>{label}</span>
}


// ─── form input helpers ───────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${focused ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', ...style }}
    />
  )
}

function Select({ style, children, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${focused ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', ...style }}
    >
      {children}
    </select>
  )
}

function Textarea({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${focused ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', resize: 'vertical', ...style }}
    />
  )
}

// ─── action button ─────────────────────────────────────────────────────────────
function ActionBtn({ label, color, onClick, disabled }) {
  const [hov, setHov] = useState(false)
  const colors = {
    green:  { base: '#15803d', hover: '#166534' },
    amber:  { base: '#b45309', hover: '#92400e' },
    red:    { base: '#dc2626', hover: '#b91c1c' },
    gray:   { base: '#6b7280', hover: '#4b5563' },
    blue:   { base: '#1a73e8', hover: '#1557b0' },
    purple: { base: '#7c3aed', hover: '#6d28d9' },
  }
  const c = colors[color] || colors.blue
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#d1d5db' : hov ? c.hover : c.base, fontSize: 12, fontWeight: 600, padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}
    >
      {label}
    </button>
  )
}

// ─── drawer section header ─────────────────────────────────────────────────────
function SectionHeader({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 0 8px', borderBottom: '1px solid gainsboro', marginBottom: 12 }}>
      {children}
    </div>
  )
}

function FormRow({ children, cols = 1 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 12 }}>
      {children}
    </div>
  )
}

// ─── plus card ────────────────────────────────────────────────────────────────
function AlertPlusCard({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#eff6ff' : 'white', border: `2px dashed ${hov ? '#1a73e8' : '#d1d5db'}`, borderRadius: '8px', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.15s' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: hov ? '#1a73e8' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={hov ? 'white' : '#9ca3af'} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? '#1a73e8' : '#6b7280', transition: 'color 0.15s' }}>Create Alert</span>
    </div>
  )
}

// ─── alert card ───────────────────────────────────────────────────────────────
function AlertCard({ alert, isAdmin, isSuperAdmin, onResolve, onSnooze, onDismiss, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  const isResolvable  = isAdmin && !['Resolved', 'Dismissed'].includes(alert.status)
  const isSnoozable   = !['Resolved', 'Dismissed', 'Snoozed'].includes(alert.status)
  const isDismissable = !['Resolved', 'Dismissed'].includes(alert.status)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: `1px solid ${hov ? '#bfdbfe' : 'gainsboro'}`, borderRadius: '8px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: hov ? '0 4px 16px rgba(26,115,232,0.08)' : 'none' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#111827', lineHeight: 1.3 }}>{alert.title}</div>
          <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '3px' }}>{SUB_TYPE_LABELS[alert.subType] || alert.subType}</div>
        </div>
        <StatusBadge status={alert.status} />
      </div>

      {/* badges row */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <TypeBadge type={alert.type} />
        <SeverityBadge severity={alert.severity} />
        {alert.isAutoGenerated && <span style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 3, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>AUTO</span>}
        {alert.smsSent && <span style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 3, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>SMS</span>}
      </div>

      {/* due / customer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {alert.dueDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#374151' }}>
            <span>Due: {fmt(alert.dueDate)}</span>
            <DueBadge dateStr={alert.dueDate} />
          </div>
        )}
        {alert.status === 'Snoozed' && alert.snoozedUntil && (
          <div style={{ fontSize: '11px', color: '#6b7280' }}>Snoozed until {fmt(alert.snoozedUntil)}</div>
        )}
        {alert.customer && <div style={{ fontSize: '12px', color: '#6b7280' }}>{alert.customer?.name || alert.customer?.businessName}</div>}
        {alert.software && <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{alert.software?.name}</div>}
      </div>

      {/* actions footer */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
        {isResolvable  && <ActionBtn label="Resolve" color="green"  onClick={onResolve} />}
        {isSnoozable   && <ActionBtn label="Snooze"  color="purple" onClick={onSnooze} />}
        {isDismissable && <ActionBtn label="Dismiss" color="gray"   onClick={onDismiss} />}
        {isAdmin       && <ActionBtn label="Edit"    color="blue"   onClick={onEdit} />}
        {isSuperAdmin  && <ActionBtn label="Delete"  color="red"    onClick={onDelete} />}
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Alerts() {
  const { user } = useSelector(s => s.auth)
  const isAdmin      = ['Admin', 'SuperAdmin'].includes(user?.role)
  const isSuperAdmin = user?.role === 'SuperAdmin'

  // list state
  const [alerts, setAlerts]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotal]    = useState(1)

  // filters
  const [filterType,     setFilterType]     = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterSubType,  setFilterSubType]  = useState('')

  // drawer
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editAlert,  setEditAlert]    = useState(null)
  const [saving,     setSaving]       = useState(false)
  const [drawerErr,  setDrawerErr]    = useState('')

  // dropdown data for drawer
  const [customers,  setCustomers]  = useState([])
  const [softwares,  setSoftwares]  = useState([])
  const [teamUsers,  setTeamUsers]  = useState([])
  const [dropLoading, setDropLoading] = useState(false)

  // form state
  const emptyForm = { type: 'Client', subType: 'Custom', title: '', message: '', severity: 'Info', dueDate: '', customer: '', software: '', assignedTo: '' }
  const [form, setForm] = useState(emptyForm)

  // action modals
  const [snoozeTarget,  setSnoozeTarget]  = useState(null)
  const [snoozeDate,    setSnoozeDate]    = useState('')
  const [snoozeLoading, setSnoozeLoading] = useState(false)

  const [resolveTarget,  setResolveTarget]  = useState(null)
  const [resolveLoading, setResolveLoading] = useState(false)

  const [dismissTarget,  setDismissTarget]  = useState(null)
  const [dismissLoading, setDismissLoading] = useState(false)

  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 15 }
      if (filterType)     params.type     = filterType
      if (filterStatus)   params.status   = filterStatus
      if (filterSeverity) params.severity = filterSeverity
      if (filterSubType)  params.subType  = filterSubType
      const res = await getAllAlertsApi(params)
      setAlerts(res.data?.data || res.data?.alerts || res.data || [])
      setTotal(res.data?.totalPages || 1)
      setPage(p)
    } catch {
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, filterSeverity, filterSubType])

  useEffect(() => { fetchAlerts(1) }, [filterType, filterStatus, filterSeverity, filterSubType])

  // ── dropdown data ──────────────────────────────────────────────────────────
  const loadDropdownData = async () => {
    setDropLoading(true)
    try {
      const [cRes, sRes, uRes] = await Promise.all([
        axiosInstance.get('/customers', { params: { limit: 200 } }),
        axiosInstance.get('/softwares', { params: { limit: 200 } }),
        axiosInstance.get('/users',     { params: { limit: 100 } }),
      ])
      setCustomers(cRes.data?.data || cRes.data?.customers || [])
      setSoftwares(sRes.data?.data || sRes.data?.softwares || [])
      setTeamUsers(uRes.data?.data || uRes.data?.users || [])
    } catch {
      // non-fatal — dropdowns just stay empty
    } finally {
      setDropLoading(false)
    }
  }

  const openCreate = () => {
    setEditAlert(null)
    setForm(emptyForm)
    setDrawerErr('')
    setDrawerOpen(true)
    loadDropdownData()
  }

  const openEdit = (alert) => {
    setEditAlert(alert)
    setForm({
      type:       alert.type       || 'Client',
      subType:    alert.subType    || 'Custom',
      title:      alert.title      || '',
      message:    alert.message    || '',
      severity:   alert.severity   || 'Info',
      dueDate:    alert.dueDate    ? alert.dueDate.slice(0, 10) : '',
      customer:   alert.customer?._id || alert.customer || '',
      software:   alert.software?._id || alert.software || '',
      assignedTo: alert.assignedTo?._id || alert.assignedTo || '',
    })
    setDrawerErr('')
    setDrawerOpen(true)
    loadDropdownData()
  }

  const closeDrawer = () => { setDrawerOpen(false); setEditAlert(null) }

  const handleSave = async () => {
    if (!form.title.trim())   { setDrawerErr('Title is required.'); return }
    if (!form.message.trim()) { setDrawerErr('Message is required.'); return }
    if (!form.dueDate)        { setDrawerErr('Due date is required.'); return }
    setSaving(true); setDrawerErr('')
    try {
      const body = {
        type:    form.type,
        subType: form.subType,
        title:   form.title.trim(),
        message: form.message.trim(),
        severity: form.severity,
        dueDate:  form.dueDate,
        ...(form.customer   && { customer:   form.customer }),
        ...(form.software   && { software:   form.software }),
        ...(form.assignedTo && { assignedTo: form.assignedTo }),
      }
      if (editAlert) {
        await updateAlertApi(editAlert._id, body)
      } else {
        await createAlertApi(body)
      }
      const wasEdit = !!editAlert
      closeDrawer()
      fetchAlerts(wasEdit ? page : 1)
      toastSuccess(wasEdit ? 'Alert updated' : 'Alert created')
    } catch (err) {
      setDrawerErr(err?.response?.data?.message || 'Failed to save alert.')
    } finally {
      setSaving(false)
    }
  }

  // ── resolve ────────────────────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!resolveTarget) return
    setResolveLoading(true)
    try {
      await resolveAlertApi(resolveTarget._id)
      setResolveTarget(null)
      fetchAlerts(page)
      toastSuccess('Alert resolved')
    } catch {
    } finally {
      setResolveLoading(false)
    }
  }

  // ── snooze ─────────────────────────────────────────────────────────────────
  const handleSnooze = async () => {
    if (!snoozeTarget || !snoozeDate) return
    setSnoozeLoading(true)
    try {
      await snoozeAlertApi(snoozeTarget._id, { snoozedUntil: snoozeDate })
      setSnoozeTarget(null); setSnoozeDate('')
      fetchAlerts(page)
      toastSuccess('Alert snoozed')
    } catch {
    } finally {
      setSnoozeLoading(false)
    }
  }

  // ── dismiss ────────────────────────────────────────────────────────────────
  const handleDismiss = async () => {
    if (!dismissTarget) return
    setDismissLoading(true)
    try {
      await dismissAlertApi(dismissTarget._id)
      setDismissTarget(null)
      fetchAlerts(page)
      toastSuccess('Alert dismissed')
    } catch {
    } finally {
      setDismissLoading(false)
    }
  }

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteAlertApi(deleteTarget._id)
      setDeleteTarget(null)
      fetchAlerts(page)
      toastSuccess('Alert deleted')
    } catch {
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── summary strip ──────────────────────────────────────────────────────────
  const pendingCount  = alerts.filter(a => a.status === 'Pending').length
  const urgentCount   = alerts.filter(a => a.severity === 'Urgent' && !['Resolved','Dismissed'].includes(a.status)).length
  const overdueCount  = alerts.filter(a => daysDiff(a.dueDate) < 0 && !['Resolved','Dismissed'].includes(a.status)).length
  const snoozedCount  = alerts.filter(a => a.status === 'Snoozed').length

  const availableSubTypes = form.type ? (SUB_TYPES_BY_TYPE[form.type] || ALL_SUB_TYPES) : ALL_SUB_TYPES

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      {/* ── page header ── */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>Alerts</h1>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Monitor and manage system alerts</p>
      </div>

      {/* ── summary strip ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending', val: pendingCount },
          { label: 'Urgent',  val: urgentCount },
          { label: 'Overdue', val: overdueCount },
          { label: 'Snoozed', val: snoozedCount },
        ].map(({ label, val }) => (
          <span key={label} style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
            {label}: {val}
          </span>
        ))}
      </div>

      {/* ── filter bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { value: filterType,     setter: setFilterType,     placeholder: 'All Types',     options: ALERT_TYPES },
          { value: filterStatus,   setter: setFilterStatus,   placeholder: 'All Statuses',  options: ALERT_STATUS },
          { value: filterSeverity, setter: setFilterSeverity, placeholder: 'All Severities',options: SEVERITIES },
          { value: filterSubType,  setter: setFilterSubType,  placeholder: 'All Sub-Types', options: ALL_SUB_TYPES, labels: SUB_TYPE_LABELS },
        ].map(({ value, setter, placeholder, options, labels }) => (
          <select
            key={placeholder}
            value={value}
            onChange={e => setter(e.target.value)}
            style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '6px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#374151', cursor: 'pointer' }}
          >
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{labels ? labels[o] : o}</option>)}
          </select>
        ))}
        {(filterType || filterStatus || filterSeverity || filterSubType) && (
          <button
            onClick={() => { setFilterType(''); setFilterStatus(''); setFilterSeverity(''); setFilterSubType('') }}
            style={{ background: 'none', border: '1px solid gainsboro', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* ── grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', height: '160px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {isAdmin && <AlertPlusCard onClick={openCreate} />}
          {alerts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '52px 0', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>
              {(filterType || filterStatus || filterSeverity || filterSubType) ? 'No alerts match the filters.' : 'No alerts found.'}
            </div>
          ) : alerts.map(alert => (
            <AlertCard key={alert._id} alert={alert} isAdmin={isAdmin} isSuperAdmin={isSuperAdmin}
              onResolve={() => setResolveTarget(alert)}
              onSnooze={() => { setSnoozeTarget(alert); setSnoozeDate('') }}
              onDismiss={() => setDismissTarget(alert)}
              onEdit={() => openEdit(alert)}
              onDelete={() => setDeleteTarget(alert)}
            />
          ))}
        </div>
      )}

      {/* ── pagination ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          <button onClick={() => fetchAlerts(page - 1)} disabled={page === 1} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151' }}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchAlerts(p)} style={{ border: `1px solid ${p === page ? '#1a73e8' : 'gainsboro'}`, background: p === page ? '#eff6ff' : 'white', color: p === page ? '#1a73e8' : '#374151', borderRadius: 6, padding: '5px 10px', fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>{p}</button>
          ))}
          <button onClick={() => fetchAlerts(page + 1)} disabled={page === totalPages} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#374151' }}>›</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SNOOZE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {snoozeTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 380, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>Snooze Alert</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>{snoozeTarget.title}</p>
            <div style={{ marginBottom: 16 }}>
              <Label required>Snooze Until</Label>
              <Input type="date" value={snoozeDate} min={TODAY_STR} onChange={e => setSnoozeDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setSnoozeTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleSnooze} disabled={!snoozeDate || snoozeLoading} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: (!snoozeDate || snoozeLoading) ? 'not-allowed' : 'pointer', opacity: (!snoozeDate || snoozeLoading) ? 0.6 : 1 }}>
                {snoozeLoading ? 'Snoozing…' : 'Snooze'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          RESOLVE CONFIRM MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {resolveTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 360, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Resolve Alert?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Mark <strong>{resolveTarget.title}</strong> as resolved. This action is final.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setResolveTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleResolve} disabled={resolveLoading} style={{ background: '#15803d', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: resolveLoading ? 'not-allowed' : 'pointer' }}>
                {resolveLoading ? 'Resolving…' : 'Mark Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DISMISS CONFIRM MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {dismissTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 360, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>Dismiss Alert?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Dismiss <strong>{dismissTarget.title}</strong>. It will remain in records but marked as dismissed.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDismissTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleDismiss} disabled={dismissLoading} style={{ background: '#6b7280', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: dismissLoading ? 'not-allowed' : 'pointer' }}>
                {dismissLoading ? 'Dismissing…' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 360, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Delete Alert?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Permanently delete <strong>{deleteTarget.title}</strong>. This cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer' }}>
                {deleteLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE / EDIT DRAWER
      ══════════════════════════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
          {/* overlay */}
          <div onClick={closeDrawer} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />

          {/* panel */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 480, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            {/* header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{editAlert ? 'Edit Alert' : 'Create Alert'}</span>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
            </div>

            {/* body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              <SectionHeader>Alert Details</SectionHeader>

              <FormRow cols={2}>
                <div>
                  <Label required>Type</Label>
                  <Select
                    value={form.type}
                    onChange={e => {
                      const t = e.target.value
                      const subs = SUB_TYPES_BY_TYPE[t] || ALL_SUB_TYPES
                      setForm(f => ({ ...f, type: t, subType: subs[0] }))
                    }}
                  >
                    {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label required>Sub-Type</Label>
                  <Select value={form.subType} onChange={e => setForm(f => ({ ...f, subType: e.target.value }))}>
                    {availableSubTypes.map(s => <option key={s} value={s}>{SUB_TYPE_LABELS[s]}</option>)}
                  </Select>
                </div>
              </FormRow>

              <FormRow cols={2}>
                <div>
                  <Label required>Severity</Label>
                  <Select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label required>Due Date</Label>
                  <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                </div>
              </FormRow>

              <FormRow>
                <div>
                  <Label required>Title</Label>
                  <Input placeholder="e.g. Domain expiring for client ABC" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
              </FormRow>

              <FormRow>
                <div>
                  <Label required>Message / SMS Draft</Label>
                  <Textarea rows={3} placeholder="This message may be sent as SMS to the customer…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                </div>
              </FormRow>

              <SectionHeader>Link (Optional)</SectionHeader>

              <FormRow cols={2}>
                <div>
                  <Label>Customer</Label>
                  <Select value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} disabled={dropLoading}>
                    <option value="">— None —</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} {c.businessName ? `(${c.businessName})` : ''}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Software</Label>
                  <Select value={form.software} onChange={e => setForm(f => ({ ...f, software: e.target.value }))} disabled={dropLoading}>
                    <option value="">— None —</option>
                    {softwares.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </Select>
                </div>
              </FormRow>

              <FormRow>
                <div>
                  <Label>Assign To</Label>
                  <Select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} disabled={dropLoading}>
                    <option value="">— Unassigned —</option>
                    {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                  </Select>
                </div>
              </FormRow>

              {drawerErr && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginTop: 8 }}>
                  {drawerErr}
                </div>
              )}
            </div>

            {/* footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid gainsboro', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeDrawer} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving…' : editAlert ? 'Save Changes' : 'Create Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
