import { useEffect, useRef, useState } from 'react'

/**
 * Smoothly animates a number from its previous value to the new one.
 */
export default function AnimatedNumber({ value, decimals = 0, duration = 500, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevRef  = useRef(value)
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const from = prevRef.current
    const to   = value
    if (from === to) return
    prevRef.current = to

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = null

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased
      setDisplay(parseFloat(current.toFixed(decimals)))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration, decimals])

  return <span className={className}>{display.toFixed(decimals)}</span>
}
