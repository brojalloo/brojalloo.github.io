import { lazy, Suspense, useSyncExternalStore } from 'react'
import { MobilePortfolio } from './ui/MobilePortfolio'

const DesktopApp = lazy(() => import('./DesktopApp'))
const mobileQuery = window.matchMedia('(max-width: 900px)')
const subscribe = (notify: () => void) => {
  mobileQuery.addEventListener('change', notify)
  return () => mobileQuery.removeEventListener('change', notify)
}

export default function App() {
  const mobile = useSyncExternalStore(subscribe, () => mobileQuery.matches)
  // Phones get a readable document immediately, without waiting for WebGL initialization.
  if (mobile) return <MobilePortfolio />
  return <Suspense fallback={<p role="status">Chargement…</p>}><DesktopApp /></Suspense>
}
