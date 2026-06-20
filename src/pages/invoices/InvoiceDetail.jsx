import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getInvoiceByIdApi, updateInvoiceApi, markInvoicePaidApi } from '../../api/invoiceApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt       = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtRs     = n => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const toISODate = d => d ? new Date(d).toISOString().split('T')[0] : ''

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  back:     'M19 12H5M12 5l-7 7 7 7',
  print:    'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z',
  check:    'M5 13l4 4L19 7',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  close:    'M18 6L6 18M6 6l12 12',
  mail:     'M4 4h16c1.1 0 2 .9 2 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  phone:    'M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z',
  location: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  link:     'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  receipt:  'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  tag:      'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
}

// ── Status colors ─────────────────────────────────────────────────────────────
const STATUS_C = {
  Paid:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Pending:   { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  Overdue:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Cancelled: { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  Refunded:  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
}

function Badge({ label, large }) {
  const c = STATUS_C[label] || { bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' }
  return (
    <span style={{ fontSize: large ? 12.5 : 11, fontWeight: 700, padding: large ? '4px 12px' : '2px 8px', borderRadius: large ? 6 : 4, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 13, w = '80%' }) => (
  <div style={{ height: h, width: w, borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ── Mark Paid modal ───────────────────────────────────────────────────────────
function MarkPaidModal({ invoice, onClose, onPaid }) {
  const today = toISODate(new Date())
  const [form, setForm] = useState({ paymentMethod: 'UPI', transactionId: '', paymentDate: today })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const res = await markInvoicePaidApi(invoice._id, form)
      onPaid(res.data.data)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to mark as paid') }
    finally { setSaving(false) }
  }

  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#111827' }
  const F = ({ label, req, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
        {label}{req && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Mark as Paid</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Ic d={IC.close} size={17} color="#9ca3af" /></button>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#6b7280' }}>
          Recording payment for <strong>{invoice.invoiceNumber}</strong> — {fmtRs(invoice.totalAmount)}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <F label="Payment method" req>
            <select style={inp} value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
              {['Cash','UPI','BankTransfer','Cheque','Card','Other'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </F>
          <F label="Transaction / reference ID">
            <input style={inp} value={form.transactionId} onChange={e => set('transactionId', e.target.value)} placeholder="UPI ref, UTR, cheque no…" />
          </F>
          <F label="Payment date">
            <input type="date" style={inp} value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} max={today} />
          </F>
        </div>
        {err && <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12.5, color: '#dc2626' }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding: '8px 22px', background: saving ? '#4ade80' : '#16a34a', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ic d={IC.check} size={13} color="white" sw={2.5} />
            {saving ? 'Saving…' : 'Confirm payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit modal (Pending invoices only) ────────────────────────────────────────
function EditModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({
    amount:       invoice.amount || '',
    tax:          invoice.tax || 0,
    discount:     invoice.discount || 0,
    totalAmount:  invoice.totalAmount || '',
    invoiceType:  invoice.invoiceType || 'NewPurchase',
    periodFrom:   toISODate(invoice.periodFrom),
    periodTo:     toISODate(invoice.periodTo),
    notes:        invoice.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const payload = { ...form, amount: Number(form.amount), tax: Number(form.tax), discount: Number(form.discount), totalAmount: Number(form.totalAmount) }
      const res = await updateInvoiceApi(invoice._id, payload)
      onSaved(res.data.data)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#111827' }
  const F = ({ label, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Edit Invoice</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Ic d={IC.close} size={17} color="#9ca3af" /></button>
        </div>
        <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#d97706', marginBottom: 16 }}>
          Only pending invoices can be edited. Fields like customer, software, and subscription cannot be changed.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <F label="Invoice type">
            <select style={inp} value={form.invoiceType} onChange={e => set('invoiceType', e.target.value)}>
              {['NewPurchase','Renewal','Upgrade','Refund'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </F>
          <F label="Base amount (₹)"><input type="number" style={inp} value={form.amount} onChange={e => set('amount', e.target.value)} /></F>
          <F label="Tax (₹)"><input type="number" style={inp} value={form.tax} onChange={e => set('tax', e.target.value)} min={0} /></F>
          <F label="Discount (₹)"><input type="number" style={inp} value={form.discount} onChange={e => set('discount', e.target.value)} min={0} /></F>
          <div style={{ gridColumn: '1/-1' }}>
            <F label="Total amount (₹)"><input type="number" style={inp} value={form.totalAmount} onChange={e => set('totalAmount', e.target.value)} /></F>
          </div>
          <F label="Period from"><input type="date" style={inp} value={form.periodFrom} onChange={e => set('periodFrom', e.target.value)} /></F>
          <F label="Period to"><input type="date" style={inp} value={form.periodTo} onChange={e => set('periodTo', e.target.value)} /></F>
          <div style={{ gridColumn: '1/-1' }}>
            <F label="Notes"><textarea style={{ ...inp, resize: 'vertical', minHeight: 64 }} value={form.notes} onChange={e => set('notes', e.target.value)} /></F>
          </div>
        </div>
        {err && <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12.5, color: '#dc2626' }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding: '8px 22px', background: saving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function InvoiceDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [inv,       setInv]       = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [showPaid,  setShowPaid]  = useState(false)
  const [showEdit,  setShowEdit]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await getInvoiceByIdApi(id)
      setInv(res.data.data)
    } catch (e) { setError(e.response?.data?.message || 'Invoice not found') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>
      <button onClick={() => navigate('/invoices')} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
    </div>
  )

  const iv = inv
  const canMarkPaid = iv && ['Pending','Overdue'].includes(iv.paymentStatus) && isAdmin
  const canEdit     = iv && iv.paymentStatus === 'Pending' && isAdmin
  const sc          = iv ? (STATUS_C[iv.paymentStatus] || STATUS_C.Pending) : STATUS_C.Pending

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#111827', maxWidth: 860, margin: '0 auto' }}>
      <style>{`@keyframes sk { from{opacity:1} to{opacity:0.4} } @media print { .no-print { display: none !important } }`}</style>

      {/* Breadcrumb */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => navigate('/invoices')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
          <Ic d={IC.back} size={13} color="currentColor" /> Invoices
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
          {loading ? <Sk h={12} w={120} /> : iv?.invoiceNumber}
        </span>
      </div>

      {/* Action bar */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {loading ? <Sk h={28} w={160} /> : (
            <>
              <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, color: '#111827' }}>{iv.invoiceNumber}</span>
              <Badge label={iv.paymentStatus} large />
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280' }}>{iv.invoiceType}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#1a73e8'} onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}>
            <Ic d={IC.print} size={13} color="currentColor" /> Print
          </button>
          {canEdit && (
            <button onClick={() => setShowEdit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'white', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#1a73e8'} onMouseLeave={e => e.currentTarget.style.borderColor = '#d1d5db'}>
              <Ic d={IC.edit} size={13} color="currentColor" /> Edit
            </button>
          )}
          {canMarkPaid && (
            <button onClick={() => setShowPaid(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', background: '#16a34a', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', color: 'white', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#15803d'} onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}>
              <Ic d={IC.check} size={13} color="white" sw={2.5} /> Mark as paid
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice document ── */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
        {/* Status banner */}
        {!loading && iv && (
          <div style={{ height: 4, background: iv.paymentStatus === 'Paid' ? 'linear-gradient(90deg,#16a34a,#4ade80)' : iv.paymentStatus === 'Overdue' ? 'linear-gradient(90deg,#dc2626,#f87171)' : iv.paymentStatus === 'Pending' ? 'linear-gradient(90deg,#d97706,#fbbf24)' : '#e5e7eb' }} />
        )}

        <div style={{ padding: '32px 36px' }}>
          {/* Invoice header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', marginBottom: 4 }}>INVOICE</div>
              {loading
                ? <Sk h={16} w={140} />
                : <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#6b7280', fontWeight: 600 }}>{iv.invoiceNumber}</div>
              }
            </div>
            {!loading && iv && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 3 }}>STATUS</div>
                <Badge label={iv.paymentStatus} large />
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>Issued {fmt(iv.createdAt)}</div>
              </div>
            )}
          </div>

          {/* Billed to + Software */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, marginBottom: 32, paddingBottom: 28, borderBottom: '1px solid #f3f4f6' }}>
            {/* Billed to */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 10 }}>BILLED TO</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><Sk h={14} w="80%" /><Sk h={11} w="65%" /><Sk h={11} w="55%" /></div>
              ) : iv.customer ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{iv.customer.name}</div>
                  {iv.customer.businessName && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{iv.customer.businessName}</div>}
                  {iv.customer.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
                      <Ic d={IC.mail} size={11} color="#9ca3af" /> {iv.customer.email}
                    </div>
                  )}
                  {iv.customer.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', marginBottom: 3 }}>
                      <Ic d={IC.phone} size={11} color="#9ca3af" /> {iv.customer.phone}
                    </div>
                  )}
                  {(iv.customer.address?.city || iv.customer.address?.state) && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      <Ic d={IC.location} size={11} color="#9ca3af" />
                      <span>{[iv.customer.address.city, iv.customer.address.state, iv.customer.address.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : <div style={{ fontSize: 13, color: '#9ca3af' }}>—</div>}
            </div>

            {/* Software */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 10 }}>SOFTWARE</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><Sk h={14} w="70%" /><Sk h={11} w="50%" /></div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 2 }}>{iv.software?.name || '—'}</div>
                  {iv.software?.type && <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>{iv.software.type}</div>}
                  <div style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#eff6ff', color: '#1a73e8', display: 'inline-block' }}>{iv.invoiceType}</div>
                </div>
              )}
            </div>

            {/* Period + subscription */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 10 }}>PERIOD</div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}><Sk h={11} w="80%" /><Sk h={11} w="60%" /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 12, color: '#374151' }}>
                    <span style={{ color: '#9ca3af' }}>From </span>{fmt(iv.periodFrom)}
                  </div>
                  <div style={{ fontSize: 12, color: '#374151' }}>
                    <span style={{ color: '#9ca3af' }}>To </span>{fmt(iv.periodTo)}
                  </div>
                  {iv.subscription && (
                    <div style={{ marginTop: 4, fontSize: 11.5, color: '#6b7280' }}>
                      {iv.subscription.billingCycle} billing
                      {iv.subscription.renewalDate && (
                        <> · renews {fmt(iv.subscription.renewalDate)}</>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Amount breakdown */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 14 }}>AMOUNT DETAILS</div>
            <div style={{ maxWidth: 340, marginLeft: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[3, 4, 5].map(w => (
                    <div key={w} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Sk h={12} w="40%" /><Sk h={12} w="25%" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Base amount</span>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{fmtRs(iv.amount)}</span>
                  </div>
                  {(iv.tax > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Tax</span>
                      <span style={{ fontSize: 13, color: '#374151' }}>{fmtRs(iv.tax)}</span>
                    </div>
                  )}
                  {(iv.discount > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Discount</span>
                      <span style={{ fontSize: 13, color: '#16a34a' }}>− {fmtRs(iv.discount)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 8px', marginTop: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Total</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{fmtRs(iv.totalAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment info (only when paid) */}
          {!loading && iv?.paymentStatus === 'Paid' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>PAYMENT METHOD</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{iv.paymentMethod || '—'}</div>
              </div>
              {iv.paymentDate && (
                <div>
                  <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>PAID ON</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{fmt(iv.paymentDate)}</div>
                </div>
              )}
              {iv.transactionId && (
                <div>
                  <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, marginBottom: 3 }}>TRANSACTION ID</div>
                  <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#111827' }}>{iv.transactionId}</div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {!loading && iv?.notes && (
            <div style={{ background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 7, padding: '12px 14px', marginBottom: 24 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', marginBottom: 5 }}>NOTES</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{iv.notes}</div>
            </div>
          )}

          {/* Footer meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 12 }}>
            {loading ? <Sk h={11} w={200} /> : (
              <>
                <div style={{ fontSize: 11.5, color: '#9ca3af' }}>
                  Created {fmt(iv.createdAt)}{iv.createdBy ? ` by ${iv.createdBy.name || iv.createdBy.email}` : ''}
                </div>
                <div className="no-print" style={{ display: 'flex', gap: 12 }}>
                  {iv.customer?._id && (
                    <button onClick={() => navigate(`/customers/${iv.customer._id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#1a73e8', fontFamily: 'inherit', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      <Ic d={IC.link} size={12} color="currentColor" />View customer
                    </button>
                  )}
                  {iv.subscription?._id && (
                    <button onClick={() => navigate(`/subscriptions/${iv.subscription._id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#1a73e8', fontFamily: 'inherit', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                      <Ic d={IC.link} size={12} color="currentColor" />View subscription
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPaid && <MarkPaidModal invoice={iv} onClose={() => setShowPaid(false)} onPaid={updated => setInv(prev => ({ ...prev, ...updated }))} />}
      {showEdit && <EditModal    invoice={iv} onClose={() => setShowEdit(false)}  onSaved={updated => setInv(updated)} />}
    </div>
  )
}
