import { useEffect, useState } from 'react'
import { getAuditTimelineApi } from '../../api/auditApi'

const fmtTime = d => d ? new Date(d).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
}) : '—'

const ACTION_COPY = {
  Created: 'created this record',
  Updated: 'updated this record',
  Deleted: 'deleted this record',
  StatusChanged: 'changed status',
  UserCreated: 'created this user',
  UserDeactivated: 'deactivated this user',
  UserActivated: 'activated this user',
  RoleChanged: 'changed role',
  PermissionChanged: 'changed permissions',
}

function actorName(log) {
  return log.performedBy?.name || log.performedBy?.email || log.performedByEmail || 'System'
}

function ActivityTimeline({ targetModel, targetId, title = 'Activity Timeline', limit = 12 }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!targetModel || !targetId) return
    setLoading(true)
    getAuditTimelineApi({ targetModel, targetId, limit })
      .then(res => setLogs(res.data?.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [targetModel, targetId, limit])

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '11px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>Loading activity...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: '#9ca3af', fontSize: 13 }}>No activity recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logs.map(log => (
              <div key={log._id} style={{ display: 'grid', gridTemplateColumns: '10px 1fr', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: log.severity === 'warning' ? '#f59e0b' : log.severity === 'critical' ? '#dc2626' : '#1a73e8', marginTop: 5 }} />
                <div>
                  <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>
                    {actorName(log)} <span style={{ fontWeight: 500, color: '#374151' }}>{ACTION_COPY[log.action] || log.action}</span>
                  </div>
                  {log.changedFields?.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 5 }}>
                      {log.changedFields.slice(0, 6).map(field => (
                        <span key={field} style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{field}</span>
                      ))}
                      {log.changedFields.length > 6 && <span style={{ fontSize: 11, color: '#9ca3af' }}>+{log.changedFields.length - 6}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>{fmtTime(log.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityTimeline
