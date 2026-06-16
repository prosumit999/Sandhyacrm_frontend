import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  getKPIsApi, getUpcomingRenewalsApi, getAlertSummaryApi,
  getRecentActivityApi, getSoftwareStatusApi, getInfraAlertsApi,
  getMyOverviewApi,
} from '../../api/dashboardApi'

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtINR  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const fmtNum  = n => new Intl.NumberFormat('en-IN').format(n || 0)
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const timeAgo = d => {
  if (!d) return ''
  const diff = Math.floor((Date.now() - new Date(d)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000)

// ── Tiny SVG icon ─────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, sw = 1.8, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={sw} style={{ flexShrink: 0 }}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)
const P = {
  customers:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  subscriptions: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  revenue:       'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  tickets:       'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  alerts:        'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  invoices:      'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  users:         'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  comms:         'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  arrow:         'M13 7l5 5m0 0l-5 5m5-5H6',
  reports:       'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 14, w = '100%', r = 4 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate' }} />
)

// ── Days badge ────────────────────────────────────────────────────────────────
function DaysBadge({ days }) {
  const base = { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }
  if (days <= 0)  return <span style={{ ...base, background: '#fef2f2', color: '#dc2626' }}>Overdue</span>
  if (days <= 7)  return <span style={{ ...base, background: '#fef2f2', color: '#dc2626' }}>{days}d left</span>
  if (days <= 30) return <span style={{ ...base, background: '#fffbeb', color: '#b45309' }}>{days}d left</span>
  return           <span style={{ ...base, background: '#f0fdf4', color: '#16a34a' }}>{days}d left</span>
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = { Active: ['#16a34a', '#f0fdf4'], Expired: ['#dc2626', '#fef2f2'], Pending: ['#b45309', '#fffbeb'], Inactive: ['#6b7280', '#f3f4f6'] }
  const [c, b] = map[status] || ['#6b7280', '#f3f4f6']
  return <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: b, color: c }}>{status}</span>
}

function ActionBadge({ action }) {
  const map = { CREATE: ['#16a34a', '#f0fdf4'], UPDATE: ['#1a73e8', '#eff6ff'], DELETE: ['#dc2626', '#fef2f2'] }
  const [c, b] = map[action] || ['#6b7280', '#f3f4f6']
  return <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: b, color: c }}>{action}</span>
}

// ── Reusable section card ─────────────────────────────────────────────────────
function Panel({ title, subtitle, action, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px', borderBottom: '1px solid gainsboro' }}>
        <div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── View all link ─────────────────────────────────────────────────────────────
const ViewAll = ({ to, nav }) => (
  <button onClick={() => nav(to)}
    style={{ fontSize: '12px', color: '#1a73e8', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}
    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
    onMouseLeave={e => e.currentTarget.style.background = 'none'}>
    View all <Ic d={P.arrow} size={12} color="#1a73e8" />
  </button>
)

// ── Table primitives ──────────────────────────────────────────────────────────
const TH = ({ children, right }) => (
  <th style={{ padding: '8px 16px', textAlign: right ? 'right' : 'left', fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid gainsboro', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
    {children}
  </th>
)
const TD = ({ children, sub, right }) => (
  <td style={{ padding: '10px 16px', verticalAlign: 'middle', textAlign: right ? 'right' : 'left' }}>
    <div style={{ fontSize: '13px', color: '#111827' }}>{children}</div>
    {sub && <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '1px' }}>{sub}</div>}
  </td>
)

// ─────────────────────────────────────────────────────────────────────────────
//  KPI CARD
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, icon, trend, loading, onClick }) {
  const [hov, setHov] = useState(false)
  if (loading) return (
    <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '16px' }}>
      <div style={{ marginBottom: '14px' }}><Sk h={32} w={32} r={6} /></div>
      <Sk h={24} w="50%" /><div style={{ marginTop: '8px' }}><Sk h={11} w="70%" /></div>
    </div>
  )
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white',
        border: `1px solid ${hov && onClick ? '#1a73e8' : 'gainsboro'}`,
        borderRadius: '8px', padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic d={icon} size={17} color={color} sw={1.9} />
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: '11px', fontWeight: 600, color: trend >= 0 ? '#16a34a' : '#dc2626', background: trend >= 0 ? '#f0fdf4' : '#fef2f2', padding: '2px 7px', borderRadius: '4px' }}>
            +{trend} new
          </span>
        )}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginTop: '4px' }}>{label}</div>
      {sub && <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '3px' }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  QUICK TILE (Standard user module shortcut)
