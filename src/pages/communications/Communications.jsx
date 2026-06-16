import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useChatContext } from '../../context/ChatContext'
import {
  getChatUsersApi,
  createConversationApi,
  getMessagesApi,
  getAllConversationsApi,
  searchShareInvoicesApi,
  searchShareSubscriptionsApi,
  searchShareAlertsApi,
} from '../../api/chatApi'

// ── helpers ────────────────────────────────────────────────────────────────

const COLORS = ['#1a73e8','#e91e63','#9c27b0','#00897b','#f57c00','#5c6bc0','#43a047','#e53935']
function colorForName(name = '') {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function fmtTime(d) {
  if (!d) return ''
  const date = new Date(d), now = new Date(), diff = now - date
  if (diff < 60000)     return 'Just now'
  if (diff < 3600000)   return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000)  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' })
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
function fmtDayLabel(d) {
  const date = new Date(d), now = new Date()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === now.toDateString())       return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
}
function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}
function fmtINR(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name, photo, size = 38, online = false, group = false }) {
  const bg = group ? '#64748b' : colorForName(name)
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: photo ? 'transparent' : bg,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, fontWeight: 600, color: '#fff', flexShrink: 0,
      }}>
        {photo
          ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : group
            ? <svg viewBox="0 0 24 24" width={size * 0.55} height={size * 0.55} fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            : initials(name)
        }
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: '#22c55e', border: '2px solid #fff',
        }} />
      )}
    </div>
  )
}

// ── Ticks ──────────────────────────────────────────────────────────────────

function Tick({ read }) {
  if (read) {
    return (
      <svg viewBox="0 0 18 18" width={16} height={16} fill="none">
        <path d="M1 9l4 4L11 5" stroke="#1a73e8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 9l4 4 6-8" stroke="#1a73e8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 18 18" width={14} height={14} fill="none">
      <path d="M2 9l4 4L14 5" stroke="#94a3b8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── TypingDots ─────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, marginLeft: 4 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width: 4, height: 4, borderRadius: '50%', background: '#94a3b8',
          display: 'inline-block',
          animation: 'chatDotBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </span>
  )
}

// ── Shared item cards ──────────────────────────────────────────────────────

const STATUS_COLORS = {
  Paid: '#16a34a', Unpaid: '#dc2626', Partial: '#d97706', Overdue: '#dc2626', Pending: '#d97706', Refunded: '#6366f1', Cancelled: '#64748b',
  Active: '#16a34a', Expired: '#dc2626',
  Info: '#1a73e8', Warning: '#d97706', Urgent: '#dc2626',
}
const STATUS_BG = {
  Paid: '#dcfce7', Unpaid: '#fee2e2', Partial: '#fef3c7', Overdue: '#fee2e2', Pending: '#fef3c7', Refunded: '#ede9fe', Cancelled: '#f1f5f9',
  Active: '#dcfce7', Expired: '#fee2e2',
  Info: '#dbeafe', Warning: '#fef3c7', Urgent: '#fee2e2',
}

// ── shared card chrome ─────────────────────────────────────────────────────

function CardWrap({ children, accent = '#1a73e8' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, overflow: 'hidden',
      width: 290, border: '1px solid #e2e8f0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: '#f1f5f9', margin: '0' }} />
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: 12, color: bold ? '#1e293b' : '#64748b', fontWeight: bold ? 700 : 400 }}>{value || '—'}</span>
    </div>
  )
}

function Tag({ label, color = '#1a73e8', bg }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: bg || color + '15', color,
    }}>
      {label}
    </span>
  )
}

function CustomerRow({ customer }) {
  if (!customer) return null
  const name = customer.name || customer.businessName || '—'
  const ini  = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const bg   = colorForName(name)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{ini}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{name}</div>
        {customer.phone && <div style={{ fontSize: 11, color: '#64748b' }}>{customer.phone}</div>}
      </div>
    </div>
  )
}

// ── Invoice Snapshot ───────────────────────────────────────────────────────

