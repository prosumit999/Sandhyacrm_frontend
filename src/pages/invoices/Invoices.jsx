import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  getAllInvoicesApi, createInvoiceApi, updateInvoiceApi, markInvoicePaidApi,
} from '../../api/invoiceApi'
import { getAllCustomersApi } from '../../api/customerApi'
import { getCustomerSubscriptionsApi } from '../../api/customerApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtINR  = n => n != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n) : '—'
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const toInput = d => d ? new Date(d).toISOString().slice(0, 10) : ''

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  plus:     'M12 5v14M5 12h14',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  paid:     'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  list:     'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  close:    'M18 6L6 18M6 6l12 12',
  chevronL: 'M15 18l-6-6 6-6',
  chevronR: 'M9 18l6-6-6-6',
  spinner:  'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  invoice:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  info:     'M12 16v-4M12 8h.01M22 12A10 10 0 112 12a10 10 0 0120 0z',
}

// ── Badge configs ─────────────────────────────────────────────────────────────
const PRIMARY_BADGE_CFG = { color: '#1a73e8', bg: '#eff6ff', border: '#bfdbfe' }
const PAYMENT_CFG = {
  Paid:      PRIMARY_BADGE_CFG,
  Collected: PRIMARY_BADGE_CFG,
  Pending:   PRIMARY_BADGE_CFG,
  Overdue:   PRIMARY_BADGE_CFG,
  Cancelled: PRIMARY_BADGE_CFG,
  Refunded:  PRIMARY_BADGE_CFG,
}
const TYPE_CFG = {
  NewPurchase: PRIMARY_BADGE_CFG,
  Renewal:     PRIMARY_BADGE_CFG,
  Upgrade:     PRIMARY_BADGE_CFG,
  Refund:      PRIMARY_BADGE_CFG,
}
const SW_TYPE_CFG = {
  Desktop: PRIMARY_BADGE_CFG,
  Mobile:  PRIMARY_BADGE_CFG,
  Web:     PRIMARY_BADGE_CFG,
  SAAS:    PRIMARY_BADGE_CFG,
  API:     PRIMARY_BADGE_CFG,
  PAAS:    PRIMARY_BADGE_CFG,
}
function Badge({ label, cfg, large }) {
  const { color, bg } = cfg || { color: '#6b7280', bg: '#f3f4f6' }
  return <span style={{ fontSize: large ? '12px' : '11px', fontWeight: 600, padding: large ? '3px 10px' : '2px 8px', borderRadius: '4px', background: bg, color, whiteSpace: 'nowrap', display: 'inline-block' }}>{label}</span>
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

const ErrBanner = ({ msg }) => msg ? (
  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '9px 12px', fontSize: '12.5px', color: '#dc2626', marginBottom: '16px' }}>{msg}</div>
) : null

const SL = ({ label }) => (
  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '18px 0 12px' }}>{label}</div>
)

// ── Action button ─────────────────────────────────────────────────────────────
function ActionBtn({ icon, title, onClick, color = '#1a73e8', bg = '#eff6ff', label }) {
  const [hov, setHov] = useState(false)
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: label ? '5px' : 0, height: 28, padding: label ? '0 10px' : '0', minWidth: 28, justifyContent: 'center', border: `1px solid ${hov ? color : 'gainsboro'}`, borderRadius: '5px', cursor: 'pointer', background: hov ? bg : 'white', color: hov ? color : '#6b7280', transition: 'all 0.12s', fontFamily: 'inherit', fontSize: '12px', fontWeight: 500 }}>
      <Ic d={icon} size={13} color="currentColor" />
      {label && <span>{label}</span>}
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

