import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { portalTicketDetailApi, portalReplyTicketApi } from '../../api/portalApi'
import { usePortal } from '../../context/PortalContext'

const fmtDate = d => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

const statusColor = s => {
  if (s === 'Open')            return '#1a73e8'
  if (s === 'InProgress')      return '#d97706'
  if (s === 'WaitingOnClient') return '#7c3aed'
  if (s === 'Resolved')        return '#16a34a'
  if (s === 'Closed')          return '#94a3b8'
  return '#475569'
}

const slaLabel = dueBy => {
  if (!dueBy) return { text: 'Not set', color: '#94a3b8' }
  const due = new Date(dueBy)
  const diff = due - new Date()
  if (diff < 0) return { text: `${Math.ceil(Math.abs(diff) / 3600000)}h overdue`, color: '#dc2626' }
  if (diff <= 24 * 3600000) return { text: `${Math.ceil(diff / 3600000)}h left`, color: '#d97706' }
  return { text: fmtDate(dueBy), color: '#334155' }
}

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export default function PortalTicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customer } = usePortal()
  const bottomRef = useRef(null)
  const [ticket, setTicket]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply]     = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr]         = useState('')

  const load = () => {
    portalTicketDetailApi(id)
      .then(r => setTicket(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { if (ticket) bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket])

  const handleReply = async () => {
    if (!reply.trim()) return
    setErr('')
    setSending(true)
    try {
      await portalReplyTicketApi(id, { message: reply })
      setReply('')
      load()
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to send reply.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!ticket) return <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>Ticket not found.</div>

  const isClosed = ['Resolved', 'Closed'].includes(ticket.status)
  const publicReplies = (ticket.replies || []).filter(r => !r.isInternal)
  const sla = slaLabel(ticket.dueBy)
  const ticketStats = [
    ['Assigned to', ticket.assignedTo?.name || 'Support Team'],
    ['SLA', sla.text, sla.color],
    ['Replies', publicReplies.length],
    ...(ticket.resolvedAt ? [['Resolved', fmtDate(ticket.resolvedAt)]] : []),
  ]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", maxWidth: '860px' }}>
      {/* Back */}
      <button
        onClick={() => navigate('/portal/tickets')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '13.5px', marginBottom: '20px', padding: 0, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
      >
        <Icon d="M10 19l-7-7m0 0l7-7m-7 7h18" size={16} />
        Back to Tickets
      </button>

      {/* Header card */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '8px' }}>
              Ticket #{ticket.ticketNumber}
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{ticket.title}</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Priority: <strong style={{ color: '#334155' }}>{ticket.priority}</strong></span>
              {ticket.software?.name && <span style={{ fontSize: '13px', color: '#64748b' }}>Software: <strong style={{ color: '#334155' }}>{ticket.software.name}</strong></span>}
              <span style={{ fontSize: '13px', color: '#64748b' }}>Created: <strong style={{ color: '#334155' }}>{fmtDate(ticket.createdAt)}</strong></span>
            </div>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: statusColor(ticket.status) }}>
            {ticket.status === 'InProgress' ? 'In Progress' : ticket.status === 'WaitingOnClient' ? 'Waiting on Client' : ticket.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '18px' }}>
          {ticketStats.map(([label, value, color]) => (
            <div key={label} style={{ border: '1px solid #eef2f7', borderRadius: '7px', padding: '10px 12px', background: '#fafbfc' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: color || '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
            </div>
          ))}
        </div>

        {ticket.resolutionSummary && (
          <div style={{ marginTop: '14px', border: '1px solid #bbf7d0', background: '#f0fdf4', borderRadius: '7px', padding: '11px 13px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>Resolution</div>
            <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.55 }}>{ticket.resolutionSummary}</div>
            {ticket.resolvedBy?.name && <div style={{ fontSize: '11.5px', color: '#22c55e', marginTop: '6px' }}>Resolved by {ticket.resolvedBy.name}</div>}
          </div>
        )}
      </div>

      {/* Thread */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px' }}>
            Conversation ({publicReplies.length + 1})
          </div>
        </div>

        <div style={{ maxHeight: '460px', overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Original message */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ maxWidth: '80%' }}>
              <div style={{ textAlign: 'right', marginBottom: '5px' }}>
                <span style={{ display: 'inline-block', background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: '999px', padding: '2px 8px', fontSize: '10.5px', fontWeight: 700 }}>You</span>
              </div>
              <div style={{ background: '#1a73e8', borderRadius: '12px 12px 4px 12px', padding: '12px 16px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'white', lineHeight: 1.6 }}>{ticket.description}</p>
              </div>
              <div style={{ textAlign: 'right', marginTop: '5px', fontSize: '11.5px', color: '#94a3b8' }}>
                {customer?.name} · {fmtDate(ticket.createdAt)}
              </div>
            </div>
          </div>

          {/* Replies */}
          {publicReplies.map((r, i) => {
            const isCustomer = !!r.isCustomerReply
            const senderLabel = isCustomer
              ? (customer?.name || 'You')
              : (r.sentBy?.name || 'Support Team')
            return (
              <div key={i} style={{ display: 'flex', justifyContent: isCustomer ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ textAlign: isCustomer ? 'right' : 'left', marginBottom: '5px' }}>
                    <span style={{
                      display: 'inline-block',
                      background: isCustomer ? '#eff6ff' : '#f8fafc',
                      color: isCustomer ? '#1a73e8' : '#64748b',
                      border: `1px solid ${isCustomer ? '#bfdbfe' : '#e2e8f0'}`,
                      borderRadius: '999px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                    }}>
                      {isCustomer ? 'You' : 'Support'}
                    </span>
                  </div>
                  <div style={{
                    background: isCustomer ? '#1a73e8' : 'white',
                    border: isCustomer ? 'none' : '1px solid #e5e7eb',
                    borderRadius: isCustomer ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                    padding: '12px 16px',
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: isCustomer ? 'white' : '#334155', lineHeight: 1.6 }}>{r.message}</p>
                  </div>
                  <div style={{ textAlign: isCustomer ? 'right' : 'left', marginTop: '5px', fontSize: '11.5px', color: '#94a3b8' }}>
                    {senderLabel} · {fmtDate(r.createdAt)}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply box */}
        {!isClosed && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9' }}>
            {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '7px', padding: '10px 14px', marginBottom: '12px', fontSize: '13.5px', color: '#dc2626' }}>{err}</div>}
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              placeholder="Type your reply..."
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleReply() }}
              style={{
                width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px',
                fontSize: '14px', color: '#0f172a', resize: 'none', outline: 'none',
                boxSizing: 'border-box', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ctrl+Enter to send</span>
              <button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                style={{
                  padding: '9px 20px', borderRadius: '7px', border: 'none', cursor: (sending || !reply.trim()) ? 'not-allowed' : 'pointer',
                  background: (sending || !reply.trim()) ? '#93c5fd' : '#1a73e8',
                  color: 'white', fontSize: '14px', fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                {sending ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        )}
        {isClosed && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
            This ticket is {ticket.status.toLowerCase()}. Replies are disabled.
          </div>
        )}
      </div>
    </div>
  )
}
