import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import {
  getAllTeamsApi, createTeamApi, updateTeamApi, deleteTeamApi,
  addTeamMemberApi, removeTeamMemberApi,
} from '../../api/teamApi'
import { getAllUsersApi } from '../../api/userApi'

// ── Helpers ───────────────────────────────────────────────────────────────────
const initials = n => n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

// ── Preset colors ─────────────────────────────────────────────────────────────
const COLORS = [
  '#1a73e8', '#16a34a', '#dc2626', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#64748b', '#ea580c', '#059669',
]

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 15, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  plus:   'M12 5v14M5 12h14',
  edit:   'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash:  'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6',
  close:  'M18 6L6 18M6 6l12 12',
  users:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  search: 'M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z',
  check:  'M5 13l4 4L19 7',
  warn:   'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 12, w = '70%' }) => (
  <div style={{ height: h, width: w, borderRadius: 4, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ── Member avatar ─────────────────────────────────────────────────────────────
function MemberAvatar({ user, size = 32, title }) {
  return (
    <div title={title || user?.name} style={{
      width: size, height: size, borderRadius: '50%',
      background: '#e5e7eb', color: '#374151',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.33, fontWeight: 700, flexShrink: 0,
      border: '2px solid white', marginLeft: -6, boxSizing: 'border-box',
    }}>
      {initials(user?.name || '')}
    </div>
  )
}

// ── Color picker ──────────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <button key={c} onClick={() => onChange(c)} style={{
          width: 28, height: 28, borderRadius: '50%', border: value === c ? '3px solid #111827' : '2px solid transparent',
          background: c, cursor: 'pointer', outline: 'none', boxSizing: 'border-box',
          boxShadow: value === c ? '0 0 0 2px white inset' : 'none',
          transition: 'transform 0.1s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />
      ))}
    </div>
  )
}

