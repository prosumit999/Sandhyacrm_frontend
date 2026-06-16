import { useEffect, useState } from 'react'
import { portalSubscriptionsApi } from '../../api/portalApi'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtINR  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000)

const TH = { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }
const TD = { padding: '13px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }

export default function PortalSubscriptions() {
  const [subs, setSubs]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalSubscriptionsApi()
      .then(r => setSubs(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>My Software</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{subs.length} subscription{subs.length !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
        {subs.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No subscriptions found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  <th style={TH}>Software</th>
                  <th style={TH}>Type</th>
                  <th style={TH}>Status</th>
                  <th style={TH}>Buy Date</th>
                  <th style={TH}>Renewal Date</th>
                  <th style={TH}>Amount</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Days Left</th>
                </tr>
              </thead>
              <tbody>
                {subs.map(sub => {
                  const days  = sub.renewalDate ? daysLeft(sub.renewalDate) : null
                  const sw    = sub.softwares
                  const isExp = days !== null && days < 0
                  const isWarn = days !== null && days >= 0 && days <= 30
                  return (
                    <tr key={sub._id} style={{ transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...TD, fontWeight: 600, color: '#0f172a' }}>{sw?.name || '—'}</td>
                      <td style={TD}>{sw?.type || '—'}</td>
                      <td style={TD}>
                        <span style={{ fontSize: '13px', color: sub.status === 'Active' ? '#16a34a' : '#64748b', fontWeight: sub.status === 'Active' ? 600 : 400 }}>
                          {sub.status || sw?.status || '—'}
                        </span>
                      </td>
                      <td style={TD}>{fmtDate(sub.buyDate)}</td>
                      <td style={{ ...TD, color: isExp ? '#dc2626' : isWarn ? '#d97706' : '#334155', fontWeight: (isExp || isWarn) ? 600 : 400 }}>
                        {fmtDate(sub.renewalDate)}
                      </td>
                      <td style={TD}>{fmtINR(sub.amountCharged)}</td>
                      <td style={{ ...TD, textAlign: 'right' }}>
                        {days === null ? '—' : (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: isExp ? '#dc2626' : isWarn ? '#d97706' : '#475569' }}>
                            {isExp ? `${Math.abs(days)}d overdue` : `${days}d`}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
