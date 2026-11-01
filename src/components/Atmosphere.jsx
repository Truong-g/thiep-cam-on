import { lazy, Suspense, useEffect, useState } from 'react'

const AtmosphereCanvas = lazy(() => import('./AtmosphereCanvas.jsx'))

export default function Atmosphere({ className = '', variant = 'home', accentColor = '#d593a8', themeKey = 'moon-garden', decorationKeys = ['hearts'] }) {
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let timer

    function update() {
      const enabled = !preference.matches
      setMotionEnabled(enabled)
      window.clearTimeout(timer)
      if (enabled) timer = window.setTimeout(() => setCanvasReady(true), 500)
      else setCanvasReady(false)
    }

    update()
    preference.addEventListener?.('change', update)
    return () => {
      window.clearTimeout(timer)
      preference.removeEventListener?.('change', update)
    }
  }, [])

  return (
    <div className={`atmosphere ${className}`} aria-hidden="true">
      <div className="atmosphere-fallback" />
      {canvasReady && <Suspense fallback={null}><AtmosphereCanvas motionEnabled={motionEnabled} variant={variant} accentColor={accentColor} themeKey={themeKey} decorationKeys={decorationKeys} /></Suspense>}
    </div>
  )
}
