import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getMyNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  dismissNotificationApi,
} from '../../api/notificationApi'

// ── Link safety ───────────────────────────────────────────────────────────────
const VALID_PREFIXES = ['/tickets/', '/customers/', '/subscriptions/', '/invoices/']
const SECTION_ROOTS  = { alerts: '/alerts', invoices: '/invoices', subscriptions: '/subscriptions', customers: '/customers', tickets: '/tickets', notifications: '/notifications' }
function safeLink(link) {
  if (!link) return null
  const path = link.split('?')[0]
  if (VALID_PREFIXES.some(p => path.startsWith(p))) return link
  const section = path.replace(/^\//, '').split('/')[0]
  return SECTION_ROOTS[section] ?? link
}

// ── Formatters ────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CFG = {
  SubscriptionRenewal: { label: 'Renewal',   color: '#16a34a', bg: '#f0fdf4', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  PaymentOverdue:      { label: 'Payment',   color: '#dc2626', bg: '#fef2f2', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  DomainExpiry:        { label: 'Domain',    color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  HostingExpiry:       { label: 'Hosting',   color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  SSLExpiry:           { label: 'SSL',       color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  TicketAssigned:      { label: 'Ticket',    color: '#1a73e8', bg: '#eff6ff', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  TicketReplied:       { label: 'Ticket',    color: '#1a73e8', bg: '#eff6ff', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  TicketResolved:      { label: 'Ticket',    color: '#16a34a', bg: '#f0fdf4', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  InvoiceCreated:      { label: 'Invoice',   color: '#7c3aed', bg: '#f5f3ff', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  AlertTriggered:      { label: 'Alert',     color: '#ea580c', bg: '#fff7ed', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  Custom:              { label: 'General',   color: '#6b7280', bg: '#f9fafb', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
}

const ALL_TYPES = Object.keys(TYPE_CFG)

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={sw} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 13, w = '100%' }) => (
  <div style={{ height: h, width: w, borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate' }} />
)

// ── Single notification row ───────────────────────────────────────────────────
function NotifRow({ n, onMarkRead, onDismiss, navigate }) {
  const cfg = TYPE_CFG[n.type] || TYPE_CFG.Custom
  const [hov, setHov] = useState(false)

  const handleClick = async () => {
    if (!n.isRead) await onMarkRead(n._id)
    if (n.link) navigate(safeLink(n.link))
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px 20px',
        background: !n.isRead ? '#f8faff' : hov ? '#fafafa' : 'white',
        borderBottom: '1px solid #f3f4f6',
        cursor: n.link ? 'pointer' : 'default',
        transition: 'background 0.12s',
        position: 'relative',
      }}
    >
      {/* Unread indicator bar */}
      {!n.isRead && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: cfg.color, borderRadius: '0 2px 2px 0' }} />
      )}

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
        border: `1px solid ${cfg.color}22`,
      }}>
        <Ic d={cfg.icon} size={18} color={cfg.color} sw={1.8} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: n.isRead ? 500 : 700, color: '#111827' }}>
              {n.title}
            </span>
            <span style={{
              fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 4,
              background: cfg.bg, color: cfg.color,
            }}>
              {cfg.label}
            </span>
            {!n.isRead && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block', flexShrink: 0 }} />
            )}
          </div>
          <span style={{ fontSize: 11.5, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
        </div>

        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: n.link ? 6 : 0 }}>
          {n.message}
        </div>

        {n.link && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: cfg.color, fontWeight: 500 }}>
            <Ic d="M13 7l5 5m0 0l-5 5m5-5H6" size={12} color={cfg.color} />
            View details
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {!n.isRead && (
          <button
            onClick={e => { e.stopPropagation(); onMarkRead(n._id) }}
            title="Mark as read"
            style={{
              background: 'none', border: '1px solid gainsboro', borderRadius: 6,
              cursor: 'pointer', padding: '4px 9px', fontSize: 11.5,
              color: '#6b7280', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
              opacity: hov ? 1 : 0, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.color = cfg.color }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'gainsboro'; e.currentTarget.style.color = '#6b7280' }}
          >
            <Ic d="M5 13l4 4L19 7" size={12} color="currentColor" /> Read
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDismiss(n._id) }}
          title="Dismiss"
          style={{
            background: 'none', border: 'none', borderRadius: 6,
            cursor: 'pointer', padding: 5, color: '#d1d5db',
            display: 'flex', opacity: hov ? 1 : 0, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none' }}
        >
          <Ic d="M6 18L18 6M6 6l12 12" size={14} color="currentColor" sw={2.2} />
        </button>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
export default function Notifications() {
  const navigate = useNavigate()

  const [notifs,      setNotifs]      = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [pagination,  setPagination]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [readFilter, setReadFilter] = useState('all')   // 'all' | 'unread' | 'read'
  const [typeFilter, setTypeFilter] = useState('all')   // 'all' | type key

  const buildParams = useCallback((page = 1) => {
    const p = { page, limit: 25 }
    if (readFilter === 'unread') p.isRead = 'false'
    if (readFilter === 'read')   p.isRead = 'true'
    return p
  }, [readFilter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyNotificationsApi(buildParams(1))
      setNotifs(res.data.data || [])
      setUnreadCount(res.data.unreadCount || 0)
      setPagination(res.data.pagination || null)
    } catch {}
    finally { setLoading(false) }
  }, [buildParams])

  useEffect(() => { load() }, [load])

  const loadMore = async () => {
    if (!pagination || pagination.page >= pagination.pages) return
    setLoadingMore(true)
    try {
      const res = await getMyNotificationsApi(buildParams(pagination.page + 1))
      setNotifs(prev => [...prev, ...(res.data.data || [])])
      setPagination(res.data.pagination || null)
    } catch {}
    finally { setLoadingMore(false) }
  }

  const handleMarkRead = async (id) => {
    try {
      await markNotificationReadApi(id)
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsReadApi()
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  const handleDismiss = async (id) => {
    try {
      await dismissNotificationApi(id)
      const target = notifs.find(n => n._id === id)
      setNotifs(prev => prev.filter(n => n._id !== id))
      if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  // Apply client-side type filter (type comes from the stored field on each notif)
  const visible = typeFilter === 'all' ? notifs : notifs.filter(n => n.type === typeFilter)

  const READ_TABS = [
    { id: 'all',    label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'read',   label: 'Read' },
  ]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827', maxWidth: 860, margin: '0 auto' }}>
      <style>{`@keyframes sk { from{opacity:1} to{opacity:0.45} }`}</style>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span style={{ background: '#1a73e8', color: 'white', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '2px 9px' }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9ca3af' }}>Your alerts, ticket updates, invoice notices and more</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', background: 'white', border: '1px solid gainsboro',
              borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: '#374151', fontFamily: 'inherit', transition: 'all 0.13s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.color = '#1a73e8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'gainsboro'; e.currentTarget.style.color = '#374151' }}
          >
            <Ic d="M5 13l4 4L19 7" size={14} color="currentColor" sw={2} />
            Mark all as read
          </button>
        )}
      </div>

      {/* ── Filters bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        {/* Read/Unread tabs */}
        <div style={{ display: 'flex', gap: 0, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 3 }}>
          {READ_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setReadFilter(t.id)}
              style={{
                padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: readFilter === t.id ? 600 : 400, fontFamily: 'inherit',
                background: readFilter === t.id ? '#1a73e8' : 'transparent',
                color: readFilter === t.id ? 'white' : '#6b7280',
                transition: 'all 0.13s',
              }}
              onMouseEnter={e => { if (readFilter !== t.id) { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#1a73e8' } }}
              onMouseLeave={e => { if (readFilter !== t.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' } }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            border: '1px solid gainsboro', borderRadius: 7, padding: '7px 32px 7px 10px',
            fontSize: 13, outline: 'none', background: 'white', color: '#374151',
            fontFamily: 'inherit', cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          <option value="all">All types</option>
          {ALL_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_CFG[t].label} — {t.replace(/([A-Z])/g, ' $1').trim()}</option>
          ))}
        </select>
      </div>

      {/* ── Notification list card ── */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>

        {/* Loading skeleton */}
        {loading && (
          <div style={{ padding: '0' }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f3f4f6', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3f4f6', flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Sk h={13} w="45%" />
                  <Sk h={11} w="75%" />
                  <Sk h={10} w="25%" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && visible.length === 0 && (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Ic
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                size={24} color="#9ca3af" sw={1.6}
              />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              {readFilter === 'unread' ? 'No unread notifications' : readFilter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              {readFilter === 'unread'
                ? "You're all caught up! New alerts, ticket updates and payment notices will appear here."
                : "Notifications from tickets, invoices, alerts, and renewals will show up here."}
            </div>
            {readFilter !== 'all' && (
              <button
                onClick={() => setReadFilter('all')}
                style={{ marginTop: 14, padding: '7px 18px', border: '1px solid gainsboro', borderRadius: 7, background: 'white', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}
              >
                View all notifications
              </button>
            )}
          </div>
        )}

        {/* Notifications */}
        {!loading && visible.map(n => (
          <NotifRow
            key={n._id}
            n={n}
            onMarkRead={handleMarkRead}
            onDismiss={handleDismiss}
            navigate={navigate}
          />
        ))}

        {/* Load more */}
        {!loading && pagination && pagination.page < pagination.pages && typeFilter === 'all' && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                padding: '8px 24px', border: '1px solid gainsboro', borderRadius: 7,
                background: 'white', fontSize: 13, fontWeight: 500, cursor: loadingMore ? 'not-allowed' : 'pointer',
                color: '#374151', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
                opacity: loadingMore ? 0.6 : 1,
              }}
              onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.borderColor = '#1a73e8' }}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'gainsboro'}
            >
              {loadingMore
                ? <><svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="#6b7280" strokeWidth={2.2} style={{ animation: 'spin 0.7s linear infinite' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Loading…</>
                : `Load more  (${pagination.total - notifs.length} remaining)`}
            </button>
          </div>
        )}

        {/* Pagination summary */}
        {!loading && visible.length > 0 && (
          <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              Showing {visible.length} of {typeFilter !== 'all' ? `${visible.length} filtered` : (pagination?.total ?? visible.length)} notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                <span style={{ fontWeight: 600, color: '#1a73e8' }}>{unreadCount}</span> unread
              </span>
            )}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