// ─────────────────────────────────────────────────────────────────────────────
function QuickTile({ label, desc, icon, color, to, nav }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => nav(to)}
      style={{
        background: 'white',
        border: `1px solid ${hov ? '#1a73e8' : 'gainsboro'}`,
        borderRadius: '8px', padding: '16px',
        cursor: 'pointer', transition: 'border-color 0.15s',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}
    >
      <div style={{ width: '36px', height: '36px', borderRadius: '7px', background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic d={icon} size={17} color={color} sw={1.9} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>{label}</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '1px' }}>{desc}</div>
      </div>
      <Ic d={P.arrow} size={14} color={hov ? '#1a73e8' : '#d1d5db'} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12.5px', color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '10px' }} />
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// =============================================================================
export default function Dashboard() {
  const { user }  = useSelector(s => s.auth)
  const navigate  = useNavigate()
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [kpis,     setKpis]     = useState(null)
  const [renewals, setRenewals] = useState([])
  const [alerts,   setAlerts]   = useState(null)
  const [activity, setActivity] = useState([])
  const [software, setSoftware] = useState(null)
  const [infra,    setInfra]    = useState([])
  const [overview, setOverview] = useState(null)  // Standard user personal data
  const [loading,  setLoading]  = useState(true)
  const [days,     setDays]     = useState(30)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        if (isAdmin) {
          const [renewRes, kpiRes, alertRes, actRes, swRes, infraRes] = await Promise.all([
            getUpcomingRenewalsApi(), getKPIsApi(), getAlertSummaryApi(),
            getRecentActivityApi(), getSoftwareStatusApi(), getInfraAlertsApi(),
          ])
          if (!cancelled) {
            setRenewals(renewRes.data.data || [])
            setKpis(kpiRes.data.data)
            setAlerts(alertRes.data.data)
            setActivity(actRes.data.data || [])
            setSoftware(swRes.data.data)
            setInfra(infraRes.data.data || [])
          }
        } else {
          const res = await getMyOverviewApi()
          if (!cancelled) setOverview(res.data.data)
        }
      } catch (_) { }
      finally { if (!cancelled) setLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [isAdmin])

  const today      = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const alertTotal = alerts ? Object.values(alerts.bySeverity || {}).reduce((a, v) => a + v, 0) : 0
  const filtered   = renewals.filter(r => daysLeft(r.renewalDate) <= days)

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif", color: '#111827' }}>

      {/* ── Page title bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
            Dashboard
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>{today}</p>
        </div>
        {isAdmin && (
          <button onClick={() => navigate('/reports')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}>
            <Ic d={P.reports} size={14} color="white" /> Reports
          </button>
        )}
      </div>

      {/* ════════════ ADMIN LAYOUT ════════════ */}
      {isAdmin && (
        <>
          {/* Row 1 — 4 primary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '12px' }}>
            <KpiCard loading={loading} label="Total Customers"      value={fmtNum(kpis?.customers?.total)}      sub={`+${kpis?.customers?.newThisMonth || 0} this month`}           color="#1a73e8" icon={P.customers}     trend={kpis?.customers?.newThisMonth} onClick={() => navigate('/customers')} />
            <KpiCard loading={loading} label="Active Subscriptions" value={fmtNum(kpis?.subscriptions?.active)} sub="Currently active"                                              color="#16a34a" icon={P.subscriptions}                                    onClick={() => navigate('/subscriptions')} />
            <KpiCard loading={loading} label="Revenue This Month"   value={fmtINR(kpis?.revenue?.thisMonth)}    sub={`${fmtINR(kpis?.revenue?.thisYear)} YTD`}                     color="#7c3aed" icon={P.revenue}                                          onClick={() => navigate('/invoices')} />
            <KpiCard loading={loading} label="Open Tickets"         value={fmtNum(kpis?.tickets?.open)}         sub="Awaiting resolution"                                          color="#ea580c" icon={P.tickets}                                          onClick={() => navigate('/tickets')} />
          </div>

          {/* Row 2 — 3 secondary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
            <KpiCard loading={loading} label="Overdue Invoices" value={fmtNum(kpis?.overdueInvoices?.count)}  sub={`${fmtINR(kpis?.overdueInvoices?.totalAmount)} outstanding`}   color="#dc2626" icon={P.invoices}  onClick={() => navigate('/invoices')} />
            <KpiCard loading={loading} label="Pending Alerts"   value={fmtNum(kpis?.alerts?.pending)}          sub="Need attention"                                              color="#d97706" icon={P.alerts}    onClick={() => navigate('/alerts')} />
            <KpiCard loading={loading} label="Active Users"     value={fmtNum(kpis?.users?.active)}            sub="Team members"                                                color="#0891b2" icon={P.users}     onClick={() => navigate('/users')} />
          </div>

          {/* Row 3 — Renewals + Alert Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', marginBottom: '14px' }}>
            <RenewalsPanel renewals={filtered} loading={loading} days={days} setDays={setDays} navigate={navigate} />
            <AlertSummaryPanel alerts={alerts} infra={infra} loading={loading} alertTotal={alertTotal} navigate={navigate} />
          </div>

          {/* Row 4 — Activity + Software Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px' }}>
            <ActivityPanel activity={activity} loading={loading} navigate={navigate} />
            <SoftwareStatusPanel software={software} loading={loading} navigate={navigate} />
          </div>
        </>
      )}

      {/* ════════════ STANDARD USER LAYOUT ════════════ */}
      {!isAdmin && (
        <StandardDashboard
          user={user} overview={overview} loading={loading} navigate={navigate}
        />
      )}

      <style>{`@keyframes sk { from { opacity:1 } to { opacity:0.45 } }`}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  STANDARD USER DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const CUST_STATUS_CFG = {
  Active:    { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  Expired:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  Suspended: { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  Lead:      { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
}
const SEV_CFG = {
  Urgent:  { color: '#dc2626', bg: '#fef2f2' },
  Warning: { color: '#b45309', bg: '#fffbeb' },
  Info:    { color: '#1a73e8', bg: '#eff6ff' },
}

function StandardDashboard({ user, overview, loading, navigate }) {
  const [custDays, setCustDays] = useState(30)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'
  const st = overview?.stats || {}
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const filteredRenewals = (overview?.upcomingRenewals || []).filter(r => {
    const d = Math.ceil((new Date(r.renewalDate) - new Date()) / 86400000)
    return d <= custDays
  })

  return (
    <div>
      {/* ── welcome bar ── */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '16px 20px', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#1a73e8,#0d47a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: '0 3px 10px rgba(26,115,232,0.3)' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{today}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user?.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280' }}>
              <Ic d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={13} color="#9ca3af" />
              {user.email}
            </div>
          )}
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }}>
        <KpiCard loading={loading} label="My Customers"    value={st.totalCustomers  ?? '—'} sub={`${st.activeCustomers ?? 0} active · ${st.leadCustomers ?? 0} leads`}                    color="#1a73e8" icon={P.customers}     onClick={() => navigate('/customers')} />
        <KpiCard loading={loading} label="Renewals (30d)"  value={st.upcomingRenewals ?? '—'} sub="Due in next 30 days"                                                                     color="#d97706" icon={P.subscriptions} onClick={() => navigate('/subscriptions')} />
        <KpiCard loading={loading} label="Overdue Payments" value={st.overdueCount ?? '—'}    sub={st.overdueAmount ? fmtINR(st.overdueAmount) + ' outstanding' : 'All payments current'}   color="#dc2626" icon={P.invoices}      onClick={() => navigate('/invoices')} />
        <KpiCard loading={loading} label="Pending Alerts"  value={(overview?.pendingAlerts?.length ?? '—')} sub="For your customers"                                                        color="#7c3aed" icon={P.alerts}        onClick={() => navigate('/alerts')} />
      </div>

      {/* ── main content row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '14px', marginBottom: '14px' }}>

        {/* Upcoming renewals */}
        <Panel
          title="Upcoming Renewals"
          subtitle="Active subscriptions due for renewal"
          action={
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[30, 60, 90].map(d => (
                <button key={d} onClick={() => setCustDays(d)}
                  style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${custDays === d ? '#1a73e8' : 'gainsboro'}`, background: custDays === d ? '#eff6ff' : 'white', color: custDays === d ? '#1a73e8' : '#6b7280', transition: 'all 0.12s' }}>
                  {d}d
                </button>
              ))}
              <ViewAll to="/subscriptions" nav={navigate} />
            </div>
          }
        >
          {loading ? (
            <div style={{ padding: '16px' }}>
              {[...Array(5)].map((_, i) => <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}><Sk h={13} w="20%" /><Sk h={13} w="15%" /><Sk h={13} w="18%" /><Sk h={13} w="12%" /></div>)}
            </div>
          ) : filteredRenewals.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✓</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#374151' }}>No renewals in {custDays} days</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px' }}>All your customers are up to date.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <TH>Customer</TH><TH>Software</TH><TH>Renewal Date</TH><TH right>Amount</TH><TH>Days Left</TH><TH>Payment</TH>
                  </tr>
                </thead>
                <tbody>
                  {filteredRenewals.map((r, i) => {
                    const d = Math.ceil((new Date(r.renewalDate) - new Date()) / 86400000)
                    const pmtCfg = { Paid: '#16a34a', Pending: '#b45309', Overdue: '#dc2626', Waived: '#6b7280' }
                    const pmtBg  = { Paid: '#f0fdf4', Pending: '#fffbeb', Overdue: '#fef2f2', Waived: '#f3f4f6' }
                    return (
                      <tr key={r._id || i} style={{ borderTop: '1px solid #f3f4f6' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <TD sub={r.customer?.phone}><span style={{ fontWeight: 600 }}>{r.customer?.name || '—'}</span></TD>
                        <TD>{r.softwares?.map ? r.softwares.map(s => s.name).join(', ') : (r.softwares?.name || '—')}</TD>
                        <TD><span style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.renewalDate)}</span></TD>
                        <TD right><span style={{ fontWeight: 600 }}>{r.amountCharged ? fmtINR(r.amountCharged) : '—'}</span></TD>
                        <TD><DaysBadge days={d} /></TD>
                        <TD>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: pmtBg[r.paymentStatus] || '#f3f4f6', color: pmtCfg[r.paymentStatus] || '#6b7280' }}>
                            {r.paymentStatus || '—'}
                          </span>
                        </TD>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* My customers panel */}
        <Panel title="My Customers" subtitle={`${st.totalCustomers ?? 0} total assigned`} action={<ViewAll to="/customers" nav={navigate} />}>
          {loading ? (
            <div style={{ padding: '14px 18px' }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ marginBottom: '10px' }}><Sk h={13} /></div>)}
            </div>
          ) : !overview?.customers?.length ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>No customers assigned yet.</div>
          ) : (
            <div>
              {/* status chips */}
              <div style={{ display: 'flex', gap: '6px', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap' }}>
                {Object.entries(CUST_STATUS_CFG).map(([s, cfg]) => {
                  const cnt = (overview?.customers || []).filter(c => c.status === s).length
                  if (!cnt) return null
                  return (
                    <span key={s} style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {s}: {cnt}
                    </span>
                  )
                })}
              </div>
              {(overview?.customers || []).slice(0, 8).map(c => {
                const cfg = CUST_STATUS_CFG[c.status] || CUST_STATUS_CFG.Active
                return (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 16px', borderBottom: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      {c.businessName && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.businessName}</div>}
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0, marginLeft: '8px' }}>
                      {c.status}
                    </span>
                  </div>
                )
              })}
              {(overview?.customers || []).length > 8 && (
                <button onClick={() => navigate('/customers')}
                  style={{ width: '100%', padding: '10px', fontSize: '12px', color: '#1a73e8', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid #f3f4f6', fontFamily: 'inherit' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  View all {overview.customers.length} customers →
                </button>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* ── overdue invoices ── */}
      {!loading && (overview?.overdueInvoices?.length > 0) && (
        <Panel
          title="Overdue Invoices"
          subtitle={`${overview.overdueInvoices.length} invoice${overview.overdueInvoices.length !== 1 ? 's' : ''} need attention`}
          action={<ViewAll to="/invoices" nav={navigate} />}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead><tr><TH>Customer</TH><TH>Software</TH><TH>Invoice</TH><TH right>Amount Due</TH><TH>Created</TH></tr></thead>
              <tbody>
                {overview.overdueInvoices.slice(0, 5).map((inv, i) => (
                  <tr key={inv._id || i} style={{ borderTop: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff8f8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <TD sub={inv.customer?.phone}><span style={{ fontWeight: 600, color: '#111827' }}>{inv.customer?.name || '—'}</span></TD>
                    <TD>{inv.software?.name || '—'}</TD>
                    <TD><span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{inv.invoiceNumber || '—'}</span></TD>
                    <TD right><span style={{ fontWeight: 700, color: '#dc2626' }}>{fmtINR(inv.totalAmount)}</span></TD>
                    <TD>{fmtDate(inv.createdAt)}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* ── pending alerts strip ── */}
      {!loading && (overview?.pendingAlerts?.length > 0) && (
        <div style={{ marginTop: '14px' }}>
          <Panel title="Pending Alerts" subtitle="Alerts for your customers" action={<ViewAll to="/alerts" nav={navigate} />}>
            <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {overview.pendingAlerts.map((a, i) => {
                const cfg = SEV_CFG[a.severity] || SEV_CFG.Info
                return (
                  <div key={a._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px', background: cfg.bg, borderRadius: '6px', border: `1px solid ${cfg.bg}` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                      <div style={{ fontSize: '11.5px', color: '#6b7280', marginTop: '1px' }}>
                        {a.customer?.name} · {a.subType} {a.dueDate ? `· Due ${fmtDate(a.dueDate)}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'white', color: cfg.color, border: `1px solid ${cfg.color}20`, flexShrink: 0 }}>
                      {a.severity}
                    </span>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  PANELS
// ─────────────────────────────────────────────────────────────────────────────

function RenewalsPanel({ renewals, loading, days, setDays, navigate }) {
  return (
    <Panel
      title="Upcoming Renewals"
      subtitle={`Subscriptions renewing within ${days} days`}
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${days === d ? '#1a73e8' : 'gainsboro'}`, background: days === d ? '#eff6ff' : 'white', color: days === d ? '#1a73e8' : '#6b7280', transition: 'all 0.12s' }}>
              {d}d
            </button>
          ))}
          <ViewAll to="/subscriptions" nav={navigate} />
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: '16px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '14px', marginBottom: '12px' }}>
              <Sk h={13} w="22%" /><Sk h={13} w="14%" /><Sk h={13} w="18%" /><Sk h={13} w="12%" /><Sk h={13} w="10%" />
            </div>
          ))}
        </div>
      ) : renewals.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#374151', marginBottom: '3px' }}>No renewals in this window</div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>No subscriptions due in the next {days} days.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <TH>Customer</TH>
                <TH>Phone</TH>
                <TH>Software</TH>
                <TH>Renewal Date</TH>
                <TH right>Amount</TH>
                <TH>Days Left</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {renewals.slice(0, 12).map((r, i) => {
                const d = daysLeft(r.renewalDate)
                return (
                  <tr key={r._id || i}
                    style={{ borderTop: '1px solid #f3f4f6' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                  >
                    <TD sub={r.customer?.email}><span style={{ fontWeight: 500 }}>{r.customer?.name || '—'}</span></TD>
                    <TD>{r.customer?.phone || '—'}</TD>
                    <TD>{Array.isArray(r.softwares) ? r.softwares.map(s => s.name).join(', ') : (r.softwares?.name || '—')}</TD>
                    <TD><span style={{ whiteSpace: 'nowrap' }}>{fmtDate(r.renewalDate)}</span></TD>
                    <TD right><span style={{ fontWeight: 600 }}>{r.amountCharged ? fmtINR(r.amountCharged) : '—'}</span></TD>
                    <TD><DaysBadge days={d} /></TD>
                    <TD><StatusBadge status={r.status} /></TD>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function AlertSummaryPanel({ alerts, infra, loading, alertTotal, navigate }) {
  return (
    <Panel title="Alert Summary" subtitle="By severity & type" action={<ViewAll to="/alerts" nav={navigate} />}>
      <div style={{ padding: '14px 18px' }}>
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} style={{ marginBottom: '10px' }}><Sk /></div>)
        ) : (
          <>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Severity</div>
            <ProgressBar label="Urgent"  value={alerts?.bySeverity?.Urgent  || 0} max={Math.max(alertTotal, 1)} color="#dc2626" />
            <ProgressBar label="Warning" value={alerts?.bySeverity?.Warning || 0} max={Math.max(alertTotal, 1)} color="#d97706" />
            <ProgressBar label="Info"    value={alerts?.bySeverity?.Info    || 0} max={Math.max(alertTotal, 1)} color="#1a73e8" />

            <div style={{ borderTop: '1px solid gainsboro', margin: '14px 0 10px' }} />
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>By Type</div>
            {[
              { key: 'Client',   label: 'Client',   color: '#1a73e8' },
              { key: 'Infra',    label: 'Infra',    color: '#7c3aed' },
              { key: 'Internal', label: 'Internal', color: '#0891b2' },
            ].map(t => (
              <div key={t.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: '12.5px', color: '#374151' }}>{t.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: t.color }}>{alerts?.byType?.[t.key] || 0}</span>
              </div>
            ))}

            {infra.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid gainsboro', margin: '14px 0 10px' }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Recent Infra</div>
                {infra.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: a.severity === 'High' ? '#dc2626' : a.severity === 'Medium' ? '#d97706' : '#16a34a', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.software?.name || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{a.subType} · {fmtDate(a.dueDate)}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}

function ActivityPanel({ activity, loading, navigate }) {
  return (
    <Panel title="Recent Activity" subtitle="Last actions across the system" action={<ViewAll to="/audit" nav={navigate} />}>
      {loading ? (
        <div style={{ padding: '14px 18px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
              <Sk h={30} w={30} r={15} /><div style={{ flex: 1 }}><Sk h={12} w="80%" /><div style={{ marginTop: '5px' }}><Sk h={10} w="40%" /></div></div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>No recent activity.</div>
      ) : (
        <div>
          {activity.map((a, i) => (
            <div key={a._id || i}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#374151', flexShrink: 0 }}>
                {a.performedBy?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SY'}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{a.performedBy?.name || 'System'}</span>
                <ActionBadge action={a.action} />
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{a.targetModel}</span>
                {a.targetLabel && <span style={{ fontSize: '12.5px', color: '#374151' }}>— {a.targetLabel}</span>}
              </div>
              <span style={{ fontSize: '11.5px', color: '#9ca3af', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}

function SoftwareStatusPanel({ software, loading, navigate }) {
  const counts = software?.counts || {}
  const total  = Object.values(counts).reduce((a, v) => a + v, 0)
  const broken = software?.brokenSoftwares || []

  return (
    <Panel title="Software Status" subtitle="Uptime & health" action={<ViewAll to="/softwares" nav={navigate} />}>
      <div style={{ padding: '14px 18px' }}>
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} style={{ marginBottom: '10px' }}><Sk /></div>)
        ) : (
          <>
            {[
              { key: 'Operational', color: '#16a34a' },
              { key: 'Maintenance', color: '#d97706' },
              { key: 'Broken',      color: '#dc2626' },
              { key: 'Development', color: '#1a73e8' },
            ].filter(s => counts[s.key] > 0).map(s => (
              <ProgressBar key={s.key} label={s.key} value={counts[s.key]} max={Math.max(total, 1)} color={s.color} />
            ))}
            {total === 0 && <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '8px 0' }}>No records yet.</div>}

            {broken.length > 0 && (
              <>
                <div style={{ borderTop: '1px solid gainsboro', margin: '14px 0 10px' }} />
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Needs Attention</div>
                {broken.map((sw, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sw.status === 'Broken' ? '#dc2626' : '#d97706', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sw.name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{sw.type}</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', background: sw.status === 'Broken' ? '#fef2f2' : '#fffbeb', color: sw.status === 'Broken' ? '#dc2626' : '#d97706' }}>
                      {sw.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </Panel>
  )
}
