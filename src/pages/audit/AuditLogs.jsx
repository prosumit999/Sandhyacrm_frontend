import { useState, useEffect, useCallback, useRef } from 'react'
import { getAllAuditLogsApi, getAuditLogByIdApi } from '../../api/auditApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return {
    date: dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }
}
const formatVal = (v) => {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') {
    try { return JSON.stringify(v, null, 2) } catch { return String(v) }
  }
  return String(v)
}
const SKIP_KEYS = new Set(['__v', '_id', 'createdAt', 'updatedAt', 'id'])

const AVATAR_COLORS = ['#1a73e8','#16a34a','#7c3aed','#d97706','#dc2626','#0891b2','#6366f1','#be185d']
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
const initials    = (name) => name?.split(' ').slice(0, 2).map(w => w?.[0]).join('').toUpperCase() || '?'

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  filter:  'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z',
  close:   'M6 18L18 6M6 6l12 12',
  chevL:   'M15 19l-7-7 7-7',
  chevR:   'M9 5l7 7-7 7',
  eye:     'M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3-9a9 9 0 100 18A9 9 0 0012 3z',
  clock:   'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  user:    'M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  globe:   'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3m-9 9h18',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  log:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  shield:  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
}

// ── Action config ─────────────────────────────────────────────────────────────
const ACTION_CFG = {
  Created:           { label: 'Created',          color: '#16a34a', bg: '#f0fdf4' },
  Updated:           { label: 'Updated',          color: '#1a73e8', bg: '#eff6ff' },
  Deleted:           { label: 'Deleted',          color: '#dc2626', bg: '#fef2f2' },
  StatusChanged:     { label: 'Status Changed',   color: '#d97706', bg: '#fffbeb' },
  Login:             { label: 'Login',            color: '#0891b2', bg: '#ecfeff' },
  Logout:            { label: 'Logout',           color: '#6b7280', bg: '#f9fafb' },
  PermissionChanged: { label: 'Permission Change',color: '#7c3aed', bg: '#f5f3ff' },
}

// ── Model config ──────────────────────────────────────────────────────────────
const MODEL_CFG = {
  Customers:      { color: '#1a73e8', label: 'Customer'      },
  Softwares:      { color: '#7c3aed', label: 'Software'      },
  Subscriptions:  { color: '#16a34a', label: 'Subscription'  },
  Invoices:       { color: '#d97706', label: 'Invoice'       },
  Alerts:         { color: '#dc2626', label: 'Alert'         },
  Communications: { color: '#0891b2', label: 'Communication' },
  SupportTickets: { color: '#6366f1', label: 'Ticket'        },
  Users:          { color: '#be185d', label: 'User'          },
  Tags:           { color: '#6b7280', label: 'Tag'           },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 14, w = '100%', r = 4 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ── Role badge ────────────────────────────────────────────────────────────────
const ROLE_CFG = {
  SuperAdmin: { bg: '#fef2f2', color: '#dc2626' },
  Admin:      { bg: '#eff6ff', color: '#1a73e8' },
  Standard:   { bg: '#f0fdf4', color: '#16a34a' },
}
const RoleBadge = ({ role }) => {
  const c = ROLE_CFG[role] || ROLE_CFG.Standard
  return <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: c.bg, color: c.color }}>{role}</span>
}

