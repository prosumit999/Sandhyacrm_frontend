import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  getAllTicketsApi, updateTicketApi, deleteTicketApi,
  addTicketReplyApi, assignTicketApi, resolveTicketApi, closeTicketApi,
} from '../../api/ticketApi'
import axiosInstance from '../../api/axios'

// ── helpers ───────────────────────────────────────────────────────────────────
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical']
const STATUSES   = ['Open', 'InProgress', 'WaitingOnClient', 'Resolved', 'Closed']

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_LABEL = { InProgress: 'In Progress', WaitingOnClient: 'Waiting on Client' }
function statusLabel(s) { return STATUS_LABEL[s] || s }

// ── badge components ──────────────────────────────────────────────────────────
const PB = { bg: '#eff6ff', color: '#1a73e8', border: '#bfdbfe' }

function StatusBadge({ status }) {
  return (
    <span style={{ background: PB.bg, color: PB.color, border: `1px solid ${PB.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {statusLabel(status)}
    </span>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span style={{ background: PB.bg, color: PB.color, border: `1px solid ${PB.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {priority}
    </span>
  )
}

// ── small helpers ─────────────────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Inp({ style, ...props }) {
  const [f, setF] = useState(false)
  return (
    <input {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', fontFamily: 'inherit', ...style }}
    />
  )
}

function Sel({ style, children, ...props }) {
  const [f, setF] = useState(false)
  return (
    <select {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', fontFamily: 'inherit', ...style }}>
      {children}
    </select>
  )
}

function Txt({ style, ...props }) {
  const [f, setF] = useState(false)
  return (
    <textarea {...props}
      onFocus={e => { setF(true); props.onFocus?.(e) }}
      onBlur={e => { setF(false); props.onBlur?.(e) }}
      style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', resize: 'vertical', fontFamily: 'inherit', ...style }}
    />
  )
}

// ── ticket card ───────────────────────────────────────────────────────────────
function TicketCard({ t, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: `1px solid ${hov ? '#bfdbfe' : 'gainsboro'}`, borderRadius: '8px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: hov ? '0 4px 16px rgba(26,115,232,0.08)' : 'none' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11.5px', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>#{t.ticketNumber}</div>
          <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#111827', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.title}</div>
        </div>
        <StatusBadge status={t.status} />
      </div>

      {/* customer / software */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {t.customer && <div style={{ fontSize: '12.5px', color: '#374151', fontWeight: 500 }}>{t.customer?.name || t.customer?.businessName || '—'}</div>}
        {t.software && <div style={{ fontSize: '11.5px', color: '#9ca3af' }}>{t.software?.name}</div>}
      </div>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #f3f4f6' }}>
        <PriorityBadge priority={t.priority || 'Medium'} />
        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{fmt(t.createdAt)}</div>
      </div>

      {t.assignedTo && (
        <div style={{ fontSize: '11.5px', color: '#6b7280' }}>Assigned: {t.assignedTo?.name}</div>
      )}
    </div>
  )
}

// ── ticket detail drawer ──────────────────────────────────────────────────────
function TicketDrawer({ ticket, isAdmin, isSuperAdmin, userId, onClose, onUpdated, onDeleted, teamUsers }) {
  const [replyText,    setReplyText]    = useState('')
  const [replySaving,  setReplySaving]  = useState(false)
  const [replyErr,     setReplyErr]     = useState('')
  const [assignTo,     setAssignTo]     = useState(ticket.assignedTo?._id || '')
  const [assigning,    setAssigning]    = useState(false)
  const [actionBusy,   setActionBusy]   = useState('')
  const [delConfirm,   setDelConfirm]   = useState(false)
  const [current,      setCurrent]      = useState(ticket)
  const [online,       setOnline]       = useState(navigator.onLine)

  useEffect(() => {
    const on  = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online',  on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/tickets/${ticket._id}`)
      const updated = res.data?.data || res.data
      setCurrent(updated)
      setAssignTo(updated.assignedTo?._id || '')
      onUpdated(updated)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket._id])

  // 3s when online, 15s when offline
  useEffect(() => {
    refresh()
    const id = setInterval(refresh, online ? 3000 : 15000)
    return () => clearInterval(id)
  }, [refresh, online])

  const handleReply = async () => {
    if (!replyText.trim()) return
    setReplySaving(true); setReplyErr('')
    try {
      await addTicketReplyApi(current._id, { message: replyText.trim() })
      setReplyText(''); refresh()
    } catch (e) { setReplyErr(e.response?.data?.message || 'Failed to send reply.') }
    finally { setReplySaving(false) }
  }

  const handleAssign = async () => {
    if (!assignTo) return
    setAssigning(true)
    try { await assignTicketApi(current._id, { assignedTo: assignTo }); refresh() }
    catch {}
    finally { setAssigning(false) }
  }

  const handleAction = async (action) => {
    setActionBusy(action)
    try {
      if (action === 'resolve') await resolveTicketApi(current._id)
      else if (action === 'close') await closeTicketApi(current._id)
      refresh()
    } catch {}
    finally { setActionBusy('') }
  }

  const handleDelete = async () => {
    try { await deleteTicketApi(current._id); onDeleted(current._id); onClose() }
    catch {}
  }

  const isOpen = !['Resolved', 'Closed'].includes(current.status)
  const replies = current.replies || []

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '4px' }}>#{current.ticketNumber}</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{current.title}</div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={current.status} />
                <PriorityBadge priority={current.priority || 'Medium'} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span title={online ? 'Live — refreshing every 3s' : 'Offline — refreshing every 15s'}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: online ? '#16a34a' : '#d97706', fontWeight: 600, cursor: 'default' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: online ? '#16a34a' : '#d97706', display: 'inline-block',
                  boxShadow: online ? '0 0 0 2px #bbf7d0' : '0 0 0 2px #fde68a' }} />
                {online ? 'Live' : 'Offline'}
              </span>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1, padding: '4px' }}>×</button>
            </div>
          </div>

          {/* meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '14px', fontSize: '12px' }}>
            <div><span style={{ color: '#9ca3af' }}>Customer: </span><span style={{ color: '#374151', fontWeight: 500 }}>{current.customer?.name || '—'}</span></div>
            <div><span style={{ color: '#9ca3af' }}>Software: </span><span style={{ color: '#374151', fontWeight: 500 }}>{current.software?.name || '—'}</span></div>
            <div><span style={{ color: '#9ca3af' }}>Assigned: </span><span style={{ color: '#374151', fontWeight: 500 }}>{current.assignedTo?.name || 'Unassigned'}</span></div>
            <div><span style={{ color: '#9ca3af' }}>Created: </span><span style={{ color: '#374151', fontWeight: 500 }}>{fmt(current.createdAt)}</span></div>
          </div>

          {/* admin actions */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '14px', flexWrap: 'wrap' }}>
              {isOpen && (
                <button onClick={() => handleAction('resolve')} disabled={actionBusy === 'resolve'}
                  style={{ padding: '5px 12px', border: '1px solid #bfdbfe', borderRadius: 5, background: '#eff6ff', color: '#1a73e8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {actionBusy === 'resolve' ? 'Resolving…' : 'Mark Resolved'}
                </button>
              )}
              {current.status !== 'Closed' && (
                <button onClick={() => handleAction('close')} disabled={actionBusy === 'close'}
                  style={{ padding: '5px 12px', border: '1px solid gainsboro', borderRadius: 5, background: 'white', color: '#6b7280', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {actionBusy === 'close' ? 'Closing…' : 'Close Ticket'}
                </button>
              )}
              {isSuperAdmin && (
                <button onClick={() => setDelConfirm(true)}
                  style={{ padding: '5px 12px', border: '1px solid #fecaca', borderRadius: 5, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                  Delete
                </button>
              )}
            </div>
          )}

          {/* assign */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', alignItems: 'center' }}>
              <Sel value={assignTo} onChange={e => setAssignTo(e.target.value)} style={{ flex: 1, fontSize: 12 }}>
                <option value="">— Assign to —</option>
                {teamUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
              </Sel>
              <button onClick={handleAssign} disabled={!assignTo || assigning}
                style={{ padding: '7px 14px', background: assignTo && !assigning ? '#1a73e8' : '#f3f4f6', color: assignTo && !assigning ? 'white' : '#9ca3af', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: assignTo && !assigning ? 'pointer' : 'not-allowed', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {assigning ? '…' : 'Assign'}
              </button>
            </div>
          )}
        </div>

        {/* description + replies */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* original description */}
          <div style={{ background: '#f9fafb', border: '1px solid gainsboro', borderRadius: '8px', padding: '14px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Description</div>
            <div style={{ fontSize: '13.5px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{current.description}</div>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '10px' }}>{fmtTime(current.createdAt)}</div>
          </div>

          {/* replies */}
          {replies.map((r, i) => {
            const isCustomerReply = !!r.isCustomerReply
            const isMe = !isCustomerReply && (r.sentBy?._id?.toString() === userId?.toString() || r.sentBy === userId)
            const senderLabel = isCustomerReply
              ? (r.customerRef?.name || 'Customer')
              : (r.sentBy?.name || 'Team')
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', paddingLeft: isMe ? 0 : '4px', paddingRight: isMe ? '4px' : 0 }}>
                  {senderLabel} · {fmtTime(r.createdAt)}
                </div>
                <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: isMe ? '#1a73e8' : isCustomerReply ? '#e0f2fe' : '#f3f4f6', color: isMe ? 'white' : '#111827', fontSize: '13.5px', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                  {r.message}
                </div>
              </div>
            )
          })}

          {replies.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: '12.5px', color: '#d1d5db', padding: '20px 0' }}>No replies yet.</div>
          )}
        </div>

        {/* reply input */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid gainsboro', flexShrink: 0 }}>
          {replyErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: '#dc2626', marginBottom: '10px' }}>{replyErr}</div>}
          <Txt rows={3} placeholder="Write a reply…" value={replyText} onChange={e => setReplyText(e.target.value)}
            style={{ marginBottom: '10px', fontSize: 13 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleReply} disabled={replySaving || !replyText.trim()}
              style={{ padding: '8px 20px', background: replyText.trim() && !replySaving ? '#1a73e8' : '#f3f4f6', color: replyText.trim() && !replySaving ? 'white' : '#9ca3af', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: replyText.trim() && !replySaving ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
              {replySaving ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>

      {/* delete confirm */}
      {delConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 360, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Delete Ticket?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Permanently delete ticket <strong>#{current.ticketNumber}</strong>? This cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDelConfirm(false)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleDelete} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function Tickets() {
  const { user } = useSelector(s => s.auth)
  const isAdmin      = ['Admin', 'SuperAdmin'].includes(user?.role)
  const isSuperAdmin = user?.role === 'SuperAdmin'
  const userId       = user?._id || user?.id

  const [tickets,    setTickets]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotal]      = useState(1)

  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [search,         setSearch]         = useState('')
  const [searchVal,      setSearchVal]      = useState('')

  const [selected,    setSelected]    = useState(null)

  const [teamUsers,  setTeamUsers]  = useState([])

  const loadTeamUsers = useCallback(async () => {
    try {
      const uRes = await axiosInstance.get('/users', { params: { limit: 100 } })
      setTeamUsers(uRes.data?.data || uRes.data?.users || [])
    } catch {}
  }, [])

  useEffect(() => { loadTeamUsers() }, [loadTeamUsers])

  const fetchTickets = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 12 }
      if (filterStatus)   params.status   = filterStatus
      if (filterPriority) params.priority = filterPriority
      if (search)         params.search   = search
      const res = await getAllTicketsApi(params)
      const data = res.data?.data || res.data?.tickets || res.data || []
      setTickets(Array.isArray(data) ? data : [])
      setTotal(res.data?.totalPages || res.data?.pagination?.totalPages || 1)
      setPage(p)
    } catch { setTickets([]) }
    finally { setLoading(false) }
  }, [filterStatus, filterPriority, search])

  useEffect(() => { fetchTickets(1) }, [filterStatus, filterPriority, search])

  const handleUpdated = (updated) => {
    setTickets(ts => ts.map(t => t._id === updated._id ? updated : t))
    if (selected?._id === updated._id) setSelected(updated)
  }

  const handleDeleted = (id) => {
    setTickets(ts => ts.filter(t => t._id !== id))
    setSelected(null)
  }

  // summary counts from current page
  const openCount     = tickets.filter(t => t.status === 'Open').length
  const inProgressCnt = tickets.filter(t => t.status === 'InProgress').length
  const resolvedCnt   = tickets.filter(t => t.status === 'Resolved').length

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      {/* header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Support Tickets</h1>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Track and respond to customer support requests</p>
      </div>

      {/* summary strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Open',        val: openCount },
          { label: 'In Progress', val: inProgressCnt },
          { label: 'Resolved',    val: resolvedCnt },
        ].map(({ label, val }) => (
          <span key={label} style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
            {label}: {val}
          </span>
        ))}
      </div>

      {/* filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', border: '1px solid gainsboro', borderRadius: 6, overflow: 'hidden', background: 'white', flex: '1 1 200px', maxWidth: 260 }}>
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setSearch(searchVal)}
            onBlur={() => setSearch(searchVal)}
            placeholder="Search subject…"
            style={{ flex: 1, border: 'none', outline: 'none', padding: '7px 10px', fontSize: 13, color: '#111827', background: 'transparent' }} />
          {searchVal && <button onClick={() => { setSearchVal(''); setSearch('') }} style={{ background: 'none', border: 'none', padding: '0 8px', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#374151', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#374151', cursor: 'pointer' }}>
          <option value="">All Priorities</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        {(filterStatus || filterPriority || search) && (
          <button onClick={() => { setFilterStatus(''); setFilterPriority(''); setSearch(''); setSearchVal('') }}
            style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
      </div>

      {/* grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', height: '150px' }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {tickets.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '52px 0', textAlign: 'center', color: '#9ca3af', fontSize: '13.5px' }}>
              {(filterStatus || filterPriority || search) ? 'No tickets match the filters.' : 'No tickets found.'}
            </div>
          ) : tickets.map(t => (
            <TicketCard key={t._id} t={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      {/* pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          <button onClick={() => fetchTickets(page - 1)} disabled={page === 1}
            style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151' }}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchTickets(p)}
              style={{ border: `1px solid ${p === page ? '#1a73e8' : 'gainsboro'}`, background: p === page ? '#eff6ff' : 'white', color: p === page ? '#1a73e8' : '#374151', borderRadius: 6, padding: '5px 10px', fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchTickets(page + 1)} disabled={page === totalPages}
            style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#374151' }}>›</button>
        </div>
      )}

      {/* ticket detail drawer */}
      {selected && (
        <TicketDrawer
          ticket={selected}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          userId={userId}
          teamUsers={teamUsers}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}

    </div>
  )
}
