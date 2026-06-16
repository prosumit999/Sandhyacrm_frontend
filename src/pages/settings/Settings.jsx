import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getMeApi, forgotPasswordApi } from '../../api/authApi'
import { updateUserApi } from '../../api/userApi'
import { getInvoiceSettingsApi, updateInvoiceSettingsApi } from '../../api/settingsApi'

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

// ─── small components ─────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    SuperAdmin: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
    Admin:      { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Standard:   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  }
  const s = map[role] || map.Standard
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{role}</span>
}

function StatusBadge({ active }) {
  return active
    ? <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>Active</span>
    : <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>Inactive</span>
}

function Label({ children, required }) {
  return (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
      {children}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
    </label>
  )
}

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e) }}
      onBlur={e => { setFocused(false); props.onBlur?.(e) }}
      style={{
        width: '100%', boxSizing: 'border-box',
        border: `1px solid ${focused ? '#1a73e8' : 'gainsboro'}`,
        borderRadius: 6, padding: '8px 10px', fontSize: 13, outline: 'none',
        background: props.readOnly ? '#f9fafb' : 'white',
        color: props.readOnly ? '#6b7280' : '#111827', ...style,
      }}
    />
  )
}

function InfoRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
      <span style={{ width: 170, fontSize: 12, fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827' }}>{children}</span>
    </div>
  )
}

