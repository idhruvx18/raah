import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/layout/Layout'

// Pages
import Home       from './pages/Home'
import Dashboard  from './pages/Dashboard'
import Scenarios  from './pages/Scenarios'
import Perception from './pages/Perception'
import Risk       from './pages/Risk'
import Planning   from './pages/Planning'
import Analytics  from './pages/Analytics'
import Results    from './pages/Results'
import Technology from './pages/Technology'
import Research   from './pages/Research'
import Team       from './pages/Team'

// Scroll to top on route change
function ScrollReset() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])
  return null
}

// Dashboard uses a full-bleed layout (no footer padding, dark-footer)
function DashboardLayout({ children }) {
  return (
    <Layout noPad darkFooter={false}>
      {children}
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollReset />
      <Routes>
        {/* Home — dark hero, special treatment */}
        <Route path="/" element={
          <Layout noPad darkFooter>
            <Home />
          </Layout>
        } />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        } />

        {/* Standard pages */}
        {[
          { path: '/scenarios',  element: <Scenarios /> },
          { path: '/perception', element: <Perception /> },
          { path: '/risk',       element: <Risk /> },
          { path: '/planning',   element: <Planning /> },
          { path: '/analytics',  element: <Analytics /> },
          { path: '/results',    element: <Results /> },
          { path: '/technology', element: <Technology /> },
          { path: '/research',   element: <Research /> },
          { path: '/team',       element: <Team /> },
        ].map(({ path, element }) => (
          <Route key={path} path={path} element={
            <Layout>
              {element}
            </Layout>
          } />
        ))}

        {/* 404 */}
        <Route path="*" element={
          <Layout>
            <div className="raah-container py-32 text-center">
              <p className="raah-label mb-4">404</p>
              <h1 className="text-hero-sm font-light text-raah-heading">Page not found.</h1>
            </div>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
