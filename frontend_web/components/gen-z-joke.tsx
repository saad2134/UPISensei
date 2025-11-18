"use client"

const jokes = [
  "Your food spending is quite high! That's a whole semester of education right there.",
  "Spent so much on delivery this week? You could have cooked a month's worth of meals!",
  "Your electricity bill is surprising. Time to check if you left something on?",
  "Spending money like there's no tomorrow while tomorrow still needs money!",
  "Your budget looks good on paper. Reality? That's a different story entirely.",
  "Saving tip: If you can't see the price tag, you probably don't need it!",
]

export default function GenZJoke() {
  const dayOfWeek = new Date().getDay()
  const randomJoke = jokes[dayOfWeek % jokes.length]

  return (
    <div className="bg-gradient-to-r from-primary/15 via-accent/15 to-secondary/15 border-2 border-primary/40 rounded-2xl p-6 hover:shadow-lg hover:from-primary/20 hover:via-accent/20 hover:to-secondary/20 transition-all duration-300">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div>
          <p className="text-xs font-semibold text-primary/80 uppercase tracking-wide mb-2">Financial Insight</p>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            "{randomJoke}"
          </p>
        </div>
      </div>
    </div>
  )
}