// ═════════════════════════════════════════════════════════════════════════════
//  DIFF VIEW — before / after snapshot comparison
// =============================================================================
function DiffView({ log }) {
  const { action, before, after, changedFields = [] } = log

  if (action === 'Login' || action === 'Logout') {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.2 }}>◎</div>
        <div style={{ fontSize: 13, color: '#9ca3af' }}>Authentication event — no field changes recorded.</div>
      </div>
    )
  }

  if (action === 'Created' && after) {
    const entries = Object.entries(after).filter(([k]) => !SKIP_KEYS.has(k))
    return (
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#16a34a', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          New Record
        </div>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
            <span style={{ width: 130, fontSize: 12, color: '#9ca3af', flexShrink: 0, fontFamily: 'monospace', marginTop: 1 }}>{k}</span>
            <span style={{ fontSize: 12.5, color: '#111827', wordBreak: 'break-all', background: '#f0fdf4', borderRadius: 4, padding: '1px 6px', flex: 1 }}>
              {formatVal(v)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (action === 'Deleted' && before) {
    const entries = Object.entries(before).filter(([k]) => !SKIP_KEYS.has(k))
    return (
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          Deleted Record Snapshot
        </div>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 12, padding: '7px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
            <span style={{ width: 130, fontSize: 12, color: '#9ca3af', flexShrink: 0, fontFamily: 'monospace', marginTop: 1 }}>{k}</span>
            <span style={{ fontSize: 12.5, color: '#111827', wordBreak: 'break-all', background: '#fef2f2', borderRadius: 4, padding: '1px 6px', flex: 1 }}>
              {formatVal(v)}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Updated / StatusChanged / PermissionChanged — field-level diff
  const allKeys = changedFields.length > 0
    ? changedFields
    : [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])].filter(k => !SKIP_KEYS.has(k))

  if (!allKeys.length) {
    return <div style={{ padding: '16px 0', fontSize: 13, color: '#9ca3af' }}>No field-level changes recorded.</div>
  }

  return (
    <div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 8, marginBottom: 6 }}>
        <div />
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px' }}>Before</div>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 8px' }}>After</div>
      </div>
      {allKeys.map(k => {
        const bv = before?.[k]
        const av = after?.[k]
        const changed = JSON.stringify(bv) !== JSON.stringify(av)
        return (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 8, padding: '7px 0', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11.5, color: '#6b7280', fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={k}>{k}</span>
            <div style={{ background: changed ? '#fef2f2' : 'transparent', borderRadius: 4, padding: changed ? '3px 7px' : '3px 0', minHeight: 22 }}>
              <span style={{ fontSize: 12, color: changed ? '#dc2626' : '#374151', wordBreak: 'break-all', display: 'block', whiteSpace: 'pre-wrap' }}>
                {formatVal(bv)}
              </span>
            </div>
            <div style={{ background: changed ? '#f0fdf4' : 'transparent', borderRadius: 4, padding: changed ? '3px 7px' : '3px 0', minHeight: 22 }}>
              <span style={{ fontSize: 12, color: changed ? '#16a34a' : '#374151', wordBreak: 'break-all', display: 'block', whiteSpace: 'pre-wrap' }}>
                {formatVal(av)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  DETAIL DRAWER
// =============================================================================
function DetailDrawer({ logId, onClose }) {
  const [log, setLog]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr]     = useState(null)
  const [section, setSection] = useState('diff')  // 'diff' | 'raw'

  useEffect(() => {
    if (!logId) return
    setLoading(true); setErr(null); setLog(null)
    getAuditLogByIdApi(logId)
      .then(r => setLog(r.data.data))
      .catch(() => setErr('Failed to load log detail.'))
      .finally(() => setLoading(false))
  }, [logId])

  const actionCfg = ACTION_CFG[log?.action] || {}
  const modelCfg  = MODEL_CFG[log?.targetModel] || {}
  const ts        = fmtDate(log?.createdAt)
  const user      = log?.performedBy

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 200, backdropFilter: 'blur(1px)' }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 540,
        background: 'white', zIndex: 201, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.12)', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        {/* ── Drawer header ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic d={IC.log} size={16} color="#6b7280" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Audit Log Detail</span>
            </div>
            <button onClick={onClose}
              style={{ width: 30, height: 30, border: 'none', background: '#f3f4f6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic d={IC.close} size={15} color="#6b7280" />
            </button>
          </div>

          {!loading && log && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: actionCfg.bg, color: actionCfg.color }}>
                {actionCfg.label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: modelCfg.color + '15', color: modelCfg.color }}>
                {modelCfg.label || log.targetModel}
              </span>
              {log.targetLabel && (
                <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{log.targetLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
          {loading ? (
            <div style={{ padding: '24px 0' }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ marginBottom: 12 }}><Sk /></div>)}
            </div>
          ) : err ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#dc2626', fontSize: 13 }}>{err}</div>
          ) : log ? (
            <>
              {/* Meta strip */}
              <div style={{ padding: '14px 0', borderBottom: '1px solid gainsboro', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Performed by */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatarColor(user?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {initials(user?.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{user?.name || 'Unknown'}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{user?.email}</div>
                  </div>
                  {user?.role && <RoleBadge role={user.role} />}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Ic d={IC.clock} size={13} color="#9ca3af" />
                    <span style={{ fontSize: 12.5, color: '#6b7280' }}>{ts.date} · {ts.time}</span>
                  </div>
                  {log.ipAddress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Ic d={IC.globe} size={13} color="#9ca3af" />
                      <span style={{ fontSize: 12.5, color: '#6b7280', fontFamily: 'monospace' }}>{log.ipAddress}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>ID:</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' }}>{String(log.targetId || '').slice(-8)}</span>
                  </div>
                </div>
              </div>

              {/* Changed fields chips */}
              {log.changedFields?.length > 0 && (
                <div style={{ padding: '12px 0', borderBottom: '1px solid gainsboro' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    Changed Fields ({log.changedFields.length})
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {log.changedFields.map(f => (
                      <span key={f} style={{ fontSize: 11.5, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe' }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab toggle: Diff / Raw */}
              <div style={{ padding: '12px 0', borderBottom: '1px solid gainsboro', display: 'flex', gap: 4 }}>
                {[['diff', 'Diff View'], ['raw', 'Raw Snapshots']].map(([id, label]) => (
                  <button key={id} onClick={() => setSection(id)}
                    style={{
                      padding: '5px 12px', fontSize: 12, fontWeight: section === id ? 600 : 400, border: 'none',
                      borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                      background: section === id ? '#111827' : 'transparent',
                      color: section === id ? 'white' : '#6b7280',
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Diff section */}
              <div style={{ padding: '14px 0 32px' }}>
                {section === 'diff' ? (
                  <DiffView log={log} />
                ) : (
                  // Raw JSON view
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {log.before && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Before</div>
                        <pre style={{ fontSize: 11, background: '#fef2f2', borderRadius: 6, padding: '12px', overflow: 'auto', margin: 0, color: '#374151', lineHeight: 1.6, border: '1px solid #fee2e2' }}>
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>After</div>
                        <pre style={{ fontSize: 11, background: '#f0fdf4', borderRadius: 6, padding: '12px', overflow: 'auto', margin: 0, color: '#374151', lineHeight: 1.6, border: '1px solid #bbf7d0' }}>
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                    {!log.before && !log.after && (
                      <div style={{ fontSize: 13, color: '#9ca3af', padding: '16px 0' }}>No snapshot data available.</div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
const ACTIONS = ['Created','Updated','Deleted','StatusChanged','Login','Logout','PermissionChanged']
const MODELS  = ['Customers','Softwares','Subscriptions','Invoices','Alerts','Communications','SupportTickets','Users','Tags']
const LIMITS  = [10, 25, 50]

export default function AuditLogs() {
  const [logs,    setLogs]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [limit,   setLimit]   = useState(25)
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState(null)

  const [filters, setFilters] = useState({ action: '', targetModel: '', dateFrom: '', dateTo: '', search: '' })
  const [applied, setApplied] = useState({ action: '', targetModel: '', dateFrom: '', dateTo: '' })
  const searchRef = useRef(null)

  const totalPages = Math.ceil(total / limit) || 1

  const fetchLogs = useCallback(async (pg = 1, lmt = 25, apl = {}) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: lmt }
      if (apl.action)      params.action      = apl.action
      if (apl.targetModel) params.targetModel = apl.targetModel
      if (apl.dateFrom)    params.dateFrom    = apl.dateFrom
      if (apl.dateTo)      params.dateTo      = apl.dateTo
      const res = await getAllAuditLogsApi(params)
      setLogs(res.data.data || [])
      setTotal(res.data.pagination?.total || 0)
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs(page, limit, applied) }, [page, limit, applied, fetchLogs])

  const applyFilters = () => {
    setApplied({ action: filters.action, targetModel: filters.targetModel, dateFrom: filters.dateFrom, dateTo: filters.dateTo })
    setPage(1)
  }
  const resetFilters = () => {
    const blank = { action: '', targetModel: '', dateFrom: '', dateTo: '', search: '' }
    setFilters(blank)
    setApplied({ action: '', targetModel: '', dateFrom: '', dateTo: '' })
    setPage(1)
  }
  const hasFilters = applied.action || applied.targetModel || applied.dateFrom || applied.dateTo

  // Client-side name search on already-fetched page
  const visibleLogs = filters.search
    ? logs.filter(l => l.performedBy?.name?.toLowerCase().includes(filters.search.toLowerCase()) || l.targetLabel?.toLowerCase().includes(filters.search.toLowerCase()))
    : logs

  const TD = ({ children, style = {}, ...rest }) => (
    <td style={{ padding: '11px 14px', verticalAlign: 'middle', ...style }} {...rest}>{children}</td>
  )

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827' }}>
      <style>{`
        @keyframes sk { from { opacity: 1 } to { opacity: 0.4 } }
        .audit-row:hover { background: #fafbff !important; }
        .detail-btn { opacity: 0; transition: opacity 0.12s; }
        .audit-row:hover .detail-btn { opacity: 1; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Audit Logs</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9ca3af' }}>
            Track every change across customers, softwares, subscriptions and users.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasFilters && (
            <span style={{ fontSize: 12, background: '#eff6ff', color: '#1a73e8', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
              Filters active
            </span>
          )}
          <button onClick={() => fetchLogs(page, limit, applied)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid gainsboro', borderRadius: 7, padding: '7px 13px', background: 'white', cursor: 'pointer', fontSize: 12.5, color: '#374151', fontFamily: 'inherit' }}>
            <Ic d={IC.refresh} size={13} color="#6b7280" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: '14px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 180px', minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Search</label>
            <input ref={searchRef} value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              placeholder="User name or entity…"
              style={{ width: '100%', border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Action */}
          <div style={{ flex: '1 1 140px', minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Action</label>
            <select value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              style={{ width: '100%', border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' }}>
              <option value="">All Actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{ACTION_CFG[a]?.label || a}</option>)}
            </select>
          </div>

          {/* Model */}
          <div style={{ flex: '1 1 140px', minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Entity Type</label>
            <select value={filters.targetModel} onChange={e => setFilters(f => ({ ...f, targetModel: e.target.value }))}
              style={{ width: '100%', border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' }}>
              <option value="">All Entities</option>
              {MODELS.map(m => <option key={m} value={m}>{MODEL_CFG[m]?.label || m}</option>)}
            </select>
          </div>

          {/* Date from */}
          <div style={{ flex: '1 1 140px', minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>From Date</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              style={{ width: '100%', border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Date to */}
          <div style={{ flex: '1 1 140px', minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>To Date</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              style={{ width: '100%', border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
            <button onClick={applyFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              <Ic d={IC.filter} size={13} color="white" />
              Apply
            </button>
            {hasFilters && (
              <button onClick={resetFilters}
                style={{ padding: '7px 12px', background: 'white', border: '1px solid gainsboro', borderRadius: 6, cursor: 'pointer', fontSize: 12.5, color: '#6b7280', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat chips ── */}
      {!loading && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12.5, color: '#6b7280', padding: '4px 12px', background: 'white', border: '1px solid gainsboro', borderRadius: 20 }}>
            <span style={{ fontWeight: 700, color: '#111827' }}>{total.toLocaleString()}</span> total entries
          </div>
          {hasFilters && (
            <div style={{ fontSize: 12.5, color: '#6b7280', padding: '4px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20 }}>
              Filtered results
            </div>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '4%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>
                {['User', 'Action', 'Entity', 'Changed Fields', 'IP Address', 'Timestamp', ''].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    {[...Array(7)].map((__, j) => (
                      <TD key={j}><Sk w={j === 6 ? 28 : j === 3 ? '90%' : '70%'} /></TD>
                    ))}
                  </tr>
                ))
              ) : visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 8 }}>◎</div>
                    No audit logs found{hasFilters ? ' for these filters.' : '.'}
                  </td>
                </tr>
              ) : visibleLogs.map(log => {
                const ac  = ACTION_CFG[log.action]  || {}
                const mc  = MODEL_CFG[log.targetModel] || {}
                const ts  = fmtDate(log.createdAt)
                const usr = log.performedBy
                const fields = log.changedFields || []

                return (
                  <tr key={log._id} className="audit-row"
                    style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' }}>

                    {/* User */}
                    <TD>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: avatarColor(usr?.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11.5, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {initials(usr?.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usr?.name || 'Unknown'}</div>
                          <RoleBadge role={usr?.role} />
                        </div>
                      </div>
                    </TD>

                    {/* Action */}
                    <TD>
                      <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: ac.bg, color: ac.color, whiteSpace: 'nowrap' }}>
                        {ac.label || log.action}
                      </span>
                    </TD>

                    {/* Entity */}
                    <TD>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: mc.color ? mc.color + '15' : '#f3f4f6', color: mc.color || '#6b7280', width: 'fit-content' }}>
                          {mc.label || log.targetModel}
                        </span>
                        {log.targetLabel && (
                          <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                            {log.targetLabel}
                          </span>
                        )}
                      </div>
                    </TD>

                    {/* Changed fields */}
                    <TD>
                      {fields.length === 0 ? (
                        <span style={{ fontSize: 12, color: '#d1d5db' }}>—</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {fields.slice(0, 3).map(f => (
                            <span key={f} style={{ fontSize: 11, fontFamily: 'monospace', padding: '1px 6px', borderRadius: 3, background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{f}</span>
                          ))}
                          {fields.length > 3 && (
                            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: '#eff6ff', color: '#1a73e8', fontWeight: 600 }}>+{fields.length - 3}</span>
                          )}
                        </div>
                      )}
                    </TD>

                    {/* IP */}
                    <TD style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>
                      {log.ipAddress || '—'}
                    </TD>

                    {/* Timestamp */}
                    <TD>
                      <div style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>{ts.date}</div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{ts.time}</div>
                    </TD>

                    {/* Detail button */}
                    <TD style={{ textAlign: 'right' }}>
                      <button className="detail-btn" onClick={() => setDetailId(log._id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, border: '1px solid gainsboro', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#1a73e8', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        <Ic d={IC.eye} size={13} color="#1a73e8" />
                        View
                      </button>
                    </TD>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {!loading && total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          {/* Count */}
          <div style={{ fontSize: 12.5, color: '#6b7280' }}>
            Showing <span style={{ fontWeight: 600, color: '#111827' }}>{((page - 1) * limit) + 1}–{Math.min(page * limit, total)}</span> of <span style={{ fontWeight: 600, color: '#111827' }}>{total.toLocaleString()}</span> entries
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Rows per page */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>Show</span>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
                style={{ border: '1px solid gainsboro', borderRadius: 5, padding: '5px 8px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', background: 'white' }}>
                {LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Page buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', border: '1px solid gainsboro', borderRadius: 6, background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151', fontSize: 12.5, fontFamily: 'inherit' }}>
                <Ic d={IC.chevL} size={13} color={page === 1 ? '#d1d5db' : '#6b7280'} />
                Prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                let pg
                if (totalPages <= 7) {
                  pg = i + 1
                } else if (page <= 4) {
                  pg = i + 1
                } else if (page >= totalPages - 3) {
                  pg = totalPages - 6 + i
                } else {
                  pg = page - 3 + i
                }
                const active = pg === page
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    style={{ width: 34, height: 34, border: active ? 'none' : '1px solid gainsboro', borderRadius: 6, background: active ? '#1a73e8' : 'white', color: active ? 'white' : '#374151', cursor: 'pointer', fontSize: 12.5, fontWeight: active ? 700 : 400, fontFamily: 'inherit' }}>
                    {pg}
                  </button>
                )
              })}

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '5px 10px', border: '1px solid gainsboro', borderRadius: 6, background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#374151', fontSize: 12.5, fontFamily: 'inherit' }}>
                Next
                <Ic d={IC.chevR} size={13} color={page === totalPages ? '#d1d5db' : '#6b7280'} />
              </button>
            </div>

            {/* Page jump */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>Page</span>
              <input type="number" min={1} max={totalPages} defaultValue={page} key={page}
                onBlur={e => { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v) }}
                onKeyDown={e => { if (e.key === 'Enter') { const v = parseInt(e.target.value); if (v >= 1 && v <= totalPages) setPage(v) } }}
                style={{ width: 50, border: '1px solid gainsboro', borderRadius: 5, padding: '5px 8px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
              <span style={{ fontSize: 12.5, color: '#6b7280' }}>of {totalPages}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      {detailId && <DetailDrawer logId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  )
}
