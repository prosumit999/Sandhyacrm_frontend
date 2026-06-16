import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  getAllUsersApi, createUserApi, updateUserApi, deleteUserApi,
  toggleUserActiveApi, getPortfolioStatsApi, getUserPortfolioApi, transferPortfolioApi,
} from '../../api/userApi'
import {
  getAllTeamsApi, createTeamApi, updateTeamApi, deleteTeamApi,
  addTeamMemberApi, removeTeamMemberApi,
} from '../../api/teamApi'

// ─── helpers ──────────────────────────────────────────────────────────────────
const ROLES = ['SuperAdmin', 'Admin', 'Standard']
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtTime(d) { if (!d) return 'Never'; return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
function initials(name = '') { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?' }

const AVATAR_COLORS = ['#1a73e8','#7c3aed','#0891b2','#15803d','#d97706','#c2410c','#db2777']
const TEAM_PALETTE  = ['#1a73e8','#7c3aed','#16a34a','#dc2626','#d97706','#0891b2','#db2777','#0d9488','#4f46e5','#92400e','#1e40af','#065f46']

function Avatar({ name, size = 32, color: forceColor }) {
  const idx = forceColor ? AVATAR_COLORS.indexOf(forceColor) : (name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0)
  const bg  = forceColor || AVATAR_COLORS[Math.max(0, idx)]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: 'white', flexShrink: 0 }}>
      {initials(name)}
    </div>
  )
}

function RoleBadge({ role }) {
  return <span style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{role}</span>
}

function ActiveBadge({ active }) {
  return <span style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>{active ? 'Active' : 'Inactive'}</span>
}

function Btn({ label, color = 'blue', onClick, disabled }) {
  const [h, setH] = useState(false)
  const c = { blue: ['#1a73e8','#1557b0'], red: ['#dc2626','#b91c1c'], green: ['#15803d','#166534'], amber: ['#b45309','#92400e'], gray: ['#6b7280','#4b5563'] }[color] || ['#1a73e8','#1557b0']
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: 'none', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? '#d1d5db' : h ? c[1] : c[0], fontSize: 12, fontWeight: 600, padding: '3px 6px', borderRadius: 4, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
      {label}
    </button>
  )
}

