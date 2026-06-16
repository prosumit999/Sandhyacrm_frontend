import { useEffect, useState } from 'react'
import { portalInvoicesApi } from '../../api/portalApi'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtINR  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const TH = { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }
const TD = { padding: '13px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }

const statusColor = s => {
  if (s === 'Paid')    return '#16a34a'
  if (s === 'Overdue') return '#dc2626'
  return '#64748b'
}

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('All')

  useEffect(() => {
    portalInvoicesApi()
      .then(r => setInvoices(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statuses = ['All', ...Array.from(new Set(invoices.map(i => i.paymentStatus).filter(Boolean)))]
  const shown    = filter === 'All' ? invoices : invoices.filter(i => i.paymentStatus === filter)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Invoices</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{shown.length} invoice{shown.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: '6px', border: '1px solid',
              borderColor: filter === s ? '#1a73e8' : '#e5e7eb',
              background: filter === s ? '#1a73e8' : 'white',
              color: filter === s ? 'white' : '#64748b',
              fontSize: '13px', fontWeight: filter === s ? 600 : 400,
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}>{s}</button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
        {shown.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No invoices found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  <th style={TH}>Invoice #</th>
                  <th style={TH}>Software</th>
                  <th style={TH}>Period From</th>
                  <th style={TH}>Period To</th>
                  <th style={TH}>Status</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(inv => (
                  <tr key={inv._id}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...TD, fontWeight: 600, color: '#0f172a' }}>#{inv.invoiceNumber}</td>
                    <td style={TD}>{inv.software?.name || '—'}</td>
                    <td style={TD}>{fmtDate(inv.periodFrom)}</td>
                    <td style={TD}>{fmtDate(inv.periodTo)}</td>
                    <td style={TD}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor(inv.paymentStatus) }}>
                        {inv.paymentStatus || '—'}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{fmtINR(inv.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
