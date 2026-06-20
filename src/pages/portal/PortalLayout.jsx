import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { usePortal } from '../../context/PortalContext'
import {
  portalLogoutApi, portalUnreadCountApi,
  portalNotifsApi, portalMarkNotifReadApi, portalMarkAllNotifsReadApi,
} from '../../api/portalApi'
import logoSvg from '../../assets/logosvg.svg'

const HEADER_H = 62

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const IC = {
  dashboard:  'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  software:   'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  invoices:   'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  alerts:     'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  tickets:    'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  messages:   'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  team:       'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  logout:        'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu:          'M4 6h16M4 12h16M4 18h16',
  bell:          'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  notifications: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  check:         'M5 13l4 4L19 7',
  close:         'M18 6L6 18M6 6l12 12',
  arrow:         'M9 5l7 7-7 7',
  settings:      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
}

const NAV = [
  { to: '/portal/dashboard',     label: 'Dashboard',       icon: 'dashboard'     },
  { to: '/portal/subscriptions', label: 'My Software',     icon: 'software'      },
  { to: '/portal/invoices',      label: 'Invoices',        icon: 'invoices'      },
  { to: '/portal/alerts',        label: 'Alerts',          icon: 'alerts'        },
  { to: '/portal/tickets',       label: 'Support Tickets', icon: 'tickets'       },
  { to: '/portal/messages',      label: 'Team & Messages', icon: 'team'          },
  { to: '/portal/notifications', label: 'Notifications',   icon: 'notifications' },
  { to: '/portal/settings',     label: 'Settings',         icon: 'settings'      },
]

const PAGE_TITLES = {
  '/portal/dashboard':      'Dashboard',
  '/portal/subscriptions':  'My Software',
  '/portal/invoices':       'Invoices',
  '/portal/alerts':         'Alerts',
  '/portal/notifications':  'Notifications',
  '/portal/tickets':       'Support Tickets',
  '/portal/messages':      'Team & Messages',
  '/portal/team':          'Team & Messages',
  '/portal/settings':     'Settings',
}

