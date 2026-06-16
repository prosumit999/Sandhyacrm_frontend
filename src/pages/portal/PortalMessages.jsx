import { useEffect, useState, useRef } from 'react'
import { portalMessagesApi, portalSendMessageApi, portalTeamApi } from '../../api/portalApi'
import { usePortal } from '../../context/PortalContext'

const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : ''

const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export default function PortalMessages() {
  const { customer } = usePortal()
  const bottomRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [team, setTeam]         = useState([])
  const [text, setText]         = useState('')
  const [sending, setSending]   = useState(false)

  const load = () => {
    portalMessagesApi().then(r => setMessages(r.data.data || [])).catch(() => {})
  }

  useEffect(() => {
    load()
    portalTeamApi().then(r => setTeam(r.data.data || [])).catch(() => {})
  }, [])

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
      load()
    } catch {}
    finally { setSending(false) }
  }

  const manager = team[0]

  return (
    <div style={{ height: 'calc(100vh - 62px - 56px)', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '16px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        {manager ? (
          <>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#0f172a' }}>{manager.name}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>Your Service Manager · {manager.email}</div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '14px', color: '#475569', fontWeight: 600 }}>Support Team</div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
          <span style={{ fontSize: '12px', color: '#64748b' }}>Online</span>
        </div>
      </div>

      {/* Message thread */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <Icon d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" size={32} />
              <p style={{ marginTop: '10px', fontSize: '14px' }}>No messages yet. Start the conversation.</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe     = msg.sender === 'customer'
          const prev     = messages[i - 1]
          const showDate = !prev || !isSameDay(msg.createdAt, prev.createdAt)

          return (
            <div key={msg._id || i}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '12px', color: '#94a3b8' }}>
                  {fmtDate(msg.createdAt)}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '72%' }}>
                  {!isMe && (
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '4px' }}>
                      {msg.teamUser?.name || 'Support Team'}
                    </div>
                  )}
                  <div style={{
                    padding: '10px 14px', borderRadius: isMe ? '12px 12px 4px 12px' : '4px 12px 12px 12px',
                    background: isMe ? '#1a73e8' : 'white',
                    border: isMe ? 'none' : '1px solid #e5e7eb',
                    fontSize: '14px', lineHeight: 1.6,
                    color: isMe ? 'white' : '#334155',
                  }}>
                    {msg.text}
                  </div>
                  <div style={{ textAlign: isMe ? 'right' : 'left', marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
                    {fmtTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '14px 16px', marginTop: '12px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
          placeholder="Type a message..."
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          style={{
            flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px',
            fontSize: '14px', color: '#0f172a', resize: 'none', outline: 'none',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          style={{
            padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: (sending || !text.trim()) ? 'not-allowed' : 'pointer',
            background: (sending || !text.trim()) ? '#bfdbfe' : 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
            color: 'white', fontSize: '14px', fontWeight: 600, flexShrink: 0,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
