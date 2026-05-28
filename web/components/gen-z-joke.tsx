"use client"

const insights = [
  "You spent ₹1,850 on food delivery this week, which is 25% over your budget limit. Cooking at home twice more would save you ₹800 next week.",
  "Weekly Chai Tracker: You are at ₹180 of your ₹200 Chai Challenge limit. Choose a smaller cup today to keep your streak alive!",
  "Utility Spends: Your electricity bill is 12% higher than your average. Time to audit standby devices and active appliances.",
  "Micro-transfers: 45% of your transactions are quick Peer-to-Peer UPI payments. Trimming down on small impulse sends can save ₹3,000 this month.",
  "Budget Execution: You've saved 78% of your plan so far this week. Great progress, but keep an eye on weekend spending patterns.",
  "Savings Tip: Setting aside just 10% of every scanned UPI transaction automatically builds a healthy emergency fund over time."
]

export default function GenZJoke() {
  const dayOfWeek = new Date().getDay()
  const randomInsight = insights[dayOfWeek % insights.length]

  return (
    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 border border-primary/20 rounded-xl p-4 transition-all duration-300">
      <div className="flex items-start gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <p className="text-xs font-semibold text-foreground leading-relaxed">
          "{randomInsight}"
        </p>
      </div>
    </div>
  )
}
