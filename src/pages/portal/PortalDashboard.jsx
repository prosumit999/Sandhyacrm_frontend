import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalDashboardApi } from '../../api/portalApi'
import { usePortal } from '../../context/PortalContext'

const fmtINR = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const IC = {
  software: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  invoices: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  alerts:   'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  tickets:  'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  messages: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
}

function StatCard({ icon, label, value, sub, to, color = '#1a73e8', badge }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  const bg  = color + '12'
  const bdr = color + '30'
  return (
    <div
      onClick={() => to && navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white',
        border: `1px solid ${hov ? bdr : 'gainsboro'}`,
        borderRadius: '10px',
        padding: '20px 22px',
        cursor: to ? 'pointer' : 'default',
        boxShadow: hov ? `0 4px 18px ${color}18` : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
        transform: hov && to ? 'translateY(-2px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle colour accent bar at top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '10px 10px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d={IC[icon]} />
          </svg>
        </div>
        {badge > 0 && (
          <span style={{ background: color, color: 'white', fontSize: '10px', fontWeight: 700, borderRadius: '10px', padding: '2px 7px', flexShrink: 0 }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        {to && !badge && (
          <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2} style={{ opacity: hov ? 0.7 : 0, transition: 'opacity 0.15s', flexShrink: 0, marginTop: '2px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d={IC.arrow} />
          </svg>
        )}
      </div>

      <div style={{ fontSize: '30px', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: '5px', letterSpacing: '-1px' }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{label}</div>
      {sub && <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function PortalDashboard() {
  const { customer } = usePortal()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalDashboardApi()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const activeSubs    = data?.subscriptions?.active  ?? '—'
  const totalSubs     = data?.subscriptions?.total   ?? 0
  const totalInvoices = data?.invoices?.total        ?? '—'
  const pendingInv    = data?.invoices?.pending      ?? 0
  const openAlerts    = data?.alerts?.total          ?? '—'
  const urgentAlerts  = data?.alerts?.urgent         ?? 0
  const openTickets   = data?.tickets?.open          ?? '—'
  const totalTickets  = data?.tickets?.total         ?? 0
  const unreadMsgs    = data?.unreadMessages         ?? '—'

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
          Welcome back, {customer?.name?.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{today}</p>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard
          icon="software"
          label="Active Subscriptions"
          value={activeSubs}
          sub={totalSubs > 0 ? `${totalSubs} total subscription${totalSubs !== 1 ? 's' : ''}` : undefined}
          to="/portal/subscriptions"
          color="#16a34a"
        />
        <StatCard
          icon="invoices"
          label="Total Invoices"
          value={totalInvoices}
          sub={pendingInv > 0 ? `${pendingInv} pending payment` : 'All paid'}
          to="/portal/invoices"
          color="#1a73e8"
        />
        <StatCard
          icon="alerts"
          label="Open Alerts"
          value={openAlerts}
          sub={urgentAlerts > 0 ? `${urgentAlerts} urgent / warning` : 'No urgent alerts'}
          to="/portal/alerts"
          color={urgentAlerts > 0 ? '#dc2626' : '#d97706'}
          badge={urgentAlerts > 0 ? urgentAlerts : 0}
        />
        <StatCard
          icon="tickets"
          label="Open Tickets"
          value={openTickets}
          sub={totalTickets > 0 ? `${totalTickets} total ticket${totalTickets !== 1 ? 's' : ''}` : 'No tickets yet'}
          to="/portal/tickets"
          color="#ea580c"
          badge={typeof openTickets === 'number' && openTickets > 0 ? openTickets : 0}
        />
        <StatCard
          icon="messages"
          label="Unread Messages"
          value={unreadMsgs}
          sub={typeof unreadMsgs === 'number' && unreadMsgs > 0 ? 'Tap to read your messages' : 'No unread messages'}
          to="/portal/messages"
          color="#7c3aed"
          badge={typeof unreadMsgs === 'number' && unreadMsgs > 0 ? unreadMsgs : 0}
        />
      </div>

      {/* Quick links */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '10px', padding: '20px 22px' }}>
        <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '16px' }}>
          Quick Access
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {[
            { to: '/portal/subscriptions', label: 'My Software',     icon: 'software', color: '#16a34a' },
            { to: '/portal/invoices',      label: 'Invoices',        icon: 'invoices', color: '#1a73e8' },
            { to: '/portal/alerts',        label: 'Alerts',          icon: 'alerts',   color: '#d97706' },
            { to: '/portal/tickets',       label: 'Support Tickets', icon: 'tickets',  color: '#ea580c' },
            { to: '/portal/messages',      label: 'Team Messages',   icon: 'messages', color: '#7c3aed' },
          ].map(item => (
            <QuickLink key={item.to} {...item} />
          ))}
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, label, icon, color }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={() => navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '10px 13px', border: `1px solid ${hov ? color + '50' : '#e2e8f0'}`,
        borderRadius: '8px', background: hov ? color + '08' : 'white',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.13s', fontFamily: 'inherit',
      }}
    >
      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={15} height={15} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d={IC[icon]} />
        </svg>
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? color : '#334155' }}>{label}</span>
    </button>
  )
}
