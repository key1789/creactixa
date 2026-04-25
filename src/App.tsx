import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { RequireAuth } from './features/auth/RequireAuth'

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
)
const ClientsPage = lazy(() =>
  import('./pages/ClientsPage').then((module) => ({ default: module.ClientsPage }))
)
const ContentPlanningPage = lazy(() =>
  import('./pages/ContentPlanningPage').then((module) => ({ default: module.ContentPlanningPage }))
)
const ProductionsPage = lazy(() =>
  import('./pages/ProductionsPage').then((module) => ({ default: module.ProductionsPage }))
)
const CalendarPage = lazy(() =>
  import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage }))
)
const ActivityLogPage = lazy(() =>
  import('./pages/ActivityLogPage').then((module) => ({ default: module.ActivityLogPage }))
)
const UserManagementPage = lazy(() =>
  import('./pages/UserManagementPage').then((module) => ({ default: module.UserManagementPage }))
)
const ClientViewPage = lazy(() =>
  import('./pages/ClientViewPage').then((module) => ({ default: module.ClientViewPage }))
)
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage }))
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Loading page...</div>}>
        <Routes>
          <Route
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="content-planning" element={<ContentPlanningPage />} />
            <Route path="productions" element={<ProductionsPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="activity-log" element={<ActivityLogPage />} />
            <Route path="users" element={<UserManagementPage />} />
          </Route>
          <Route path="login" element={<LoginPage />} />
          <Route path="view/:id" element={<ClientViewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
