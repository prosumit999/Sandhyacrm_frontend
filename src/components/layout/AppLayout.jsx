import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useState, useRef, useEffect, useCallback } from 'react'
import { logoutUser } from '../../store/slices/authSlice'
import { useChatContext } from '../../context/ChatContext'
import logoSvg from '../../assets/logosvg.svg'
import {
  getMyNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  dismissNotificationApi,
} from '../../api/notificationApi'

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const IC = {
  dashboard:      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  customers:      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  softwares:      'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  subscriptions:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  invoices:       'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  tickets:        'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  alerts:         'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  communications: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  reports:        'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  users:          'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  audit:          'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  teams:          'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  settings:       'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  logout:         'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  bell:           'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  menu:           'M4 6h16M4 12h16M4 18h16',
  phone:          'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail:           'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  dept:           'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
}

const HEADER_H = 62

// ── Admin / SuperAdmin nav ─────────────────────────────────────────────────────
const ADMIN_OVERVIEW_NAV = [
  { to: '/dashboard',      label: 'Dashboard',      icon: 'dashboard' },
  { to: '/customers',      label: 'Customers',      icon: 'customers' },
  { to: '/softwares',      label: 'Softwares',      icon: 'softwares' },
  { to: '/subscriptions',  label: 'Subscriptions',  icon: 'subscriptions' },
  { to: '/invoices',       label: 'Invoices',       icon: 'invoices' },
  { to: '/tickets',        label: 'Support Tickets',icon: 'tickets' },
  { to: '/alerts',         label: 'Alerts',         icon: 'alerts' },
  { to: '/communications', label: 'Communications', icon: 'communications' },
]
const ADMIN_NAV = [
  { to: '/reports', label: 'Reports',         icon: 'reports' },
  { to: '/users',   label: 'User Management', icon: 'users' },
  { to: '/teams',   label: 'Teams',           icon: 'teams' },
  { to: '/audit',   label: 'Audit Logs',      icon: 'audit' },
]

// ── Standard user nav ─────────────────────────────────────────────────────────
const STD_OVERVIEW_NAV = [
  { to: '/dashboard',  label: 'Dashboard',    icon: 'dashboard' },
  { to: '/customers',  label: 'My Customers', icon: 'customers' },
]
const STD_WORK_NAV = [
  { to: '/tickets', label: 'Support Tickets', icon: 'tickets' },
]
const STD_COMMS_NAV = [
  { to: '/alerts',         label: 'Alerts',         icon: 'alerts' },
  { to: '/communications', label: 'Communications', icon: 'communications' },
]
const ROLE_BADGE = {
  SuperAdmin: { bg: '#eff6ff', color: '#1a73e8' },
  Admin:      { bg: '#eff6ff', color: '#1a73e8' },
  Standard:   { bg: '#eff6ff', color: '#1a73e8' },
}
const PAGE_TITLES = {
  '/dashboard': 'Dashboard', '/customers': 'Customers', '/softwares': 'Softwares',
  '/subscriptions': 'Subscriptions', '/invoices': 'Invoices', '/tickets': 'Support Tickets',
  '/alerts': 'Alerts', '/communications': 'Communications', '/reports': 'Reports',
  '/users': 'User Management', '/users/new': 'Create User', '/teams': 'Teams', '/audit': 'Audit Logs',
  '/notifications': 'Notifications', '/settings': 'Settings',
}

// ── Nav item ──────────────────────────────────────────────────────────────────
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
        background: isActive
          ? '#1a73e8'
          : hovered ? 'rgba(26,115,232,0.08)' : 'transparent',
        boxShadow: isActive ? '0 4px 14px rgba(26,115,232,0.35)' : 'none',
        transition: 'all 0.15s',
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon d={IC[icon]} size={20} />
      <span style={{ whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
      {badge > 0 && (
        <div style={{
          background: '#ef4444', color: '#fff', borderRadius: 10,
          minWidth: 18, height: 18, fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', flexShrink: 0,
        }}>
          {badge > 9 ? '9+' : badge}
        </div>
      )}
    </NavLink>
  )
}

