import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { portalMessagesApi, portalSendMessageApi, portalTeamApi } from '../../api/portalApi'

const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : ''
const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

const ROLE_COLOR = { SuperAdmin: '#7c3aed', Admin: '#1a73e8', Standard: '#16a34a' }
const ROLE_BG    = { SuperAdmin: '#f3e8ff', Admin: '#eff6ff', Standard: '#f0fdf4' }

const Icon = ({ d, size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

function TeamMemberCard({ member }) {
  const color  = ROLE_COLOR[member.role] || '#1a73e8'
  const bg     = ROLE_BG[member.role]    || '#eff6ff'
  const initials = (member.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '14px', marginBottom: '8px',
    }}>
      {member.isPrimary && (
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '8px' }}>
          Your Service Manager
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}cc)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          fontSize: '13px', fontWeight: 700, color: 'white',
          boxShadow: `0 2px 8px ${color}33`,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {member.name}
          </div>
          <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '10px', background: bg, color }}>
            {member.role}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {member.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={12} color="#94a3b8" />
            <span style={{ fontSize: '12px', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</span>
          </div>
        )}
        {member.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={12} color="#94a3b8" />
            <span style={{ fontSize: '12px', color: '#475569' }}>{member.phone}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortalMessages() {
  const { onUnreadChange } = useOutletContext() || {}
  const bottomRef  = useRef(null)
  const [messages, setMessages] = useState([])
  const [team,     setTeam]     = useState([])
  const [text,     setText]     = useState('')
  const [sending,  setSending]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  const loadMessages = () => {
    portalMessagesApi()
      .then(r => {
        setMessages(r.data.data || [])
        // all team messages marked read server-side on fetch — signal parent
        onUnreadChange?.(0)
      })
      .catch(() => {})
  }

  // Initial load: messages + team in parallel
  useEffect(() => {
    Promise.all([
      portalMessagesApi().then(r => { setMessages(r.data.data || []); onUnreadChange?.(0) }).catch(() => {}),
      portalTeamApi().then(r => {
        const data = r.data.data
        // backend now returns array; handle legacy single-object fallback
        setTeam(Array.isArray(data) ? data : (data ? [data] : []))
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Adaptive poll: 3s when online, 15s when offline
  useEffect(() => {
    let id
    const poll = async () => {
      try {
        const r = await portalMessagesApi()
        setMessages(r.data.data || [])
        onUnreadChange?.(0)
      } catch {}
      id = setTimeout(poll, navigator.onLine ? 3000 : 15000)
    }
    id = setTimeout(poll, navigator.onLine ? 3000 : 15000)
    return () => clearTimeout(id)
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim()) return
    const t = text.trim()
    setText('')
    setSending(true)
    try {
      await portalSendMessageApi({ text: t })
      loadMessages()
    } catch {}
    finally { setSending(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'pmSpin 0.7s linear infinite' }} />
      <style>{`@keyframes pmSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ height: 'calc(100vh - 62px - 56px)', display: 'flex', gap: '16px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── Left: Team panel ── */}
      <div style={{ width: '240px', flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>
          Your Support Team
        </div>
        {team.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No team assigned yet
          </div>
        ) : (
          team.map((member, i) => <TeamMemberCard key={member._id || i} member={member} />)
        )}
        <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '11.5px', color: '#1d4ed8', fontWeight: 600, marginBottom: '3px' }}>How it works</div>
          <div style={{ fontSize: '11px', color: '#3b82f6', lineHeight: 1.5 }}>
            Messages you send here go to your entire support team. Any team member can reply.
          </div>
        </div>
      </div>

      {/* ── Right: Chat ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '9px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" size={18} color="#1a73e8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>Support Chat</div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              {team.length > 0
                ? `${team.length} team member${team.length !== 1 ? 's' : ''} available`
                : 'Messages go to your admin team'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>Online</span>
          </div>
        </div>

        {/* Message thread */}
        <div style={{ flex: 1, overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
              <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3} style={{ margin: '0 auto 10px', opacity: 0.4 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#475569' }}>No messages yet</p>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>Send a message to start the conversation</p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe     = msg.sender === 'customer'
            const prev     = messages[i - 1]
            const showDate = !prev || !isSameDay(msg.createdAt, prev.createdAt)
            const senderName = isMe ? 'You' : (msg.teamUser?.name || 'Support Team')
            const senderRole = !isMe && msg.teamUser?.role
            return (
              <div key={msg._id || i}>
                {showDate && (
                  <div style={{ textAlign: 'center', margin: '12px 0 8px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {fmtDate(msg.createdAt)}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '4px' }}>
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px', textAlign: isMe ? 'right' : 'left' }}>
                      {senderName}
                      {senderRole && (
                        <span style={{ marginLeft: '5px', fontWeight: 600, color: ROLE_COLOR[senderRole] || '#64748b' }}>
                          · {senderRole}
                        </span>
                      )}
                    </div>
                    <div style={{
                      padding: '10px 14px', lineHeight: 1.6, wordBreak: 'break-word',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                      background: isMe ? 'linear-gradient(135deg, #1a73e8, #1255c4)' : '#f1f5f9',
                      color: isMe ? 'white' : '#334155',
                      fontSize: '13.5px',
                      boxShadow: isMe ? '0 2px 8px rgba(26,115,232,0.25)' : 'none',
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ textAlign: isMe ? 'right' : 'left', marginTop: '3px', fontSize: '10.5px', color: '#94a3b8' }}>
                      {fmtTime(msg.createdAt)}
                      {!isMe && msg.readByTeam === false && (
                        <span style={{ marginLeft: '6px', color: '#f59e0b' }}>• unread</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            placeholder="Type a message to your support team…"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            style={{
              flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 13px',
              fontSize: '13.5px', color: '#0f172a', resize: 'none', outline: 'none',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              background: '#f8fafc', lineHeight: 1.5,
            }}
            onFocus={e => { e.target.style.borderColor = '#1a73e8'; e.target.style.background = 'white' }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            style={{
              width: '42px', height: '42px', borderRadius: '50%', border: 'none', flexShrink: 0,
              cursor: (sending || !text.trim()) ? 'not-allowed' : 'pointer',
              background: (sending || !text.trim()) ? '#e2e8f0' : 'linear-gradient(135deg, #1a73e8, #1255c4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
              boxShadow: (!sending && text.trim()) ? '0 2px 8px rgba(26,115,232,0.4)' : 'none',
            }}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill={(!sending && text.trim()) ? '#fff' : '#94a3b8'}>
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
