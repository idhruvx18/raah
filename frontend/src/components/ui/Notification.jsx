import { useEffect, useState } from 'react'

const COLORS = {
  info:    'bg-white border-raah-border text-raah-body',
  warn:    'bg-white border-raah-warn/30 text-raah-warn',
  danger:  'bg-white border-raah-danger/30 text-raah-danger',
  success: 'bg-white border-raah-safe/30 text-raah-safe',
}

export default function Notification({ message, severity = 'info', duration = 3000, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDone?.(), 300)
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  return (
    <div
      className={`
        border rounded-sm px-4 py-2.5 text-xs font-medium tracking-[.02em] shadow-sm
        transition-all duration-300
        ${COLORS[severity] || COLORS.info}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {message}
    </div>
  )
}
