import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { usePortal } from '../../context/PortalContext'
import { portalLogoutApi } from '../../api/portalApi'
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
  logout:     'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  menu:       'M4 6h16M4 12h16M4 18h16',
}

const NAV = [
  { to: '/portal/dashboard',     label: 'Dashboard',       icon: 'dashboard' },
  { to: '/portal/subscriptions', label: 'My Software',     icon: 'software'  },
  { to: '/portal/invoices',      label: 'Invoices',        icon: 'invoices'  },
  { to: '/portal/alerts',        label: 'Alerts',          icon: 'alerts'    },
  { to: '/portal/tickets',       label: 'Support Tickets', icon: 'tickets'   },
  { to: '/portal/messages',      label: 'Messages',        icon: 'messages'  },
  { to: '/portal/team',          label: 'My Team',         icon: 'team'      },
]

const PAGE_TITLES = {
  '/portal/dashboard':     'Dashboard',
  '/portal/subscriptions': 'My Software',
  '/portal/invoices':      'Invoices',
  '/portal/alerts':        'Alerts',
  '/portal/tickets':       'Support Tickets',
  '/portal/messages':      'Messages',
  '/portal/team':          'My Team',
}

function NavItem({ to, label, icon }) {
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
    </NavLink>
  )
}

export default function PortalLayout() {
  const { customer, logout, initializing } = usePortal()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

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
            {NAV.map(item => <NavItem key={item.to} {...item} />)}
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
          <Outlet />
        </main>
      </div>

      <style>{`@keyframes plspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
