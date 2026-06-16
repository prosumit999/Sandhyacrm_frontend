import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  getAllSubscriptionsApi, createSubscriptionApi,
  updateSubscriptionApi, deleteSubscriptionApi, renewSubscriptionApi,
} from '../../api/subscriptionApi'
import { getAllCustomersApi } from '../../api/customerApi'
import { getAllSoftwaresApi } from '../../api/softwareApi'
import { createInvoiceApi } from '../../api/invoiceApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR  = n => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const toInput = d => d ? new Date(d).toISOString().slice(0, 10) : ''
const daysLeft = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  plus:     'M12 5v14M5 12h14',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:    'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  renew:    'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  close:    'M18 6L6 18M6 6l12 12',
  chevronL: 'M15 18l-6-6 6-6',
  chevronR: 'M9 18l6-6-6-6',
  spinner:  'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  info:     'M12 16v-4M12 8h.01M22 12A10 10 0 112 12a10 10 0 0120 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  invoice:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  check:    'M5 13l4 4L19 7',
}

// ── Badge configs — all use primary blue for clean business look ──────────────
const PRIMARY_BADGE = { color: '#1a73e8', bg: '#eff6ff' }
const STATUS_CFG  = { Active: PRIMARY_BADGE, Expired: PRIMARY_BADGE, Cancelled: PRIMARY_BADGE, Paused: PRIMARY_BADGE }
const PAYMENT_CFG = { Paid: PRIMARY_BADGE, Pending: PRIMARY_BADGE, Overdue: PRIMARY_BADGE, Waived: PRIMARY_BADGE }
const TYPE_CFG    = { Desktop: PRIMARY_BADGE, Mobile: PRIMARY_BADGE, Web: PRIMARY_BADGE, SAAS: PRIMARY_BADGE, API: PRIMARY_BADGE, PAAS: PRIMARY_BADGE }

function Badge({ label, cfg }) {
  const { color, bg } = cfg || { color: '#6b7280', bg: '#f3f4f6' }
  return <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: bg, color, whiteSpace: 'nowrap', display: 'inline-block' }}>{label}</span>
}

