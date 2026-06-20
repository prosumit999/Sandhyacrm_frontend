import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import {
  portalNotifsApi,
  portalMarkNotifReadApi,
  portalMarkAllNotifsReadApi,
  portalDismissNotifApi,
} from '../../api/portalApi'

// ── helpers ───────────────────────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d)
  if (diff < 60000)       return 'Just now'
  if (diff < 3600000)     return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000)    return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000)   return `${Math.floor(diff / 86400000)}d ago`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Type config ────────────────────────────────────────────────────────────────
const TYPE_CFG = {
  InvoiceCreated:  { label: 'Invoice',  color: '#16a34a', bg: '#f0fdf4', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  TicketReplied:   { label: 'Ticket',   color: '#1a73e8', bg: '#eff6ff', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  TicketResolved:  { label: 'Resolved', color: '#7c3aed', bg: '#f5f3ff', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  AlertCreated:    { label: 'Alert',    color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  RenewalReminder: { label: 'Renewal',  color: '#0891b2', bg: '#ecfeff', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  MessageReceived: { label: 'Message',  color: '#0ea5e9', bg: '#f0f9ff', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  Custom:          { label: 'Notice',   color: '#64748b', bg: '#f8fafc', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
}

function Ic({ d, size = 15, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  check:   'M5 13l4 4L19 7',
  dismiss: 'M18 6L6 18M6 6l12 12',
  bell:    'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  arrow:   'M9 5l7 7-7 7',
  refresh: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
}

// ── Skeleton row ──────────────────────────────────────────────────────────────
function SkRow() {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3f4f6', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ height: 13, width: '55%', borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate' }} />
        <div style={{ height: 11, width: '80%', borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate' }} />
      </div>
    </div>
  )
}

// ── Notification row ──────────────────────────────────────────────────────────
function NotifRow({ n, onMarkRead, onDismiss, onNavigate }) {
  const [hov, setHov] = useState(false)
  const cfg = TYPE_CFG[n.type] || TYPE_CFG.Custom

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', gap: 12, padding: '14px 16px',
        borderBottom: '1px solid #f3f4f6',
        background: n.isRead ? 'white' : `${cfg.color}06`,
        borderLeft: `3px solid ${n.isRead ? 'transparent' : cfg.color}`,
        transition: 'background 0.1s',
        cursor: n.link ? 'pointer' : 'default',
        position: 'relative',
      }}
      onClick={() => n.link && onNavigate(n)}
    >
      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ic d={cfg.icon} size={16} color={cfg.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: n.isRead ? 500 : 700, color: '#111827', lineHeight: 1.3 }}>
            {n.title}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>{n.message}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />}
        </div>
      </div>

      {/* Hover actions */}
      {hov && (
        <div
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}
          onClick={e => e.stopPropagation()}
        >
          {!n.isRead && (
            <button
              onClick={() => onMarkRead(n._id)}
              title="Mark as read"
              style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <Ic d={ICONS.check} size={12} color="#16a34a" />
              Read
            </button>
          )}
          <button
            onClick={() => onDismiss(n._id)}
            title="Dismiss"
            style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <Ic d={ICONS.dismiss} size={12} color="#9ca3af" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function PortalNotifications() {
  const navigate = useNavigate()
  const { onNotifUnreadChange: onUnreadChange } = useOutletContext() || {}

  const [notifs,     setNotifs]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [loadingMore,setLoadingMore] = useState(false)
  const [unreadCount,setUnreadCount] = useState(0)
  const [filter,     setFilter]     = useState('all') // 'all' | 'unread' | 'read'
  const [page,       setPage]       = useState(1)
  const [hasMore,    setHasMore]    = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const buildParams = (pg = 1, f = filter) => {
    const p = { page: pg, limit: 20 }
    if (f === 'unread') p.isRead = false
    if (f === 'read')   p.isRead = true
    return p
  }

  const load = useCallback(async (f = filter) => {
    setLoading(true)
    try {
      const res = await portalNotifsApi(buildParams(1, f))
      const d = res.data
      setNotifs(d.data || [])
      setUnreadCount(d.unreadCount || 0)
      onUnreadChange?.(d.unreadCount || 0)
      setHasMore((d.pagination?.page || 1) < (d.pagination?.totalPages || 1))
      setPage(1)
    } catch {}
    finally { setLoading(false) }
  }, [filter]) // eslint-disable-line

  useEffect(() => { load(filter) }, [filter]) // eslint-disable-line

  const loadMore = async () => {
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const res = await portalNotifsApi(buildParams(nextPage))
      const d = res.data
      setNotifs(prev => [...prev, ...(d.data || [])])
      setHasMore(nextPage < (d.pagination?.totalPages || 1))
      setPage(nextPage)
    } catch {}
    finally { setLoadingMore(false) }
  }

  const handleMarkRead = async (id) => {
    try {
      await portalMarkNotifReadApi(id)
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
      const newCount = Math.max(0, unreadCount - 1)
      setUnreadCount(newCount)
      onUnreadChange?.(newCount)
    } catch {}
  }

  const handleDismiss = async (id) => {
    const waUnread = notifs.find(n => n._id === id)?.isRead === false
    try {
      await portalDismissNotifApi(id)
      setNotifs(prev => prev.filter(n => n._id !== id))
      if (waUnread) {
        const newCount = Math.max(0, unreadCount - 1)
        setUnreadCount(newCount)
        onUnreadChange?.(newCount)
      }
    } catch {}
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await portalMarkAllNotifsReadApi()
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      onUnreadChange?.(0)
    } catch {}
    finally { setMarkingAll(false) }
  }

  const handleNavigate = async (n) => {
    if (!n.isRead) await handleMarkRead(n._id)
    navigate(n.link)
  }

  const FILTERS = [
    { id: 'all',    label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'read',   label: 'Read' },
  ]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#111827', maxWidth: 680 }}>
      <style>{`@keyframes sk { from{opacity:1} to{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Notifications</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9ca3af' }}>
            {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={markingAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', border: '1px solid #e5e7eb', background: 'white', borderRadius: 7, fontSize: 12.5, cursor: markingAll ? 'not-allowed' : 'pointer', color: '#374151', fontFamily: 'inherit', opacity: markingAll ? 0.6 : 1 }}>
            <Ic d={ICONS.check} size={13} color="#16a34a" />
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f3f4f6', padding: 4, borderRadius: 8, width: 'fit-content' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: filter === f.id ? 'white' : 'transparent',
              color: filter === f.id ? '#111827' : '#6b7280',
              boxShadow: filter === f.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit',
              transition: 'all 0.12s',
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          [...Array(6)].map((_, i) => <SkRow key={i} />)
        ) : notifs.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Ic d={ICONS.bell} size={22} color="#9ca3af" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              {filter === 'unread' ? 'No unread notifications' : filter === 'read' ? 'No read notifications' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              {filter !== 'all'
                ? <button onClick={() => setFilter('all')} style={{ color: '#1a73e8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>View all notifications</button>
                : "You'll be notified about invoices, ticket updates, and alerts."}
            </div>
          </div>
        ) : (
          <>
            {notifs.map(n => (
              <NotifRow
                key={n._id}
                n={n}
                onMarkRead={handleMarkRead}
                onDismiss={handleDismiss}
                onNavigate={handleNavigate}
              />
            ))}
            {hasMore && (
              <div style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid #f3f4f6' }}>
                <button onClick={loadMore} disabled={loadingMore}
                  style={{ padding: '7px 20px', border: '1px solid #e5e7eb', background: 'white', borderRadius: 7, fontSize: 13, cursor: loadingMore ? 'not-allowed' : 'pointer', color: '#374151', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: loadingMore ? 0.6 : 1 }}>
                  {loadingMore
                    ? <><Ic d={ICONS.refresh} size={13} color="#9ca3af" /> Loading…</>
                    : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
