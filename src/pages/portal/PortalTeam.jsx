import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalTeamApi } from '../../api/portalApi'

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export default function PortalTeam() {
  const navigate = useNavigate()
  const [team, setTeam]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    portalTeamApi()
      .then(r => setTeam(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const manager = team[0]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>My Team</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Your dedicated service contacts</p>
      </div>

      {team.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          No team members assigned yet. Please contact support.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {team.map((member, i) => {
            const isPrimary = i === 0
            return (
              <div key={member._id || i} style={{
                background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '24px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                {isPrimary && (
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '16px' }}>
                    Service Manager
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                  <div style={{
                    width: '50px', height: '50px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1a73e8, #0d47a1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, boxShadow: '0 3px 12px rgba(26,115,232,0.3)',
                  }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{member.name}</div>
                    <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>{member.role || 'Support Staff'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {member.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                        <Icon d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" size={15} />
                      </span>
                      <span style={{ fontSize: '13.5px', color: '#475569' }}>{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#94a3b8', flexShrink: 0 }}>
                        <Icon d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" size={15} />
                      </span>
                      <span style={{ fontSize: '13.5px', color: '#475569' }}>{member.phone}</span>
                    </div>
                  )}
                </div>

                {isPrimary && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/portal/messages')}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: '7px', border: 'none', cursor: 'pointer',
                        background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
                        color: 'white', fontSize: '13.5px', fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      Send Message
                    </button>
                    <button
                      onClick={() => navigate('/portal/tickets')}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: '7px', border: '1px solid #e5e7eb', cursor: 'pointer',
                        background: 'white', color: '#475569', fontSize: '13.5px', fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      }}
                    >
                      Open Ticket
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
