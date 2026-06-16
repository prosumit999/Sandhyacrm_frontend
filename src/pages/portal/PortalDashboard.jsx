import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalDashboardApi } from '../../api/portalApi'
import { usePortal } from '../../context/PortalContext'

const fmtINR = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const IC = {
  software: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  invoices: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  alerts:   'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  tickets:  'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
  messages: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
}

function StatCard({ icon, label, value, sub, to }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={() => to && navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white', border: '1px solid gainsboro', borderRadius: '8px',
        padding: '22px 24px', cursor: to ? 'pointer' : 'default',
        boxShadow: hov ? '0 4px 18px rgba(0,0,0,0.07)' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s, transform 0.15s',
        transform: hov && to ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ color: '#94a3b8' }}><Icon d={IC[icon]} size={20} /></div>
        {to && <div style={{ color: '#1a73e8', opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}><Icon d={IC.arrow} size={16} /></div>}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', lineHeight: 1, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{sub}</div>}
    </div>
  )
}

export default function PortalDashboard() {
  const { customer } = usePortal()
  const [data, setData]     = useState(null)
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

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
          Welcome back, {customer?.name?.split(' ')[0]}
        </h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{today}</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <StatCard icon="software" label="Active Subscriptions"  value={data?.activeSubscriptions  ?? '—'} to="/portal/subscriptions" />
        <StatCard icon="invoices" label="Total Invoices"        value={data?.totalInvoices         ?? '—'} to="/portal/invoices"      />
        <StatCard icon="alerts"   label="Open Alerts"           value={data?.urgentAlerts          ?? '—'} to="/portal/alerts"        />
        <StatCard icon="tickets"  label="Open Tickets"          value={data?.openTickets           ?? '—'} to="/portal/tickets"       />
        <StatCard icon="messages" label="Unread Messages"       value={data?.unreadMessages        ?? '—'} to="/portal/messages"      />
      </div>

      {/* Recent activity */}
      {data?.recentInvoice && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '22px 24px', marginBottom: '16px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '14px' }}>
            Latest Invoice
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>
                #{data.recentInvoice.invoiceNumber}
              </div>
              <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                {data.recentInvoice.paymentStatus}
              </div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              {fmtINR(data.recentInvoice.totalAmount)}
            </div>
          </div>
        </div>
      )}

      {data?.renewingSoon?.length > 0 && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '22px 24px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '14px' }}>
            Renewing Soon
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.renewingSoon.map((sub, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < data.renewingSoon.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: '14px', color: '#334155', fontWeight: 500 }}>{sub.softwares?.name || '—'}</span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