function InvoiceCard({ d }) {
  const statusColor = STATUS_COLORS[d.paymentStatus] || '#64748b'
  const statusBg    = STATUS_BG[d.paymentStatus]     || '#f1f5f9'
  return (
    <CardWrap>
      {/* Top bar */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{d.invoiceNumber}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {d.invoiceType && <Tag label={d.invoiceType} color="#1a73e8" />}
          </div>
          {d.createdAt && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{fmtDate(d.createdAt)}</div>}
        </div>
        {d.paymentStatus && (
          <span style={{ fontSize: 12, fontWeight: 700, background: statusBg, color: statusColor, padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>
            {d.paymentStatus}
          </span>
        )}
      </div>

      <Divider />

      {/* Customer */}
      <CustomerRow customer={d.customer} />

      {/* Software + period */}
      <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {d.software?.name && <Tag label={d.software.name} color="#0f766e" />}
        {d.software?.type && <Tag label={d.software.type} color="#7c3aed" />}
      </div>
      {(d.periodFrom || d.periodTo) && (
        <div style={{ padding: '0 14px 8px', fontSize: 11, color: '#64748b' }}>
          {fmtDate(d.periodFrom)} — {fmtDate(d.periodTo)}
        </div>
      )}

      <Divider />

      {/* Amounts */}
      <div style={{ padding: '8px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Amount</div>
            <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{d.amount ? fmtINR(d.amount) : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Tax</div>
            <div style={{ fontSize: 13, color: '#1e293b' }}>{d.tax ? fmtINR(d.tax) : '—'}</div>
          </div>
        </div>
        {d.discount > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Discount</div>
            <div style={{ fontSize: 13, color: '#16a34a' }}>-{fmtINR(d.discount)}</div>
          </div>
        )}
      </div>

      <Divider />

      {/* Total */}
      <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', letterSpacing: '0.04em' }}>TOTAL</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{fmtINR(d.totalAmount)}</span>
      </div>

      <Divider />

      {/* Via */}
      <div style={{ padding: '7px 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Via {d.paymentMethod || '—'}</span>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#94a3b8" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
      </div>
    </CardWrap>
  )
}

// ── Subscription Snapshot ──────────────────────────────────────────────────

function SubscriptionCard({ d }) {
  const statusColor = STATUS_COLORS[d.status]       || '#64748b'
  const statusBg    = STATUS_BG[d.status]           || '#f1f5f9'
  const payColor    = STATUS_COLORS[d.paymentStatus] || '#64748b'
  const payBg       = STATUS_BG[d.paymentStatus]    || '#f1f5f9'
  return (
    <CardWrap>
      {/* Top bar */}
      <div style={{ padding: '10px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{d.softwares?.name || '—'}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {d.softwares?.type && <Tag label={d.softwares.type} color="#7c3aed" />}
            {d.billingCycle    && <Tag label={d.billingCycle}   color="#0f766e" />}
          </div>
        </div>
        {d.status && (
          <span style={{ fontSize: 12, fontWeight: 700, background: statusBg, color: statusColor, padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>
            {d.status}
          </span>
        )}
      </div>

      <Divider />
      <CustomerRow customer={d.customer} />
      <Divider />

      {/* Dates */}
      <div style={{ padding: '8px 14px' }}>
        <Row label="Buy Date"     value={fmtDate(d.buyDate)} />
        <Row label="Renewal Date" value={fmtDate(d.renewalDate)} />
        {d.lastRenewedDate && <Row label="Last Renewed" value={fmtDate(d.lastRenewedDate)} />}
      </div>

      <Divider />

      {/* Amount + payment status */}
      <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Amount Charged</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>{fmtINR(d.amountCharged)}</div>
        </div>
        {d.paymentStatus && (
          <span style={{ fontSize: 12, fontWeight: 700, background: payBg, color: payColor, padding: '3px 10px', borderRadius: 8 }}>
            {d.paymentStatus}
          </span>
        )}
      </div>

      {d.notes && (
        <>
          <Divider />
          <div style={{ padding: '7px 14px', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>{d.notes}</div>
        </>
      )}
    </CardWrap>
  )
}

// ── Alert Snapshot ─────────────────────────────────────────────────────────

function AlertCard({ d }) {
  const sevColor = STATUS_COLORS[d.severity] || '#64748b'
  const sevBg    = STATUS_BG[d.severity]     || '#f1f5f9'
  return (
    <CardWrap>
      {/* Severity header bar */}
      <div style={{ background: sevColor, padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
            {d.type?.toUpperCase()} ALERT
          </span>
        </div>
        <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>
          {d.severity}
        </span>
      </div>

      {/* Title + subType */}
      <div style={{ padding: '10px 14px 8px' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{d.title}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {d.subType && <Tag label={d.subType} color="#64748b" />}
          {d.dueDate && (
            <Tag label={`Due: ${fmtDate(d.dueDate)}`} color={sevColor} />
          )}
        </div>
      </div>

      {d.message && (
        <>
          <Divider />
          <div style={{ padding: '8px 14px', fontSize: 12, color: '#475569', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>
            {d.message}
          </div>
        </>
      )}

      {d.customer && (
        <>
          <Divider />
          <CustomerRow customer={d.customer} />
        </>
      )}

      {d.software && (
        <>
          <Divider />
          <div style={{ padding: '8px 14px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Tag label={d.software.name} color="#0f766e" />
            {d.software.type && <Tag label={d.software.type} color="#7c3aed" />}
          </div>
        </>
      )}
    </CardWrap>
  )
}

function MsgCard({ msg }) {
  if (!msg.refData) return <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Snapshot unavailable</div>
  if (msg.type === 'invoice')      return <InvoiceCard d={msg.refData} />
  if (msg.type === 'subscription') return <SubscriptionCard d={msg.refData} />
  if (msg.type === 'alert')        return <AlertCard d={msg.refData} />
  return null
}

// ── Share Picker ───────────────────────────────────────────────────────────

function SharePicker({ onShare, onClose }) {
  const [tab,    setTab]    = useState('invoice')
  const [q,      setQ]      = useState('')
  const [items,  setItems]  = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQ('')
    setItems([])
  }, [tab])

  const search = useCallback(async (query) => {
    setLoading(true)
    try {
      let r
      if (tab === 'invoice')      r = await searchShareInvoicesApi(query)
      if (tab === 'subscription') r = await searchShareSubscriptionsApi(query)
      if (tab === 'alert')        r = await searchShareAlertsApi(query)
      setItems(r?.data?.data || [])
    } catch { setItems([]) }
    finally { setLoading(false) }
  }, [tab])

  useEffect(() => {
    search('')
  }, [search])

  const tabs = [
    { id: 'invoice',      label: 'Invoices',       icon: '🧾' },
    { id: 'subscription', label: 'Subscriptions',  icon: '🔄' },
    { id: 'alert',        label: 'Alerts',          icon: '⚠️' },
  ]

  const getLabel = (item) => {
    if (tab === 'invoice')      return `${item.invoiceNumber} · ${item.customer?.name || item.customer?.businessName || ''}`
    if (tab === 'subscription') return `${item.softwares?.name || '?'} · ${item.customer?.name || item.customer?.businessName || ''}`
    if (tab === 'alert')        return item.title
    return ''
  }
  const getSub = (item) => {
    if (tab === 'invoice')      return `${fmtINR(item.totalAmount)} · ${item.paymentStatus || ''}`
    if (tab === 'subscription') return `${item.status || ''} · Renewal: ${fmtDate(item.renewalDate)}`
    if (tab === 'alert')        return `${item.severity} · ${fmtDate(item.dueDate)}`
    return ''
  }

  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 8,
      background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      border: '1px solid #e2e8f0', zIndex: 50, maxHeight: 380, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Share</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1 }}>×</button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: tab === t.id ? '#1a73e8' : '#f1f5f9',
              color: tab === t.id ? '#fff' : '#64748b',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', borderRadius: 8, padding: '6px 10px' }}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="#94a3b8"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5a6.5 6.5 0 10-13 0 6.5 6.5 0 006.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          <input
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1e293b' }}
            placeholder={`Search ${tab}s…`}
            value={q}
            onChange={e => { setQ(e.target.value); search(e.target.value) }}
          />
        </div>
      </div>
      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>Loading…</div>}
        {!loading && items.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13 }}>No items found</div>}
        {!loading && items.map(item => (
          <div
            key={item._id}
            onClick={() => onShare(tab, item)}
            style={{
              padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 10,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getLabel(item)}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{getSub(item)}</div>
            </div>
            <div style={{ background: '#1a73e8', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, flexShrink: 0 }}>Share</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Admin Conversation Browser ─────────────────────────────────────────────

function AdminBrowser({ myId, isAdmin, onSelectConv }) {
  // Admin/SuperAdmin can tap any conversation from the list via the existing UI.
  // The context already provides all conversations including those the admin is in.
  // To see ALL conversations (including ones they're not in), a separate admin API would be needed.
  // For now: admins see all conversations where they are a participant, same as others.
  return null
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Communications() {
  const me   = useSelector(s => s.auth.user)
  const myId = me?._id || me?.id || ''
  const isAdmin = ['Admin', 'SuperAdmin'].includes(me?.role)

  const {
    socket: socketRef,
    conversations, setConversations,
    onlineUsers,
    typingMap,
    markConvRead,
    clearActiveConv,
    activeConvIdRef,
  } = useChatContext()

  const messagesEndRef = useRef(null)
  const msgContRef     = useRef(null)
  const typingTimeout  = useRef(null)
  const isTypingRef    = useRef(false)

  const [activeConvId,  setActiveConvId]  = useState(null)
  const [messages,      setMessages]      = useState([])
  const [users,         setUsers]         = useState([])
  const [text,          setText]          = useState('')
  const [loading,       setLoading]       = useState(true)
  const [msgLoading,    setMsgLoading]    = useState(false)
  const [hasMore,       setHasMore]       = useState(false)
  const [search,        setSearch]        = useState('')
  const [showNewChat,   setShowNewChat]   = useState(false)
  const [ncTab,         setNcTab]         = useState('direct')
  const [ncSelected,    setNcSelected]    = useState([])
  const [ncGroupName,   setNcGroupName]   = useState('')
  const [creating,      setCreating]      = useState(false)
  const [userSearch,    setUserSearch]    = useState('')
  const [ncError,       setNcError]       = useState('')
  const [showShare,     setShowShare]     = useState(false)
  const [adminView,     setAdminView]     = useState(false)   // admin "All Chats" toggle
  const [allConvs,      setAllConvs]      = useState([])
  const [allConvsLoading, setAllConvsLoading] = useState(false)

  const activeConv    = conversations.find(c => c._id === activeConvId) || null
  const socket        = socketRef?.current

  // ── helpers ──────────────────────────────────────────────────────────────

  const getConvName = useCallback((conv) => {
    if (!conv) return ''
    if (conv.type === 'group') return conv.name || 'Group Chat'
    const other = (conv.participants || []).find(p => String(p._id || p) !== String(myId))
    return other?.name || 'Unknown'
  }, [myId])

  const getConvPhoto = useCallback((conv) => {
    if (!conv || conv.type === 'group') return null
    const other = (conv.participants || []).find(p => String(p._id || p) !== String(myId))
    return other?.ProfilePhoto || null
  }, [myId])

  const getOtherUser = useCallback((conv) => {
    if (!conv || conv.type === 'group') return null
    return (conv.participants || []).find(p => String(p._id || p) !== String(myId)) || null
  }, [myId])

  // ── socket new_message handler ────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return
    const handler = ({ conversationId, message }) => {
      if (conversationId !== activeConvIdRef.current) return
      setMessages(prev => {
        if (prev.find(m => m._id === message._id)) return prev
        return [...prev, message]
      })
    }
    socket.on('new_message', handler)
    return () => socket.off('new_message', handler)
  }, [socket, activeConvIdRef])

  // ── load users ────────────────────────────────────────────────────────────

  useEffect(() => {
    getChatUsersApi()
      .then(r => setUsers(r.data.data || []))
      .finally(() => setLoading(false))
  }, [])

  // Load all conversations when admin toggles the view
  useEffect(() => {
    if (!adminView || !isAdmin) return
    setAllConvsLoading(true)
    getAllConversationsApi()
      .then(r => setAllConvs(r.data.data || []))
      .catch(() => setAllConvs([]))
      .finally(() => setAllConvsLoading(false))
  }, [adminView, isAdmin])

  // ── load messages ─────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (convId, before = null) => {
    setMsgLoading(true)
    try {
      const params = { limit: 40 }
      if (before) params.before = before
      const r = await getMessagesApi(convId, params)
      const newMsgs = r.data.data || []
      if (before) setMessages(prev => [...newMsgs, ...prev])
      else        setMessages(newMsgs)
      setHasMore(r.data.hasMore || false)
    } catch { /* ignore */ }
    finally { setMsgLoading(false) }
  }, [])

  useEffect(() => {
    if (!activeConvId) return
    loadMessages(activeConvId)
    socket?.emit('mark_read', { conversationId: activeConvId })
    markConvRead(activeConvId)
  }, [activeConvId, loadMessages, socket, markConvRead])

  // Sync activeConvIdRef
  useEffect(() => {
    activeConvIdRef.current = activeConvId
    return () => { if (!activeConvId) clearActiveConv() }
  }, [activeConvId, activeConvIdRef, clearActiveConv])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── load more ─────────────────────────────────────────────────────────────

  const handleMsgScroll = useCallback(() => {
    const el = msgContRef.current
    if (!el || !hasMore || msgLoading) return
    if (el.scrollTop < 80 && messages.length > 0) loadMessages(activeConvId, messages[0]._id)
  }, [hasMore, msgLoading, messages, activeConvId, loadMessages])

  // ── send message ──────────────────────────────────────────────────────────

  const sendMessage = useCallback((overridePayload = null) => {
    if (!activeConvId) return
    const payload = overridePayload || { conversationId: activeConvId, text: text.trim() }
    if (!payload.text?.trim() && !payload.refId) return
    socket?.emit('send_message', payload)
    if (!overridePayload) {
      setText('')
      isTypingRef.current = false
      socket?.emit('typing_stop', { conversationId: activeConvId })
    }
  }, [text, activeConvId, socket])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }, [sendMessage])

  // ── typing ────────────────────────────────────────────────────────────────

  const handleTextChange = useCallback((e) => {
    setText(e.target.value)
    if (!activeConvId) return
    if (!isTypingRef.current) {
      isTypingRef.current = true
      socket?.emit('typing_start', { conversationId: activeConvId })
    }
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      isTypingRef.current = false
      socket?.emit('typing_stop', { conversationId: activeConvId })
    }, 2000)
  }, [activeConvId, socket])

  // ── share attachment ──────────────────────────────────────────────────────

  const handleShare = useCallback((type, item) => {
    setShowShare(false)
    sendMessage({
      conversationId: activeConvId,
      text: '',
      type,
      refId:   item._id,
      refData: item,
    })
  }, [activeConvId, sendMessage])

  // ── new conversation ──────────────────────────────────────────────────────

  const openNewChat = useCallback(() => {
    setNcTab('direct'); setNcSelected([]); setNcGroupName('')
    setUserSearch(''); setNcError(''); setShowNewChat(true)
  }, [])

  const toggleNcUser = useCallback((uid) => {
    setNcSelected(prev =>
      ncTab === 'direct'
        ? [uid]
        : prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }, [ncTab])

  const createChat = useCallback(async () => {
    if (!ncSelected.length) return
    if (ncTab === 'group' && !ncGroupName.trim()) return
    setCreating(true)
    try {
      const r = await createConversationApi({
        type: ncTab === 'direct' ? 'direct' : 'group',
        participantIds: ncSelected,
        name: ncTab === 'group' ? ncGroupName.trim() : undefined,
      })
      const conv = r.data.data
      socket?.emit('join_conversation', { conversationId: conv._id })
      setConversations(prev => prev.find(c => c._id === conv._id) ? prev : [conv, ...prev])
      setActiveConvId(conv._id)
      setShowNewChat(false)
    } catch (err) {
      setNcError(err.response?.data?.message || 'Could not create conversation')
    } finally { setCreating(false) }
  }, [ncSelected, ncTab, ncGroupName, socket, setConversations])

  // ── computed ──────────────────────────────────────────────────────────────

  const sourceConvs   = (isAdmin && adminView) ? allConvs : conversations
  const filteredConvs = sourceConvs.filter(c =>
    !search || getConvName(c).toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase())
  )

  const typingInActive = activeConvId
    ? [...(typingMap[activeConvId] || new Set())].filter(id => String(id) !== String(myId))
    : []

  const typingNames = typingInActive.map(id => {
    const p = activeConv?.participants?.find(p => String(p._id || p) === String(id))
    return p?.name || 'Someone'
  }).join(', ')

  // Date-grouped messages
  const groupedMessages = []
  messages.forEach((msg, i) => {
    const prev = messages[i - 1]
    if (!prev || !isSameDay(prev.createdAt, msg.createdAt)) {
      groupedMessages.push({ type: 'date', label: fmtDayLabel(msg.createdAt), key: `d-${i}` })
    }
    groupedMessages.push({ type: 'msg', msg, key: msg._id })
  })

  // ── styles ────────────────────────────────────────────────────────────────

  const S = {
    root: { display: 'flex', height: 'calc(100vh - 82px)', margin: '-28px -30px', overflow: 'hidden', background: '#f1f5f9' },
    sidebar: { width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', background: '#ffffff', borderRight: '1px solid #e2e8f0' },
    sidebarTop: { padding: '16px 16px 12px', borderBottom: '1px solid #e2e8f0' },
    sidebarTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    searchBar: { display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: 10, padding: '8px 12px', gap: 8 },
    searchInput: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#1e293b' },
    convList: { flex: 1, overflowY: 'auto', padding: '6px 0' },
    convItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', cursor: 'pointer',
      background: active ? '#eff6ff' : 'transparent',
      borderLeft: active ? '3px solid #1a73e8' : '3px solid transparent',
      transition: 'background 0.15s',
    }),
    convMeta: { flex: 1, minWidth: 0 },
    convName: (active) => ({ fontSize: 14, fontWeight: active ? 600 : 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
    convPreview: { fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2, display: 'flex', alignItems: 'center' },
    convRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
    convTime: { fontSize: 11, color: '#94a3b8' },
    badge: { background: '#1a73e8', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' },
    panel: { flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', minWidth: 0 },
    panelHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
    messagesArea: { flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 2 },
    dateLabel: { textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', margin: '12px 0 6px', textTransform: 'uppercase' },
    bubble: (mine) => ({ display: 'flex', flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginBottom: 2 }),
    bubbleText: (mine) => ({
      maxWidth: '65%', padding: '8px 14px',
      borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: mine ? '#1a73e8' : '#DCDCDC',
      color: mine ? '#ffffff' : '#1e293b',
      fontSize: 14, lineHeight: 1.5, boxShadow: 'none', wordBreak: 'break-word', whiteSpace: 'pre-wrap',
    }),
    bubbleMeta: (mine) => ({ fontSize: 10, color: '#94a3b8', textAlign: mine ? 'right' : 'left', marginTop: 2, paddingLeft: mine ? 0 : 42, paddingRight: mine ? 42 : 0, display: 'flex', alignItems: 'center', gap: 3, justifyContent: mine ? 'flex-end' : 'flex-start' }),
    inputBar: { display: 'flex', alignItems: 'flex-end', gap: 10, padding: '12px 20px', background: '#ffffff', borderTop: '1px solid #e2e8f0', flexShrink: 0, position: 'relative' },
    textarea: { flex: 1, resize: 'none', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', fontFamily: 'inherit', maxHeight: 120, lineHeight: 1.5, background: '#f8fafc' },
    sendBtn: (enabled) => ({ width: 42, height: 42, borderRadius: '50%', background: enabled ? '#1a73e8' : '#e2e8f0', border: 'none', cursor: enabled ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }),
    attachBtn: { width: 38, height: 38, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8' },
    newChatBtn: { width: 30, height: 30, borderRadius: '50%', background: '#1a73e8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: 16, width: 440, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    modalHeader: { padding: '20px 24px 16px', borderBottom: '1px solid #e2e8f0' },
    modalTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 12 },
    tabRow: { display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3 },
    tabBtn: (active) => ({ flex: 1, padding: '7px 0', border: 'none', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400, background: active ? '#fff' : 'transparent', color: active ? '#1a73e8' : '#64748b', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }),
    modalBody: { flex: 1, overflowY: 'auto', padding: '12px 24px' },
    modalFooter: { padding: '12px 24px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end' },
    userRow: (sel) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: sel ? '#eff6ff' : 'transparent' }),
    cancelBtn: { padding: '9px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
    primaryBtn: (dis) => ({ padding: '9px 20px', borderRadius: 10, border: 'none', background: dis ? '#93c5fd' : '#1a73e8', color: '#fff', fontSize: 14, fontWeight: 600, cursor: dis ? 'not-allowed' : 'pointer' }),
    groupInput: { width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#1e293b', outline: 'none', marginBottom: 12, boxSizing: 'border-box' },
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        @keyframes chatDotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>

      <div style={S.root}>

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────── */}
        <div style={S.sidebar}>
          <div style={S.sidebarTop}>
            <div style={S.sidebarTitle}>
              <span>Messages</span>
              <button style={S.newChatBtn} onClick={openNewChat} title="New conversation" disabled={adminView}>
                <svg viewBox="0 0 24 24" width={16} height={16} fill="#fff">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14l4-4h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 10H8v-2h4V7h2v4h4v2h-4v4h-2v-4z"/>
                </svg>
              </button>
            </div>
            {/* Admin toggle */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 10, padding: 3, marginBottom: 10 }}>
                {[['My Chats', false], ['All Chats', true]].map(([label, val]) => (
                  <button key={label} onClick={() => { setAdminView(val); setActiveConvId(null); setMessages([]) }} style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: adminView === val ? 700 : 400,
                    background: adminView === val ? '#1a73e8' : 'transparent',
                    color: adminView === val ? '#fff' : '#64748b',
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div style={S.searchBar}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="#94a3b8"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5a6.5 6.5 0 10-13 0 6.5 6.5 0 006.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              <input style={S.searchInput} placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div style={S.convList}>
            {allConvsLoading && (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading all chats…</div>
            )}
            {!allConvsLoading && filteredConvs.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                {search ? 'No conversations found' : 'No conversations yet. Start one!'}
              </div>
            )}
            {filteredConvs.map(conv => {
              const isActive   = conv._id === activeConvId
              const name       = getConvName(conv)
              const photo      = getConvPhoto(conv)
              const isGroup    = conv.type === 'group'
              const other      = getOtherUser(conv)
              const otherId    = other?._id || other?.id
              const isOnline   = !isGroup && otherId ? onlineUsers.has(otherId) : false
              const lastMsg    = conv.lastMessage
              const isTyping   = (typingMap[conv._id]?.size || 0) > 0
              const typingUser = isTyping
                ? [...typingMap[conv._id]].map(id => {
                    const p = conv.participants?.find(p => String(p._id || p) === String(id))
                    return p?.name?.split(' ')[0] || 'Someone'
                  }).join(', ')
                : null

              let preview = 'No messages yet'
              if (isTyping) preview = null
              else if (lastMsg) {
                const isMine = String(lastMsg.sender?._id || lastMsg.sender) === String(myId)
                if (lastMsg.type === 'invoice')      preview = (isMine ? 'You: ' : '') + '🧾 Invoice shared'
                else if (lastMsg.type === 'subscription') preview = (isMine ? 'You: ' : '') + '🔄 Subscription shared'
                else if (lastMsg.type === 'alert')   preview = (isMine ? 'You: ' : '') + '⚠️ Alert shared'
                else preview = (isMine ? 'You: ' : '') + (lastMsg.text || '')
              }

              return (
                <div key={conv._id} style={S.convItem(isActive)} onClick={() => setActiveConvId(conv._id)}>
                  <Avatar name={name} photo={photo} size={44} online={isOnline} group={isGroup} />
                  <div style={S.convMeta}>
                    <div style={S.convName(isActive)}>{name}</div>
                    <div style={S.convPreview}>
                      {isTyping
                        ? <span style={{ color: '#1a73e8', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                            {typingUser} typing <TypingDots />
                          </span>
                        : preview
                      }
                    </div>
                  </div>
                  <div style={S.convRight}>
                    <span style={S.convTime}>{fmtTime(conv.updatedAt)}</span>
                    {conv.unreadCount > 0 && (
                      <div style={S.badge}>{conv.unreadCount > 9 ? '9+' : conv.unreadCount}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────────────── */}
        <div style={S.panel}>
          {!activeConvId ? (
            <div style={S.emptyState}>
              <svg viewBox="0 0 24 24" width={56} height={56} fill="#cbd5e1"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>Select a conversation</div>
              <div style={{ fontSize: 13, color: '#cbd5e1' }}>or start a new one</div>
              <button style={{ ...S.primaryBtn(false), marginTop: 8 }} onClick={openNewChat}>New Conversation</button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={S.panelHeader}>
                {activeConv && (
                  <>
                    <Avatar
                      name={getConvName(activeConv)}
                      photo={getConvPhoto(activeConv)}
                      size={40}
                      group={activeConv.type === 'group'}
                      online={activeConv.type !== 'group' && onlineUsers.has(getOtherUser(activeConv)?._id || getOtherUser(activeConv)?.id)}
                    />
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{getConvName(activeConv)}</div>
                      {activeConv.type !== 'group' && onlineUsers.has(getOtherUser(activeConv)?._id || getOtherUser(activeConv)?.id)
                        ? <div style={{ fontSize: 12, color: '#22c55e', marginTop: 1 }}>Online</div>
                        : activeConv.type === 'group'
                          ? <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>{activeConv.participants?.length || 0} members</div>
                          : null
                      }
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div style={S.messagesArea} ref={msgContRef} onScroll={handleMsgScroll}>
                {msgLoading && messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 20 }}>Loading messages…</div>
                )}
                {hasMore && !msgLoading && (
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <button onClick={() => loadMessages(activeConvId, messages[0]?._id)} style={{ border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 16px', fontSize: 12, color: '#64748b', background: '#fff', cursor: 'pointer' }}>
                      Load earlier
                    </button>
                  </div>
                )}

                {groupedMessages.map(item => {
                  if (item.type === 'date') return <div key={item.key} style={S.dateLabel}>{item.label}</div>

                  const msg        = item.msg
                  const mine       = String(msg.sender?._id || msg.sender) === String(myId)
                  const senderName = msg.sender?.name || ''
                  const senderPhoto= msg.sender?.ProfilePhoto || null
                  const showAvatar = activeConv?.type === 'group' && !mine
                  const isCard     = msg.type !== 'text'
                  const readByOthers = (msg.readBy || []).some(id => String(id) !== String(myId))

                  return (
                    <div key={item.key}>
                      <div style={S.bubble(mine)}>
                        {showAvatar
                          ? <Avatar name={senderName} photo={senderPhoto} size={28} />
                          : !mine ? <div style={{ width: 28 }} /> : null
                        }
                        {isCard
                          ? (
                            <div style={{ opacity: 1 }}>
                              <MsgCard msg={msg} />
                            </div>
                          )
                          : <div style={S.bubbleText(mine)}>{msg.text}</div>
                        }
                      </div>
                      <div style={S.bubbleMeta(mine)}>
                        {!mine && activeConv?.type === 'group' && (
                          <span style={{ fontWeight: 500, color: '#64748b' }}>{senderName} · </span>
                        )}
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {mine && <Tick read={readByOthers} />}
                      </div>
                    </div>
                  )
                })}

                {/* Typing indicator in message area */}
                {typingInActive.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          width: 8, height: 8, borderRadius: '50%', background: '#94a3b8',
                          animation: 'chatDotBounce 1.2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                      {typingNames} {typingInActive.length === 1 ? 'is' : 'are'} typing…
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Admin read-only notice */}
              {isAdmin && adminView && activeConv && !activeConv.participants?.some(p => String(p._id || p) === String(myId)) && (
                <div style={{ padding: '8px 20px', background: '#fef3c7', borderTop: '1px solid #fde68a', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="#92400e"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  You are viewing this conversation as an admin (read-only)
                </div>
              )}

              {/* Input bar — hide if admin viewing someone else's conversation */}
              {(!adminView || !isAdmin || activeConv?.participants?.some(p => String(p._id || p) === String(myId))) && <div style={S.inputBar}>
                {showShare && (
                  <SharePicker onShare={handleShare} onClose={() => setShowShare(false)} />
                )}
                <button style={S.attachBtn} onClick={() => setShowShare(v => !v)} title="Share invoice / subscription / alert">
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={showShare ? '#1a73e8' : '#64748b'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </button>
                <textarea
                  style={S.textarea}
                  rows={1}
                  placeholder="Type a message…"
                  value={text}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                />
                <button style={S.sendBtn(!!text.trim())} onClick={sendMessage} disabled={!text.trim()}>
                  <svg viewBox="0 0 24 24" width={18} height={18} fill={text.trim() ? '#fff' : '#94a3b8'}>
                    <path d="M2 21l21-9L2 3v7l15 2-15 2z"/>
                  </svg>
                </button>
              </div>}
            </>
          )}
        </div>
      </div>

      {/* ── NEW CHAT MODAL ──────────────────────────────────────────── */}
      {showNewChat && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowNewChat(false) }}>
          <div style={S.modal}>
            <div style={S.modalHeader}>
              <div style={S.modalTitle}>New Conversation</div>
              <div style={S.tabRow}>
                <button style={S.tabBtn(ncTab === 'direct')} onClick={() => { setNcTab('direct'); setNcSelected([]) }}>Direct Message</button>
                <button style={S.tabBtn(ncTab === 'group')} onClick={() => { setNcTab('group'); setNcSelected([]) }}>Group Chat</button>
              </div>
            </div>
            <div style={S.modalBody}>
              {ncTab === 'group' && (
                <input style={S.groupInput} placeholder="Group name…" value={ncGroupName} onChange={e => setNcGroupName(e.target.value)} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', borderRadius: 10, padding: '8px 12px', marginBottom: 8 }}>
                <svg viewBox="0 0 24 24" width={15} height={15} fill="#94a3b8"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5a6.5 6.5 0 10-13 0 6.5 6.5 0 006.5 6.5c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <input style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#1e293b' }} placeholder="Search people…" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              </div>
              {filteredUsers.map(u => {
                const sel = ncSelected.includes(u._id)
                return (
                  <div key={u._id} style={S.userRow(sel)} onClick={() => toggleNcUser(u._id)}>
                    <Avatar name={u.name} photo={u.ProfilePhoto} size={38} online={onlineUsers.has(u._id)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{u.role}</div>
                    </div>
                    {sel && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width={12} height={12} fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      </div>
                    )}
                  </div>
                )
              })}
              {filteredUsers.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: 13 }}>No users found</div>}
              {ncError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{ncError}</div>}
            </div>
            <div style={S.modalFooter}>
              <button style={S.cancelBtn} onClick={() => { setShowNewChat(false); setNcError('') }}>Cancel</button>
              <button
                style={S.primaryBtn(!ncSelected.length || creating || (ncTab === 'group' && !ncGroupName.trim()))}
                disabled={!ncSelected.length || creating || (ncTab === 'group' && !ncGroupName.trim())}
                onClick={createChat}
              >
                {creating ? 'Creating…' : ncTab === 'direct' ? 'Start Chat' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