function SectionLabel({ text }) {
  return (
    <div style={{ padding: '12px 14px 5px', fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', letterSpacing: '0.9px', textTransform: 'uppercase' }}>
      {text}
    </div>
  )
}

// ── Profile / settings dropdown ───────────────────────────────────────────────
function SettingsDropdown({ user, onLogout, onClose }) {
  const navigate  = useNavigate()
  const ref       = useRef(null)
  const roleStyle = ROLE_BADGE[user?.role] || ROLE_BADGE.Standard

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  const MenuItem = ({ icon, label, action, danger }) => {
    const [h, setH] = useState(false)
    return (
      <button
        onClick={() => { onClose(); action() }}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 14px', background: h ? (danger ? '#fef2f2' : '#f5f8ff') : 'none',
          border: 'none', borderRadius: '8px', cursor: 'pointer',
          fontSize: '13.5px', color: danger ? '#dc2626' : '#374151',
          fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.12s',
        }}
      >
        <Icon d={IC[icon]} size={16} />
        {label}
      </button>
    )
  }

  return (
    <div ref={ref} style={{
      position: 'fixed', top: HEADER_H + 8, right: 16, width: 272,
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '14px',
      boxShadow: '0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 999, overflow: 'hidden',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{ padding: '18px 16px 14px', background: 'linear-gradient(135deg, #eff6ff 0%, #f8faff 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 3px 10px rgba(26,115,232,0.35)',
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{user?.name}</div>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px',
              background: roleStyle.bg, color: roleStyle.color, display: 'inline-block', marginTop: '3px',
            }}>{user?.role}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {user?.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon d={IC.mail} size={14} />
              <span style={{ fontSize: '12.5px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
            </div>
          )}
          {user?.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon d={IC.phone} size={14} />
              <span style={{ fontSize: '12.5px', color: '#6b7280' }}>{user.phone}</span>
            </div>
          )}
          {user?.department && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon d={IC.dept} size={14} />
              <span style={{ fontSize: '12.5px', color: '#6b7280' }}>{user.department}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '8px' }}>
        <MenuItem icon="settings" label="Account Settings" action={() => navigate('/settings')} />
        <MenuItem icon="bell"     label="Notifications"    action={() => navigate('/notifications')} />
      </div>
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '0 10px' }} />
      <div style={{ padding: '8px' }}>
        <MenuItem icon="logout" label="Sign out" action={onLogout} danger />
      </div>
    </div>
  )
}

