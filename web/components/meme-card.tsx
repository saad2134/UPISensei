"use client"

interface MemeCardProps {
  type: 'insight' | 'warning' | 'challenge'
  title: string
  message: string
}

export default function MemeCard({ type, title, message }: MemeCardProps) {
  const colors = {
    insight: 'from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:border-blue-800',
    warning: 'from-red-50 to-red-100 border-red-200 dark:from-red-950 dark:to-red-900 dark:border-red-800',
    challenge: 'from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950 dark:to-yellow-900 dark:border-yellow-800',
  }

  const textColors = {
    insight: 'text-blue-900 dark:text-blue-100',
    warning: 'text-red-900 dark:text-red-100',
    challenge: 'text-yellow-900 dark:text-yellow-100',
  }

  return (
    <div
      className={`bg-gradient-to-br ${colors[type]} border rounded-xl p-4 animate-slide-in`}
    >
      <h3 className={`font-black text-base mb-1 ${textColors[type]}`}>
        {title}
      </h3>
      <p className={`text-sm leading-relaxed ${textColors[type]}`}>
        {message}
      </p>
    </div>
  )
}
