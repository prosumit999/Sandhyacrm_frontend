import { useEffect, useState } from 'react'
import { portalAlertsApi } from '../../api/portalApi'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const TH = { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }
const TD = { padding: '13px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }

const severityColor = s => {
  if (s === 'Urgent')  return '#dc2626'
  if (s === 'Warning') return '#d97706'
  return '#64748b'
}

export default function PortalAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')

  useEffect(() => {
    portalAlertsApi()
      .then(r => setAlerts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filters = ['All', 'Urgent', 'Warning', 'Info']
  const shown   = filter === 'All' ? alerts : alerts.filter(a => a.severity === filter)

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
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Alerts</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{shown.length} alert{shown.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 14px', borderRadius: '6px', border: '1px solid',
              borderColor: filter === f ? '#1a73e8' : '#e5e7eb',
              background: filter === f ? '#1a73e8' : 'white',
              color: filter === f ? 'white' : '#64748b',
              fontSize: '13px', fontWeight: filter === f ? 600 : 400,
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
        {shown.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No alerts found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  <th style={TH}>Severity</th>
                  <th style={TH}>Category</th>
                  <th style={TH}>Message</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(alert => (
                  <tr key={alert._id}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={TD}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: severityColor(alert.severity) }}>
                        {alert.severity || '—'}
                      </span>
                    </td>
                    <td style={{ ...TD, color: '#64748b' }}>{alert.subType || '—'}</td>
                    <td style={TD}>{alert.message || '—'}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>{fmtDate(alert.createdAt)}</td>
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
