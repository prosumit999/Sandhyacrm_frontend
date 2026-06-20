import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { portalTicketsApi, portalCreateTicketApi, portalSubscriptionsApi } from '../../api/portalApi'
import { toastSuccess } from '../../utils/toast'

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const TH = { padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }
const TD = { padding: '13px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' }

const statusColor = s => {
  if (s === 'Open')             return '#1a73e8'
  if (s === 'InProgress')       return '#d97706'
  if (s === 'WaitingOnClient')  return '#7c3aed'
  if (s === 'Resolved')         return '#16a34a'
  if (s === 'Closed')           return '#94a3b8'
  return '#475569'
}

const inp = (extra = {}) => ({
  width: '100%', border: '1px solid #e2e8f0', borderRadius: '7px',
  padding: '10px 12px', fontSize: '14px', color: '#0f172a',
  background: 'white', outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", ...extra,
})

export default function PortalTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets]   = useState([])
  const [subs, setSubs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ title: '', type: '', description: '', priority: 'Medium', software: '' })
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState('')

  const load = () => {
    setLoading(true)
    portalTicketsApi()
      .then(r => setTickets(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    portalSubscriptionsApi()
      .then(r => setSubs((r.data.data || []).map(s => s.softwares).filter(Boolean)))
      .catch(() => {})
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.title.trim())       { setErr('Subject is required.'); return }
    if (!form.type)               { setErr('Please select a ticket type.'); return }
    if (!form.software)           { setErr('Please select the related software.'); return }
    if (!form.description.trim()) { setErr('Description is required.'); return }
    setSaving(true)
    try {
      await portalCreateTicketApi(form)
      setShowForm(false)
      setForm({ title: '', type: '', description: '', priority: 'Medium', software: '' })
      load()
      toastSuccess('Support ticket submitted')
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create ticket.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '26px', height: '26px', border: '3px solid #e5e7eb', borderTopColor: '#1a73e8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Support Tickets</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            padding: '9px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #1a73e8 0%, #1255c4 100%)',
            color: 'white', fontSize: '14px', fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          {showForm ? 'Cancel' : '+ New Ticket'}
        </button>
      </div>

      {/* New ticket form */}
      {showForm && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b0bec5', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '18px' }}>
            New Support Ticket
          </div>
          {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '7px', padding: '10px 14px', marginBottom: '16px', fontSize: '13.5px', color: '#dc2626' }}>{err}</div>}
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Subject *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief summary of the issue" style={{ ...inp(), height: '40px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inp(), height: '40px' }}>
                  <option value="">— Select type —</option>
                  <option value="Bug">Bug</option>
                  <option value="FeatureRequest">Feature Request</option>
                  <option value="HowTo">How To</option>
                  <option value="Performance">Performance</option>
                  <option value="Billing">Billing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Related Software *</label>
                <select value={form.software} onChange={e => setForm(f => ({ ...f, software: e.target.value }))} style={{ ...inp(), height: '40px' }}>
                  <option value="">— Select software —</option>
                  {subs.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...inp(), height: '40px' }}>
                  <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Description *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue in detail..." style={{ ...inp(), resize: 'vertical', padding: '10px 12px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 18px', borderRadius: '7px', border: '1px solid #e5e7eb', background: 'white', color: '#64748b', fontSize: '14px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={{ padding: '9px 18px', borderRadius: '7px', border: 'none', background: '#1a73e8', color: 'white', fontSize: '14px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
                {saving ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: '8px', overflow: 'hidden' }}>
        {tickets.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No tickets found. Create one to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafbfc' }}>
                  <th style={TH}>Ticket #</th>
                  <th style={TH}>Subject</th>
                  <th style={TH}>Priority</th>
                  <th style={TH}>Status</th>
                  <th style={{ ...TH, textAlign: 'right' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t._id}
                    onClick={() => navigate(`/portal/tickets/${t._id}`)}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...TD, fontWeight: 600, color: '#0f172a' }}>#{t.ticketNumber}</td>
                    <td style={{ ...TD, maxWidth: '300px' }}>
                      <div style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    </td>
                    <td style={{ ...TD, color: '#64748b' }}>{t.priority || '—'}</td>
                    <td style={TD}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: statusColor(t.status) }}>
                        {t.status === 'InProgress' ? 'In Progress' : t.status === 'WaitingOnClient' ? 'Waiting' : t.status}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right', color: '#94a3b8', fontSize: '13px' }}>{fmtDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
