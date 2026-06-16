import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

// Layouts
import AppLayout from '../components/layout/AppLayout'

// Portal
import PortalLayout from '../pages/portal/PortalLayout'
import PortalDashboard from '../pages/portal/PortalDashboard'
import PortalSubscriptions from '../pages/portal/PortalSubscriptions'
import PortalInvoices from '../pages/portal/PortalInvoices'
import PortalAlerts from '../pages/portal/PortalAlerts'
import PortalTickets from '../pages/portal/PortalTickets'
import PortalTicketDetail from '../pages/portal/PortalTicketDetail'
import PortalMessages from '../pages/portal/PortalMessages'
import PortalTeam from '../pages/portal/PortalTeam'

// Auth pages (public)
import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'

// App pages (protected)
import Tickets from '../pages/tickets/Tickets'
import Dashboard from '../pages/dashboard/Dashboard'
import CreateUser from '../pages/users/CreateUser'
import Customers from '../pages/customers/Customers'
import Softwares from '../pages/softwares/Softwares'
import SoftwareDetail from '../pages/softwares/SoftwareDetail'
import Subscriptions from '../pages/subscriptions/Subscriptions'
import Invoices from '../pages/invoices/Invoices'
import Alerts from '../pages/alerts/Alerts'
import Settings from '../pages/settings/Settings'
import Users from '../pages/users/Users'
import Reports from '../pages/reports/Reports'
import AuditLogs from '../pages/audit/AuditLogs'
import Communications from '../pages/communications/Communications'

// ── Auth guard ───────────────────────────────────────────────────────────────
// Shows nothing while the cookie session check is in flight (initializing).
// Redirects to /login if no active session.
function ProtectedRoute() {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth)
  if (initializing) return null
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

// ── Placeholder while a page hasn't been built yet ──────────────────────────
function ComingSoon({ title }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '48px 40px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontFamily: 'system-ui' }}>
      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>{title}</h2>
      <p style={{ color: '#9ca3af', marginTop: '8px', fontSize: '14px' }}>This page is coming soon.</p>
    </div>
  )
}

// ── Route map ────────────────────────────────────────────────────────────────
//
//  Backend base : /api/v1/
//  Auth         : cookie-based (httpOnly logintoken + refreshToken)
//
//  ┌─────────────────────────────────────────────────────────────────────────┐
//  │  Frontend path           Backend endpoint prefix      Min role          │
//  ├─────────────────────────────────────────────────────────────────────────┤
//  │  /login                  /auth                        Public            │
//  │  /register               /auth/register               Public            │
//  │  /forgot-password        /auth/forgot-password        Public            │
//  │  /reset-password/:token  /auth/reset-password/:token  Public            │
//  │  /dashboard              /dashboard                   Standard          │
//  │  /customers              /customers                   Standard          │
//  │  /customers/:id          /customers/:id               Standard          │
//  │  /softwares              /softwares                   Standard          │
//  │  /softwares/:id          /softwares/:id               Standard          │
//  │  /subscriptions          /subscriptions               Standard          │
//  │  /subscriptions/:id      /subscriptions/:id           Standard          │
//  │  /invoices               /invoices                    Standard          │
//  │  /invoices/:id           /invoices/:id                Standard          │
//  │  /tickets                /tickets                     Standard          │
//  │  /tickets/:id            /tickets/:id                 Standard          │
//  │  /alerts                 /alerts                      Standard          │
//  │  /communications         /communications              Standard          │
//  │  /reports                /reports                     Admin             │
//  │  /users                  /users                       Admin             │
//  │  /users/new              /auth/register               SuperAdmin        │
//  │  /audit                  /audit                       Admin             │
//  └─────────────────────────────────────────────────────────────────────────┘

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/login"                  element={<Login />} />
      <Route path="/register"               element={<Register />} />
      <Route path="/forgot-password"        element={<ForgotPassword />} />
      <Route path="/reset-password/:token"  element={<ResetPassword />} />

      {/* ── Protected (wrapped in AppLayout with sidebar) ── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard"            element={<Dashboard />} />

          <Route path="/customers"            element={<Customers />} />
          <Route path="/customers/:id"        element={<ComingSoon title="Customer Detail" />} />

          <Route path="/softwares"            element={<Softwares />} />
          <Route path="/softwares/:id"        element={<SoftwareDetail />} />

          <Route path="/subscriptions"        element={<Subscriptions />} />
          <Route path="/subscriptions/:id"    element={<ComingSoon title="Subscription Detail" />} />

          <Route path="/invoices"             element={<Invoices />} />
          <Route path="/invoices/:id"         element={<ComingSoon title="Invoice Detail" />} />

          <Route path="/tickets"              element={<Tickets />} />
          <Route path="/tickets/:id"          element={<Tickets />} />

          <Route path="/alerts"               element={<Alerts />} />

          <Route path="/communications"       element={<Communications />} />

          <Route path="/reports"              element={<Reports />} />

          <Route path="/users"                element={<Users />} />
          <Route path="/users/new"            element={<CreateUser />} />

          <Route path="/audit"                element={<AuditLogs />} />

          <Route path="/notifications"        element={<ComingSoon title="Notifications" />} />
          <Route path="/settings"             element={<Settings />} />
        </Route>
      </Route>

      {/* ── Customer Portal ── */}
      <Route path="/portal/login" element={<Navigate to="/login" replace />} />
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard"     element={<PortalDashboard />} />
        <Route path="subscriptions" element={<PortalSubscriptions />} />
        <Route path="invoices"      element={<PortalInvoices />} />
        <Route path="alerts"        element={<PortalAlerts />} />
        <Route path="tickets"       element={<PortalTickets />} />
        <Route path="tickets/:id"   element={<PortalTicketDetail />} />
        <Route path="messages"      element={<PortalMessages />} />
        <Route path="team"          element={<PortalTeam />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
