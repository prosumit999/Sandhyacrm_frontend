import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getRevenueReportApi, getSubscriptionReportApi,
  getSoftwareReportApi, getCommunicationReportApi,
} from '../../api/reportApi'
import {
  getInstagramAnalyticsApi, updateInstagramCaptionApi,
  getMetaAdsAnalyticsApi,
  getWebsiteAnalyticsApi,
} from '../../api/socialApi'

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtINR = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const fmtNum = n => new Intl.NumberFormat('en-IN').format(n || 0)
const fmtK   = n => {
  if (!n) return '₹0'
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(1)}Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)}L`
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`
  return fmtINR(n)
}

const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const CUR_YEAR = new Date().getFullYear()

// ── Icon ──────────────────────────────────────────────────────────────────────
const Ic = ({ d, size = 16, color = 'currentColor', sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
)
const IC = {
  revenue:  'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  subs:     'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  software: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
  comms:    'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  invoice:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  star:     'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  arrow:    'M13 7l5 5m0 0l-5 5m5-5H6',
  ig:       'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 2h11A4.5 4.5 0 0122 6.5v11a4.5 4.5 0 01-4.5 4.5h-11A4.5 4.5 0 012 17.5v-11A4.5 4.5 0 016.5 2z',
  meta:     'M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 4l3 5.5L18 8l-2 7H8l-2-7 3-1.5L12 6z',
  globe:    'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 004 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  edit2:    'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  heart:    'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  msg:      'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  save:     'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z',
  link:     'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  warn:     'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  close:    'M6 18L18 6M6 6l12 12',
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  eye:      'M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9.9-.7C6.6 8.1 9.1 6 12 6s5.4 2.1 6.9 5.3c.1.2.1.5 0 .7C17.4 15.9 14.9 18 12 18s-5.4-2.1-6.9-5.3a1 1 0 010-.7z',
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Sk = ({ h = 14, w = '100%', r = 4 }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: '#f3f4f6', animation: 'sk 1.2s ease infinite alternate', display: 'inline-block' }} />
)

// ═════════════════════════════════════════════════════════════════════════════
//  LINE CHART  — pure SVG, smooth bezier, pintip tooltips
// =============================================================================
const VW = 800, VH = 260
const PAD = { top: 22, right: 28, bottom: 46, left: 76 }
const CW = VW - PAD.left - PAD.right   // chart width
const CH = VH - PAD.top  - PAD.bottom  // chart height

function niceMax(val) {
  if (!val || val <= 0) return 10
  const exp = Math.pow(10, Math.floor(Math.log10(val)))
  return Math.ceil(val / exp) * exp
}

