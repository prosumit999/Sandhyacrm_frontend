import { useEffect, useState } from 'react'
import { portalInvoicesApi, portalOrgSettingsApi, portalSubmitPaymentReferenceApi } from '../../api/portalApi'
import { downloadInvoicePdf } from '../../utils/invoicePdf'
import { toastSuccess } from '../../utils/toast'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtINR  = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

const TH = { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }
const TD = { padding: '13px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }

const statusStyle = s => {
  if (s === 'Paid')    return { color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0' }
  if (s === 'Overdue') return { color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' }
  return { color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0' }
}

function DownloadBtn({ onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Download PDF"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 6, border: '1px solid',
        borderColor: hov ? '#1a73e8' : '#e2e8f0',
        background: hov ? '#eff6ff' : 'white',
        color: hov ? '#1a73e8' : '#64748b',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        transition: 'all 0.12s',
      }}
    >
      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      PDF
    </button>
  )
}

function PaymentReferenceModal({ invoice, onClose, onSaved }) {
  const [reference, setReference] = useState(invoice.customerPaymentReference || '')
  const [note, setNote] = useState(invoice.customerPaymentNote || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!reference.trim()) { setErr('Payment reference is required.'); return }
    setSaving(true); setErr('')
    try {
      const res = await portalSubmitPaymentReferenceApi(invoice._id, { reference, note })
      onSaved(res.data.data)
      toastSuccess('Payment reference submitted')
      onClose()
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to submit payment reference.')
    } finally {
      setSaving(false)
    }
  }

  const input = {
    width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: 7,
    padding: '9px 11px', fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 10, width: 420, maxWidth: '100%', padding: 22, boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Payment Reference</div>
        <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>Invoice #{invoice.invoiceNumber} · {fmtINR(invoice.totalAmount)}</div>
        {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 7, padding: '8px 10px', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Reference / UTR / Transaction ID *</label>
        <input value={reference} onChange={e => setReference(e.target.value)} placeholder="UPI ref, bank UTR, cheque no..." style={input} />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', margin: '12px 0 5px' }}>Note</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Optional note for our accounts team" style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid #e5e7eb', background: 'white', color: '#64748b', cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: saving ? '#93c5fd' : '#1a73e8', color: 'white', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PortalInvoices() {
  const [invoices,    setInvoices]    = useState([])
  const [orgSettings, setOrgSettings] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('All')
  const [payTarget,   setPayTarget]   = useState(null)

  useEffect(() => {
    Promise.all([
      portalInvoicesApi(),
      portalOrgSettingsApi().catch(() => ({ data: { data: {} } })),
    ]).then(([invRes, orgRes]) => {
      setInvoices(invRes.data.data || [])
      setOrgSettings(orgRes.data?.data || {})
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const statuses = ['All', ...Array.from(new Set(invoices.map(i => i.paymentStatus).filter(Boolean)))]
  const shown    = filter === 'All' ? invoices : invoices.filter(i => i.paymentStatus === filter)
  const updateInvoice = updated => setInvoices(prev => prev.map(inv => inv._id === updated._id ? updated : inv))

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
                  <th style={TH}>Payment Ref</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Amount</th>
                  <th style={{ ...TH, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(inv => {
                  const ss = statusStyle(inv.paymentStatus)
                  return (
                    <tr key={inv._id}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ ...TD, fontWeight: 600, color: '#0f172a' }}>#{inv.invoiceNumber}</td>
                      <td style={TD}>{inv.software?.name || '—'}</td>
                      <td style={TD}>{fmtDate(inv.periodFrom)}</td>
                      <td style={TD}>{fmtDate(inv.periodTo)}</td>
                      <td style={TD}>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4, ...ss }}>
                          {inv.paymentStatus || '—'}
                        </span>
                      </td>
                      <td style={TD}>
                        {inv.customerPaymentReference ? (
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{inv.customerPaymentReference}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(inv.customerPaymentSubmittedAt)}</div>
                          </div>
                        ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                      <td style={{ ...TD, textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{fmtINR(inv.totalAmount)}</td>
                      <td style={{ ...TD, textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          <DownloadBtn onClick={() => downloadInvoicePdf(inv, orgSettings)} />
                          {['Pending', 'Overdue'].includes(inv.paymentStatus) && (
                            <button onClick={() => setPayTarget(inv)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1a73e8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Ref
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {payTarget && <PaymentReferenceModal invoice={payTarget} onClose={() => setPayTarget(null)} onSaved={updateInvoice} />}
    </div>
  )
}
