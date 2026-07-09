import { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getAllTasksApi, createTaskApi, updateTaskApi, deleteTaskApi } from '../../api/taskApi'
import { getAllUsersApi } from '../../api/userApi'
import { getAllSoftwaresApi } from '../../api/softwareApi'
import { toastSuccess, toastError } from '../../utils/toast'

const TYPES = ['Task', 'Bug', 'Feature', 'Improvement']
const STATUSES = ['Todo', 'InProgress', 'Blocked', 'Done', 'Cancelled']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

const BLANK = {
  title: '', description: '', type: 'Task', status: 'Todo', priority: 'Medium',
  software: '', assignedTo: '', dueDate: '',
}

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const isoDate = d => d ? d.slice(0, 10) : ''

const badgeCfg = {
  Todo: ['#eff6ff', '#1d4ed8', '#bfdbfe'],
  InProgress: ['#fffbeb', '#b45309', '#fde68a'],
  Blocked: ['#fef2f2', '#dc2626', '#fecaca'],
  Done: ['#f0fdf4', '#15803d', '#bbf7d0'],
  Cancelled: ['#f9fafb', '#6b7280', '#e5e7eb'],
  Low: ['#f9fafb', '#6b7280', '#e5e7eb'],
  Medium: ['#eff6ff', '#1d4ed8', '#bfdbfe'],
  High: ['#fffbeb', '#b45309', '#fde68a'],
  Urgent: ['#fef2f2', '#dc2626', '#fecaca'],
}