function NavItem({ to, label, icon, badge }) {
  const [hovered, setHovered] = useState(false)
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '13px',
        padding: '11px 14px', borderRadius: '10px', textDecoration: 'none',
        fontSize: '14.5px', fontWeight: isActive ? 600 : 400, marginBottom: '2px',
        color: isActive ? 'white' : hovered ? '#1a73e8' : '#475569',
        background: isActive ? '#1a73e8' : hovered ? 'rgba(26,115,232,0.08)' : 'transparent',
        boxShadow: isActive ? '0 4px 14px rgba(26,115,232,0.35)' : 'none',
        transition: 'all 0.15s',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon d={IC[icon]} size={20} />
      <span style={{ whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: 700,
          borderRadius: '10px', minWidth: '18px', height: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
          flexShrink: 0,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}

// ── Notification type colours ─────────────────────────────────────────────────
const NOTIF_CFG = {
  InvoiceCreated:  { color: '#16a34a', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  TicketReplied:   { color: '#1a73e8', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  TicketResolved:  { color: '#7c3aed', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  AlertCreated:    { color: '#d97706', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  RenewalReminder: { color: '#0891b2', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  Custom:          { color: '#64748b', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
}
function tAgo(d) {
  const diff = Date.now() - new Date(d)
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function PortalLayout() {
  const { customer, logout, initializing } = usePortal()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [collapsed,    setCollapsed]    = useState(false)
  const [loggingOut,   setLoggingOut]   = useState(false)
  const [unreadMsgs,   setUnreadMsgs]   = useState(0)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifs,       setNotifs]       = useState([])
  const [notifUnread,  setNotifUnread]  = useState(0)
  const notifRef = useRef(null)

  const fetchUnread = useCallback(() => {
    portalUnreadCountApi().then(r => setUnreadMsgs(r.data.unread || 0)).catch(() => {})
  }, [])

  const fetchNotifs = useCallback(() => {
    portalNotifsApi({ limit: 8 }).then(r => {
      setNotifs(r.data.data || [])
      setNotifUnread(r.data.unreadCount || 0)
    }).catch(() => {})
  }, [])

  // Poll message unread every 20s
  useEffect(() => {
    if (!customer) return
    fetchUnread()
    const isMessagesPage = location.pathname === '/portal/messages'
    if (isMessagesPage) return
    const id = setInterval(fetchUnread, 20000)
    return () => clearInterval(id)
  }, [customer, fetchUnread, location.pathname])

  // Poll notification unread count every 30s
  useEffect(() => {
    if (!customer) return
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [customer, fetchNotifs])

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (initializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'plspin 0.7s linear infinite' }} />
        <style>{`@keyframes plspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!customer) return <Navigate to="/login" replace />

  const handleLogout = async () => {
    setLoggingOut(true)
    try { await portalLogoutApi() } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  const pageTitle = PAGE_TITLES[location.pathname] || 'Customer Portal'

  const hdrIconBtn = {
    background: 'transparent', border: 'none', borderRadius: '8px',
    cursor: 'pointer', color: 'white', padding: '8px',
    display: 'flex', alignItems: 'center', transition: 'background 0.14s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        height: HEADER_H, flexShrink: 0, width: '100%',
        background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
        boxShadow: 'rgb(146 187 241 / 14%) 0px 4px 20px 7px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'relative', zIndex: 30,
        borderBottom: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '20px' }}>
            <img src={logoSvg} alt="Sandhya CRM" style={{ width: '34px', height: '34px', objectFit: 'contain', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'white', letterSpacing: '0.1px', lineHeight: 1.2 }}>Sandhya CRM</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>Customer Portal</div>
            </div>
          </div>

          <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.22)', marginRight: '18px', flexShrink: 0 }} />

          <button
            onClick={() => setCollapsed(v => !v)}
            style={hdrIconBtn}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon d={IC.menu} size={20} />
          </button>

          <span style={{ marginLeft: '10px', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.1px' }}>
            {pageTitle}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* ── Bell button + dropdown ── */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setNotifOpen(v => !v); if (!notifOpen) fetchNotifs() }}
              style={{ ...hdrIconBtn, position: 'relative' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon d={IC.bell} size={20} />
              {notifUnread > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 700,
                  borderRadius: 10, minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 3px', border: '2px solid #1a73e8',
                }}>
                  {notifUnread > 9 ? '9+' : notifUnread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                width: 340, background: 'white', borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 200,
                border: '1px solid #e5e7eb', overflow: 'hidden',
                fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
              }}>
                {/* Dropdown header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>
                    Notifications {notifUnread > 0 && <span style={{ fontSize: 11, background: '#ef4444', color: 'white', borderRadius: 4, padding: '1px 5px', marginLeft: 4 }}>{notifUnread}</span>}
                  </span>
                  {notifUnread > 0 && (
                    <button onClick={async () => {
                      await portalMarkAllNotifsReadApi().catch(() => {})
                      setNotifs(p => p.map(n => ({ ...n, isRead: true })))
                      setNotifUnread(0)
                    }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11.5, color: '#1a73e8', fontFamily: 'inherit' }}>
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notification list */}
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      <Icon d={IC.bell} size={28} />
                      <div style={{ marginTop: 8 }}>No notifications yet</div>
                    </div>
                  ) : notifs.map(n => {
                    const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.Custom
                    return (
                      <div key={n._id}
                        onClick={async () => {
                          if (!n.isRead) {
                            await portalMarkNotifReadApi(n._id).catch(() => {})
                            setNotifs(p => p.map(x => x._id === n._id ? { ...x, isRead: true } : x))
                            setNotifUnread(c => Math.max(0, c - 1))
                          }
                          setNotifOpen(false)
                          if (n.link) navigate(n.link)
                        }}
                        style={{
                          display: 'flex', gap: 10, padding: '10px 14px',
                          borderBottom: '1px solid #f9fafb',
                          background: n.isRead ? 'white' : `${cfg.color}07`,
                          borderLeft: `3px solid ${n.isRead ? 'transparent' : cfg.color}`,
                          cursor: n.link ? 'pointer' : 'default',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'white' : `${cfg.color}07`}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                          background: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d={cfg.icon} />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: n.isRead ? 500 : 700, color: '#111827', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                            {n.message}
                          </div>
                          <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{tAgo(n.createdAt)}</div>
                        </div>
                        {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 6 }} />}
                      </div>
                    )
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
                  <button onClick={() => { setNotifOpen(false); navigate('/portal/notifications') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, color: '#1a73e8', fontFamily: 'inherit', fontWeight: 500 }}>
                    View all notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'white', lineHeight: 1.2 }}>{customer.name}</div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.6)' }}>{customer.businessName || customer.email}</div>
          </div>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)', border: '2px solid rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'white' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: collapsed ? 0 : 248, minWidth: collapsed ? 0 : 248,
          height: '100%', background: 'white',
          boxShadow: '4px 0 20px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'width 0.22s ease, min-width 0.22s ease', zIndex: 20,
        }}>
          <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 0', scrollbarWidth: 'none' }}>
            {NAV.map(item => (
              <NavItem
                key={item.to}
                {...item}
                badge={
                  item.to === '/portal/messages'      ? unreadMsgs :
                  item.to === '/portal/notifications' ? notifUnread :
                  0
                }
              />
            ))}
          </nav>

          {/* User card */}
          <div style={{ padding: '14px', flexShrink: 0, background: 'rgba(248,250,255,0.9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, boxShadow: '0 2px 8px rgba(26,115,232,0.3)',
              }}>
                <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {customer.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {customer.email}
                </div>
              </div>
              <button
                title="Sign out"
                onClick={handleLogout}
                disabled={loggingOut}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '6px', borderRadius: '6px', display: 'flex', flexShrink: 0, transition: 'color 0.12s, background 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none' }}
              >
                <Icon d={IC.logout} size={17} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 30px' }}>
          <Outlet context={{ onUnreadChange: setUnreadMsgs, onNotifUnreadChange: setNotifUnread }} />
        </main>
      </div>

      <style>{`@keyframes plspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
