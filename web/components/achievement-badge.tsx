"use client"

interface AchievementBadgeProps {
  achievement: {
    id: number
    icon: string
    title: string
    description: string
    locked: boolean
  }
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  return (
    <button
      className={`group relative rounded-lg p-3 text-center transition-all duration-300 ${
        achievement.locked
          ? 'bg-muted border border-border hover:bg-muted/80'
          : 'bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 hover:border-primary/50 hover:shadow-lg'
      }`}
    >
      {/* Icon */}
      <div className="text-2xl mb-2 transition-transform group-hover:scale-110">
        {achievement.locked ? '🔒' : achievement.icon}
      </div>

      {/* Title */}
      <p className="text-xs font-black text-foreground line-clamp-2">
        {achievement.title}
      </p>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-foreground text-foreground-background text-xs font-medium p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-normal bg-card text-card-foreground border border-border">
        {achievement.description}
      </div>
    </button>
  )
}