function Badge({ value }) {
  const [bg, color, border] = badgeCfg[value] || badgeCfg.Todo
  return <span style={{ background: bg, color, border: `1px solid ${border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{value}</span>
}

function Field({ label, children, required }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
        {label}{required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', border: '1px solid gainsboro', borderRadius: 6,
  padding: '8px 10px', fontSize: 13, outline: 'none', color: '#111827', background: 'white',
  fontFamily: 'inherit',
}

function TaskDrawer({ task, users, softwares, onClose, onSaved }) {
  const [form, setForm] = useState(() => task ? {
    title: task.title || '',
    description: task.description || '',
    type: task.type || 'Task',
    status: task.status || 'Todo',
    priority: task.priority || 'Medium',
    software: task.software?._id || task.software || '',
    assignedTo: task.assignedTo?._id || task.assignedTo || '',
    dueDate: isoDate(task.dueDate),
  } : BLANK)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const save = async () => {
    if (!form.title.trim()) { setErr('Title is required.'); return }
    setSaving(true); setErr('')
    const payload = { ...form, title: form.title.trim() }
    if (!payload.software) delete payload.software
    if (!payload.assignedTo) delete payload.assignedTo
    if (!payload.dueDate) delete payload.dueDate
    try {
      if (task) await updateTaskApi(task._id, payload)
      else await createTaskApi(payload)
      onSaved(!!task)
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to save task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 500, maxWidth: '100vw', background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid gainsboro', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{task ? 'Edit Task' : 'Add Task'}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{task ? task.title : 'Track bug, feature, or internal work'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Title" required>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Fix login redirect issue" style={inputStyle} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="What needs to be done?" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Type">
                <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>{TYPES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Priority">
                <select value={form.priority} onChange={e => set('priority', e.target.value)} style={inputStyle}>{PRIORITIES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Status">
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>{STATUSES.map(v => <option key={v}>{v}</option>)}</select>
              </Field>
              <Field label="Due Date">
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <Field label="Software">
              <select value={form.software} onChange={e => set('software', e.target.value)} style={inputStyle}>
                <option value="">No software linked</option>
                {softwares.map(sw => <option key={sw._id} value={sw._id}>{sw.name}</option>)}
              </select>
            </Field>
            <Field label="Assigned To">
              <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} style={inputStyle}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </Field>
          </div>
          {err && <div style={{ marginTop: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', color: '#dc2626', fontSize: 13 }}>{err}</div>}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid gainsboro', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ border: '1px solid gainsboro', background: 'white', borderRadius: 6, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#374151' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : task ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Tasks() {
  const { user } = useSelector(s => s.auth)
  const isAdmin = ['Admin', 'SuperAdmin'].includes(user?.role)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [softwares, setSoftwares] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [mine, setMine] = useState(false)
  const [drawerTask, setDrawerTask] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const fetchTasks = useCallback(async (nextPage = 1) => {
    setLoading(true)
    try {
      const params = { page: nextPage, limit: 20 }
      if (search) params.search = search
      if (status) params.status = status
      if (priority) params.priority = priority
      if (mine) params.mine = true
      const res = await getAllTasksApi(params)
      setTasks(res.data?.data || [])
      setPage(res.data?.pagination?.page || nextPage)
      setPages(res.data?.pagination?.pages || 1)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [search, status, priority, mine])

  useEffect(() => {
    getAllUsersApi({ limit: 100 }).then(r => setUsers(r.data?.data || [])).catch(() => {})
    getAllSoftwaresApi({ limit: 100 }).then(r => setSoftwares(r.data?.data || [])).catch(() => {})
  }, [])

  useEffect(() => { fetchTasks(1) }, [fetchTasks])

  const openCreate = () => { setDrawerTask(null); setDrawerOpen(true) }
  const openEdit = task => { setDrawerTask(task); setDrawerOpen(true) }
  const closeDrawer = () => { setDrawerOpen(false); setDrawerTask(null) }
  const saved = (wasEdit) => {
    closeDrawer()
    fetchTasks(wasEdit ? page : 1)
    toastSuccess(wasEdit ? 'Task updated' : 'Task created')
  }

  const changeStatus = async (task, nextStatus) => {
    try {
      await updateTaskApi(task._id, { status: nextStatus })
      fetchTasks(page)
      toastSuccess('Task status updated')
    } catch {
      toastError('Failed to update task')
    }
  }

  const removeTask = async task => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return
    try {
      await deleteTaskApi(task._id)
      fetchTasks(page)
      toastSuccess('Task deleted')
    } catch {
      toastError('Failed to delete task')
    }
  }

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter(t => t.status === s).length }), {})

  return (
    <div style={{ padding: '20px 24px', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Tasks</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>Track bugs, feature work, and internal follow-ups</p>
        </div>
        <button onClick={openCreate} style={{ background: '#1a73e8', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Task</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <span key={s} style={{ background: '#eff6ff', color: '#1a73e8', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}>
            {s}: {counts[s] || 0}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." style={{ ...inputStyle, width: 260 }} />
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">All Status</option>
          {STATUSES.map(v => <option key={v}>{v}</option>)}
        </select>
        <select value={priority} onChange={e => setPriority(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="">All Priority</option>
          {PRIORITIES.map(v => <option key={v}>{v}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#374151', border: '1px solid gainsboro', borderRadius: 6, padding: '0 10px', background: 'white' }}>
          <input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} />
          Mine
        </label>
      </div>

      <div style={{ border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>
              {['Task', 'Type', 'Priority', 'Status', 'Software', 'Assigned', 'Due', 'Actions'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Loading tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No tasks found.</td></tr>
            ) : tasks.map(task => (
              <tr key={task._id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 12px', maxWidth: 320 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{task.title}</div>
                  {task.description && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                </td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>{task.type}</td>
                <td style={{ padding: '10px 12px' }}><Badge value={task.priority} /></td>
                <td style={{ padding: '10px 12px' }}><Badge value={task.status} /></td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: task.software ? '#374151' : '#d1d5db' }}>{task.software?.name || '—'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: task.assignedTo ? '#374151' : '#d1d5db' }}>{task.assignedTo?.name || 'Unassigned'}</td>
                <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>{fmtDate(task.dueDate)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(task)} style={{ background: 'none', border: 'none', color: '#1a73e8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                    {task.status !== 'Done' && <button onClick={() => changeStatus(task, 'Done')} style={{ background: 'none', border: 'none', color: '#15803d', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Done</button>}
                    {isAdmin && <button onClick={() => removeTask(task)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
          <button disabled={page <= 1} onClick={() => fetchTasks(page - 1)} style={{ ...inputStyle, width: 38, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>‹</button>
          <span style={{ padding: '8px 12px', fontSize: 13, color: '#6b7280' }}>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => fetchTasks(page + 1)} style={{ ...inputStyle, width: 38, cursor: page >= pages ? 'not-allowed' : 'pointer' }}>›</button>
        </div>
      )}

      {drawerOpen && (
        <TaskDrawer task={drawerTask} users={users} softwares={softwares} onClose={closeDrawer} onSaved={saved} />
      )}
    </div>
  )
}
