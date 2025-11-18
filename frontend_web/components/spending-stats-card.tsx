"use client"

export default function SpendingStatsCard() {
  const spentThisWeek = 3450
  const averageSpentThisWeek = 493

  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary/20 rounded-2xl p-6 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-6">
        {/* Spent This Week */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Spent This Week</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-primary">₹{spentThisWeek.toLocaleString()}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-accent" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Average Spent This Week */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Average Daily</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-secondary">₹{averageSpentThisWeek}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-accent" style={{ width: '45%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