// ── Notification type config ──────────────────────────────────────────────────
const NOTIF_CFG = {
  SubscriptionRenewal: { color: '#16a34a', bg: '#f0fdf4', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  PaymentOverdue:      { color: '#dc2626', bg: '#fef2f2', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  DomainExpiry:        { color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  HostingExpiry:       { color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  SSLExpiry:           { color: '#d97706', bg: '#fffbeb', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  TicketAssigned:      { color: '#1a73e8', bg: '#eff6ff', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  TicketReplied:       { color: '#1a73e8', bg: '#eff6ff', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
  TicketResolved:      { color: '#16a34a', bg: '#f0fdf4', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  InvoiceCreated:      { color: '#7c3aed', bg: '#f5f3ff', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  AlertTriggered:      { color: '#ea580c', bg: '#fff7ed', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  Custom:              { color: '#6b7280', bg: '#f9fafb', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Map a stored notification link to a valid app route.
// Stale DB records may contain paths like /alerts/:id which have no route.
const VALID_PREFIXES = ['/tickets/', '/customers/', '/subscriptions/', '/invoices/']
const SECTION_ROOTS  = { alerts: '/alerts', invoices: '/invoices', subscriptions: '/subscriptions', customers: '/customers', tickets: '/tickets', notifications: '/notifications' }
function safeLink(link) {
  if (!link) return null
  const path = link.split('?')[0]
  if (VALID_PREFIXES.some(p => path.startsWith(p))) return link
  const section = path.replace(/^\//, '').split('/')[0]
  return SECTION_ROOTS[section] ?? link
}

// ── Notification Dropdown ─────────────────────────────────────────────────────
function NotificationDropdown({ notifs, unreadCount, onClose, onMarkRead, onMarkAllRead, onDismiss, navigate }) {
  const ref = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [onClose])

  const handleClick = async (n) => {
    if (!n.isRead) await onMarkRead(n._id)
    if (n.link) { onClose(); navigate(safeLink(n.link)) }
  }

  return (
    <div ref={ref} style={{
      position: 'fixed', top: HEADER_H + 8, right: 16,
      width: 380, maxHeight: 520,
      background: 'rgba(255,255,255,0.98)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 14,
      boxShadow: '0 12px 40px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)',
      zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: '#1a73e8', color: 'white', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            style={{ fontSize: 12, color: '#1a73e8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: 5, fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width={22} height={22} fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d={IC.bell} />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 4 }}>All caught up!</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>No notifications yet.</div>
          </div>
        ) : (
          notifs.map((n, i) => {
            const cfg = NOTIF_CFG[n.type] || NOTIF_CFG.Custom
            return (
              <div
                key={n._id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 11,
                  padding: '11px 14px',
                  borderBottom: i < notifs.length - 1 ? '1px solid #f9fafb' : 'none',
                  background: n.isRead ? 'white' : '#f8faff',
                  cursor: n.link ? 'pointer' : 'default',
                  transition: 'background 0.12s',
                }}
                onClick={() => handleClick(n)}
                onMouseEnter={e => { if (n.link) e.currentTarget.style.background = n.isRead ? '#f9fafb' : '#eff6ff' }}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'white' : '#f8faff'}
              >
                {/* Icon */}
                <div style={{ width: 34, height: 34, borderRadius: 9, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth={1.9}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
                  </svg>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: '#111827', lineHeight: 1.35 }}>{n.title}</div>
                    {!n.isRead && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#1a73e8', flexShrink: 0, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); onDismiss(n._id) }}
                  title="Dismiss"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 3, borderRadius: 5, display: 'flex', flexShrink: 0, marginTop: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = '#f3f4f6' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#d1d5db'; e.currentTarget.style.background = 'none' }}
                >
                  <svg width={13} height={13} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid #f3f4f6', flexShrink: 0, textAlign: 'center' }}>
        <button
          onClick={() => { onClose(); navigate('/notifications') }}
          style={{ fontSize: 12.5, color: '#1a73e8', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 10px', borderRadius: 5 }}
          onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          View all notifications
        </button>
      </div>
    </div>
  )
}

// ── Root layout ───────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user }  = useSelector(s => s.auth)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [collapsed,    setCollapsed]    = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [notifs,       setNotifs]       = useState([])
  const [unreadCount,  setUnreadCount]  = useState(0)
  const { chatUnread } = useChatContext() || { chatUnread: 0 }

  const isAdmin  = ['Admin', 'SuperAdmin'].includes(user?.role)
  const pageTitle = PAGE_TITLES[location.pathname] || 'Sandhya CRM'

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getMyNotificationsApi()
      setNotifs(res.data.data || [])
      setUnreadCount(res.data.unreadCount || 0)
    } catch {}
  }, [])

  // Poll every 30s for unread count
  useEffect(() => {
    if (!user) return
    fetchNotifs()
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [user, fetchNotifs])

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
      const dismissed = notifs.find(n => n._id === id)
      setNotifs(prev => prev.filter(n => n._id !== id))
      if (dismissed && !dismissed.isRead) setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleLogout = async () => {
    setSettingsOpen(false)
    await dispatch(logoutUser())
    navigate('/login')
  }

  const hdrIconBtn = (active) => ({
    background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    color: 'white', padding: '8px', display: 'flex', alignItems: 'center',
    transition: 'background 0.14s',
  })

  return (
    // ── Outer: column layout so header is truly full width ──
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ════════════════════════════════════════════════
          FULL-WIDTH BLUE HEADER — spans sidebar + content
          ════════════════════════════════════════════════ */}
      <header style={{
        height: HEADER_H, flexShrink: 0, width: '100%',
        background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
        boxShadow: 'rgb(146 187 241 / 14%) 0px 4px 20px 7px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'relative', zIndex: 30,
        borderBottom: '1px solid white', borderRadius: '0px', margin: '0px auto',
      }}>

        {/* LEFT — brand + divider + toggle + page title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '20px' }}>
            <img src={logoSvg} alt="Sandhya CRM" style={{ width: '34px', height: '34px', objectFit: 'contain', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'white', letterSpacing: '0.1px', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                Sandhya CRM
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
                Internal Portal
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.22)', marginRight: '18px', flexShrink: 0 }} />

          {/* Sidebar toggle */}
          <button
            onClick={() => setCollapsed(v => !v)}
            style={hdrIconBtn(false)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon d={IC.menu} size={20} />
          </button>

          {/* Page title */}
          <span style={{ marginLeft: '10px', fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.1px' }}>
            {pageTitle}
          </span>
        </div>

        {/* RIGHT — bell + settings + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Notification bell */}
          <button
            title="Notifications"
            onClick={() => { setNotifOpen(v => !v); setSettingsOpen(false) }}
            style={{ ...hdrIconBtn(notifOpen), position: 'relative' }}
            onMouseEnter={e => { if (!notifOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.background = 'transparent' }}
          >
            <Icon d={IC.bell} size={20} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: 2, right: 2,
                background: '#ef4444', color: '#fff',
                borderRadius: '50%', minWidth: 16, height: 16,
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px', pointerEvents: 'none',
                border: '1.5px solid rgba(255,255,255,0.3)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>

          <button
            title="Settings & Profile"
            onClick={() => { setSettingsOpen(v => !v); setNotifOpen(false) }}
            style={hdrIconBtn(settingsOpen)}
            onMouseEnter={e => { if (!settingsOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { if (!settingsOpen) e.currentTarget.style.background = settingsOpen ? 'rgba(255,255,255,0.22)' : 'transparent' }}
          >
            <Icon d={IC.settings} size={20} />
          </button>

          <div
            onClick={() => { setSettingsOpen(v => !v); setNotifOpen(false) }}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              border: '2px solid rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: '6px', cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.14s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.32)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>

        {/* Dropdowns */}
        {notifOpen && (
          <NotificationDropdown
            notifs={notifs}
            unreadCount={unreadCount}
            onClose={() => setNotifOpen(false)}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onDismiss={handleDismiss}
            navigate={navigate}
          />
        )}
        {settingsOpen && (
          <SettingsDropdown user={user} onLogout={handleLogout} onClose={() => setSettingsOpen(false)} />
        )}
      </header>

      {/* ════════════════════════════════════════
          BODY ROW — sidebar | content
          ════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'white' }}>

        {/* ── Sidebar (below header) ── */}
        <aside style={{
          width: collapsed ? 0 : 248,
          minWidth: collapsed ? 0 : 248,
          height: '100%',
          background: 'white',
          boxShadow: '4px 0 20px rgba(0,0,0,0.06)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.22s ease, min-width 0.22s ease',
          zIndex: 20,
        }}>

          {/* Nav items */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 10px 0', scrollbarWidth: 'none' }}>
            {isAdmin ? (
              /* ── Admin / SuperAdmin navigation ── */
              <>
                <SectionLabel text="Overview" />
                {ADMIN_OVERVIEW_NAV.map(item => (
                  <NavItem key={item.to} {...item} badge={item.to === '/communications' ? chatUnread : 0} />
                ))}
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 4px' }} />
                <SectionLabel text="Admin" />
                {ADMIN_NAV.map(item => <NavItem key={item.to} {...item} />)}
              </>
            ) : (
              /* ── Standard user navigation ── */
              <>
                <SectionLabel text="Overview" />
                {STD_OVERVIEW_NAV.map(item => <NavItem key={item.to} {...item} />)}
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 4px' }} />
                <SectionLabel text="Work" />
                {STD_WORK_NAV.map(item => <NavItem key={item.to} {...item} />)}
                <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 4px' }} />
                <SectionLabel text="Communication" />
                {STD_COMMS_NAV.map(item => (
                  <NavItem key={item.to} {...item} badge={item.to === '/communications' ? chatUnread : 0} />
                ))}
              </>
            )}
            <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '10px 4px' }} />
            <SectionLabel text="Account" />
            <NavItem to="/settings" label="Settings" icon="settings" />
          </nav>

          {/* User card at bottom */}
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
                  {user?.name}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
              <button
                title="Sign out"
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '6px', borderRadius: '6px', display: 'flex', flexShrink: 0, transition: 'color 0.12s, background 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none' }}
              >
                <Icon d={IC.logout} size={17} />
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 30px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