function Skeleton({ w, h = 14 }) {
  return <div style={{ width: w, height: h, borderRadius: 4, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.2s infinite' }} />
}

// ─── nav items config ─────────────────────────────────────────────────────────
const NAV = [
  {
    id: 'profile',
    label: 'My Profile',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
  {
    id: 'account',
    label: 'Account Details',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Security',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: 'invoice',
    label: 'Invoice Settings',
    adminOnly: true,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
    ),
  },
]

// ─── main ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user: authUser } = useSelector(s => s.auth)
  const isAdmin = ['Admin', 'SuperAdmin'].includes(authUser?.role)

  const [activeTab, setActiveTab] = useState('profile')
  const [profile,   setProfile]   = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [fetchErr,  setFetchErr]  = useState('')

  // edit form
  const [editing,  setEditing]  = useState(false)
  const [form,     setForm]     = useState({ name: '', email: '', phone: '' })
  const [saving,   setSaving]   = useState(false)
  const [saveErr,  setSaveErr]  = useState('')
  const [saveOk,   setSaveOk]   = useState('')

  // password reset
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg,     setResetMsg]     = useState('')

  // invoice settings
  const BLANK_INV = { orgName:'', orgTagline:'', gstin:'', pan:'', cin:'', address:'', city:'', state:'', pincode:'', phone:'', email:'', bankName:'', bankAccount:'', bankIfsc:'', bankBranch:'' }
  const [invForm,    setInvForm]    = useState(BLANK_INV)
  const [invLoading, setInvLoading] = useState(false)
  const [invSaving,  setInvSaving]  = useState(false)
  const [invSaveOk,  setInvSaveOk]  = useState('')
  const [invSaveErr, setInvSaveErr] = useState('')

  useEffect(() => {
    getMeApi()
      .then(res => {
        const data = res.data?.data || res.data
        setProfile(data)
        setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' })
      })
      .catch(() => setFetchErr('Failed to load profile.'))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = () => {
    setForm({ name: profile.name || '', email: profile.email || '', phone: profile.phone || '' })
    setSaveErr(''); setSaveOk(''); setEditing(true)
  }
  const cancelEdit = () => { setEditing(false); setSaveErr(''); setSaveOk('') }

  const handleSave = async () => {
    if (!form.name.trim())  { setSaveErr('Name is required.'); return }
    if (!form.email.trim()) { setSaveErr('Email is required.'); return }
    setSaving(true); setSaveErr(''); setSaveOk('')
    try {
      const res = await updateUserApi(profile._id, {
        name:  form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      })
      const updated = res.data?.data || res.data
      setProfile(prev => ({ ...prev, ...updated }))
      setSaveOk('Profile updated successfully.')
      setEditing(false)
    } catch (err) {
      setSaveErr(err?.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!profile?.email) return
    setResetLoading(true); setResetMsg('')
    try {
      await forgotPasswordApi(profile.email)
      setResetMsg('Reset email sent. Check your inbox.')
    } catch {
      setResetMsg('Failed to send reset email. Try again.')
    } finally {
      setResetLoading(false)
    }
  }

  // Load invoice settings when that tab becomes active
  useEffect(() => {
    if (activeTab !== 'invoice' || !isAdmin) return
    setInvLoading(true); setInvSaveOk(''); setInvSaveErr('')
    getInvoiceSettingsApi()
      .then(r => {
        const d = r.data.data || {}
        setInvForm(f => ({ ...f, ...d }))
      })
      .catch(() => setInvSaveErr('Failed to load settings.'))
      .finally(() => setInvLoading(false))
  }, [activeTab, isAdmin])

  const handleInvSave = async () => {
    setInvSaving(true); setInvSaveOk(''); setInvSaveErr('')
    try {
      const res = await updateInvoiceSettingsApi(invForm)
      setInvForm(f => ({ ...f, ...(res.data.data || {}) }))
      setInvSaveOk('Invoice settings saved successfully.')
    } catch (err) {
      setInvSaveErr(err?.response?.data?.message || 'Failed to save settings.')
    } finally {
      setInvSaving(false)
    }
  }

  // ── loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ marginBottom: 16 }}><Skeleton w={120} h={20} /></div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ width: 210, border: '1px solid gainsboro', borderRadius: 8, background: 'white', padding: 12, flexShrink: 0 }}>
            {[100, 120, 80].map((w, i) => <div key={i} style={{ marginBottom: 8 }}><Skeleton w={w} /></div>)}
          </div>
          <div style={{ flex: 1, border: '1px solid gainsboro', borderRadius: 8, background: 'white', padding: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton w={180} h={16} /><Skeleton w={220} h={12} /><Skeleton w={90} h={20} />
              </div>
            </div>
            {[140, 200, 160].map((w, i) => <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}><Skeleton w={w} /></div>)}
          </div>
        </div>
      </div>
    )
  }

  if (fetchErr) {
    return (
      <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ border: '1px solid #fecaca', background: '#fef2f2', borderRadius: 8, padding: '16px 20px', color: '#dc2626', fontSize: 13 }}>{fetchErr}</div>
      </div>
    )
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* page header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Settings</h1>
        <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Manage your account profile and security</p>
      </div>

      {/* ── grid: sidebar + content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ border: '1px solid gainsboro', borderRadius: 8, background: 'white', overflow: 'hidden' }}>
          {/* mini profile card at top of sidebar */}
          <div style={{ padding: '16px 14px', borderBottom: '1px solid gainsboro', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#f9fafb' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: 'white' }}>
              {initials(profile?.name)}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{profile?.name}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{profile?.email}</div>
              <div style={{ marginTop: 6 }}><RoleBadge role={profile?.role} /></div>
            </div>
          </div>

          {/* nav links */}
          <div style={{ padding: '8px 0' }}>
            {NAV.filter(item => !item.adminOnly || isAdmin).map(item => {
              const active = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setEditing(false); setSaveErr(''); setSaveOk('') }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 9,
                    padding: '9px 14px', background: active ? '#eff6ff' : 'none',
                    border: 'none', borderLeft: `3px solid ${active ? '#1a73e8' : 'transparent'}`,
                    cursor: 'pointer', fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? '#1a73e8' : '#374151', textAlign: 'left',
                  }}
                >
                  <span style={{ color: active ? '#1a73e8' : '#9ca3af', flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div style={{ border: '1px solid gainsboro', borderRadius: 8, background: 'white', overflow: 'hidden' }}>

          {/* ════════════════════════════ MY PROFILE ════════════════════════════ */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid gainsboro', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>My Profile</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                    {isAdmin ? 'Update your name, email, and phone number' : 'Profile editing requires Admin access'}
                  </div>
                </div>
                {isAdmin && !editing && (
                  <button
                    onClick={startEdit}
                    style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '6px 14px', fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div style={{ padding: '20px' }}>
                {/* avatar row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid gainsboro' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {initials(profile?.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{profile?.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 6px' }}>{profile?.email}</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <RoleBadge role={profile?.role} />
                      <StatusBadge active={profile?.isActive} />
                    </div>
                  </div>
                </div>

                {/* success banner */}
                {saveOk && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#15803d', marginBottom: 16 }}>
                    {saveOk}
                  </div>
                )}

                {/* read-only */}
                {!editing && (
                  <>
                    <InfoRow label="Full Name"><span style={{ color: '#111827' }}>{profile?.name || <span style={{ color: '#d1d5db' }}>—</span>}</span></InfoRow>
                    <InfoRow label="Email Address"><span style={{ color: '#111827' }}>{profile?.email || <span style={{ color: '#d1d5db' }}>—</span>}</span></InfoRow>
                    <InfoRow label="Phone"><span style={{ color: profile?.phone ? '#111827' : '#d1d5db' }}>{profile?.phone || '—'}</span></InfoRow>
                    {!isAdmin && (
                      <div style={{ marginTop: 14, padding: '8px 12px', background: '#f9fafb', border: '1px solid gainsboro', borderRadius: 6, fontSize: 12, color: '#6b7280' }}>
                        Contact an Admin to update your profile information.
                      </div>
                    )}
                  </>
                )}

                {/* edit form */}
                {editing && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                      <div>
                        <Label required>Full Name</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <Label required>Email Address</Label>
                      <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
                    </div>
                    {saveErr && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 13, color: '#dc2626', marginBottom: 14 }}>
                        {saveErr}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSave} disabled={saving} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button onClick={cancelEdit} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════ ACCOUNT DETAILS ═════════════════════════ */}
          {activeTab === 'account' && (
            <div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid gainsboro', background: '#f9fafb' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Account Details</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Read-only account information</div>
              </div>
              <div style={{ padding: '20px' }}>
                <InfoRow label="Role"><RoleBadge role={profile?.role} /></InfoRow>
                <InfoRow label="Account Status"><StatusBadge active={profile?.isActive} /></InfoRow>
                <InfoRow label="Member Since"><span>{fmt(profile?.createdAt)}</span></InfoRow>
                <InfoRow label="Last Login"><span>{fmtTime(profile?.lastlogin)}</span></InfoRow>
                <InfoRow label="User ID">
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#6b7280', wordBreak: 'break-all' }}>{profile?._id}</span>
                </InfoRow>
                {(profile?.Softwares?.length > 0) && (
                  <InfoRow label="Assigned Softwares">
                    <span>{profile.Softwares.length} software{profile.Softwares.length > 1 ? 's' : ''}</span>
                  </InfoRow>
                )}
              </div>
            </div>
          )}

          {/* ═══════════════════════════ SECURITY ══════════════════════════════ */}
          {activeTab === 'security' && (
            <div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid gainsboro', background: '#f9fafb' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Security</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Manage your account password</div>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ border: '1px solid gainsboro', borderRadius: 8, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Change Password</div>
                    <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                      A password reset link will be sent to<br />
                      <strong style={{ color: '#374151' }}>{profile?.email}</strong>
                    </div>
                    {resetMsg && (
                      <div style={{ marginTop: 8, fontSize: 12, fontWeight: 500, color: resetMsg.includes('sent') ? '#15803d' : '#dc2626' }}>
                        {resetMsg}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handlePasswordReset}
                    disabled={resetLoading}
                    style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: resetLoading ? 'not-allowed' : 'pointer', color: '#374151', whiteSpace: 'nowrap', flexShrink: 0, opacity: resetLoading ? 0.6 : 1 }}
                  >
                    {resetLoading ? 'Sending…' : 'Send Reset Email'}
                  </button>
                </div>

                <div style={{ marginTop: 16, padding: '12px 14px', background: '#f9fafb', border: '1px solid gainsboro', borderRadius: 6, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                  <strong style={{ color: '#374151' }}>Note:</strong> After clicking Send Reset Email, check your inbox and follow the link to set a new password. The link expires after 1 hour.
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════ INVOICE SETTINGS ══════════════════════ */}
          {activeTab === 'invoice' && isAdmin && (
            <div>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid gainsboro', background: '#f9fafb' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Invoice Settings</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Organisation details printed on every invoice PDF</div>
              </div>

              <div style={{ padding: '20px' }}>
                {invLoading ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {[...Array(8)].map((_, i) => <div key={i}><Skeleton w="100%" h={34} /></div>)}
                  </div>
                ) : (
                  <>
                    {invSaveOk && (
                      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#15803d', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {invSaveOk}
                      </div>
                    )}
                    {invSaveErr && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '9px 12px', fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{invSaveErr}</div>
                    )}

                    {/* ── Organisation Identity ── */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Organisation Identity</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                      <div>
                        <Label required>Organisation Name</Label>
                        <Input value={invForm.orgName} onChange={e => setInvForm(f => ({ ...f, orgName: e.target.value }))} placeholder="Sandhya Softtechpvt Pvt. Ltd." />
                      </div>
                      <div>
                        <Label>Tagline</Label>
                        <Input value={invForm.orgTagline} onChange={e => setInvForm(f => ({ ...f, orgTagline: e.target.value }))} placeholder="Software Solutions & IT Services" />
                      </div>
                      <div>
                        <Label>GSTIN</Label>
                        <Input value={invForm.gstin} onChange={e => setInvForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="27XXXXX1234X0XX" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} maxLength={15} />
                      </div>
                      <div>
                        <Label>PAN</Label>
                        <Input value={invForm.pan} onChange={e => setInvForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} placeholder="XXXXX1234X" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} maxLength={10} />
                      </div>
                      <div>
                        <Label>CIN</Label>
                        <Input value={invForm.cin} onChange={e => setInvForm(f => ({ ...f, cin: e.target.value.toUpperCase() }))} placeholder="U74999MH2020PTC000000" style={{ fontFamily: 'monospace' }} maxLength={21} />
                      </div>
                    </div>

                    {/* ── Address ── */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>Address</div>
                    <div style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
                      <div>
                        <Label>Street Address</Label>
                        <Input value={invForm.address} onChange={e => setInvForm(f => ({ ...f, address: e.target.value }))} placeholder="123, Business Hub, Andheri East" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div>
                          <Label>City</Label>
                          <Input value={invForm.city} onChange={e => setInvForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" />
                        </div>
                        <div>
                          <Label>State</Label>
                          <Input value={invForm.state} onChange={e => setInvForm(f => ({ ...f, state: e.target.value }))} placeholder="Maharashtra" />
                        </div>
                        <div>
                          <Label>Pincode</Label>
                          <Input value={invForm.pincode} onChange={e => setInvForm(f => ({ ...f, pincode: e.target.value }))} placeholder="400 001" maxLength={6} style={{ fontFamily: 'monospace' }} />
                        </div>
                      </div>
                    </div>

                    {/* ── Contact ── */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>Contact</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                      <div>
                        <Label>Phone</Label>
                        <Input value={invForm.phone} onChange={e => setInvForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={invForm.email} onChange={e => setInvForm(f => ({ ...f, email: e.target.value }))} placeholder="accounts@company.com" />
                      </div>
                    </div>

                    {/* ── Bank Details ── */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>Bank Details</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>Optional — shown on receipt when filled</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                      <div>
                        <Label>Bank Name</Label>
                        <Input value={invForm.bankName} onChange={e => setInvForm(f => ({ ...f, bankName: e.target.value }))} placeholder="State Bank of India" />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input value={invForm.bankAccount} onChange={e => setInvForm(f => ({ ...f, bankAccount: e.target.value }))} placeholder="1234567890" style={{ fontFamily: 'monospace' }} />
                      </div>
                      <div>
                        <Label>IFSC Code</Label>
                        <Input value={invForm.bankIfsc} onChange={e => setInvForm(f => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))} placeholder="SBIN0001234" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} maxLength={11} />
                      </div>
                      <div>
                        <Label>Branch</Label>
                        <Input value={invForm.bankBranch} onChange={e => setInvForm(f => ({ ...f, bankBranch: e.target.value }))} placeholder="Andheri East, Mumbai" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleInvSave} disabled={invSaving}
                        style={{ background: invSaving ? '#93c5fd' : '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 22px', fontSize: 13, fontWeight: 600, cursor: invSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
                        {invSaving && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
                        {invSaving ? 'Saving…' : 'Save Invoice Settings'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