function Label({ children, required }) {
  return <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}</label>
}
function Inp({ style, ...props }) {
  const [f, setF] = useState(false)
  return <input {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: props.readOnly ? '#f9fafb' : 'white', color: props.readOnly ? '#6b7280' : '#111827', fontFamily: 'inherit', ...style }} />
}
function Sel({ style, children, ...props }) {
  const [f, setF] = useState(false)
  return <select {...props} onFocus={e => { setF(true); props.onFocus?.(e) }} onBlur={e => { setF(false); props.onBlur?.(e) }}
    style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${f ? '#1a73e8' : 'gainsboro'}`, borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', fontFamily: 'inherit', ...style }}>{children}</select>
}

const skAnim = `@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`
function SkRow() {
  return <tr>{[200,90,110,80,80,140,100,90].map((w,i) => (<td key={i} style={{ padding: '10px 14px', borderBottom: '1px solid gainsboro' }}><div style={{ width: w, height: 13, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite' }} /></td>))}</tr>
}

const CUST_STATUS = {
  Active:    { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Expired:   { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Suspended: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  Lead:      { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
}

// ═════════════════════════════════════════════════════════════════════════════
//  PORTFOLIO MODAL
// =============================================================================
function PortfolioModal({ user, allUsers, isSuperAdmin, onClose, onTransferred }) {
  const [customers,       setCustomers]       = useState([])
  const [refCount,        setRefCount]        = useState(0)
  const [loading,         setLoading]         = useState(true)
  const [transferTo,      setTransferTo]      = useState('')
  const [confirmStep,     setConfirmStep]     = useState(false)
  const [transferBusy,    setTransferBusy]    = useState(false)
  const [transferErr,     setTransferErr]     = useState('')
  const [transferredNum,  setTransferredNum]  = useState(null)
  const [transferredName, setTransferredName] = useState('')

  useEffect(() => {
    getUserPortfolioApi(user._id).then(res => {
      setCustomers(res.data.data.customers || [])
      setRefCount(res.data.data.referralCount || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [user._id])

  const activeCount = customers.filter(c => c.status === 'Active').length
  const leadCount   = customers.filter(c => c.status === 'Lead').length
  const targetUser  = allUsers.find(u => u._id === transferTo)
  const eligibleTargets = allUsers.filter(u => u._id !== user._id && u.isActive)

  const doTransfer = async () => {
    setTransferBusy(true); setTransferErr('')
    try {
      const res = await transferPortfolioApi(user._id, transferTo)
      setTransferredNum(res.data.data.transferred); setTransferredName(targetUser?.name || ''); onTransferred()
    } catch (ex) { setTransferErr(ex.response?.data?.message || 'Transfer failed.') }
    finally { setTransferBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{ width: 560, maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={user.name} size={42} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{user.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}><RoleBadge role={user.role} /><span style={{ fontSize: 11.5, color: '#9ca3af' }}>{user.email}</span></div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', padding: '4px 8px', lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color='#374151'} onMouseLeave={e => e.currentTarget.style.color='#9ca3af'}>×</button>
          </div>
          {!loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
              {[
                { label: 'Customers', val: customers.length, bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
                { label: 'Active', val: activeCount, bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
                { label: 'Leads', val: leadCount, bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
                { label: 'Via Referral', val: refCount, bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 7, padding: '8px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: s.color, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '10px 20px 8px', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>Customer Portfolio</div>
          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading portfolio…</div>
          ) : customers.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>No customers assigned</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>This user has no customers in their portfolio.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>{['Customer','Status','Referral Source','Since'].map(h => <th key={h} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
              <tbody>{customers.map(c => { const sc = CUST_STATUS[c.status] || CUST_STATUS.Active; return (
                <tr key={c._id} style={{ borderBottom: '1px solid #f3f4f6' }} onMouseEnter={e => e.currentTarget.style.background='#fafafa'} onMouseLeave={e => e.currentTarget.style.background='white'}>
                  <td style={{ padding: '9px 14px' }}><div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.name}</div>{c.businessName && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{c.businessName}</div>}</td>
                  <td style={{ padding: '9px 14px' }}><span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 600 }}>{c.status}</span></td>
                  <td style={{ padding: '9px 14px', fontSize: 12, color: c.referrredBy ? '#374151' : '#d1d5db' }}>{c.referrredBy || '—'}</td>
                  <td style={{ padding: '9px 14px', fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDate(c.createdAt)}</td>
                </tr>
              )})}</tbody>
            </table>
          )}
        </div>
        {isSuperAdmin && !loading && (
          <div style={{ borderTop: '1px solid gainsboro', background: '#fafafa', flexShrink: 0 }}>
            {transferredNum !== null ? (
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18, color: '#16a34a' }}>✓</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>{transferredNum} customers transferred</div><div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Portfolio reassigned to {transferredName}.</div></div>
              </div>
            ) : customers.length === 0 ? null : !confirmStep ? (
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Transfer Portfolio</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Sel value={transferTo} onChange={e => setTransferTo(e.target.value)} style={{ flex: 1 }}>
                    <option value="">Select target user…</option>
                    {eligibleTargets.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                  </Sel>
                  <button onClick={() => transferTo && setConfirmStep(true)} disabled={!transferTo}
                    style={{ padding: '7px 16px', background: transferTo ? '#dc2626' : '#f3f4f6', color: transferTo ? 'white' : '#d1d5db', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: transferTo ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                    Transfer →
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '14px 20px' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '11px 14px', marginBottom: 12, fontSize: 12.5, color: '#dc2626', lineHeight: 1.6 }}>
                  ⚠ Transfer <strong>{customers.length} customers</strong> from <strong>{user.name}</strong> to <strong>{targetUser?.name}</strong>?
                </div>
                {transferErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', marginBottom: 10, fontSize: 12.5, color: '#dc2626' }}>{transferErr}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => { setConfirmStep(false); setTransferErr('') }} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
                  <button onClick={doTransfer} disabled={transferBusy}
                    style={{ background: transferBusy ? '#fca5a5' : '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: transferBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {transferBusy ? 'Transferring…' : 'Confirm Transfer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEAM EDIT / CREATE MODAL
// =============================================================================
function TeamModal({ team, onClose, onSaved }) {
  const isEdit = !!team
  const [name, setName]     = useState(team?.name || '')
  const [desc, setDesc]     = useState(team?.description || '')
  const [color, setColor]   = useState(team?.color || '#1a73e8')
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState('')

  const handleSave = async () => {
    if (!name.trim()) { setErr('Team name is required.'); return }
    setSaving(true); setErr('')
    try {
      if (isEdit) { await updateTeamApi(team._id, { name: name.trim(), description: desc, color }) }
      else        { await createTeamApi({ name: name.trim(), description: desc, color }) }
      onSaved()
    } catch (ex) { setErr(ex.response?.data?.message || 'Failed to save.') }
    finally { setSaving(false) }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', borderRadius: 10, width: 460, maxWidth: '96vw', zIndex: 1201, boxShadow: '0 20px 60px rgba(0,0,0,0.16)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
        {/* color strip */}
        <div style={{ height: 5, background: color }} />
        <div style={{ padding: '18px 22px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{isEdit ? 'Edit Team' : 'Create Team'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '18px 22px' }}>
          <div style={{ marginBottom: 14 }}>
            <Label required>Team Name</Label>
            <Inp value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Web Team, Mobile Team…" autoFocus />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Label>Description</Label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Brief description of this team's responsibilities…" rows={3}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.55, fontFamily: 'system-ui,sans-serif', color: '#111827' }}
              onFocus={e => e.target.style.borderColor='#1a73e8'} onBlur={e => e.target.style.borderColor='gainsboro'} />
          </div>
          <div style={{ marginBottom: 6 }}>
            <Label>Team Color</Label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TEAM_PALETTE.map(c => (
                <button key={c} onClick={() => setColor(c)} title={c}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? `3px solid ${c}` : '3px solid transparent', outline: color === c ? '2px solid #111827' : 'none', cursor: 'pointer', flexShrink: 0, transition: 'outline 0.1s' }} />
              ))}
            </div>
          </div>
          {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 12.5, color: '#dc2626', marginTop: 12 }}>{err}</div>}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid gainsboro', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? color + 'aa' : color, color: 'white', border: 'none', borderRadius: 6, padding: '8px 22px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'opacity 0.1s' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Team'}
          </button>
        </div>
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEAM MANAGE DRAWER  (members list + add member)
// =============================================================================
function TeamManageDrawer({ team, allUsers, onClose, onUpdated, isAdmin }) {
  const [addUserId, setAddUserId] = useState('')
  const [addBusy,   setAddBusy]   = useState(false)
  const [addErr,    setAddErr]    = useState('')
  const [rmBusy,    setRmBusy]    = useState('')  // userId being removed

  const memberIds = new Set(team.members.map(m => m._id))
  const eligible  = allUsers.filter(u => !memberIds.has(u._id) && u.isActive)

  const handleAdd = async () => {
    if (!addUserId) return
    setAddBusy(true); setAddErr('')
    try { const res = await addTeamMemberApi(team._id, addUserId); setAddUserId(''); onUpdated(res.data.data) }
    catch (ex) { setAddErr(ex.response?.data?.message || 'Failed to add member.') }
    finally { setAddBusy(false) }
  }

  const handleRemove = async (userId) => {
    setRmBusy(userId)
    try { const res = await removeTeamMemberApi(team._id, userId); onUpdated(res.data.data) }
    catch {}
    finally { setRmBusy('') }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{ width: 480, maxWidth: '100vw', height: '100vh', background: 'white', borderLeft: '1px solid gainsboro', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* color top strip */}
        <div style={{ height: 4, background: team.color || '#1a73e8', flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: team.color + '22', border: `2px solid ${team.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={team.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{team.name}</div>
                  {team.description && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{team.description}</div>}
                </div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <span style={{ background: team.color + '18', color: team.color, borderRadius: 5, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                {team.createdBy && <span style={{ background: '#f3f4f6', color: '#6b7280', borderRadius: 5, padding: '3px 10px', fontSize: 11 }}>Created by {team.createdBy.name}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', lineHeight: 1, padding: '4px' }} onMouseEnter={e => e.currentTarget.style.color='#374151'} onMouseLeave={e => e.currentTarget.style.color='#9ca3af'}>×</button>
          </div>
        </div>

        {/* Member list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '10px 20px 8px', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            Team Members
          </div>
          {team.members.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No members yet. Add someone below.</div>
          ) : (
            team.members.map(m => (
              <div key={m._id} style={{ padding: '10px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}
                onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background='white'}>
                <Avatar name={m.name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{m.email}</div>
                </div>
                <RoleBadge role={m.role} />
                {!m.isActive && <ActiveBadge active={false} />}
                {isAdmin && (
                  <button onClick={() => handleRemove(m._id)} disabled={rmBusy === m._id}
                    style={{ padding: '4px 10px', border: '1px solid gainsboro', borderRadius: 5, background: 'white', fontSize: 12, cursor: rmBusy === m._id ? 'not-allowed' : 'pointer', color: '#6b7280', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
                    onMouseEnter={e => { if (!rmBusy) { e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626'; e.currentTarget.style.background='#fef2f2' }}}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='gainsboro'; e.currentTarget.style.color='#6b7280'; e.currentTarget.style.background='white' }}>
                    {rmBusy === m._id ? '…' : 'Remove'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add member footer */}
        {isAdmin && (
          <div style={{ borderTop: '1px solid gainsboro', background: '#fafafa', padding: '14px 20px', flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Add Member</div>
            {eligible.length === 0 ? (
              <div style={{ fontSize: 12.5, color: '#9ca3af' }}>All active users are already in this team.</div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <Sel value={addUserId} onChange={e => setAddUserId(e.target.value)} style={{ flex: 1 }}>
                  <option value="">Select user to add…</option>
                  {eligible.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </Sel>
                <button onClick={handleAdd} disabled={!addUserId || addBusy}
                  style={{ padding: '7px 16px', background: (!addUserId || addBusy) ? '#f3f4f6' : team.color, color: (!addUserId || addBusy) ? '#9ca3af' : 'white', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: (!addUserId || addBusy) ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'background 0.1s' }}>
                  {addBusy ? 'Adding…' : '+ Add'}
                </button>
              </div>
            )}
            {addErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: '#dc2626', marginTop: 10 }}>{addErr}</div>}
          </div>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  TEAMS VIEW
// =============================================================================
function TeamsView({ isAdmin, allUsers }) {
  const [teams,      setTeams]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(null)  // null | { mode:'create'|'edit', team? }
  const [manageTeam, setManageTeam] = useState(null)
  const [delTarget,  setDelTarget]  = useState(null)
  const [delBusy,    setDelBusy]    = useState(false)

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try { const res = await getAllTeamsApi(); setTeams(res.data.data || []) }
    catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTeams() }, [fetchTeams])

  const handleModalSaved = async () => { setModal(null); await fetchTeams() }

  const handleUpdated = (updatedTeam) => {
    setTeams(ts => ts.map(t => t._id === updatedTeam._id ? updatedTeam : t))
    if (manageTeam?._id === updatedTeam._id) setManageTeam(updatedTeam)
  }

  const handleDelete = async () => {
    if (!delTarget) return
    setDelBusy(true)
    try { await deleteTeamApi(delTarget._id); setDelTarget(null); fetchTeams() }
    catch {}
    finally { setDelBusy(false) }
  }

  // Avatar stack for a team card
  const MemberStack = ({ members }) => {
    const shown = members.slice(0, 5)
    const rest  = members.length - shown.length
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {shown.map((m, i) => (
          <div key={m._id} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: shown.length - i, border: '2px solid white', borderRadius: '50%' }}>
            <Avatar name={m.name} size={26} />
          </div>
        ))}
        {rest > 0 && (
          <div style={{ marginLeft: -8, width: 26, height: 26, borderRadius: '50%', background: '#f3f4f6', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9.5, fontWeight: 700, color: '#6b7280', zIndex: 0 }}>+{rest}</div>
        )}
        {members.length === 0 && <span style={{ fontSize: 12, color: '#d1d5db', fontStyle: 'italic' }}>No members</span>}
      </div>
    )
  }

  return (
    <div>
      {/* Sub-header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>{loading ? 'Loading…' : `${teams.length} team${teams.length !== 1 ? 's' : ''}`}</div>
        {isAdmin && (
          <button onClick={() => setModal({ mode: 'create' })}
            style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
            onMouseEnter={e => e.currentTarget.style.background='#1557b0'} onMouseLeave={e => e.currentTarget.style.background='#1a73e8'}>
            + Create Team
          </button>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: 4, background: '#f3f4f6', animation: 'shimmer 1.2s infinite', backgroundSize: '400px 100%', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)' }} />
              <div style={{ padding: '16px 18px' }}>
                <div style={{ width: 120, height: 16, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite', marginBottom: 8 }} />
                <div style={{ width: '80%', height: 12, borderRadius: 3, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite' }} />
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: '60px 24px', textAlign: 'center' }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px', display: 'block' }}>
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>No teams yet</div>
          <div style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: isAdmin ? 16 : 0 }}>
            Create teams to organise your members by function or project.
          </div>
          {isAdmin && (
            <button onClick={() => setModal({ mode: 'create' })}
              style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Create First Team
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {teams.map(team => (
            <div key={team._id} style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden', transition: 'box-shadow 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              {/* color bar */}
              <div style={{ height: 4, background: team.color || '#1a73e8' }} />
              <div style={{ padding: '16px 18px' }}>
                {/* name row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
                    {team.description && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{team.description}</div>}
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 4, marginLeft: 10, flexShrink: 0 }}>
                      <button onClick={() => setModal({ mode: 'edit', team })} title="Edit team"
                        style={{ width: 26, height: 26, border: '1px solid gainsboro', borderRadius: 5, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='#1a73e8'; e.currentTarget.style.color='#1a73e8'; e.currentTarget.style.background='#eff6ff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='gainsboro'; e.currentTarget.style.color='#6b7280'; e.currentTarget.style.background='white' }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setDelTarget(team)} title="Delete team"
                        style={{ width: 26, height: 26, border: '1px solid gainsboro', borderRadius: 5, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.color='#dc2626'; e.currentTarget.style.background='#fef2f2' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='gainsboro'; e.currentTarget.style.color='#6b7280'; e.currentTarget.style.background='white' }}>
                        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* member count + avatar stack */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <MemberStack members={team.members} />
                  <span style={{ fontSize: 11.5, color: '#9ca3af', flexShrink: 0, marginLeft: 8 }}>
                    {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Manage button */}
                <button onClick={() => setManageTeam(team)}
                  style={{ marginTop: 14, width: '100%', padding: '7px 0', border: `1px solid ${team.color}33`, borderRadius: 6, background: team.color + '0e', color: team.color, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = team.color + '1f' }}
                  onMouseLeave={e => { e.currentTarget.style.background = team.color + '0e' }}>
                  Manage Members
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team create / edit modal */}
      {modal && (
        <TeamModal team={modal.team} onClose={() => setModal(null)} onSaved={handleModalSaved} />
      )}

      {/* Manage drawer */}
      {manageTeam && (
        <TeamManageDrawer team={manageTeam} allUsers={allUsers} isAdmin={isAdmin}
          onClose={() => setManageTeam(null)} onUpdated={handleUpdated} />
      )}

      {/* Delete confirm */}
      {delTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 380, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', fontFamily: 'system-ui,sans-serif' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Delete Team?</h3>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
              Permanently delete <strong style={{ color: '#111827' }}>{delTarget.name}</strong> ({delTarget.members.length} member{delTarget.members.length !== 1 ? 's' : ''})? This cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDelTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleDelete} disabled={delBusy}
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: delBusy ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: delBusy ? 0.7 : 1 }}>
                {delBusy ? 'Deleting…' : 'Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MEMBERS VIEW (existing user table)
// =============================================================================
function MembersView({ isAdmin, isSuperAdmin, meId }) {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotal]      = useState(1)
  const [search,     setSearch]     = useState('')
  const [searchVal,  setSearchVal]  = useState('')
  const [filterRole,   setFilterRole]   = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [drawerOpen,   setDrawerOpen]   = useState(false)
  const [editUser,     setEditUser]     = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [drawerErr,    setDrawerErr]    = useState('')
  const [form,         setForm]         = useState({ name: '', email: '', phone: '', password: '', role: 'Standard' })
  const [showPwd,      setShowPwd]      = useState(false)
  const [portfolioStats, setPortfolioStats] = useState({})
  const [portfolioUser,  setPortfolioUser]  = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)
  const [deleteLoading,  setDeleteLoading]  = useState(false)
  const [toggleTarget,   setToggleTarget]   = useState(null)
  const [toggleLoading,  setToggleLoading]  = useState(false)

  const emptyForm = { name: '', email: '', phone: '', password: '', role: 'Standard' }

  const fetchStats = useCallback(async () => {
    try {
      const res = await getPortfolioStatsApi()
      const map = {}
      ;(res.data?.data || []).forEach(s => { if (s._id) map[s._id.toString()] = { customerCount: s.customerCount, referralCount: s.referralCount } })
      setPortfolioStats(map)
    } catch {}
  }, [])

  const fetchUsers = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 15 }
      if (search)            params.search   = search
      if (filterRole)        params.role     = filterRole
      if (filterActive !== '') params.isActive = filterActive
      const [res] = await Promise.all([getAllUsersApi(params), fetchStats()])
      setUsers(res.data?.data || [])
      setTotal(res.data?.pagination?.totalPages || 1)
      setPage(p)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }, [search, filterRole, filterActive, fetchStats])

  useEffect(() => { fetchUsers(1) }, [search, filterRole, filterActive])

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setDrawerErr(''); setShowPwd(false); setDrawerOpen(true) }
  const openEdit   = u  => { setEditUser(u); setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', password: '', role: u.role || 'Standard' }); setDrawerErr(''); setShowPwd(false); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setEditUser(null) }

  const handleSave = async () => {
    if (!form.name.trim())  { setDrawerErr('Name is required.'); return }
    if (!form.email.trim()) { setDrawerErr('Email is required.'); return }
    if (!editUser && !form.password.trim()) { setDrawerErr('Password is required for new users.'); return }
    setSaving(true); setDrawerErr('')
    try {
      const body = { name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim(), role: form.role, ...(form.password.trim() && { password: form.password }) }
      if (editUser) { await updateUserApi(editUser._id, body) } else { await createUserApi(body) }
      closeDrawer(); fetchUsers(editUser ? page : 1)
    } catch (err) { setDrawerErr(err?.response?.data?.message || 'Failed to save user.') }
    finally { setSaving(false) }
  }

  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggleLoading(true)
    try { await toggleUserActiveApi(toggleTarget._id); setToggleTarget(null); fetchUsers(page) }
    catch {}
    finally { setToggleLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try { await deleteUserApi(deleteTarget._id); setDeleteTarget(null); fetchUsers(page) }
    catch {}
    finally { setDeleteLoading(false) }
  }

  const activeCount   = users.filter(u => u.isActive).length
  const inactiveCount = users.filter(u => !u.isActive).length
  const adminCount    = users.filter(u => ['Admin','SuperAdmin'].includes(u.role)).length
  const standardCount = users.filter(u => u.role === 'Standard').length

  return (
    <>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'Active',   val: activeCount },
          { label: 'Inactive', val: inactiveCount },
          { label: 'Admin',    val: adminCount },
          { label: 'Standard', val: standardCount },
        ].map(({ label, val }) => (
          <span key={label} style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
            {label}: {val}
          </span>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', border: '1px solid gainsboro', borderRadius: 6, overflow: 'hidden', background: 'white', flex: '1 1 200px', maxWidth: 280 }}>
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && setSearch(searchVal)} onBlur={() => setSearch(searchVal)} placeholder="Search name or email…"
            style={{ flex: 1, border: 'none', outline: 'none', padding: '7px 10px', fontSize: 13, color: '#111827', background: 'transparent' }} />
          {searchVal && <button onClick={() => { setSearchVal(''); setSearch('') }} style={{ background: 'none', border: 'none', padding: '0 8px', cursor: 'pointer', color: '#9ca3af', fontSize: 16 }}>×</button>}
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#374151', cursor: 'pointer' }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterActive} onChange={e => setFilterActive(e.target.value)}
          style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#374151', cursor: 'pointer' }}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        {(filterRole || filterActive || search) && (
          <button onClick={() => { setFilterRole(''); setFilterActive(''); setSearch(''); setSearchVal('') }}
            style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
            Clear
          </button>
        )}
        {isSuperAdmin && (
          <button onClick={openCreate} style={{ marginLeft: 'auto', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background='#1557b0'} onMouseLeave={e => e.currentTarget.style.background='#1a73e8'}>
            + Add User
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '22%' }} /><col style={{ width: '9%' }} /><col style={{ width: '11%' }} />
            <col style={{ width: '8%' }} /><col style={{ width: '12%' }} /><col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} /><col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>
              {['User','Role','Phone','Status','Portfolio','Last Login','Joined','Actions'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkRow key={i} />)
              : users.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  No users found. {isSuperAdmin ? 'Add the first team member.' : ''}
                </td></tr>
              ) : users.map(u => {
                const isSelf   = u._id === meId
                const isTarget = u.role === 'SuperAdmin' && !isSuperAdmin
                return (
                  <tr key={u._id} style={{ borderBottom: '1px solid gainsboro' }}
                    onMouseEnter={e => e.currentTarget.style.background='#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background='white'}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={u.name} size={32} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.name}
                            {isSelf && <span style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 3, padding: '0 5px', fontSize: 10, fontWeight: 700 }}>You</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}><RoleBadge role={u.role} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: u.phone ? '#374151' : '#d1d5db' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><ActiveBadge active={u.isActive} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      {(() => {
                        const stats = portfolioStats[u._id] || { customerCount: 0, referralCount: 0 }
                        return (
                          <button onClick={() => setPortfolioUser(u)} title="View portfolio"
                            style={{ background: 'none', border: '1px solid gainsboro', borderRadius: 5, padding: '3px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151', fontFamily: 'inherit' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor='#1a73e8'; e.currentTarget.style.color='#1a73e8' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor='gainsboro'; e.currentTarget.style.color='#374151' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
                            <span style={{ fontWeight: 600 }}>{stats.customerCount}</span>
                            {stats.referralCount > 0 && <span style={{ background: '#f5f3ff', color: '#7c3aed', borderRadius: 3, padding: '0 4px', fontSize: 10, fontWeight: 700 }}>+{stats.referralCount}R</span>}
                          </button>
                        )
                      })()}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{fmtTime(u.lastlogin)}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{fmtDate(u.createdAt)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {isAdmin && !isTarget && <Btn label="Edit" color="blue" onClick={() => openEdit(u)} />}
                        {isAdmin && <Btn label="Portfolio" color="gray" onClick={() => setPortfolioUser(u)} />}
                        {isSuperAdmin && !isSelf && <Btn label={u.isActive ? 'Deactivate' : 'Activate'} color={u.isActive ? 'amber' : 'green'} onClick={() => setToggleTarget(u)} />}
                        {isSuperAdmin && !isSelf && <Btn label="Delete" color="red" onClick={() => setDeleteTarget(u)} />}
                      </div>
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
          <button onClick={() => fetchUsers(page - 1)} disabled={page === 1}
            style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#d1d5db' : '#374151' }}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => fetchUsers(p)}
              style={{ border: `1px solid ${p === page ? '#1a73e8' : 'gainsboro'}`, background: p === page ? '#eff6ff' : 'white', color: p === page ? '#1a73e8' : '#374151', borderRadius: 6, padding: '5px 10px', fontSize: 13, fontWeight: p === page ? 700 : 400, cursor: 'pointer' }}>
              {p}
            </button>
          ))}
          <button onClick={() => fetchUsers(page + 1)} disabled={page === totalPages}
            style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#d1d5db' : '#374151' }}>›</button>
        </div>
      )}

      {/* Portfolio modal */}
      {portfolioUser && <PortfolioModal user={portfolioUser} allUsers={users} isSuperAdmin={isSuperAdmin} onClose={() => setPortfolioUser(null)} onTransferred={() => { fetchUsers(page); fetchStats() }} />}

      {/* Toggle confirm */}
      {toggleTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 380, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', fontFamily: 'system-ui,sans-serif' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700 }}>{toggleTarget.isActive ? 'Deactivate' : 'Activate'} User?</h3>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}><strong>{toggleTarget.name}</strong> ({toggleTarget.email})</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>{toggleTarget.isActive ? 'This will block them from logging in. Their data stays intact.' : 'This will restore their access to the system.'}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setToggleTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleToggle} disabled={toggleLoading}
                style={{ background: toggleTarget.isActive ? '#b45309' : '#15803d', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: toggleLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {toggleLoading ? 'Saving…' : toggleTarget.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 10, width: 380, padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.14)', fontFamily: 'system-ui,sans-serif' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Delete User?</h3>
            <p style={{ margin: '0 0 6px', fontSize: 13, color: '#6b7280' }}><strong>{deleteTarget.name}</strong> ({deleteTarget.email})</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>This will permanently deactivate the account. Their records and history will remain intact.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, padding: '7px 20px', fontSize: 13, fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {deleteLoading ? 'Removing…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
          <div onClick={closeDrawer} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 460, background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{editUser ? 'Edit User' : 'Add User'}</div>
                {editUser && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{editUser.email}</div>}
              </div>
              <button onClick={closeDrawer} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 0 8px', borderBottom: '1px solid gainsboro', marginBottom: 12 }}>Personal Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><Label required>Full Name</Label><Inp value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" /></div>
                <div><Label>Phone</Label><Inp value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <Label required>Email Address</Label>
                <Inp type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" readOnly={!!editUser} style={editUser ? { cursor: 'not-allowed' } : {}} />
                {editUser && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Email cannot be changed after creation.</div>}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 0 8px', borderBottom: '1px solid gainsboro', marginBottom: 12 }}>Access & Role</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <Label required>Role</Label>
                  <Sel value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} disabled={!isSuperAdmin}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </Sel>
                  {!isSuperAdmin && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>Only SuperAdmin can change roles.</div>}
                </div>
                {!editUser && (
                  <div>
                    <Label required>Password</Label>
                    <div style={{ position: 'relative' }}>
                      <Inp type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 characters" style={{ paddingRight: 36 }} />
                      <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 12, padding: 0 }}>
                        {showPwd ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {editUser && isSuperAdmin && (
                <div style={{ padding: '10px 12px', background: '#f9fafb', border: '1px solid gainsboro', borderRadius: 6, fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  To reset this user's password, ask them to use the Forgot Password flow on the login page.
                </div>
              )}
              {drawerErr && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginTop: 4 }}>{drawerErr}</div>}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid gainsboro', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={closeDrawer} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  ROOT COMPONENT
// =============================================================================
export default function Users() {
  const { user: me } = useSelector(s => s.auth)
  const isAdmin      = ['Admin', 'SuperAdmin'].includes(me?.role)
  const isSuperAdmin = me?.role === 'SuperAdmin'
  const [view, setView] = useState('members')

  // fetch all users once so TeamsView can use them for member select
  const [allUsers, setAllUsers] = useState([])
  useEffect(() => {
    getAllUsersApi({ limit: 200 }).then(r => setAllUsers(r.data?.data || [])).catch(() => {})
  }, [])

  const TAB_VIEWS = [
    { id: 'members', label: 'Members', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z' },
    { id: 'teams',   label: 'Teams',   icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ]

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <style>{skAnim}</style>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>User Management</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Manage user accounts, roles, and teams</p>
        </div>
        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 4 }}>
          {TAB_VIEWS.map(t => {
            const active = view === t.id
            return (
              <button key={t.id} onClick={() => setView(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400, background: active ? '#1a73e8' : 'transparent', color: active ? 'white' : '#6b7280', fontFamily: 'inherit', transition: 'all 0.12s' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background='#eff6ff'; e.currentTarget.style.color='#1a73e8' }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }}}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {view === 'members' && (
        <MembersView isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} meId={me?.id || me?._id} />
      )}
      {view === 'teams' && (
        <TeamsView isAdmin={isAdmin} allUsers={allUsers} />
      )}
    </div>
  )
}