// ── Shared form helpers (module-level to prevent remounting on each render) ───
const inp = { width: '100%', boxSizing: 'border-box', padding: '8px 11px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#111827' }
function F({ label, req, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
        {label}{req && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

// ── Create / Edit team modal ──────────────────────────────────────────────────
function TeamModal({ team, onClose, onSaved }) {
  const isEdit = !!team
  const [form, setForm] = useState({
    name:        team?.name        || '',
    description: team?.description || '',
    color:       team?.color       || '#1a73e8',
  })
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { setErr('Team name is required'); return }
    setSaving(true); setErr('')
    try {
      const res = isEdit
        ? await updateTeamApi(team._id, form)
        : await createTeamApi(form)
      onSaved(res.data.data)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 440, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{isEdit ? 'Edit Team' : 'Create Team'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Ic d={IC.close} size={17} color="#9ca3af" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <F label="Team name" req>
            <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sales Team" autoFocus />
          </F>
          <F label="Description">
            <textarea style={{ ...inp, resize: 'vertical', minHeight: 72 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this team handle?" />
          </F>
          <F label="Team colour">
            <ColorPicker value={form.color} onChange={v => set('color', v)} />
          </F>
        </div>

        {/* Preview strip */}
        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, border: `2px solid ${form.color}`, background: `${form.color}0a`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: form.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{form.name || 'Team name'}</span>
        </div>

        {err && <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12.5, color: '#dc2626' }}>{err}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
          <button onClick={save} disabled={saving}
            style={{ padding: '8px 22px', background: saving ? '#93c5fd' : form.color, color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create team'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ team, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')

  const confirm = async () => {
    setBusy(true); setErr('')
    try {
      await deleteTeamApi(team._id)
      onDeleted(team._id)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to delete') }
    finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 380, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Ic d={IC.warn} size={22} color="#dc2626" sw={2} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>Delete team?</h3>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 1.5 }}>
          <strong>{team.name}</strong> and its {team.members?.length || 0} member{team.members?.length !== 1 ? 's' : ''} will be removed. This cannot be undone.
        </p>
        {err && <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6, fontSize: 12.5, color: '#dc2626' }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', border: '1px solid gainsboro', background: 'white', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#374151' }}>Cancel</button>
          <button onClick={confirm} disabled={busy}
            style={{ flex: 1, padding: '9px', background: busy ? '#fca5a5' : '#dc2626', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Manage Members panel (full-screen slide-in) ───────────────────────────────
function MembersPanel({ team, allUsers, onClose, onUpdated }) {
  const memberIds = new Set((team.members || []).map(m => m._id || m))

  const [search,  setSearch]  = useState('')
  const [busy,    setBusy]    = useState(null) // userId being added/removed

  const members    = (team.members || [])
  const nonMembers = allUsers.filter(u => !memberIds.has(u._id))
  const filtered   = search
    ? nonMembers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : nonMembers

  const add = async (userId) => {
    setBusy(userId)
    try {
      const res = await addTeamMemberApi(team._id, userId)
      onUpdated(res.data.data)
    } catch {}
    finally { setBusy(null) }
  }

  const remove = async (userId) => {
    setBusy(userId)
    try {
      const res = await removeTeamMemberApi(team._id, userId)
      onUpdated(res.data.data)
    } catch {}
    finally { setBusy(null) }
  }

  const ROLE_COLOR = { SuperAdmin: '#7c3aed', Admin: '#1a73e8', Standard: '#16a34a' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: '100%', maxWidth: 480, background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", overflowY: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{team.name}</span>
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{members.length} member{members.length !== 1 ? 's' : ''}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Ic d={IC.close} size={18} color="#9ca3af" /></button>
          </div>
        </div>

        {/* Current members */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 10 }}>CURRENT MEMBERS</div>
          {members.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>No members yet — add some below.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 }}>
              {members.map(m => {
                const id = m._id || m
                const isBusy = busy === id
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: '#f9fafb' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', background: team.color + '22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: team.color, flexShrink: 0,
                    }}>
                      {initials(m.name || '')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || '—'}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: (ROLE_COLOR[m.role] || '#6b7280') + '18', color: ROLE_COLOR[m.role] || '#6b7280', flexShrink: 0 }}>
                      {m.role}
                    </span>
                    <button onClick={() => remove(id)} disabled={isBusy}
                      title="Remove member"
                      style={{ background: 'none', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 8px', cursor: isBusy ? 'not-allowed' : 'pointer', color: '#dc2626', fontSize: 11.5, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, opacity: isBusy ? 0.5 : 1, flexShrink: 0 }}
                      onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background = '#fef2f2' }}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                      <Ic d={IC.close} size={11} color="currentColor" sw={2.5} />
                      Remove
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Add members */}
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 10 }}>ADD MEMBERS</div>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Ic d={IC.search} size={13} color="#9ca3af" />
            </div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users by name or email…"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 30px', border: '1px solid #e5e7eb', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#111827' }}
            />
          </div>

          {nonMembers.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>All active users are already members.</div>
          ) : filtered.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', padding: '20px 0' }}>No users match "{search}"</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map(u => {
                const isBusy = busy === u._id
                return (
                  <div key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'white', border: '1px solid #f3f4f6' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', background: '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#374151', flexShrink: 0,
                    }}>
                      {initials(u.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: (ROLE_COLOR[u.role] || '#6b7280') + '18', color: ROLE_COLOR[u.role] || '#6b7280', flexShrink: 0 }}>
                      {u.role}
                    </span>
                    <button onClick={() => add(u._id)} disabled={isBusy}
                      style={{ background: isBusy ? '#93c5fd' : '#1a73e8', border: 'none', borderRadius: 6, padding: '5px 10px', cursor: isBusy ? 'not-allowed' : 'pointer', color: 'white', fontSize: 11.5, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                      onMouseEnter={e => { if (!isBusy) e.currentTarget.style.background = '#1557b0' }}
                      onMouseLeave={e => { if (!isBusy) e.currentTarget.style.background = '#1a73e8' }}>
                      <Ic d={IC.plus} size={11} color="white" sw={2.5} />
                      Add
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Team card ─────────────────────────────────────────────────────────────────
function TeamCard({ team, isAdmin, onEdit, onDelete, onManage }) {
  const [hov, setHov] = useState(false)
  const maxAvatars = 5
  const shown  = (team.members || []).slice(0, maxAvatars)
  const extra  = Math.max(0, (team.members || []).length - maxAvatars)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'box-shadow 0.15s, transform 0.15s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.09)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Colour band */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${team.color}, ${team.color}bb)` }} />

      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color, flexShrink: 0 }} />
            <span style={{ fontSize: 14.5, fontWeight: 700, color: '#111827' }}>{team.name}</span>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => onEdit(team)} title="Edit team"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 5, color: '#9ca3af' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af' }}>
                <Ic d={IC.edit} size={13} color="currentColor" />
              </button>
              <button onClick={() => onDelete(team)} title="Delete team"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px', borderRadius: 5, color: '#9ca3af' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9ca3af' }}>
                <Ic d={IC.trash} size={13} color="currentColor" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5, minHeight: 36, marginBottom: 14, flex: 1 }}>
          {team.description || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>No description</span>}
        </div>

        {/* Member avatars */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
            {shown.map(m => <MemberAvatar key={m._id || m} user={m} size={30} />)}
            {extra > 0 && (
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, border: '2px solid white', marginLeft: -6,
              }}>+{extra}</div>
            )}
            {team.members?.length === 0 && (
              <span style={{ fontSize: 12, color: '#d1d5db', paddingLeft: 2 }}>No members</span>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            By {team.createdBy?.name || '—'} · {new Date(team.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
          <button onClick={() => onManage(team)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', background: `${team.color}14`,
              border: `1px solid ${team.color}44`, borderRadius: 6,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', color: team.color, fontFamily: 'inherit',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${team.color}28` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${team.color}14` }}>
            <Ic d={IC.users} size={12} color="currentColor" />
            {isAdmin ? 'Manage members' : 'View members'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Teams() {
  const { user }  = useSelector(s => s.auth)
  const isAdmin   = ['Admin', 'SuperAdmin'].includes(user?.role)

  const [teams,    setTeams]    = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  const [showCreate,  setShowCreate]  = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [delTarget,   setDelTarget]   = useState(null)
  const [manageTeam,  setManageTeam]  = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, uRes] = await Promise.allSettled([
        getAllTeamsApi(),
        isAdmin ? getAllUsersApi() : Promise.resolve(null),
      ])
      if (tRes.status === 'fulfilled') setTeams(tRes.value.data.data || [])
      if (uRes.status === 'fulfilled' && uRes.value) setAllUsers(uRes.value.data.data || [])
    } catch {}
    finally { setLoading(false) }
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  const filtered = search
    ? teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()))
    : teams

  const handleSaved = (updated) => {
    setTeams(prev => {
      const exists = prev.some(t => t._id === updated._id)
      return exists ? prev.map(t => t._id === updated._id ? updated : t) : [updated, ...prev]
    })
  }

  const handleDeleted = (id) => setTeams(prev => prev.filter(t => t._id !== id))

  const handleUpdated = (updated) => {
    setTeams(prev => prev.map(t => t._id === updated._id ? updated : t))
    setManageTeam(updated)
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: '#111827' }}>
      <style>{`@keyframes sk { from{opacity:1} to{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Teams</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#9ca3af' }}>
            {loading ? 'Loading…' : `${teams.length} team${teams.length !== 1 ? 's' : ''} · organise staff into groups`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1557b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#1a73e8'}>
            <Ic d={IC.plus} size={14} color="white" sw={2.5} /> New Team
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 340, marginBottom: 20 }}>
        <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Ic d={IC.search} size={14} color="#9ca3af" />
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search teams…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 32px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#111827', background: 'white' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ height: 5, background: '#f3f4f6' }} />
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Sk h={15} w="60%" />
                <Sk h={11} w="85%" />
                <Sk h={11} w="70%" />
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {[...Array(3)].map((__, j) => <div key={j} style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6' }} />)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Ic d={IC.users} size={22} color="#9ca3af" sw={1.6} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
            {search ? `No teams match "${search}"` : 'No teams yet'}
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>
            {search ? 'Try a different search term.' : 'Create your first team to start organising staff.'}
          </div>
          {isAdmin && !search && (
            <button onClick={() => setShowCreate(true)}
              style={{ padding: '8px 20px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Create first team
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(t => (
            <TeamCard
              key={t._id}
              team={t}
              isAdmin={isAdmin}
              onEdit={setEditTarget}
              onDelete={setDelTarget}
              onManage={setManageTeam}
            />
          ))}
        </div>
      )}

      {/* Summary footer */}
      {!loading && teams.length > 0 && (
        <div style={{ marginTop: 20, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
          {teams.reduce((s, t) => s + (t.members?.length || 0), 0)} total members across {teams.length} teams
        </div>
      )}

      {/* Modals */}
      {showCreate  && <TeamModal   team={null}        onClose={() => setShowCreate(false)}   onSaved={handleSaved} />}
      {editTarget  && <TeamModal   team={editTarget}  onClose={() => setEditTarget(null)}     onSaved={handleSaved} />}
      {delTarget   && <DeleteModal team={delTarget}   onClose={() => setDelTarget(null)}      onDeleted={handleDeleted} />}
      {manageTeam  && (
        <MembersPanel
          team={manageTeam}
          allUsers={allUsers}
          onClose={() => setManageTeam(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
