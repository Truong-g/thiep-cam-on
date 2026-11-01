import { lazy, Suspense } from 'react'
import HomePage from './pages/HomePage.jsx'

const AdminPage = lazy(() => import('./pages/AdminPage.jsx'))
const CardPage = lazy(() => import('./pages/CardPage.jsx'))

function RouteLoading() {
  return <main className="route-loading" role="status"><span className="spinner" />Đang mở một lời nhắn dịu dàng…</main>
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'

  if (path === '/admin') return <Suspense fallback={<RouteLoading />}><AdminPage /></Suspense>
  if (path.startsWith('/c/')) {
    const slug = decodeURIComponent(path.slice(3))
    return <Suspense fallback={<RouteLoading />}><CardPage slug={slug} /></Suspense>
  }
  return <HomePage />
}
