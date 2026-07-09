import { useEffect, useState } from 'react'
import { portalSubscriptionsApi, portalAllSoftwaresApi } from '../../api/portalApi'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtINR  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const daysLeft = d => Math.ceil((new Date(d) - new Date()) / 86400000)

const TH = { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }
const TD = { padding: '13px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }
const PB = { bg: '#eff6ff', color: '#1a73e8', border: '#bfdbfe' }

const SW_TYPE_ICONS = {
  Desktop: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  Mobile:  'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  Web:     'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
  SAAS:    'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  API:     'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  PAAS:    'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2',
}
const DEFAULT_SW_ICON = 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18'

function SoftwareCard({ sw, purchased, sub }) {
  const iconPath = SW_TYPE_ICONS[sw.type] || DEFAULT_SW_ICON
  const days = sub?.renewalDate ? daysLeft(sub.renewalDate) : null
  const isExp  = days !== null && days < 0
  const isWarn = days !== null && days >= 0 && days <= 30
  const links = [
    ['Live', sw.liveUrl],
    ['Download', sw.downloadUrl],
    ['Play Store', sw.playStoreUrl],
    ['App Store', sw.appStoreUrl],
    ['Docs', sw.documentationUrl],
  ].filter(([, url]) => url)

  return (
    <div style={{ background: 'white', border: `1px solid ${purchased ? '#bfdbfe' : 'gainsboro'}`, borderRadius: '8px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'relative' }}>
      {purchased && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: PB.bg, color: PB.color, border: `1px solid ${PB.border}`, borderRadius: '4px', padding: '2px 8px', fontSize: '10.5px', fontWeight: 700 }}>
          Purchased
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: purchased ? '#eff6ff' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={purchased ? '#1a73e8' : '#94a3b8'} strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sw.name}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{sw.type || 'Software'}</div>
        </div>
      </div>

      {sw.description && (
        <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {sw.description}
        </div>
      )}

      {purchased && sub ? (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: '#94a3b8' }}>Status</span>
            <span style={{ color: sub.status === 'Active' ? '#16a34a' : '#64748b', fontWeight: 600 }}>{sub.status || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: '#94a3b8' }}>Renewal</span>
            <span style={{ color: isExp ? '#dc2626' : isWarn ? '#d97706' : '#334155', fontWeight: (isExp || isWarn) ? 600 : 400 }}>
              {fmtDate(sub.renewalDate)}{days !== null ? (isExp ? ` (${Math.abs(days)}d overdue)` : ` (${days}d)`) : ''}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: '#94a3b8' }}>Amount</span>
            <span style={{ color: '#334155', fontWeight: 600 }}>{fmtINR(sub.amountCharged)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
            <span style={{ color: '#94a3b8' }}>Billing</span>
            <span style={{ color: '#334155', fontWeight: 600 }}>{sub.billingCycle || '—'}</span>
          </div>
          {links.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {links.map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11.5, fontWeight: 700, color: '#1a73e8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '3px 8px', textDecoration: 'none' }}>
                  {label}
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
          <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Not yet purchased</span>
        </div>
      )}
    </div>
  )
}

export default function PortalSubscriptions() {
  const [tab,     setTab]     = useState('subs')
  const [subs,    setSubs]    = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      portalSubscriptionsApi().then(r => setSubs(r.data.data || [])).catch(() => {}),
      portalAllSoftwaresApi()
        .then(r => setCatalog(r.data.data || r.data?.softwares || []))
        .catch(() => setCatalog([])),  // silently empty if endpoint requires CRM auth
    ]).finally(() => setLoading(false))
  }, [])

  const purchasedIds = new Set(subs.map(s => s.softwares?._id).filter(Boolean))
  const getSubForSw  = sw => subs.find(s => s.softwares?._id === sw._id)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>My Software</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            {subs.length} subscription{subs.length !== 1 ? 's' : ''} · {catalog.length} available
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', gap: '2px' }}>
          {[['subs', `My Subscriptions (${subs.length})`], ['catalog', `Software Catalog (${catalog.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '7px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: tab === key ? 600 : 400,
              background: tab === key ? 'white' : 'transparent',
              color: tab === key ? '#1a73e8' : '#64748b',
              boxShadow: tab === key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* My Subscriptions tab */}
      {tab === 'subs' && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
          {subs.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No subscriptions found. Browse the Software Catalog to see what&apos;s available.
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
                    const isExp  = days !== null && days < 0
                    const isWarn = days !== null && days >= 0 && days <= 30
                    return (
                      <tr key={sub._id}
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
      )}

      {/* Software Catalog tab */}
      {tab === 'catalog' && (
        catalog.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No software available in the catalog.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {catalog.map(sw => (
              <SoftwareCard key={sw._id} sw={sw} purchased={purchasedIds.has(sw._id)} sub={getSubForSw(sw)} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
