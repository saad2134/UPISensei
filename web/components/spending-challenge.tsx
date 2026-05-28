"use client"

interface SpendingChallengeProps {
  title: string
  description: string
  progress: number
  target: number
  emoji: string
}

export default function SpendingChallenge({
  title,
  description,
  progress,
  target,
  emoji,
}: SpendingChallengeProps) {
  const percentage = (progress / target) * 100

  return (
    <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2 flex-1">
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="font-bold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="text-right ml-2">
          <p className="text-xs font-bold text-primary">
            {progress}/{target}
          </p>
        </div>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage >= 100
              ? 'bg-destructive'
              : percentage >= 75
              ? 'bg-yellow-500'
              : 'bg-primary'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}
