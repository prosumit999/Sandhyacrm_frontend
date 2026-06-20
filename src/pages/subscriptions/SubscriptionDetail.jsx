import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { getSubscriptionByIdApi, updateSubscriptionApi, renewSubscriptionApi, deleteSubscriptionApi } from '../../api/subscriptionApi'
import { getCustomerInvoicesApi } from '../../api/customerApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt    = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtRs  = n => n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—'
const daysUntil = d => { if (!d) return null; return Math.ceil((new Date(d) - Date.now()) / 86400000) }
const toInputDate = d => d ? new Date(d).toISOString().split('T')[0] : ''

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  back:     'M19 12H5M12 5l-7 7 7 7',
  renewal:  'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  invoice:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  user:     'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  edit:     'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:    'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  close:    'M18 6L6 18M6 6l12 12',
  check:    'M5 13l4 4L19 7',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  clock:    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  software: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  warn:     'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  note:     'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  link:     'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const COLORS = {
  Active:  { bg: '#f0fdf4', color: '#16a34a' }, Expired:  { bg: '#fef2f2', color: '#dc2626' },
  Paused:  { bg: '#f9fafb', color: '#6b7280' }, Cancelled:{ bg: '#fef2f2', color: '#dc2626' },
  Paid:    { bg: '#f0fdf4', color: '#16a34a' }, Pending:  { bg: '#fffbeb', color: '#d97706' },
  Overdue: { bg: '#fef2f2', color: '#dc2626' }, Waived:   { bg: '#f5f3ff', color: '#7c3aed' },
  Refunded:{ bg: '#f5f3ff', color: '#7c3aed' }, Cancelled2:{ bg: '#f9fafb', color: '#6b7280' },
}
function Badge({ label }) {
  const c = COLORS[label] || { bg: '#f3f4f6', color: '#374151' }
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>{label}</span>
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 13, w = '80%' }) => (
  <div style={{ height: h, width: w, borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ icon, label, value, sub, color = '#1a73e8', loading }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}16`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic d={icon} size={16} color={color} sw={2} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>{label}</div>
        {loading ? <Sk h={18} w={56} /> : <div style={{ fontSize: 19, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px', lineHeight: 1.1 }}>{value}</div>}
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, accent }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 26, height: 26, borderRadius: 5, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ic d={icon} size={12} color="#6b7280" sw={2} />
      </div>
      <div>
        <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 13, color: accent || '#374151', fontWeight: accent ? 600 : 400 }}>{value}</div>
      </div>
    </div>
  )
}

// ── Renew modal ───────────────────────────────────────────────────────────────
function RenewModal({ sub, onClose, onRenewed }) {
  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const [form, setForm] = useState({ renewalDate: '', amountCharged: sub.amountCharged || '', paymentStatus: 'Paid' })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.renewalDate) { setErr('Renewal date is required'); return }
    setSaving(true); setErr('')
    try {
      const res = await renewSubscriptionApi(sub._id, { ...form, amountCharged: Number(form.amountCharged) })
      onRenewed(res.data.data.subscription)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to renew') }
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
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Renew Subscription</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Ic d={IC.close} size={17} color="#9ca3af" /></button>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#6b7280' }}>
          Renewing <strong>{sub.softwares?.name}</strong> for <strong>{sub.customer?.name}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <F label="New renewal date" req>
            <input type="date" style={inp} min={toInputDate(minDate)} value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} />
          </F>
          <F label="Amount charged">
            <input type="number" style={inp} value={form.amountCharged} onChange={e => set('amountCharged', e.target.value)} placeholder={sub.amountCharged} />
          </F>
          <F label="Payment status">
            <select style={inp} value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>
              {['Paid','Pending','Overdue','Waived'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
        </div>
        {err && <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12.5, color: '#dc2626' }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding: '8px 22px', background: saving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Renewing…' : 'Renew & invoice'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ sub, onClose, onSaved }) {
  const [form, setForm] = useState({
    status: sub.status || 'Active',
    billingCycle: sub.billingCycle || 'Yearly',
    paymentStatus: sub.paymentStatus || 'Paid',
    amountCharged: sub.amountCharged || '',
    renewalDate: toInputDate(sub.renewalDate),
    notes: sub.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const res = await updateSubscriptionApi(sub._id, { ...form, amountCharged: Number(form.amountCharged) })
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Edit Subscription</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Ic d={IC.close} size={17} color="#9ca3af" /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <F label="Status"><select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>{['Active','Expired','Cancelled','Paused'].map(s => <option key={s} value={s}>{s}</option>)}</select></F>
          <F label="Billing cycle"><select style={inp} value={form.billingCycle} onChange={e => set('billingCycle', e.target.value)}>{['Monthly','Quarterly','HalfYearly','Yearly','OneTime'].map(s => <option key={s} value={s}>{s}</option>)}</select></F>
          <F label="Payment status"><select style={inp} value={form.paymentStatus} onChange={e => set('paymentStatus', e.target.value)}>{['Paid','Pending','Overdue','Waived'].map(s => <option key={s} value={s}>{s}</option>)}</select></F>
          <F label="Amount (₹)"><input type="number" style={inp} value={form.amountCharged} onChange={e => set('amountCharged', e.target.value)} /></F>
          <div style={{ gridColumn: '1/-1' }}>
            <F label="Renewal date"><input type="date" style={inp} value={form.renewalDate} onChange={e => set('renewalDate', e.target.value)} /></F>
          </div>
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
export default function SubscriptionDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user }  = useSelector(s => s.auth)
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [sub,       setSub]       = useState(null)
  const [invoices,  setInvoices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [showRenew, setShowRenew] = useState(false)
  const [showEdit,  setShowEdit]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await getSubscriptionByIdApi(id)
      const s = res.data.data
      setSub(s)
      if (s.customer?._id) {
        const iRes = await getCustomerInvoicesApi(s.customer._id)
        const all = iRes.data.data || []
        setInvoices(all.filter(inv => inv.subscription === s._id || inv.subscription?._id === s._id))
      }
    } catch (e) { setError(e.response?.data?.message || 'Subscription not found') }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => { load() }, [load])

  if (error) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>
      <button onClick={() => navigate('/subscriptions')} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Back</button>
    </div>
  )

  const s    = sub
  const days = s ? daysUntil(s.renewalDate) : null
  const renewColor = days == null ? '#374151' : days <= 0 ? '#dc2626' : days <= 7 ? '#dc2626' : days <= 30 ? '#d97706' : '#16a34a'
  const paidTotal  = invoices.filter(i => i.paymentStatus === 'Paid').reduce((acc, i) => acc + (i.totalAmount || 0), 0)

  const BILLING_MONTHS = { Monthly: 1, Quarterly: 3, HalfYearly: 6, Yearly: 12, OneTime: null }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#111827', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`@keyframes sk { from{opacity:1} to{opacity:0.4} }`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => navigate('/subscriptions')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#1a73e8'} onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}>
          <Ic d={IC.back} size={13} color="currentColor" /> Subscriptions
        </button>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
          {loading ? <Sk h={12} w={120} /> : `${s?.softwares?.name} — ${s?.customer?.name}`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: 18, alignItems: 'start' }}>

        {/* ── LEFT: Info card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {/* header band */}
            <div style={{ height: 6, background: loading ? '#e5e7eb' : s?.status === 'Active' ? 'linear-gradient(90deg,#16a34a,#4ade80)' : s?.status === 'Expired' ? 'linear-gradient(90deg,#dc2626,#f87171)' : '#e5e7eb' }} />
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[70, 50, 90, 60, 80].map((w, i) => <Sk key={i} w={`${w}%`} />)}
                </div>
              ) : (
                <>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{s.softwares?.name}</div>
                      <Badge label={s.status} />
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{s.softwares?.type}</div>
                  </div>

                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <InfoRow icon={IC.user}     label="Customer"       value={s.customer?.name} />
                    <InfoRow icon={IC.calendar} label="Billing cycle"  value={s.billingCycle} />
                    <InfoRow icon={IC.calendar} label="Buy date"       value={fmt(s.buyDate)} />
                    <InfoRow icon={IC.calendar} label="Renewal date"   value={fmt(s.renewalDate)} accent={days != null && days <= 30 ? renewColor : undefined} />
                    {s.lastRenewedDate && <InfoRow icon={IC.renewal} label="Last renewed" value={fmt(s.lastRenewedDate)} />}
                    <InfoRow icon={IC.invoice}  label="Amount / cycle" value={fmtRs(s.amountCharged)} />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 5, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Ic d={IC.invoice} size={12} color="#6b7280" sw={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 500 }}>Payment status</div>
                        <Badge label={s.paymentStatus} />
                      </div>
                    </div>
                    {s.createdBy && <InfoRow icon={IC.user} label="Created by" value={s.createdBy.name || s.createdBy.email} />}
                    <InfoRow icon={IC.clock} label="Created" value={fmt(s.createdAt)} />
                  </div>

                  {s.notes && (
                    <>
                      <div style={{ borderTop: '1px solid #f3f4f6' }} />
                      <div>
                        <div style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 600, marginBottom: 5 }}>NOTES</div>
                        <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '8px 10px', borderRadius: 6 }}>{s.notes}</div>
                      </div>
                    </>
                  )}

                  {/* Renewal countdown */}
                  {days != null && (
                    <div style={{ background: days <= 0 ? '#fef2f2' : days <= 7 ? '#fef2f2' : days <= 30 ? '#fffbeb' : '#f0fdf4', border: `1px solid ${days <= 7 ? '#fecaca' : days <= 30 ? '#fde68a' : '#bbf7d0'}`, borderRadius: 7, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: renewColor }}>
                        {days <= 0 ? `Overdue by ${Math.abs(days)} days` : days === 0 ? 'Renews today!' : `${days} days until renewal`}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{fmt(s.renewalDate)}</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            <KPI icon={IC.invoice}  label="Total paid"        value={fmtRs(paidTotal)}              color="#16a34a" loading={loading} />
            <KPI icon={IC.renewal}  label="Invoices raised"   value={invoices.length}               color="#1a73e8" loading={loading} />
            <KPI icon={IC.calendar} label="Days to renewal"
              value={loading ? '—' : days == null ? '—' : days <= 0 ? 'Overdue' : `${days}d`}
              sub={loading ? undefined : fmt(s?.renewalDate)}
              color={days != null && days <= 7 ? '#dc2626' : days != null && days <= 30 ? '#d97706' : '#16a34a'}
              loading={loading}
            />
          </div>

          {/* Invoice history */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111827' }}>Invoice history</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>{loading ? '' : `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Invoice #','Type','Period','Status','Method','Paid on','Amount'].map((h, i) => (
                      <th key={h} style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: i === 6 ? 'right' : 'left', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i}>{[...Array(7)].map((__, j) => <td key={j} style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6' }}><Sk /></td>)}</tr>
                    ))
                  ) : invoices.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#9ca3af' }}>No invoices found for this subscription</div>
                    </td></tr>
                  ) : invoices.map(inv => (
                    <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600, color: '#1a73e8' }}>{inv.invoiceNumber}</span>
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6' }}><Badge label={inv.invoiceType} /></td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {inv.periodFrom && inv.periodTo ? `${fmt(inv.periodFrom)} – ${fmt(inv.periodTo)}` : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6' }}><Badge label={inv.paymentStatus} /></td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12.5, color: '#9ca3af' }}>{inv.paymentMethod || '—'}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6', fontSize: 12.5, color: '#9ca3af' }}>{inv.paymentDate ? fmt(inv.paymentDate) : '—'}</td>
                      <td style={{ padding: '11px 14px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>
                        <span style={{ fontWeight: 600, color: '#111827', fontSize: 13 }}>{fmtRs(inv.totalAmount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {!loading && invoices.length > 0 && (
                  <tfoot>
                    <tr style={{ background: '#f9fafb' }}>
                      <td colSpan={6} style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280', borderTop: '1px solid #e5e7eb', fontWeight: 500 }}>
                        Total paid: {invoices.filter(i => i.paymentStatus === 'Paid').length} of {invoices.length} invoices
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', borderTop: '1px solid #e5e7eb' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>{fmtRs(paidTotal)}</span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Actions — below invoice history */}
          {!loading && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {isAdmin && (
                <button onClick={() => setShowRenew(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flex: 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}>
                  <Ic d={IC.renewal} size={14} color="white" />Renew subscription
                </button>
              )}
              {s?.customer && (
                <button onClick={() => navigate(`/customers/${s.customer._id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'inherit', flex: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.color = '#1a73e8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151' }}>
                  <Ic d={IC.link} size={13} color="currentColor" />View customer profile
                </button>
              )}
              {isAdmin && (
                <button onClick={() => setShowEdit(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: 'white', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151', fontFamily: 'inherit', flex: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a73e8'; e.currentTarget.style.color = '#1a73e8' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}>
                  <Ic d={IC.edit} size={13} color="currentColor" />Edit details
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showRenew && <RenewModal sub={s} onClose={() => setShowRenew(false)} onRenewed={updated => { setSub(updated); load() }} />}
      {showEdit  && <EditModal  sub={s} onClose={() => setShowEdit(false)}  onSaved={updated => setSub(updated)} />}
    </div>
  )
}