// ── Days-left badge ───────────────────────────────────────────────────────────
function DaysBadge({ date }) {
  const d = daysLeft(date)
  if (d === null) return <span style={{ color: '#d1d5db', fontSize: '12px' }}>—</span>
  const base = { fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', display: 'inline-block', whiteSpace: 'nowrap', background: '#eff6ff', color: '#1a73e8' }
  if (d <= 0)  return <span style={{ ...base }}>Overdue</span>
  return             <span style={{ ...base }}>{d}d left</span>
}

// ── Reminder flags ────────────────────────────────────────────────────────────
function ReminderDots({ r }) {
  if (!r) return null
  const flags = [
    { key: 'thirtyDays', label: '30d' },
    { key: 'sevenDays',  label: '7d'  },
    { key: 'oneDay',     label: '1d'  },
    { key: 'overdue',    label: 'OD'  },
  ]
  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {flags.map(f => (
        <span key={f.key} title={`${f.label} reminder ${r[f.key] ? 'sent' : 'not sent'}`}
          style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '3px', background: r[f.key] ? '#f0fdf4' : '#f3f4f6', color: r[f.key] ? '#16a34a' : '#9ca3af', border: `1px solid ${r[f.key] ? '#bbf7d0' : 'gainsboro'}` }}>
          {f.label}
        </span>
      ))}
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ w = '80%', h = 12 }) => (
  <div style={{ height: h, width: w, borderRadius: 3, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ── Form helpers ──────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}
const inp = (extra = {}) => ({
  width: '100%', boxSizing: 'border-box', padding: '8px 11px',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px',
  color: '#111827', outline: 'none', fontFamily: 'inherit',
  background: 'white', transition: 'border-color 0.14s', ...extra,
})
const fb = e => { e.target.style.borderColor = '#1a73e8' }
const bb = e => { e.target.style.borderColor = '#d1d5db' }

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, title, onClick, color = '#1a73e8', bg = '#eff6ff' }) {
  const [hov, setHov] = useState(false)
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${hov ? color : 'gainsboro'}`, borderRadius: '5px', cursor: 'pointer', background: hov ? bg : 'white', color: hov ? color : '#6b7280', transition: 'all 0.12s', padding: 0 }}>
      <Ic d={icon} size={13} color="currentColor" />
    </button>
  )
}

function PagBtn({ disabled, onClick, icon }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid gainsboro', borderRadius: '5px', cursor: disabled ? 'default' : 'pointer', background: 'white', color: disabled ? '#d1d5db' : '#374151' }}>
      <Ic d={icon} size={13} color={disabled ? '#d1d5db' : '#374151'} />
    </button>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────
const ErrBanner = ({ msg }) => msg ? (
  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '9px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '16px' }}>{msg}</div>
) : null

// ─────────────────────────────────────────────────────────────────────────────
//  ADD / EDIT DRAWER
// =============================================================================
const BLANK = { customer: '', softwares: '', buyDate: toInput(new Date()), renewalDate: '', amountCharged: '', billingCycle: 'Yearly', paymentStatus: 'Paid', status: 'Active', notes: '' }

function SubscriptionDrawer({ mode, initial, onClose, onSaved, customers, softwares }) {
  const [form, setForm] = useState(() =>
    initial
      ? { ...BLANK, ...initial, customer: initial.customer?._id || initial.customer || '', softwares: initial.softwares?._id || initial.softwares || '', buyDate: toInput(initial.buyDate), renewalDate: toInput(initial.renewalDate) }
      : BLANK
  )
  const [err, setErr]   = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Auto-fill price when software changes
  const handleSoftwareChange = (id) => {
    set('softwares', id)
    const sw = softwares.find(s => s._id === id)
    if (sw && !form.amountCharged) set('amountCharged', sw.price || '')
  }

  const handleSubmit = async e => {
    e.preventDefault(); setErr('')
    if (!form.customer || !form.softwares || !form.renewalDate || !form.amountCharged) {
      setErr('Customer, software, renewal date, and amount are required.'); return
    }
    setBusy(true)
    try {
      const payload = { ...form, amountCharged: Number(form.amountCharged) }
      if (mode === 'create') {
        const res = await createSubscriptionApi(payload)
        const inv = res.data?.data?.invoice
        onSaved(inv?.invoiceNumber || null)
      } else {
        await updateSubscriptionApi(initial._id, payload)
        onSaved(null)
      }
    } catch (ex) { setErr(ex.response?.data?.message || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const SL = ({ label }) => <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0 12px' }}>{label}</div>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 50 }}>
      <div style={{ width: '480px', maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>{mode === 'create' ? 'Add Subscription' : 'Edit Subscription'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <ErrBanner msg={err} />

          <SL label="Customer & Software" />
          <div style={{ display: 'grid', gap: '12px', marginBottom: '12px' }}>
            <Field label="Customer" required>
              <select value={form.customer} onChange={e => set('customer', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })} disabled={mode === 'edit'}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>)}
              </select>
            </Field>
            <Field label="Software" required>
              <select value={form.softwares} onChange={e => handleSoftwareChange(e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })} disabled={mode === 'edit'}>
                <option value="">Select software</option>
                {softwares.map(s => <option key={s._id} value={s._id}>{s.name} ({s.type})</option>)}
              </select>
            </Field>
          </div>

          <SL label="Dates" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Buy Date" required>
              <input type="date" value={form.buyDate} onChange={e => set('buyDate', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} />
            </Field>
            <Field label="Renewal Date" required>
              <input type="date" value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} />
            </Field>
          </div>

          <SL label="Billing" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Amount Charged (₹)" required>
              <input type="number" value={form.amountCharged} onChange={e => set('amountCharged', e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" min="0" style={inp()} />
            </Field>
            <Field label="Billing Cycle">
              <select value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['Monthly', 'Quarterly', 'HalfYearly', 'Yearly', 'OneTime'].map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Payment Status">
              <select value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['Paid', 'Pending', 'Overdue', 'Waived'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Subscription Status">
              <select value={form.status} onChange={e => set('status', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['Active', 'Expired', 'Cancelled', 'Paused'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <SL label="Notes" />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={fb} onBlur={bb} placeholder="Any internal notes about this subscription…" rows={3} style={inp({ resize: 'vertical', lineHeight: 1.5 })} />
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#93c5fd' : '#1a73e8', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#1557b0' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#1a73e8' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Saving…' : mode === 'create' ? 'Add Subscription' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  RENEW MODAL
// =============================================================================
function RenewModal({ sub, onClose, onSaved }) {
  const [renewalDate,    setRenewalDate]    = useState('')
  const [amountCharged,  setAmountCharged]  = useState(sub.amountCharged || '')
  const [paymentStatus,  setPaymentStatus]  = useState('Paid')
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setErr('')
    if (!renewalDate) { setErr('New renewal date is required.'); return }
    setBusy(true)
    try {
      await renewSubscriptionApi(sub._id, { renewalDate, amountCharged: Number(amountCharged), paymentStatus })
      onSaved()
    } catch (ex) { setErr(ex.response?.data?.message || 'Renewal failed.') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', width: '400px', maxWidth: '90vw', overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro' }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Renew Subscription</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', color: '#6b7280', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={17} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Summary */}
          <div style={{ background: '#f9fafb', border: '1px solid gainsboro', borderRadius: '6px', padding: '12px 14px', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{sub.customer?.name}</div>
            <div style={{ fontSize: '12.5px', color: '#6b7280' }}>{sub.softwares?.name} · Current renewal: {fmtDate(sub.renewalDate)}</div>
          </div>

          {/* Info note */}
          <div style={{ display: 'flex', gap: '8px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '6px', padding: '10px 12px', marginBottom: '18px', alignItems: 'flex-start' }}>
            <Ic d={IC.info} size={14} color="#1a73e8" sw={2} />
            <span style={{ fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
              Renewing will reset all reminder flags and auto-generate a renewal invoice.
            </span>
          </div>

          <ErrBanner msg={err} />

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '12px' }}>
              <Field label="New Renewal Date" required>
                <input type="date" value={renewalDate} onChange={e => setRenewalDate(e.target.value)} onFocus={fb} onBlur={bb} style={inp()} />
              </Field>
              <Field label="Amount Charged (₹)">
                <input type="number" value={amountCharged} onChange={e => setAmountCharged(e.target.value)} onFocus={fb} onBlur={bb} placeholder={sub.amountCharged} style={inp()} />
              </Field>
              <Field label="Payment Status">
                <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                  {['Paid', 'Pending', 'Overdue', 'Waived'].map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>
          </form>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#6ee7b7' : '#16a34a', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#15803d' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#16a34a' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Processing…' : 'Renew & Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE CONFIRM
// =============================================================================
function ConfirmDialog({ sub, onConfirm, onCancel, loading, error }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '24px', width: '380px', maxWidth: '90vw' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Delete Subscription?</div>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>
          Delete subscription for <strong style={{ color: '#111827' }}>{sub.customer?.name}</strong> — <strong style={{ color: '#111827' }}>{sub.softwares?.name}</strong>? Subscriptions with paid invoices cannot be deleted.
        </div>
        {error && <ErrBanner msg={error} />}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#dc2626', color: 'white', fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  GENERATE INVOICE MODAL  (creates a fresh invoice from an existing subscription)
// =============================================================================
const INVOICE_TYPES = ['NewPurchase', 'Renewal', 'Upgrade', 'Refund']
const PAYMENT_METHODS = ['Cash', 'UPI', 'BankTransfer', 'Cheque', 'Card', 'Other']

function GenInvoiceModal({ sub, onClose, onSaved }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    invoiceType:   'Renewal',
    periodFrom:    today,
    periodTo:      toInput(sub.renewalDate),
    amount:        sub.amountCharged || '',
    tax:           0,
    discount:      0,
    paymentStatus: 'Pending',
    paymentMethod: '',
    transactionId: '',
    paymentDate:   today,
    notes:         '',
  })
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const total = Math.max(0,
    (Number(form.amount) || 0) +
    ((Number(form.amount) || 0) * (Number(form.tax) || 0) / 100) -
    (Number(form.discount) || 0)
  )

  const handleSubmit = async () => {
    if (!form.periodFrom || !form.periodTo) { setErr('Period From and To are required.'); return }
    if (!form.amount) { setErr('Amount is required.'); return }
    if (form.paymentStatus === 'Paid' && !form.paymentMethod) { setErr('Payment method is required when status is Paid.'); return }
    setBusy(true); setErr('')
    try {
      const body = {
        customer:      sub.customer?._id || sub.customer,
        subscription:  sub._id,
        software:      sub.softwares?._id || sub.softwares,
        invoiceType:   form.invoiceType,
        amount:        Number(form.amount),
        tax:           Number(form.tax) || 0,
        discount:      Number(form.discount) || 0,
        totalAmount:   total,
        periodFrom:    form.periodFrom,
        periodTo:      form.periodTo,
        paymentStatus: form.paymentStatus,
        notes:         form.notes,
        ...(form.paymentStatus === 'Paid' && {
          paymentMethod: form.paymentMethod,
          transactionId: form.transactionId,
          paymentDate:   form.paymentDate,
        }),
      }
      await createInvoiceApi(body)
      onSaved('manual')
    } catch (ex) { setErr(ex.response?.data?.message || 'Failed to generate invoice.') }
    finally { setBusy(false) }
  }

  const SL = ({ label }) => <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '16px 0 10px' }}>{label}</div>

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 60 }}>
      <div style={{ width: '460px', maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Generate Invoice</div>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: 2 }}>{sub.customer?.name} · {sub.softwares?.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* subscription context */}
          <div style={{ background: '#f9fafb', border: '1px solid gainsboro', borderRadius: '6px', padding: '10px 14px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
              <span style={{ color: '#6b7280' }}>Customer</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{sub.customer?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginTop: 4 }}>
              <span style={{ color: '#6b7280' }}>Software</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{sub.softwares?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginTop: 4 }}>
              <span style={{ color: '#6b7280' }}>Renewal Due</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{fmtDate(sub.renewalDate)}</span>
            </div>
          </div>

          <ErrBanner msg={err} />

          <SL label="Invoice Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Invoice Type">
              <select value={form.invoiceType} onChange={e => set('invoiceType', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {INVOICE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Payment Status">
              <select value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['Pending', 'Paid', 'Overdue', 'Cancelled'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <SL label="Period" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="From" required><input type="date" value={form.periodFrom} onChange={e => set('periodFrom', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} /></Field>
            <Field label="To" required><input type="date" value={form.periodTo} onChange={e => set('periodTo', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} /></Field>
          </div>

          <SL label="Amount" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Amount (₹)" required><input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" style={inp()} /></Field>
            <Field label="Tax (%)"><input type="number" value={form.tax} onChange={e => set('tax', e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" min="0" max="100" style={inp()} /></Field>
            <Field label="Discount (₹)"><input type="number" value={form.discount} onChange={e => set('discount', e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" style={inp()} /></Field>
          </div>

          {/* total preview */}
          <div style={{ background: '#f9fafb', border: '1px solid gainsboro', borderRadius: '6px', padding: '10px 14px', marginBottom: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>Total Amount</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}
              </span>
            </div>
          </div>

          {/* payment details — only if Paid */}
          {form.paymentStatus === 'Paid' && (
            <>
              <SL label="Payment Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Field label="Payment Method" required>
                  <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                    <option value="">Select…</option>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Payment Date"><input type="date" value={form.paymentDate} onChange={e => set('paymentDate', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} /></Field>
              </div>
              <Field label="Transaction ID">
                <input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} onFocus={fb} onBlur={bb} placeholder="UPI ref / cheque no…" style={inp()} />
              </Field>
            </>
          )}

          <SL label="Notes" />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={fb} onBlur={bb} placeholder="Internal note for this invoice…" rows={2} style={inp({ resize: 'vertical', lineHeight: 1.5 })} />
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#93c5fd' : '#1a73e8', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#1557b0' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#1a73e8' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Generating…' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Plus card ─────────────────────────────────────────────────────────────────
function PlusCard({ label, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? '#eff6ff' : 'white',
        border: `2px dashed ${hov ? '#1a73e8' : '#d1d5db'}`,
        borderRadius: '8px', padding: '18px 20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', minHeight: '140px', gap: '10px', transition: 'all 0.15s',
      }}
    >
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: hov ? '#1a73e8' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
        <Ic d={IC.plus} size={18} color={hov ? 'white' : '#9ca3af'} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: hov ? '#1a73e8' : '#9ca3af', transition: 'color 0.15s' }}>{label}</span>
    </div>
  )
}

// ── Subscription card ─────────────────────────────────────────────────────────
function SubCard({ s, isAdmin, onRenew, onInvoice, onEdit, onDelete }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '18px 20px', boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.07)' : 'none', transition: 'box-shadow 0.15s', display: 'flex', flexDirection: 'column', gap: '12px' }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>{s.customer?.name || '—'}</div>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{s.customer?.phone}</div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <Badge label={s.status} cfg={STATUS_CFG[s.status]} />
        </div>
      </div>

      {/* Software row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f9fafb', borderRadius: '6px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{s.softwares?.name || '—'}</div>
          {s.softwares?.type && <Badge label={s.softwares.type} cfg={TYPE_CFG[s.softwares.type]} />}
        </div>
        <Badge label={s.paymentStatus} cfg={PAYMENT_CFG[s.paymentStatus]} />
      </div>

      {/* Date + amount row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Renewal</div>
          <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{fmtDate(s.renewalDate)}</div>
          <DaysBadge date={s.renewalDate} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>Amount</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{fmtINR(s.amountCharged)}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>{s.billingCycle}</div>
        </div>
      </div>

      {/* Reminders */}
      <ReminderDots r={s.reminderSent} />

      {/* Actions */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: '4px', paddingTop: '4px', borderTop: '1px solid #f3f4f6' }}>
          <ActionBtn icon={IC.renew}   title="Renew"          onClick={onRenew}   color="#1a73e8" bg="#eff6ff" />
          <ActionBtn icon={IC.invoice} title="Gen Invoice"    onClick={onInvoice} color="#1a73e8" bg="#eff6ff" />
          <ActionBtn icon={IC.edit}    title="Edit"           onClick={onEdit} />
          <ActionBtn icon={IC.trash}   title="Delete"         onClick={onDelete} color="#dc2626" bg="#fef2f2" />
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
export default function Subscriptions() {
  const { user }     = useSelector(s => s.auth)
  const isAdmin      = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [subs,       setSubs]       = useState([])
  const [customers,  setCustomers]  = useState([])
  const [softwares,  setSoftwares]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 })

  // Filters
  const [filterStatus,        setFilterStatus]        = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterBillingCycle,  setFilterBillingCycle]  = useState('')

  // UI state
  const [drawer,           setDrawer]           = useState(null)  // { mode: 'create'|'edit', initial? }
  const [renewSub,         setRenewSub]         = useState(null)  // sub to renew
  const [genInvoiceSub,    setGenInvoiceSub]    = useState(null)  // sub to manually generate invoice for
  const [delTarget,        setDelTarget]        = useState(null)
  const [delBusy,          setDelBusy]          = useState(false)
  const [delError,         setDelError]         = useState('')
  const [createdInvoiceNum, setCreatedInvoiceNum] = useState(null) // auto-generated invoice number banner

  const fetchSubs = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 20 }
      if (filterStatus)        params.status        = filterStatus
      if (filterPaymentStatus) params.paymentStatus = filterPaymentStatus
      if (filterBillingCycle)  params.billingCycle  = filterBillingCycle
      const res = await getAllSubscriptionsApi(params)
      setSubs(res.data.data || [])
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 1 })
    } catch (_) { }
    finally { setLoading(false) }
  }, [filterStatus, filterPaymentStatus, filterBillingCycle])

  // Fetch dropdown data when drawer opens
  const loadDropdowns = useCallback(async () => {
    if (customers.length && softwares.length) return
    try {
      const [cRes, sRes] = await Promise.all([
        getAllCustomersApi({ limit: 200 }),
        getAllSoftwaresApi({ limit: 200 }),
      ])
      setCustomers(cRes.data.data || [])
      setSoftwares(sRes.data.data || [])
    } catch (_) { }
  }, [customers.length, softwares.length])

  useEffect(() => { fetchSubs(1) }, [fetchSubs])

  const openDrawer = async (mode, initial = null) => {
    await loadDropdowns()
    setDrawer({ mode, initial })
  }

  const handleSaved = (invoiceNum = null) => {
    setDrawer(null)
    setRenewSub(null)
    setGenInvoiceSub(null)
    fetchSubs(pagination.page)
    if (invoiceNum && invoiceNum !== 'manual') setCreatedInvoiceNum(invoiceNum)
    else if (invoiceNum === 'manual') setCreatedInvoiceNum('manual')
  }

  const handleDelete = async () => {
    setDelBusy(true); setDelError('')
    try {
      await deleteSubscriptionApi(delTarget._id)
      setDelTarget(null); fetchSubs(pagination.page)
    } catch (ex) { setDelError(ex.response?.data?.message || 'Failed to delete.') }
    finally { setDelBusy(false) }
  }

  const hasFilters = filterStatus || filterPaymentStatus || filterBillingCycle
  const clearFilters = () => { setFilterStatus(''); setFilterPaymentStatus(''); setFilterBillingCycle('') }

  // Summary counts
  const activeCount  = subs.filter(s => s.status  === 'Active').length
  const overdueCount = subs.filter(s => s.paymentStatus === 'Overdue').length
  const dueSoonCount = subs.filter(s => { const d = daysLeft(s.renewalDate); return d !== null && d >= 0 && d <= 30 }).length

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Subscriptions</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>
            {loading ? 'Loading…' : `${pagination.total} total subscription${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* ── Auto-invoice success banner ── */}
      {createdInvoiceNum && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', marginBottom: '14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '7px', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ic d={IC.check} size={15} color="#16a34a" sw={2.5} />
            <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500 }}>
              {createdInvoiceNum === 'manual'
                ? 'Invoice generated successfully.'
                : <>Subscription created. Invoice <strong>{createdInvoiceNum}</strong> generated automatically.</>
              }
            </span>
          </div>
          <button onClick={() => setCreatedInvoiceNum(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', padding: '2px', display: 'flex', borderRadius: '4px' }}
            onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={14} color="#16a34a" />
          </button>
        </div>
      )}

      {/* ── Summary strip ── */}
      {!loading && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Active',    value: activeCount  },
            { label: 'Due ≤ 30d', value: dueSoonCount },
            { label: 'Overdue',   value: overdueCount },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#1a73e8' }}>{s.value}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#1a73e8' }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'All Status',        value: filterStatus,        set: setFilterStatus,        opts: ['Active', 'Expired', 'Cancelled', 'Paused'] },
          { label: 'All Payments',      value: filterPaymentStatus, set: setFilterPaymentStatus, opts: ['Paid', 'Pending', 'Overdue', 'Waived'] },
          { label: 'All Billing',       value: filterBillingCycle,  set: setFilterBillingCycle,  opts: ['Monthly', 'Quarterly', 'HalfYearly', 'Yearly', 'OneTime'] },
        ].map(({ label, value, set, opts }) => (
          <select key={label} value={value} onChange={e => set(e.target.value)}
            style={{ padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', color: value ? '#111827' : '#9ca3af', outline: 'none', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
            <option value="">{label}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        {hasFilters && (
          <button onClick={clearFilters}
            style={{ padding: '8px 12px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '12.5px', color: '#6b7280', background: 'white', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '18px 20px', height: '160px' }}>
              {[80, 60, 100, 50].map((w, j) => <Sk key={j} w={`${w}%`} h={11} />)}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {/* Plus card */}
          {isAdmin && (
            <PlusCard label="Add Subscription" onClick={() => openDrawer('create')} />
          )}
          {subs.length === 0 && !isAdmin ? (
            <div style={{ gridColumn: '1/-1', padding: '52px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>
              {hasFilters ? 'No subscriptions match the filters.' : 'No subscriptions found.'}
            </div>
          ) : (
            subs.map(s => (
              <SubCard key={s._id} s={s} isAdmin={isAdmin}
                onRenew={() => setRenewSub(s)}
                onInvoice={() => setGenInvoiceSub(s)}
                onEdit={() => openDrawer('edit', s)}
                onDelete={() => { setDelTarget(s); setDelError('') }}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', marginTop: '8px' }}>
          <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <PagBtn disabled={pagination.page <= 1} onClick={() => fetchSubs(pagination.page - 1)} icon={IC.chevronL} />
            {[...Array(pagination.pages)].map((_, i) => {
              const pg = i + 1; const active = pg === pagination.page
              if (pagination.pages > 7 && Math.abs(pg - pagination.page) > 2 && pg !== 1 && pg !== pagination.pages) return null
              return (
                <button key={pg} onClick={() => fetchSubs(pg)}
                  style={{ width: 30, height: 30, border: `1px solid ${active ? '#1a73e8' : 'gainsboro'}`, borderRadius: '5px', fontSize: '12.5px', fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? '#eff6ff' : 'white', color: active ? '#1a73e8' : '#374151', fontFamily: 'inherit' }}>
                  {pg}
                </button>
              )
            })}
            <PagBtn disabled={pagination.page >= pagination.pages} onClick={() => fetchSubs(pagination.page + 1)} icon={IC.chevronR} />
          </div>
        </div>
      )}

      {/* Drawers & modals */}
      {drawer && (
        <SubscriptionDrawer
          mode={drawer.mode} initial={drawer.initial}
          onClose={() => setDrawer(null)} onSaved={handleSaved}
          customers={customers} softwares={softwares}
        />
      )}
      {renewSub      && <RenewModal      sub={renewSub}      onClose={() => setRenewSub(null)}      onSaved={handleSaved} />}
      {genInvoiceSub && <GenInvoiceModal sub={genInvoiceSub} onClose={() => setGenInvoiceSub(null)} onSaved={handleSaved} />}
      {delTarget     && <ConfirmDialog   sub={delTarget}     onConfirm={handleDelete} onCancel={() => { setDelTarget(null); setDelError('') }} loading={delBusy} error={delError} />}

      <style>{`
        @keyframes sk   { from{opacity:1} to{opacity:0.45} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