function LineChart({ series, yFormatter, loading }) {
  const svgRef  = useRef(null)
  const uid     = useRef(Math.random().toString(36).slice(2)).current
  const [hov, setHov] = useState(null)  // { idx, clientX, clientY }

  const allVals = series.flatMap(s => s.data || []).filter(v => v > 0)
  const maxV    = niceMax(Math.max(...allVals, 1))

  const ptX = i => PAD.left + (i / 11) * CW
  const ptY = v => PAD.top  + CH - (Math.max(0, v) / maxV) * CH

  const bezier = pts => {
    if (!pts.length) return ''
    let d = `M${pts[0][0]},${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
      const cx = (x0 + x1) / 2
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
    }
    return d
  }

  const area = pts => {
    const bot = PAD.top + CH
    let d = `M${pts[0][0]},${bot} L${pts[0][0]},${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
      const cx = (x0 + x1) / 2
      d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`
    }
    d += ` L${pts[pts.length - 1][0]},${bot} Z`
    return d
  }

  const onMove = e => {
    const svg  = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx   = ((e.clientX - rect.left) / rect.width) * VW
    const raw  = (mx - PAD.left) / (CW / 11)
    const idx  = Math.max(0, Math.min(11, Math.round(raw)))
    if (mx < PAD.left - 10 || mx > VW - PAD.right + 10) { setHov(null); return }
    setHov({ idx, clientX: e.clientX, clientY: e.clientY })
  }

  const yTicks  = 5
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => maxV * (1 - i / yTicks))
  const fmt     = yFormatter || (v => fmtNum(v))

  if (loading) return (
    <div style={{ height: VH, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 6 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.2 }}>◌</div>
        <div style={{ fontSize: 12.5, color: '#9ca3af' }}>Loading chart…</div>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <svg ref={svgRef} width="100%" viewBox={`0 0 ${VW} ${VH}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseMove={onMove} onMouseLeave={() => setHov(null)}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`g_${uid}_${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <filter id={`shadow_${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)" />
          </filter>
        </defs>

        {/* horizontal grid */}
        {tickVals.map((v, i) => {
          const y = ptY(v)
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={VW - PAD.right} y2={y}
                stroke={i === yTicks ? '#e5e7eb' : '#f3f4f6'} strokeWidth="1"
                strokeDasharray={i === 0 || i === yTicks ? '0' : '4,4'} />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end"
                fontSize="10.5" fill="#9ca3af" fontFamily="'Plus Jakarta Sans',system-ui">
                {fmt(v)}
              </text>
            </g>
          )
        })}

        {/* x axis labels */}
        {MONTHS.map((m, i) => (
          <text key={i} x={ptX(i)} y={VH - PAD.bottom + 18}
            textAnchor="middle" fontSize="11.5" fill={hov?.idx === i ? '#374151' : '#9ca3af'}
            fontWeight={hov?.idx === i ? '600' : '400'} fontFamily="'Plus Jakarta Sans',system-ui"
            style={{ transition: 'fill 0.1s' }}>
            {m}
          </text>
        ))}

        {/* area fills */}
        {series.map((s, i) => (
          <path key={i} d={area(s.data.map((v, j) => [ptX(j), ptY(v)]))}
            fill={`url(#g_${uid}_${i})`} />
        ))}

        {/* lines */}
        {series.map((s, i) => (
          <path key={i} d={bezier(s.data.map((v, j) => [ptX(j), ptY(v)]))}
            fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" />
        ))}

        {/* hover: vertical indicator */}
        {hov && (
          <line x1={ptX(hov.idx)} y1={PAD.top - 4} x2={ptX(hov.idx)} y2={PAD.top + CH}
            stroke="#d1d5db" strokeWidth="1.5" strokeDasharray="4,3" />
        )}

        {/* hover: data points */}
        {hov && series.map((s, i) => (
          <circle key={i} cx={ptX(hov.idx)} cy={ptY(s.data[hov.idx])} r={5}
            fill="white" stroke={s.color} strokeWidth="2.5"
            filter={`url(#shadow_${uid})`} />
        ))}

        {/* bottom axis line */}
        <line x1={PAD.left} y1={PAD.top + CH} x2={VW - PAD.right} y2={PAD.top + CH}
          stroke="#e5e7eb" strokeWidth="1" />
      </svg>

      {/* pintip tooltip */}
      {hov && (
        <div style={{
          position: 'fixed', left: hov.clientX, top: hov.clientY - 14,
          transform: 'translate(-50%,-100%)',
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: '9px 13px', boxShadow: '0 8px 24px rgba(0,0,0,0.11)',
          pointerEvents: 'none', zIndex: 9999, minWidth: 130,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
            {MONTHS[hov.idx]}
          </div>
          {series.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < series.length - 1 ? 4 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: '#6b7280', flex: 1, whiteSpace: 'nowrap' }}>{s.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                {fmt(s.data[hov.idx])}
              </span>
            </div>
          ))}
          {/* arrow */}
          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 10, height: 6, overflow: 'hidden' }}>
            <div style={{ width: 8, height: 8, background: 'white', border: '1px solid #e5e7eb', transform: 'rotate(45deg)', margin: '-4px auto 0' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  SUMMARY CARD
// =============================================================================
function SummaryCard({ label, value, sub, color, icon, loading }) {
  if (loading) return (
    <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 16 }}>
      <div style={{ marginBottom: 14 }}><Sk h={32} w={32} r={6} /></div>
      <Sk h={22} w="55%" /><div style={{ marginTop: 8 }}><Sk h={11} w="70%" /></div>
    </div>
  )
  return (
    <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 16 }}>
      <div style={{ width: 34, height: 34, borderRadius: 7, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ic d={icon} size={16} color={color} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  CHART CARD
// =============================================================================
function ChartCard({ title, subtitle, legend, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '1px solid gainsboro' }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{subtitle}</div>}
        </div>
        {legend && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {legend.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontSize: 12, color: '#6b7280' }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '14px 20px 10px' }}>{children}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  MINI BAR
// =============================================================================
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 5, background: '#f3f4f6', borderRadius: 10, overflow: 'hidden', flex: 1 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 10, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
//  DONUT SEGMENT
// =============================================================================
function DonutChart({ segments }) {
  // segments: [{ label, value, color }]
  const total = segments.reduce((s, x) => s + x.value, 0)
  if (!total) return <div style={{ fontSize: 12, color: '#9ca3af', padding: '16px 0' }}>No data</div>

  let cumAngle = -90
  const r = 44, cx = 54, cy = 54, stroke = 12
  const arc = (pct) => {
    const angle = pct * 360
    const rad   = (a) => (a * Math.PI) / 180
    const large = angle > 180 ? 1 : 0
    const startX = cx + r * Math.cos(rad(cumAngle))
    const startY = cy + r * Math.sin(rad(cumAngle))
    cumAngle    += angle
    const endX  = cx + r * Math.cos(rad(cumAngle - 0.01))
    const endY  = cy + r * Math.sin(rad(cumAngle - 0.01))
    return `M${startX},${startY} A${r},${r} 0 ${large},1 ${endX},${endY}`
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={108} height={108} viewBox="0 0 108 108">
        {segments.filter(s => s.value > 0).map((s, i) => {
          const pct = s.value / total
          const d   = arc(pct)
          return <path key={i} d={d} fill="none" stroke={s.color} strokeWidth={stroke} strokeLinecap="round" />
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#111827" fontFamily="'Plus Jakarta Sans',system-ui">
          {fmtNum(total)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9.5" fill="#9ca3af" fontFamily="'Plus Jakarta Sans',system-ui">total</text>
      </svg>
      <div style={{ flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < segments.length - 1 ? 8 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
              <span style={{ fontSize: 12.5, color: '#374151' }}>{s.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>{total ? Math.round(s.value / total * 100) : 0}%</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', minWidth: 30, textAlign: 'right' }}>{fmtNum(s.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  REVENUE TAB
// =============================================================================
function RevenueTab({ data, loading }) {
  const monthly      = data?.monthly     || Array(12).fill({ total: 0, count: 0 })
  const bySoftware   = data?.bySoftware  || []
  const byType       = data?.byInvoiceType || {}
  const totalRevenue = data?.totalRevenue || 0

  const bestMonth = monthly.reduce((b, m) => m.total > (b?.total || 0) ? m : b, null)
  const totalInv  = monthly.reduce((s, m) => s + (m.count || 0), 0)
  const monthlyAvg = monthly.filter(m => m.total > 0).length
    ? totalRevenue / monthly.filter(m => m.total > 0).length : 0

  const topSw = bySoftware[0]?.softwareName || '—'

  const series = [{ label: 'Revenue', color: '#1a73e8', data: monthly.map(m => m.total) }]
  const maxSw  = Math.max(...bySoftware.map(s => s.total), 1)

  const typeColors = { NewPurchase: '#1a73e8', Renewal: '#16a34a', Upgrade: '#7c3aed', Refund: '#dc2626' }

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Total Revenue"   value={loading ? '—' : fmtINR(totalRevenue)} sub={`Year to date`}             color="#1a73e8" icon={IC.revenue}  />
        <SummaryCard loading={loading} label="Invoices Paid"   value={loading ? '—' : fmtNum(totalInv)}      sub="Total paid invoices"         color="#16a34a" icon={IC.invoice}  />
        <SummaryCard loading={loading} label="Monthly Avg"     value={loading ? '—' : fmtK(monthlyAvg)}      sub="Active months only"          color="#7c3aed" icon={IC.trending} />
        <SummaryCard loading={loading} label="Best Month"      value={loading ? '—' : (bestMonth ? MONTHS[bestMonth.month - 1] : '—')} sub={bestMonth?.total ? fmtINR(bestMonth.total) : 'No data'} color="#d97706" icon={IC.star} />
      </div>

      {/* Line chart */}
      <div style={{ marginBottom: 14 }}>
        <ChartCard title="Monthly Revenue" subtitle={`Paid invoices by month`} legend={series.map(s => ({ label: s.label, color: s.color }))}>
          <LineChart series={series} yFormatter={fmtK} loading={loading} />
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        {/* Revenue by software */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Revenue by Software</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Top 10 by paid invoice total</div>
          </div>
          <div style={{ padding: '0 0 4px' }}>
            {loading ? (
              [...Array(6)].map((_, i) => <div key={i} style={{ padding: '10px 18px' }}><Sk /></div>)
            ) : bySoftware.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No revenue data</div>
            ) : bySoftware.map((sw, i) => (
              <div key={i} style={{ padding: '10px 18px', borderBottom: '1px solid #f9fafb', display: 'flex', alignItems: 'center', gap: 14 }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#1a73e8', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sw.softwareName || 'Unknown'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <MiniBar value={sw.total} max={maxSw} color="#1a73e8" />
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{sw.count} inv</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 13, flexShrink: 0 }}>{fmtK(sw.total)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice type breakdown */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>By Invoice Type</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Revenue breakdown</div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            {loading ? [...Array(4)].map((_, i) => <div key={i} style={{ marginBottom: 12 }}><Sk /></div>) : (
              <>
                <DonutChart segments={
                  Object.entries(byType).map(([k, v]) => ({
                    label: k, value: v.total || 0, color: typeColors[k] || '#6b7280'
                  }))
                } />
                <div style={{ marginTop: 16 }}>
                  {Object.entries(byType).map(([type, v]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f9fafb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: typeColors[type] || '#6b7280' }} />
                        <span style={{ fontSize: 12.5, color: '#374151' }}>{type}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{fmtK(v.total)}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>{v.count} inv</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SUBSCRIPTIONS TAB
// =============================================================================
function SubscriptionsTab({ data, loading }) {
  const monthly  = data?.monthly              || Array(12).fill({ newSubscriptions: 0 })
  const status   = data?.statusBreakdown       || {}
  const billing  = data?.billingCycleBreakdown || {}

  const totalNew   = monthly.reduce((s, m) => s + (m.newSubscriptions || 0), 0)
  const bestMonth  = monthly.reduce((b, m) => (m.newSubscriptions || 0) > (b?.newSubscriptions || 0) ? m : b, null)

  const series = [{ label: 'New Subscriptions', color: '#16a34a', data: monthly.map(m => m.newSubscriptions || 0) }]

  const statusColors = { Active: '#16a34a', Expired: '#dc2626', Cancelled: '#6b7280', Paused: '#d97706' }
  const billingColors = { Monthly: '#1a73e8', Quarterly: '#7c3aed', HalfYearly: '#0891b2', Yearly: '#16a34a', OneTime: '#d97706' }

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Active"     value={loading ? '—' : fmtNum(status.Active || 0)}    sub="Currently active"   color="#16a34a" icon={IC.check}    />
        <SummaryCard loading={loading} label="Expired"    value={loading ? '—' : fmtNum(status.Expired || 0)}   sub="Past renewal date"  color="#dc2626" icon={IC.subs}     />
        <SummaryCard loading={loading} label="New (Year)" value={loading ? '—' : fmtNum(totalNew)}              sub="Created this year"  color="#1a73e8" icon={IC.trending} />
        <SummaryCard loading={loading} label="Best Month" value={loading ? '—' : (bestMonth ? MONTHS[bestMonth.month - 1] : '—')} sub={`${bestMonth?.newSubscriptions || 0} new`} color="#7c3aed" icon={IC.star} />
      </div>

      {/* Line chart */}
      <div style={{ marginBottom: 14 }}>
        <ChartCard title="New Subscriptions per Month" subtitle="Subscriptions created each month" legend={series.map(s => ({ label: s.label, color: s.color }))}>
          <LineChart series={series} yFormatter={v => Math.round(v).toString()} loading={loading} />
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Status breakdown */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Status Breakdown</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>All subscriptions by status</div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            {loading ? [...Array(4)].map((_, i) => <div key={i} style={{ marginBottom: 12 }}><Sk /></div>) : (
              <DonutChart segments={
                Object.entries(status).map(([k, v]) => ({ label: k, value: v, color: statusColors[k] || '#9ca3af' }))
              } />
            )}
          </div>
        </div>

        {/* Billing cycle breakdown */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Billing Cycle (Active)</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Active subscriptions by cycle</div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            {loading ? [...Array(5)].map((_, i) => <div key={i} style={{ marginBottom: 12 }}><Sk /></div>) : (
              <>
                <DonutChart segments={
                  Object.entries(billing).map(([k, v]) => ({ label: k, value: v, color: billingColors[k] || '#9ca3af' }))
                } />
                <div style={{ marginTop: 12 }}>
                  {Object.entries(billing).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
                    const maxBilling = Math.max(...Object.values(billing), 1)
                    return (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 12.5, color: '#374151', minWidth: 90 }}>{k}</span>
                        <MiniBar value={v} max={maxBilling} color={billingColors[k] || '#9ca3af'} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 28, textAlign: 'right' }}>{v}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  SOFTWARE TAB
// =============================================================================
function SoftwareTab({ data, loading }) {
  const [sort, setSort]   = useState('revenue')
  const [search, setSearch] = useState('')

  const list = (data || [])
    .filter(sw => !search || sw.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'revenue') return (b.revenue?.totalRevenue || 0) - (a.revenue?.totalRevenue || 0)
      if (sort === 'active')  return (b.subscriptions?.activeCount || 0) - (a.subscriptions?.activeCount || 0)
      if (sort === 'total')   return (b.subscriptions?.totalCount || 0) - (a.subscriptions?.totalCount || 0)
      if (sort === 'name')    return (a.name || '').localeCompare(b.name || '')
      return 0
    })

  const totalRev   = list.reduce((s, sw) => s + (sw.revenue?.totalRevenue || 0), 0)
  const totalActive = list.reduce((s, sw) => s + (sw.subscriptions?.activeCount || 0), 0)
  const maxRev     = Math.max(...list.map(sw => sw.revenue?.totalRevenue || 0), 1)

  const typeColors = { Web: '#1a73e8', Mobile: '#0891b2', Desktop: '#7c3aed', SAAS: '#6366f1', API: '#ea580c', PAAS: '#be185d' }
  const statusColors = { Active: '#16a34a', Inactive: '#6b7280', Maintenance: '#d97706', Broken: '#dc2626' }

  const SortBtn = ({ id, label }) => (
    <button onClick={() => setSort(id)}
      style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 5, border: `1px solid ${sort === id ? '#1a73e8' : 'gainsboro'}`, background: sort === id ? '#eff6ff' : 'white', color: sort === id ? '#1a73e8' : '#6b7280', transition: 'all 0.12s' }}>
      {label}
    </button>
  )

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Total Softwares"  value={loading ? '—' : fmtNum(list.length)}    sub="In catalogue"          color="#1a73e8" icon={IC.software} />
        <SummaryCard loading={loading} label="Total Revenue"    value={loading ? '—' : fmtINR(totalRev)}       sub="All time paid"         color="#16a34a" icon={IC.revenue}  />
        <SummaryCard loading={loading} label="Active Subs"      value={loading ? '—' : fmtNum(totalActive)}    sub="Across all softwares"  color="#7c3aed" icon={IC.subs}     />
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid gainsboro', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Software Performance</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{list.length} softwares</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search software…"
              style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '6px 10px', fontSize: 12.5, outline: 'none', fontFamily: 'inherit', width: 160 }} />
            <SortBtn id="revenue" label="By Revenue" />
            <SortBtn id="active"  label="By Active" />
            <SortBtn id="name"    label="A–Z" />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 20 }}>{[...Array(6)].map((_, i) => <div key={i} style={{ marginBottom: 10 }}><Sk /></div>)}</div>
          ) : list.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No software data found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>
                  {['Software', 'Type', 'Status', 'Revenue', 'Revenue Bar', 'Active Subs', 'Total Subs', 'Invoices'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: h === 'Revenue' || h === 'Active Subs' || h === 'Total Subs' || h === 'Invoices' ? 'right' : 'left', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((sw, i) => {
                  const tc = typeColors[sw.type] || '#6b7280'
                  const sc = statusColors[sw.status] || '#6b7280'
                  return (
                    <tr key={sw._id || i} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{sw.name}</div>
                        {sw.price && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>{fmtINR(sw.price)}/{sw.billingCycle}</div>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: tc + '18', color: tc }}>{sw.type || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: sc + '18', color: sc }}>{sw.status || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{fmtINR(sw.revenue?.totalRevenue || 0)}</td>
                      <td style={{ padding: '10px 16px', width: 100 }}>
                        <MiniBar value={sw.revenue?.totalRevenue || 0} max={maxRev} color="#1a73e8" />
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>{sw.subscriptions?.activeCount || 0}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280' }}>{sw.subscriptions?.totalCount || 0}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280' }}>{sw.revenue?.invoiceCount || 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMMUNICATIONS TAB
// =============================================================================
function CommunicationsTab({ data, loading }) {
  const byChannel  = data?.byChannel        || {}
  const byStatus   = data?.byDeliveryStatus || {}
  const byPurpose  = data?.byPurpose        || {}
  const daily      = data?.daily            || []

  const total = Object.values(byChannel).reduce((s, v) => s + v, 0)

  const channelColors  = { SMS: '#1a73e8', WhatsApp: '#16a34a', Email: '#7c3aed', Call: '#d97706', Push: '#0891b2' }
  const statusColors   = { Delivered: '#16a34a', Sent: '#1a73e8', Failed: '#dc2626', Pending: '#d97706', Read: '#0891b2' }
  const purposeColors  = ['#1a73e8','#16a34a','#7c3aed','#d97706','#dc2626','#0891b2','#6366f1']

  // Build daily line series (last 30 days or all available)
  const dailyData = (() => {
    if (!daily.length) return Array(12).fill(0)
    const pts = daily.slice(-30).map(d => d.count || 0)
    if (pts.length < 12) return [...Array(12 - pts.length).fill(0), ...pts]
    return pts.slice(-12)
  })()

  const series = [{ label: 'Communications', color: '#0891b2', data: dailyData }]

  const maxPurpose = Math.max(...Object.values(byPurpose), 1)
  const maxChannel = Math.max(...Object.values(byChannel), 1)

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Total Sent"   value={loading ? '—' : fmtNum(total)}                                    sub="All channels"   color="#0891b2" icon={IC.comms}    />
        <SummaryCard loading={loading} label="Delivered"    value={loading ? '—' : fmtNum(byStatus.Delivered || 0)}                   sub="Successfully"   color="#16a34a" icon={IC.check}    />
        <SummaryCard loading={loading} label="Failed"       value={loading ? '—' : fmtNum(byStatus.Failed || 0)}                      sub="Delivery failed" color="#dc2626" icon={IC.trending} />
        <SummaryCard loading={loading} label="Delivery Rate" value={loading ? '—' : (total ? Math.round((byStatus.Delivered || 0) / total * 100) + '%' : '—')} sub="Delivered / total" color="#7c3aed" icon={IC.star} />
      </div>

      {/* Line chart */}
      <div style={{ marginBottom: 14 }}>
        <ChartCard title="Recent Communication Activity" subtitle="Daily volume (recent 30 days)" legend={series.map(s => ({ label: s.label, color: s.color }))}>
          <LineChart series={series} yFormatter={v => Math.round(v).toString()} loading={loading} />
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {/* By channel */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>By Channel</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            {loading ? [...Array(4)].map((_, i) => <div key={i} style={{ marginBottom: 10 }}><Sk /></div>) : (
              <DonutChart segments={
                Object.entries(byChannel).map(([k, v]) => ({ label: k, value: v, color: channelColors[k] || '#9ca3af' }))
              } />
            )}
          </div>
        </div>

        {/* Delivery status */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Delivery Status</div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            {loading ? [...Array(4)].map((_, i) => <div key={i} style={{ marginBottom: 10 }}><Sk /></div>) : (
              <DonutChart segments={
                Object.entries(byStatus).map(([k, v]) => ({ label: k, value: v, color: statusColors[k] || '#9ca3af' }))
              } />
            )}
          </div>
        </div>

        {/* By purpose */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>By Purpose</div>
          </div>
          <div style={{ padding: '4px 0 8px' }}>
            {loading ? (
              [...Array(5)].map((_, i) => <div key={i} style={{ padding: '8px 18px' }}><Sk /></div>)
            ) : Object.keys(byPurpose).length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No data</div>
            ) : (
              Object.entries(byPurpose).sort((a, b) => b[1] - a[1]).map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: purposeColors[i % purposeColors.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#374151', flex: 1 }}>{k}</span>
                  <MiniBar value={v} max={maxPurpose} color={purposeColors[i % purposeColors.length]} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 28, textAlign: 'right' }}>{v}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  NOT CONFIGURED — shared empty state for social tabs
// =============================================================================
function NotConfigured({ title, envVars, docsUrl, color, iconD }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 10, padding: '40px 36px', textAlign: 'center', maxWidth: 500, width: '100%' }}>
        <div style={{ width: 54, height: 54, borderRadius: 14, background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Ic d={iconD} size={24} color={color} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{title} Not Connected</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7, marginBottom: 20 }}>
          Add the following variables to your backend <code style={{ background: '#f3f4f6', padding: '1px 5px', borderRadius: 3, fontSize: 12 }}>.env</code> file and restart the server.
        </div>
        <div style={{ background: '#f9fafb', border: '1px solid gainsboro', borderRadius: 7, padding: '12px 16px', textAlign: 'left', marginBottom: 18 }}>
          {envVars.map(v => (
            <div key={v} style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', marginBottom: 3, lineHeight: 1.5 }}>
              <span style={{ color: color, fontWeight: 600 }}>{v}</span>=<span style={{ color: '#9ca3af' }}>YOUR_VALUE</span>
            </div>
          ))}
        </div>
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: color, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            View Setup Guide <Ic d={IC.link} size={13} color={color} />
          </a>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  INSTAGRAM TAB
// =============================================================================
const IG_PERIODS = [
  { id: '3months',  label: '3 Months' },
  { id: '1month',   label: '1 Month'  },
  { id: '28days',   label: '28 Days'  },
  { id: '7days',    label: '7 Days'   },
  { id: 'yesterday',label: 'Yesterday'},
]

function CaptionEditModal({ post, onClose, onSaved }) {
  const [caption, setCaption] = useState(post.caption || '')
  const [saving,  setSaving]  = useState(false)
  const [err,     setErr]     = useState('')

  const handleSave = async () => {
    setSaving(true); setErr('')
    try {
      await updateInstagramCaptionApi(post.id, caption)
      onSaved(post.id, caption)
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update caption.')
    } finally { setSaving(false) }
  }

  // Highlight hashtags and mentions in preview
  const highlighted = caption.replace(/(#\w+)/g, '<span style="color:#e1306c;font-weight:600">$1</span>')
                               .replace(/(@\w+)/g, '<span style="color:#405de6;font-weight:600">$1</span>')

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200, backdropFilter: 'blur(1px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'white', borderRadius: 10, width: 540, maxWidth: '95vw', zIndex: 201, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Edit Caption & Tags</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Post ID: {post.id}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, border: 'none', background: '#f3f4f6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic d={IC.close} size={15} color="#6b7280" />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Post thumbnail preview */}
          {(post.media_url || post.thumbnail_url) && (
            <div style={{ marginBottom: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <img src={post.thumbnail_url || post.media_url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 7, border: '1px solid gainsboro', flexShrink: 0 }}
                onError={e => { e.target.style.display = 'none' }} />
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: '#374151', marginBottom: 2 }}>{post.media_type} · {new Date(post.timestamp).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</div>
                <div>❤️ {post.like_count || 0} &nbsp; 💬 {post.comments_count || 0}</div>
              </div>
            </div>
          )}

          {/* Textarea */}
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Caption (use # for hashtags, @ for mentions)</label>
          <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={6}
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: 7, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: 1.6, color: '#111827' }}
            onFocus={e => e.target.style.borderColor = '#e1306c'}
            onBlur={e => e.target.style.borderColor = '#d1d5db'} />
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, textAlign: 'right' }}>{caption.length} characters · {(caption.match(/#\w+/g) || []).length} hashtags</div>

          {/* Live preview */}
          <div style={{ marginTop: 10, background: '#f9fafb', border: '1px solid gainsboro', borderRadius: 6, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6, color: '#374151' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 }}>Preview</div>
            <div dangerouslySetInnerHTML={{ __html: highlighted || '<span style="color:#9ca3af">Empty caption…</span>' }} />
          </div>

          {err && <div style={{ marginTop: 10, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 12px', fontSize: 12.5, color: '#dc2626' }}>{err}</div>}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid gainsboro', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid gainsboro', borderRadius: 6, background: 'white', fontSize: 13, cursor: 'pointer', color: '#374151', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '8px 20px', border: 'none', borderRadius: 6, background: saving ? '#f9a8d4' : '#e1306c', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            {saving && <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} style={{ animation: 'sk 0.7s linear infinite' }}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
            {saving ? 'Saving…' : 'Update Caption'}
          </button>
        </div>
      </div>
    </>
  )
}

function InstagramTab({ data, loading, configured }) {
  const [period,    setPeriod]    = useState('28days')
  const [editPost,  setEditPost]  = useState(null)
  const [localData, setLocalData] = useState(data)

  useEffect(() => { setLocalData(data) }, [data])

  if (!configured && !loading) {
    return <NotConfigured title="Instagram" color="#e1306c" iconD={IC.ig}
      envVars={['INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_USER_ID']}
      docsUrl="https://developers.facebook.com/docs/instagram-api/getting-started" />
  }

  const profile  = localData?.profile  || {}
  const insights = localData?.insights || {}
  const topPosts = localData?.topPosts || []

  const handleCaptionSaved = (mediaId, newCaption) => {
    setLocalData(d => ({
      ...d,
      topPosts: d.topPosts.map(p => p.id === mediaId ? { ...p, caption: newCaption } : p),
      allMedia: d.allMedia?.map(p => p.id === mediaId ? { ...p, caption: newCaption } : p),
    }))
    setEditPost(null)
  }

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 18, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {IG_PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            style={{ padding: '6px 14px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: period === p.id ? 700 : 400, background: period === p.id ? '#e1306c' : 'transparent', color: period === p.id ? 'white' : '#6b7280', fontFamily: 'inherit', transition: 'all 0.12s' }}
            onMouseEnter={e => { if (period !== p.id) { e.currentTarget.style.background='#fce7f3'; e.currentTarget.style.color='#e1306c' }}}
            onMouseLeave={e => { if (period !== p.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }}}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Profile KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Total Views"    value={loading?'—':fmtNum(insights.impressions||0)} sub={`Period: ${IG_PERIODS.find(p=>p.id===period)?.label}`} color="#e1306c" icon={IC.trending} />
        <SummaryCard loading={loading} label="Reach"          value={loading?'—':fmtNum(insights.reach||0)}        sub="Unique accounts"    color="#fd1d1d" icon={IC.user}    />
        <SummaryCard loading={loading} label="Profile Views"  value={loading?'—':fmtNum(insights.profile_views||0)} sub="Page visits"       color="#833ab4" icon={IC.eye}    />
        <SummaryCard loading={loading} label="Followers"      value={loading?'—':fmtNum(profile.followers_count||0)} sub={`${profile.media_count||0} total posts`} color="#405de6" icon={IC.star} />
      </div>

      {/* Profile info strip */}
      {!loading && profile.username && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: '12px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          {profile.profile_picture_url && (
            <img src={profile.profile_picture_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={e => e.target.style.display='none'} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{profile.name}</div>
            <div style={{ fontSize: 12.5, color: '#9ca3af' }}>@{profile.username}</div>
            {profile.biography && <div style={{ fontSize: 12, color: '#374151', marginTop: 3, maxWidth: 500 }}>{profile.biography}</div>}
          </div>
          <a href={`https://instagram.com/${profile.username}`} target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: 'auto', fontSize: 12.5, color: '#e1306c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            Open Profile <Ic d={IC.link} size={12} color="#e1306c" />
          </a>
        </div>
      )}

      {/* Top Posts */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid gainsboro', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Top Performing Posts</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Ranked by impressions · Click edit to update caption & tags</div>
          </div>
          <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#9ca3af' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic d={IC.trending} size={12} color="#9ca3af" /> Impressions</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic d={IC.heart} size={12} color="#9ca3af" /> Likes</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic d={IC.msg} size={12} color="#9ca3af" /> Comments</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Ic d={IC.save} size={12} color="#9ca3af" /> Saved</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ marginBottom: 14 }}><Sk h={80} /></div>)}</div>
        ) : topPosts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No posts found.</div>
        ) : (
          <div>
            {topPosts.map((post, i) => {
              const ins      = post.insights || {}
              const caption  = post.caption || ''
              const tags     = (caption.match(/#\w+/g) || []).slice(0, 6)
              const isVideo  = post.media_type === 'VIDEO'

              return (
                <div key={post.id}
                  style={{ padding: '13px 18px', borderBottom: i < topPosts.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>

                  {/* Rank */}
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: i < 3 ? '#fce7f3' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: i < 3 ? '#e1306c' : '#6b7280', flexShrink: 0, marginTop: 2 }}>
                    {i + 1}
                  </div>

                  {/* Thumbnail */}
                  <div style={{ width: 64, height: 64, borderRadius: 7, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', position: 'relative' }}>
                    {(post.thumbnail_url || post.media_url) ? (
                      <img src={post.thumbnail_url || post.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { e.target.style.display='none' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Ic d={isVideo ? IC.trending : IC.ig} size={20} color="#d1d5db" />
                      </div>
                    )}
                    {isVideo && (
                      <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', borderRadius: 3, padding: '1px 4px', fontSize: 9, color: 'white', fontWeight: 700 }}>VID</div>
                    )}
                  </div>

                  {/* Caption + tags */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.5, marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {caption || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>No caption</span>}
                    </div>
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {tags.map(t => (
                          <span key={t} style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 3, background: '#fce7f3', color: '#e1306c', fontWeight: 500 }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      {new Date(post.timestamp).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      &nbsp;·&nbsp;
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', textDecoration: 'none' }}>View on Instagram</a>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                    {[
                      { icon: IC.trending, val: ins.impressions,  color: '#e1306c' },
                      { icon: IC.heart,    val: post.like_count,   color: '#fd1d1d' },
                      { icon: IC.msg,      val: post.comments_count, color: '#833ab4' },
                      { icon: IC.save,     val: ins.saved,        color: '#405de6' },
                    ].map(({ icon, val, color }, mi) => (
                      <div key={mi} style={{ textAlign: 'center', minWidth: 38 }}>
                        <Ic d={icon} size={14} color={color} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginTop: 2 }}>{fmtNum(val || 0)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Edit button */}
                  <button onClick={() => setEditPost(post)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: '1px solid gainsboro', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, color: '#374151', fontFamily: 'inherit', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor='#e1306c'; e.currentTarget.style.color='#e1306c' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor='gainsboro'; e.currentTarget.style.color='#374151' }}>
                    <Ic d={IC.edit2} size={13} color="currentColor" /> Edit
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Caption editor modal */}
      {editPost && <CaptionEditModal post={editPost} onClose={() => setEditPost(null)} onSaved={handleCaptionSaved} />}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  META ADS TAB
// =============================================================================
const META_PRESETS = [
  { id: 'last_7d',  label: '7 Days'  },
  { id: 'last_14d', label: '14 Days' },
  { id: 'last_30d', label: '30 Days' },
  { id: 'last_90d', label: '90 Days' },
]
const CAMPAIGN_STATUS_CFG = {
  ACTIVE:  { bg: '#f0fdf4', color: '#16a34a' },
  PAUSED:  { bg: '#fffbeb', color: '#d97706' },
  DELETED: { bg: '#fef2f2', color: '#dc2626' },
}

function MetaAdsTab({ data, loading, configured }) {
  if (!configured && !loading) {
    return <NotConfigured title="Meta Ads" color="#1877f2" iconD={IC.meta}
      envVars={['META_ADS_ACCESS_TOKEN','META_ADS_ACCOUNT_ID']}
      docsUrl="https://developers.facebook.com/docs/marketing-api/get-started" />
  }

  const overview   = data?.overview   || {}
  const campaigns  = data?.campaigns  || []
  const dailySpend = data?.dailySpend || []
  const account    = data?.account    || {}

  const spendSeries = [{
    label: 'Daily Spend (₹)',
    color: '#1877f2',
    data: (() => {
      if (!dailySpend.length) return Array(12).fill(0)
      const vals = dailySpend.slice(-30).map(d => parseFloat(d.spend) || 0)
      return vals.length >= 12 ? vals.slice(-12) : [...Array(12 - vals.length).fill(0), ...vals]
    })(),
  }]

  const fmtUSD = n => `₹${parseFloat(n || 0).toFixed(2)}`
  const pct    = n => `${(parseFloat(n || 0) * 1).toFixed(2)}%`

  // Extract key conversions from actionMap
  const actions = overview.actionMap || {}
  const leads    = actions['lead'] || actions['offsite_conversion.fb_pixel_lead'] || 0
  const purchases = actions['purchase'] || actions['offsite_conversion.fb_pixel_purchase'] || 0

  return (
    <div>
      {/* Account strip */}
      {!loading && account.name && (
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: '10px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e7f0fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Ic d={IC.meta} size={18} color="#1877f2" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: '#111827' }}>{account.name}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{account.currency} · Account ID: {account.id}</div>
          </div>
          {account.balance !== undefined && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Balance</div>
              <div style={{ fontWeight: 700, color: '#111827' }}>{fmtUSD(account.balance / 100)}</div>
            </div>
          )}
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Total Spend"    value={loading?'—':`₹${parseFloat(overview.spend||0).toFixed(2)}`} sub="Ad spend"          color="#1877f2" icon={IC.revenue}  />
        <SummaryCard loading={loading} label="Impressions"    value={loading?'—':fmtNum(parseInt(overview.impressions)||0)} sub="Total ad views"   color="#42b72a" icon={IC.trending} />
        <SummaryCard loading={loading} label="Reach"          value={loading?'—':fmtNum(parseInt(overview.reach)||0)}        sub="Unique accounts"  color="#f02849" icon={IC.user}    />
        <SummaryCard loading={loading} label="Clicks"         value={loading?'—':fmtNum(parseInt(overview.clicks)||0)}       sub="Link + all clicks" color="#e67e22" icon={IC.arrow}   />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="CTR"            value={loading?'—':pct(overview.ctr)}             sub="Click-through rate" color="#8e44ad" icon={IC.trending} />
        <SummaryCard loading={loading} label="CPM"            value={loading?'—':fmtUSD(overview.cpm)}          sub="Cost per 1000 impr." color="#2980b9" icon={IC.revenue}  />
        <SummaryCard loading={loading} label="CPC"            value={loading?'—':fmtUSD(overview.cpc)}          sub="Cost per click"     color="#16a34a" icon={IC.revenue}  />
        <SummaryCard loading={loading} label="Frequency"      value={loading?'—':(parseFloat(overview.frequency||0).toFixed(2))} sub="Avg times seen" color="#d97706" icon={IC.eye} />
      </div>

      {/* Conversions row */}
      {!loading && (leads > 0 || purchases > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
          <SummaryCard loading={false} label="Leads"     value={fmtNum(leads)}     sub="Lead conversions"     color="#e1306c" icon={IC.user}   />
          <SummaryCard loading={false} label="Purchases" value={fmtNum(purchases)} sub="Purchase conversions" color="#16a34a" icon={IC.check}  />
        </div>
      )}

      {/* Daily spend trend */}
      <div style={{ marginBottom: 14 }}>
        <ChartCard title="Daily Ad Spend Trend" subtitle="Last 30 days of spend" legend={[{ label: 'Daily Spend', color: '#1877f2' }]}>
          <LineChart series={spendSeries} yFormatter={v => `₹${v.toFixed(0)}`} loading={loading} />
        </ChartCard>
      </div>

      {/* Campaign table */}
      <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '13px 18px', borderBottom: '1px solid gainsboro' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Campaign Performance</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{campaigns.length} campaigns</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 16 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ marginBottom: 10 }}><Sk /></div>)}</div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No campaigns found for this period.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid gainsboro' }}>
                  {['Campaign', 'Status', 'Objective', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPM'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: ['Spend','Impressions','Clicks','CTR','CPM'].includes(h) ? 'right' : 'left', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, i) => {
                  const ins = c.insights || {}
                  const sc  = CAMPAIGN_STATUS_CFG[c.status] || { bg: '#f3f4f6', color: '#6b7280' }
                  return (
                    <tr key={c.id || i} style={{ borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827', maxWidth: 220 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                        {c.daily_budget && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>Daily: ₹{(c.daily_budget/100).toFixed(0)}</div>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: sc.bg, color: sc.color }}>{c.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6b7280' }}>{c.objective?.replace(/_/g,' ') || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>₹{parseFloat(ins.spend||0).toFixed(2)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>{fmtNum(parseInt(ins.impressions)||0)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>{fmtNum(parseInt(ins.clicks)||0)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>{pct(ins.ctr)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: '#374151' }}>₹{parseFloat(ins.cpm||0).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  WEBSITE (GA4) TAB
// =============================================================================
const WEB_RANGES = [
  { id: '7daysAgo',  label: '7 Days'   },
  { id: '28daysAgo', label: '28 Days'  },
  { id: '90daysAgo', label: '3 Months' },
]
const SOURCE_COLORS = ['#1a73e8','#16a34a','#7c3aed','#d97706','#dc2626','#0891b2','#6366f1','#be185d']
const DEVICE_CFG = { desktop: '#1a73e8', mobile: '#e1306c', tablet: '#d97706' }

function WebsiteTab({ data, loading, configured }) {
  if (!configured && !loading) {
    return <NotConfigured title="Google Analytics 4" color="#e37400" iconD={IC.globe}
      envVars={['GA4_PROPERTY_ID','GA4_CLIENT_EMAIL','GA4_PRIVATE_KEY']}
      docsUrl="https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries" />
  }

  const ov    = data?.overview   || {}
  const pages = data?.topPages   || []
  const srcs  = data?.sources    || []
  const devs  = data?.devices    || []
  const trend = data?.dailyTrend || []

  const fmtDur = s => {
    const m = Math.floor(s / 60), sec = Math.round(s % 60)
    return `${m}m ${sec}s`
  }

  const trendSeries = [
    { label: 'Sessions',  color: '#1a73e8', data: (() => { const v = trend.slice(-28).map(d => d.sessions||0); return v.length>=12 ? v.slice(-12) : [...Array(12-v.length).fill(0),...v] })() },
    { label: 'Users',     color: '#16a34a', data: (() => { const v = trend.slice(-28).map(d => d.totalUsers||0); return v.length>=12 ? v.slice(-12) : [...Array(12-v.length).fill(0),...v] })() },
  ]

  const totalSrcs = srcs.reduce((s, r) => s + (r.sessions || 0), 0)
  const maxPages  = Math.max(...pages.map(p => p.screenPageViews || 0), 1)

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="Sessions"    value={loading?'—':fmtNum(Math.round(ov.sessions||0))}         sub="Total sessions"        color="#e37400" icon={IC.globe}    />
        <SummaryCard loading={loading} label="Users"       value={loading?'—':fmtNum(Math.round(ov.totalUsers||0))}       sub="Unique visitors"       color="#1a73e8" icon={IC.user}    />
        <SummaryCard loading={loading} label="Page Views"  value={loading?'—':fmtNum(Math.round(ov.screenPageViews||0))} sub="Total page views"      color="#7c3aed" icon={IC.trending} />
        <SummaryCard loading={loading} label="Bounce Rate" value={loading?'—':`${(ov.bounceRate*100||0).toFixed(1)}%`}   sub="Single-page sessions"  color="#dc2626" icon={IC.warn}    />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }}>
        <SummaryCard loading={loading} label="New Users"      value={loading?'—':fmtNum(Math.round(ov.newUsers||0))}            sub="First-time visitors"  color="#16a34a" icon={IC.star}     />
        <SummaryCard loading={loading} label="Avg. Duration"  value={loading?'—':fmtDur(ov.averageSessionDuration||0)}          sub="Per session"          color="#0891b2" icon={IC.calendar} />
      </div>

      {/* Session trend */}
      <div style={{ marginBottom: 14 }}>
        <ChartCard title="Sessions & Users Trend" subtitle="Daily traffic over selected range" legend={trendSeries.map(s => ({ label: s.label, color: s.color }))}>
          <LineChart series={trendSeries} yFormatter={v => fmtNum(Math.round(v))} loading={loading} />
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14, marginBottom: 14 }}>
        {/* Top pages table */}
        <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Top Pages</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Ranked by page views</div>
          </div>
          <div>
            {loading ? (
              [...Array(8)].map((_, i) => <div key={i} style={{ padding: '10px 18px' }}><Sk /></div>)
            ) : pages.length === 0 ? (
              <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No data</div>
            ) : pages.map((p, i) => (
              <div key={i} style={{ padding: '9px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12 }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#6b7280', flexShrink: 0 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.pageTitle}>{p.pageTitle || p.pagePath || '/'}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.pagePath}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <MiniBar value={p.screenPageViews} max={maxPages} color="#e37400" />
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{fmtDur(p.averageSessionDuration || 0)}</span>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 13, flexShrink: 0 }}>{fmtNum(Math.round(p.screenPageViews||0))}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic sources + devices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sources */}
          <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Traffic Sources</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {loading ? <Sk /> : (
                <DonutChart segments={srcs.map((s, i) => ({ label: s.sessionDefaultChannelGroup || 'Other', value: s.sessions || 0, color: SOURCE_COLORS[i % SOURCE_COLORS.length] }))} />
              )}
            </div>
          </div>

          {/* Devices */}
          <div style={{ background: 'white', border: '1px solid gainsboro', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid gainsboro' }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>Devices</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {loading ? <Sk /> : (
                <>
                  {devs.map((d, i) => {
                    const total = devs.reduce((s, x) => s + (x.sessions || 0), 0)
                    const pct   = total > 0 ? Math.round(d.sessions / total * 100) : 0
                    const color = DEVICE_CFG[d.deviceCategory?.toLowerCase()] || SOURCE_COLORS[i]
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <span style={{ fontSize: 12.5, color: '#374151', textTransform: 'capitalize', width: 70, flexShrink: 0 }}>{d.deviceCategory}</span>
                        <MiniBar value={d.sessions} max={Math.max(...devs.map(x => x.sessions), 1)} color={color} />
                        <span style={{ fontSize: 12, color: '#6b7280', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// =============================================================================
const TABS = [
  { id: 'revenue',        label: 'Revenue',          icon: IC.revenue,  color: '#1a73e8' },
  { id: 'subscriptions',  label: 'Subscriptions',    icon: IC.subs,     color: '#16a34a' },
  { id: 'software',       label: 'Software',         icon: IC.software, color: '#7c3aed' },
  { id: 'communications', label: 'Communications',   icon: IC.comms,    color: '#0891b2' },
  { id: 'instagram',      label: 'Instagram',        icon: IC.ig,       color: '#e1306c' },
  { id: 'meta',           label: 'Meta Ads',         icon: IC.meta,     color: '#1877f2' },
  { id: 'website',        label: 'Website',          icon: IC.globe,    color: '#e37400' },
]
const YEARS = Array.from({ length: 5 }, (_, i) => CUR_YEAR - i)

const TAB_GROUPS = [
  { label: 'Business', ids: ['revenue','subscriptions','software','communications'] },
  { label: 'Social & Marketing', ids: ['instagram','meta','website'] },
]

export default function Reports() {
  const navigate = useNavigate()
  const [tab,  setTab]  = useState('revenue')
  const [year, setYear] = useState(CUR_YEAR)

  // Business data
  const [revenue,  setRevenue]  = useState(null)
  const [subs,     setSubs]     = useState(null)
  const [software, setSoftware] = useState(null)
  const [comms,    setComms]    = useState(null)

  // Social data
  const [igData,   setIgData]   = useState(null)
  const [igCfg,    setIgCfg]    = useState(true)   // true = assume configured until told otherwise
  const [metaData, setMetaData] = useState(null)
  const [metaCfg,  setMetaCfg]  = useState(true)
  const [webData,  setWebData]  = useState(null)
  const [webCfg,   setWebCfg]   = useState(true)

  const [loading, setLoading] = useState({})

  // Social sub-filters (controlled here so reload works)
  const [igPeriod,   setIgPeriod]   = useState('28days')
  const [metaPreset, setMetaPreset] = useState('last_30d')
  const [webRange,   setWebRange]   = useState('28daysAgo')

  const load = useCallback(async (id, yr, opts = {}) => {
    setLoading(l => ({ ...l, [id]: true }))
    try {
      if (id === 'revenue') {
        const res = await getRevenueReportApi({ year: yr })
        setRevenue(res.data.data)
      } else if (id === 'subscriptions') {
        const res = await getSubscriptionReportApi({ year: yr })
        setSubs(res.data.data)
      } else if (id === 'software') {
        const res = await getSoftwareReportApi()
        setSoftware(res.data.data)
      } else if (id === 'communications') {
        const res = await getCommunicationReportApi()
        setComms(res.data.data)
      } else if (id === 'instagram') {
        const res = await getInstagramAnalyticsApi(opts.period || igPeriod)
        if (res.data.data?.configured === false) { setIgCfg(false) }
        else { setIgCfg(true); setIgData(res.data.data) }
      } else if (id === 'meta') {
        const res = await getMetaAdsAnalyticsApi(opts.preset || metaPreset)
        if (res.data.data?.configured === false) { setMetaCfg(false) }
        else { setMetaCfg(true); setMetaData(res.data.data) }
      } else if (id === 'website') {
        const res = await getWebsiteAnalyticsApi(opts.range || webRange)
        if (res.data.data?.configured === false) { setWebCfg(false) }
        else { setWebCfg(true); setWebData(res.data.data) }
      }
    } catch (_) {}
    finally { setLoading(l => ({ ...l, [id]: false })) }
  }, [igPeriod, metaPreset, webRange])

  // Load active tab on mount and when tab/year changes
  useEffect(() => { load(tab, year) }, [tab, year, load])

  const isLoading = !!loading[tab]
  const tabCfg    = TABS.find(t => t.id === tab) || TABS[0]

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: '#111827' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>Reports</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#9ca3af' }}>Business analytics and performance insights</p>
        </div>
        {/* Year selector (shown for revenue + subscriptions tabs) */}
        {(tab === 'revenue' || tab === 'subscriptions') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ic d={IC.calendar} size={14} color="#6b7280" />
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              style={{ border: '1px solid gainsboro', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', background: 'white', color: '#111827', fontFamily: 'inherit', cursor: 'pointer' }}>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        {/* Instagram period selector in header */}
        {tab === 'instagram' && igCfg && (
          <div style={{ display: 'flex', gap: 0, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 3 }}>
            {IG_PERIODS.map(p => (
              <button key={p.id} onClick={() => { setIgPeriod(p.id); load('instagram', year, { period: p.id }) }}
                style={{ padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: igPeriod === p.id ? 700 : 400, background: igPeriod === p.id ? '#e1306c' : 'transparent', color: igPeriod === p.id ? 'white' : '#6b7280', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (igPeriod !== p.id) { e.currentTarget.style.background='#fce7f3'; e.currentTarget.style.color='#e1306c' }}}
                onMouseLeave={e => { if (igPeriod !== p.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }}}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        {/* Meta preset selector in header */}
        {tab === 'meta' && metaCfg && (
          <div style={{ display: 'flex', gap: 0, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 3 }}>
            {META_PRESETS.map(p => (
              <button key={p.id} onClick={() => { setMetaPreset(p.id); load('meta', year, { preset: p.id }) }}
                style={{ padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: metaPreset === p.id ? 700 : 400, background: metaPreset === p.id ? '#1877f2' : 'transparent', color: metaPreset === p.id ? 'white' : '#6b7280', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (metaPreset !== p.id) { e.currentTarget.style.background='#e7f0fd'; e.currentTarget.style.color='#1877f2' }}}
                onMouseLeave={e => { if (metaPreset !== p.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }}}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        {/* Website range selector in header */}
        {tab === 'website' && webCfg && (
          <div style={{ display: 'flex', gap: 0, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 3 }}>
            {WEB_RANGES.map(p => (
              <button key={p.id} onClick={() => { setWebRange(p.id); load('website', year, { range: p.id }) }}
                style={{ padding: '5px 12px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: webRange === p.id ? 700 : 400, background: webRange === p.id ? '#e37400' : 'transparent', color: webRange === p.id ? 'white' : '#6b7280', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (webRange !== p.id) { e.currentTarget.style.background='#fef3e2'; e.currentTarget.style.color='#e37400' }}}
                onMouseLeave={e => { if (webRange !== p.id) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }}}>
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Tab bar — grouped ── */}
      <div style={{ marginBottom: 20 }}>
        {TAB_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 4, paddingLeft: 2 }}>{group.label}</div>
            <div style={{ display: 'flex', gap: 0, background: 'white', border: '1px solid gainsboro', borderRadius: 8, padding: 4, width: 'fit-content' }}>
              {TABS.filter(t => group.ids.includes(t.id)).map(t => {
                const active = tab === t.id
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: 'inherit',
                      background: active ? t.color : 'transparent',
                      color: active ? 'white' : '#6b7280',
                      transition: 'all 0.14s',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = t.color + '18'; e.currentTarget.style.color = t.color } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280' } }}>
                    <Ic d={t.icon} size={14} color={active ? 'white' : 'currentColor'} />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tab content ── */}
      {tab === 'revenue'        && <RevenueTab         data={revenue}   loading={isLoading} />}
      {tab === 'subscriptions'  && <SubscriptionsTab   data={subs}      loading={isLoading} />}
      {tab === 'software'       && <SoftwareTab        data={software}  loading={isLoading} />}
      {tab === 'communications' && <CommunicationsTab  data={comms}     loading={isLoading} />}
      {tab === 'instagram'      && <InstagramTab       data={igData}    loading={isLoading} configured={igCfg} />}
      {tab === 'meta'           && <MetaAdsTab         data={metaData}  loading={isLoading} configured={metaCfg} />}
      {tab === 'website'        && <WebsiteTab         data={webData}   loading={isLoading} configured={webCfg} />}

      <style>{`@keyframes sk { from { opacity:1 } to { opacity:0.45 } } @keyframes sk2 { 0%,100%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