// ── View toggle ───────────────────────────────────────────────────────────────
function ViewToggle({ view, setView }) {
  return (
    <div style={{ display: 'flex', border: '1px solid gainsboro', borderRadius: '6px', overflow: 'hidden' }}>
      {[{ v: 'list', icon: IC.list, label: 'List' }, { v: 'grid', icon: IC.grid, label: 'Grid' }].map(({ v, icon, label }) => (
        <button key={v} onClick={() => setView(v)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 500, background: view === v ? '#1a73e8' : 'white', color: view === v ? 'white' : '#6b7280', transition: 'all 0.12s', borderRight: v === 'list' ? '1px solid gainsboro' : 'none' }}>
          <Ic d={icon} size={13} color={view === v ? 'white' : '#6b7280'} />
          {label}
        </button>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MARK PAID MODAL
// =============================================================================
function MarkPaidModal({ invoice, onClose, onSaved }) {
  const [method,   setMethod]   = useState('UPI')
  const [txnId,    setTxnId]    = useState('')
  const [paidDate, setPaidDate] = useState(toInput(new Date()))
  const [err,  setErr]  = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault(); setErr('')
    setBusy(true)
    try {
      await markInvoicePaidApi(invoice._id, { paymentMethod: method, transactionId: txnId, paymentDate: paidDate })
      onSaved()
    } catch (ex) { setErr(ex.response?.data?.message || 'Failed to mark as paid.') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', width: '380px', maxWidth: '90vw', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro' }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Mark Invoice Paid</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={17} />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ background: '#f9fafb', border: '1px solid gainsboro', borderRadius: '6px', padding: '12px 14px', marginBottom: '18px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: '12.5px', color: '#6b7280', marginTop: '3px' }}>
              {invoice.customer?.name} · {fmtINR(invoice.totalAmount)}
            </div>
          </div>
          <ErrBanner msg={err} />
          <div style={{ display: 'grid', gap: '12px' }}>
            <Field label="Payment Method" required>
              <select value={method} onChange={e => setMethod(e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['Cash', 'UPI', 'BankTransfer', 'Cheque', 'Card', 'Other'].map(m => <option key={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Transaction / Reference ID">
              <input value={txnId} onChange={e => setTxnId(e.target.value)} onFocus={fb} onBlur={bb} placeholder="UPI ref, UTR, cheque no…" style={inp()} />
            </Field>
            <Field label="Payment Date">
              <input type="date" value={paidDate} onChange={e => setPaidDate(e.target.value)} onFocus={fb} onBlur={bb} style={inp()} />
            </Field>
          </div>
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#6ee7b7' : '#16a34a', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#15803d' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#16a34a' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Saving…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CREATE / EDIT DRAWER
// =============================================================================
const BLANK_FORM = {
  customer: '', subscription: '', software: '',
  invoiceType: 'NewPurchase', periodFrom: '', periodTo: '',
  amount: '', tax: 0, discount: 0, totalAmount: '',
  paymentStatus: 'Pending', paymentMethod: '', transactionId: '', notes: '',
}

function InvoiceDrawer({ mode, initial, onClose, onSaved, customers }) {
  const [form, setForm] = useState(() => {
    if (!initial) return BLANK_FORM
    return {
      ...BLANK_FORM, ...initial,
      customer:     initial.customer?._id     || initial.customer     || '',
      subscription: initial.subscription?._id || initial.subscription || '',
      software:     initial.software?._id     || initial.software     || '',
      periodFrom:   toInput(initial.periodFrom),
      periodTo:     toInput(initial.periodTo),
    }
  })
  const [err,        setErr]        = useState('')
  const [busy,       setBusy]       = useState(false)
  const [customerSubs, setCustomerSubs] = useState([])
  const [subLoading,   setSubLoading]   = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Fetch active subscriptions whenever the selected customer changes
  useEffect(() => {
    if (!form.customer) { setCustomerSubs([]); return }
    setSubLoading(true)
    getCustomerSubscriptionsApi(form.customer)
      .then(r => {
        const all = r.data?.data || []
        setCustomerSubs(all.filter(s => s.status === 'Active'))
      })
      .catch(() => setCustomerSubs([]))
      .finally(() => setSubLoading(false))
  }, [form.customer])

  // Auto-fill software, amount, and period when subscription changes
  const handleSubChange = id => {
    set('subscription', id)
    const sub = customerSubs.find(s => s._id === id)
    if (sub) {
      set('software',   sub.softwares?._id || sub.softwares || '')
      set('amount',     sub.amountCharged  || '')
      set('periodFrom', toInput(new Date()))
      set('periodTo',   toInput(sub.renewalDate))
      // Recalculate total with the new amount
      const a = parseFloat(sub.amountCharged) || 0
      const t = parseFloat(form.tax)          || 0
      const d = parseFloat(form.discount)     || 0
      set('totalAmount', Math.max(0, a + (a * t / 100) - d))
    }
  }

  // Auto-calculate total
  const calcTotal = (amount, tax, discount) => {
    const a = parseFloat(amount) || 0
    const t = parseFloat(tax)    || 0
    const d = parseFloat(discount) || 0
    return Math.max(0, a + (a * t / 100) - d)
  }

  const handleAmountChange = v => {
    set('amount', v)
    set('totalAmount', calcTotal(v, form.tax, form.discount))
  }
  const handleTaxChange = v => {
    set('tax', v)
    set('totalAmount', calcTotal(form.amount, v, form.discount))
  }
  const handleDiscountChange = v => {
    set('discount', v)
    set('totalAmount', calcTotal(form.amount, form.tax, v))
  }

  const handleSubmit = async e => {
    e.preventDefault(); setErr('')
    if (!form.customer || !form.subscription || !form.software || !form.amount || !form.periodFrom || !form.periodTo) {
      setErr('Customer, subscription, software, amount, and period dates are required.'); return
    }
    setBusy(true)
    try {
      const payload = {
        ...form,
        amount:      Number(form.amount),
        tax:         Number(form.tax)      || 0,
        discount:    Number(form.discount) || 0,
        totalAmount: Number(form.totalAmount) || Number(form.amount),
      }
      mode === 'create' ? await createInvoiceApi(payload) : await updateInvoiceApi(initial._id, payload)
      onSaved()
    } catch (ex) { setErr(ex.response?.data?.message || 'Something went wrong.') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', zIndex: 50 }}>
      <div style={{ width: '500px', maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>{mode === 'create' ? 'Generate Invoice' : 'Edit Invoice'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '4px', borderRadius: '4px', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            <Ic d={IC.close} size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <ErrBanner msg={err} />

          <SL label="Customer & Subscription" />
          <div style={{ display: 'grid', gap: '12px', marginBottom: '4px' }}>
            <Field label="Customer" required>
              <select value={form.customer}
                onChange={e => { set('customer', e.target.value); set('subscription', ''); set('software', ''); set('amount', ''); set('periodTo', '') }}
                onFocus={fb} onBlur={bb} style={inp({ background: 'white' })} disabled={mode === 'edit'}>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} — {c.phone}</option>)}
              </select>
            </Field>
            <Field label="Subscription" required>
              <select value={form.subscription} onChange={e => handleSubChange(e.target.value)} onFocus={fb} onBlur={bb}
                style={inp({ background: subLoading ? '#f9fafb' : 'white', color: subLoading ? '#9ca3af' : undefined })}
                disabled={!form.customer || subLoading || mode === 'edit'}>
                <option value="">
                  {!form.customer
                    ? 'Select a customer first'
                    : subLoading
                    ? 'Loading subscriptions…'
                    : customerSubs.length === 0
                    ? 'No active subscriptions found'
                    : 'Select subscription'}
                </option>
                {customerSubs.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.softwares?.name || 'Unknown'} — {s.billingCycle} — ₹{s.amountCharged} — renews {fmtDate(s.renewalDate)}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <SL label="Invoice Details" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Invoice Type">
              <select value={form.invoiceType} onChange={e => set('invoiceType', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['NewPurchase', 'Renewal', 'Upgrade', 'Refund'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Payment Status">
              <select value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                {['Paid', 'Pending', 'Overdue', 'Cancelled', 'Refunded'].map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Period From" required>
              <input type="date" value={form.periodFrom} onChange={e => set('periodFrom', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} />
            </Field>
            <Field label="Period To" required>
              <input type="date" value={form.periodTo} onChange={e => set('periodTo', e.target.value)} onFocus={fb} onBlur={bb} style={inp()} />
            </Field>
          </div>

          <SL label="Amount Breakdown" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Field label="Base Amount (₹)" required>
              <input type="number" value={form.amount} onChange={e => handleAmountChange(e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" min="0" style={inp()} />
            </Field>
            <Field label="Tax (%)">
              <input type="number" value={form.tax} onChange={e => handleTaxChange(e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" min="0" max="100" style={inp()} />
            </Field>
            <Field label="Discount (₹)">
              <input type="number" value={form.discount} onChange={e => handleDiscountChange(e.target.value)} onFocus={fb} onBlur={bb} placeholder="0" min="0" style={inp()} />
            </Field>
            <Field label="Total Amount (₹)">
              <input type="number" value={form.totalAmount} readOnly style={inp({ background: '#f9fafb', color: '#16a34a', fontWeight: 600, cursor: 'default' })} />
            </Field>
          </div>

          {form.paymentStatus === 'Paid' && (
            <>
              <SL label="Payment Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <Field label="Payment Method">
                  <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} onFocus={fb} onBlur={bb} style={inp({ background: 'white' })}>
                    <option value="">Select method</option>
                    {['Cash', 'UPI', 'BankTransfer', 'Cheque', 'Card', 'Other'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Transaction ID">
                  <input value={form.transactionId} onChange={e => set('transactionId', e.target.value)} onFocus={fb} onBlur={bb} placeholder="UTR / UPI ref…" style={inp()} />
                </Field>
              </div>
            </>
          )}

          <SL label="Notes" />
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={fb} onBlur={bb} placeholder="Internal notes for this invoice…" rows={3} style={inp({ resize: 'vertical', lineHeight: 1.5 })} />
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'white', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={busy}
            style={{ padding: '8px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: busy ? '#93c5fd' : '#1a73e8', color: 'white', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#1557b0' }}
            onMouseLeave={e => { if (!busy) e.currentTarget.style.background = '#1a73e8' }}>
            {busy && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'spin 0.7s linear infinite' }}><path d={IC.spinner} /></svg>}
            {busy ? 'Saving…' : mode === 'create' ? 'Generate Invoice' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  GRID CARD
// =============================================================================
function InvoiceCard({ inv, isAdmin, onView, onMarkPaid, onEdit }) {
  const [hov, setHov] = useState(false)
  const pc = PAYMENT_CFG[inv.paymentStatus] || { color: '#6b7280', bg: '#f3f4f6', border: 'gainsboro' }
  const isPaid    = inv.paymentStatus === 'Paid'
  const isPending = inv.paymentStatus === 'Pending'

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: `1px solid ${hov ? '#1a73e8' : 'gainsboro'}`, borderRadius: '8px', overflow: 'hidden', transition: 'border-color 0.14s', display: 'flex', flexDirection: 'column' }}>

      {/* Card header */}
      <div style={{ padding: '13px 16px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: 'monospace', letterSpacing: '0.3px' }}>{inv.invoiceNumber}</div>
          <div style={{ marginTop: '5px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <Badge label={inv.invoiceType} cfg={TYPE_CFG[inv.invoiceType]} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '4px', background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, display: 'inline-block' }}>
            {inv.paymentStatus}
          </span>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '5px' }}>{fmtDate(inv.createdAt)}</div>
        </div>
      </div>

      {/* Customer + Software */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#1a73e8', flexShrink: 0 }}>
            {inv.customer?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.customer?.name || '—'}</div>
            <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{inv.customer?.phone}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{inv.software?.name || '—'}</span>
          {inv.software?.type && <Badge label={inv.software.type} cfg={SW_TYPE_CFG[inv.software.type]} />}
        </div>
        <div style={{ fontSize: '11.5px', color: '#9ca3af', marginTop: '4px' }}>
          {fmtDate(inv.periodFrom)} — {fmtDate(inv.periodTo)}
        </div>
      </div>

      {/* Amount breakdown */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          {[
            { label: 'Amount',   value: fmtINR(inv.amount) },
            { label: 'Tax',      value: inv.tax ? `${inv.tax}%` : '—' },
            { label: 'Discount', value: inv.discount ? fmtINR(inv.discount) : '—' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#9ca3af' }}>{r.label}</span>
              <span style={{ color: '#374151' }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid gainsboro' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total</span>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>{fmtINR(inv.totalAmount)}</span>
        </div>
      </div>

      {/* Payment info (if paid) */}
      {isPaid && (
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '11.5px', color: '#374151' }}>
              <span style={{ color: '#9ca3af', marginRight: '5px' }}>Via</span>
              <span style={{ fontWeight: 500 }}>{inv.paymentMethod || '—'}</span>
            </div>
            {inv.transactionId && (
              <div style={{ fontSize: '11.5px', color: '#374151' }}>
                <span style={{ color: '#9ca3af', marginRight: '5px' }}>Ref</span>
                <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{inv.transactionId}</span>
              </div>
            )}
            {inv.paymentDate && (
              <div style={{ fontSize: '11.5px', color: '#374151' }}>
                <span style={{ color: '#9ca3af', marginRight: '5px' }}>On</span>
                <span style={{ fontWeight: 500 }}>{fmtDate(inv.paymentDate)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <ActionBtn icon={IC.invoice} title="View Detail" onClick={() => onView(inv)} color="#6b7280" bg="#f9fafb" />
        {isAdmin && isPending && (
          <ActionBtn icon={IC.paid} title="Mark as Paid" label="Mark Paid" onClick={() => onMarkPaid(inv)} color="#16a34a" bg="#f0fdf4" />
        )}
        {isAdmin && isPending && (
          <ActionBtn icon={IC.edit} title="Edit Invoice" onClick={() => onEdit(inv)} />
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
export default function Invoices() {
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [invoices,  setInvoices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [pagination,setPagination]= useState({ total: 0, page: 1, limit: 20, pages: 1 })
  const [view,      setView]      = useState('grid')   // 'list' | 'grid'

  // Filter state
  const [filterPayment, setFilterPayment] = useState('')
  const [filterType,    setFilterType]    = useState('')

  // Drawer/modal state
  const [drawer,   setDrawer]   = useState(null)
  const [markPaid, setMarkPaid] = useState(null)

  // Dropdown data (loaded lazily when drawer opens)
  const [customers, setCustomers] = useState([])

  const fetchInvoices = useCallback(async (pg = 1) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: 20 }
      if (filterPayment) params.paymentStatus = filterPayment
      if (filterType)    params.invoiceType   = filterType
      const res = await getAllInvoicesApi(params)
      setInvoices(res.data.data || [])
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 20, pages: 1 })
    } catch (_) { }
    finally { setLoading(false) }
  }, [filterPayment, filterType])

  useEffect(() => {
    fetchInvoices(1)
  }, [fetchInvoices])

  const loadDropdowns = useCallback(async () => {
    if (customers.length) return
    try {
      const r = await getAllCustomersApi({ limit: 200 })
      setCustomers(r.data.data || [])
    } catch (_) { }
  }, [customers.length])

  const openDrawer = async (mode, initial = null) => {
    await loadDropdowns()
    setDrawer({ mode, initial })
  }

  const handleSaved = () => { setDrawer(null); setMarkPaid(null); fetchInvoices(pagination.page) }

  const hasFilters = filterPayment || filterType
  const clearFilters = () => { setFilterPayment(''); setFilterType('') }

  // Summary from current page
  const totalPaid    = invoices.filter(i => i.paymentStatus === 'Paid').reduce((a, i) => a + (i.totalAmount || 0), 0)
  const pendingCount = invoices.filter(i => i.paymentStatus === 'Pending').length
  const overdueCount = invoices.filter(i => i.paymentStatus === 'Overdue').length

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827' }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Invoices</h1>
          <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#9ca3af' }}>
            {loading ? 'Loading…' : `${pagination.total} invoice${pagination.total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <ViewToggle view={view} setView={setView} />
          {isAdmin && (
            <button onClick={() => openDrawer('create')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
              onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}>
              <Ic d={IC.plus} size={14} color="white" /> Generate Invoice
            </button>
          )}
        </div>
      </div>

      {/* ── Summary strip ── */}
      {!loading && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Collected',     value: fmtINR(totalPaid),  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Pending',       value: pendingCount,       color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
            { label: 'Overdue',       value: overdueCount,       color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
          ].map(s => (
            <div key={s.label} style={{ padding: '10px 16px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '12px', fontWeight: 500, color: s.color }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        {[
          { label: 'All Payments',  value: filterPayment, set: setFilterPayment, opts: ['Paid', 'Pending', 'Overdue', 'Cancelled', 'Refunded'] },
          { label: 'All Types',     value: filterType,    set: setFilterType,    opts: ['NewPurchase', 'Renewal', 'Upgrade', 'Refund'] },
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

      {/* ════════ LIST VIEW ════════ */}
      {view === 'list' && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Invoice #', 'Customer', 'Software', 'Type', 'Period', 'Amount', 'Payment', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid gainsboro', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(7)].map((_, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #f3f4f6' }}>
                      {[100, 130, 100, 80, 110, 90, 70, 70].map((w, j) => (
                        <td key={j} style={{ padding: '13px 16px' }}><Sk w={`${w}px`} /></td>
                      ))}
                    </tr>
                  ))
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '52px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>No invoices found</div>
                      <div style={{ fontSize: '12.5px', color: '#9ca3af' }}>{hasFilters ? 'Try clearing the filters.' : 'Generate your first invoice to get started.'}</div>
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv._id}
                      style={{ borderTop: '1px solid #f3f4f6', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12.5px', fontWeight: 600, color: '#1a73e8' }}>{inv.invoiceNumber}</span>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{fmtDate(inv.createdAt)}</div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{inv.customer?.name || '—'}</div>
                        <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{inv.customer?.phone}</div>
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontWeight: 500, color: '#374151', marginBottom: '3px' }}>{inv.software?.name || '—'}</div>
                        {inv.software?.type && <Badge label={inv.software.type} cfg={SW_TYPE_CFG[inv.software.type]} />}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <Badge label={inv.invoiceType} cfg={TYPE_CFG[inv.invoiceType]} />
                      </td>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '12.5px', color: '#374151' }}>{fmtDate(inv.periodFrom)}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>to {fmtDate(inv.periodTo)}</div>
                      </td>
                      <td style={{ padding: '11px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, color: '#111827', fontSize: '13.5px' }}>{fmtINR(inv.totalAmount)}</div>
                        {inv.discount > 0 && <div style={{ fontSize: '11px', color: '#9ca3af' }}>−{fmtINR(inv.discount)} disc</div>}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <Badge label={inv.paymentStatus} cfg={PAYMENT_CFG[inv.paymentStatus]} />
                        {inv.paymentMethod && <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '3px' }}>{inv.paymentMethod}</div>}
                      </td>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <ActionBtn icon={IC.invoice} title="View Detail" onClick={() => navigate(`/invoices/${inv._id}`)} color="#6b7280" bg="#f9fafb" />
                          {isAdmin && inv.paymentStatus === 'Pending' && (
                            <ActionBtn icon={IC.paid} title="Mark as Paid" onClick={() => setMarkPaid(inv)} color="#16a34a" bg="#f0fdf4" />
                          )}
                          {isAdmin && inv.paymentStatus === 'Pending' && (
                            <ActionBtn icon={IC.edit} title="Edit Invoice" onClick={() => openDrawer('edit', inv)} />
                          )}
                                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderTop: '1px solid gainsboro' }}>
              <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <PagBtn disabled={pagination.page <= 1} onClick={() => fetchInvoices(pagination.page - 1)} icon={IC.chevronL} />
                {[...Array(pagination.pages)].map((_, i) => {
                  const pg = i + 1; const active = pg === pagination.page
                  if (pagination.pages > 7 && Math.abs(pg - pagination.page) > 2 && pg !== 1 && pg !== pagination.pages) return null
                  return (
                    <button key={pg} onClick={() => fetchInvoices(pg)}
                      style={{ width: 30, height: 30, border: `1px solid ${active ? '#1a73e8' : 'gainsboro'}`, borderRadius: '5px', fontSize: '12.5px', fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? '#eff6ff' : 'white', color: active ? '#1a73e8' : '#374151', fontFamily: 'inherit' }}>
                      {pg}
                    </button>
                  )
                })}
                <PagBtn disabled={pagination.page >= pagination.pages} onClick={() => fetchInvoices(pagination.page + 1)} icon={IC.chevronR} />
              </div>
            </div>
          )}
          {!loading && pagination.pages <= 1 && invoices.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid gainsboro' }}>
              <span style={{ fontSize: '12.5px', color: '#9ca3af' }}>{invoices.length} record{invoices.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* ════════ GRID VIEW ════════ */}
      {view === 'grid' && (
        <>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '16px' }}>
                  <Sk w="60%" h={16} /><div style={{ marginTop: 10 }}><Sk w="80%" /></div>
                  <div style={{ marginTop: 16 }}><Sk /><div style={{ marginTop: 8 }}><Sk w="70%" /></div></div>
                  <div style={{ marginTop: 16 }}><Sk h={28} /></div>
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '52px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 500, color: '#374151', marginBottom: '4px' }}>No invoices found</div>
              <div style={{ fontSize: '12.5px', color: '#9ca3af' }}>{hasFilters ? 'Try clearing the filters.' : 'Generate your first invoice to get started.'}</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {invoices.map(inv => (
                  <InvoiceCard key={inv._id} inv={inv} isAdmin={isAdmin} onView={i => navigate(`/invoices/${i._id}`)} onMarkPaid={setMarkPaid} onEdit={i => openDrawer('edit', i)} />
                ))}
              </div>

              {/* Grid pagination */}
              {pagination.pages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '11px 0' }}>
                  <span style={{ fontSize: '12.5px', color: '#6b7280' }}>
                    Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <PagBtn disabled={pagination.page <= 1} onClick={() => fetchInvoices(pagination.page - 1)} icon={IC.chevronL} />
                    {[...Array(pagination.pages)].map((_, i) => {
                      const pg = i + 1; const active = pg === pagination.page
                      if (pagination.pages > 7 && Math.abs(pg - pagination.page) > 2 && pg !== 1 && pg !== pagination.pages) return null
                      return (
                        <button key={pg} onClick={() => fetchInvoices(pg)}
                          style={{ width: 30, height: 30, border: `1px solid ${active ? '#1a73e8' : 'gainsboro'}`, borderRadius: '5px', fontSize: '12.5px', fontWeight: active ? 600 : 400, cursor: 'pointer', background: active ? '#eff6ff' : 'white', color: active ? '#1a73e8' : '#374151', fontFamily: 'inherit' }}>
                          {pg}
                        </button>
                      )
                    })}
                    <PagBtn disabled={pagination.page >= pagination.pages} onClick={() => fetchInvoices(pagination.page + 1)} icon={IC.chevronR} />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals */}
      {drawer && (
        <InvoiceDrawer
          mode={drawer.mode} initial={drawer.initial}
          onClose={() => setDrawer(null)} onSaved={handleSaved}
          customers={customers}
        />
      )}
      {markPaid && <MarkPaidModal invoice={markPaid} onClose={() => setMarkPaid(null)} onSaved={handleSaved} />}

      <style>{`
        @keyframes sk   { from{opacity:1} to{opacity:0.45} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
