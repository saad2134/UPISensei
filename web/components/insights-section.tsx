"use client"

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function InsightsSection() {
  
  const [expenditureData] = useState([
    { name: 'Food & Dining', value: 4500, percentage: 35, color: '#FF006E' },
    { name: 'Electricity & Bills', value: 1800, percentage: 14, color: '#FFB703' },
    { name: 'Transport', value: 2200, percentage: 17, color: '#00D9FF' },
    { name: 'Entertainment', value: 2000, percentage: 15, color: '#8338EC' },
    { name: 'Shopping & Others', value: 2500, percentage: 19, color: '#FFBE0B' },
  ])

  const [merchantData] = useState([
    { name: 'Swiggy', transactions: 21, amount: 3200, avatar: '🍕', color: '#FF006E' },
    { name: 'Starbucks', transactions: 15, amount: 2400, avatar: '☕', color: '#00D9FF' },
    { name: 'Uber', transactions: 12, amount: 1800, avatar: '🚗', color: '#8338EC' },
  ])

  const [goalsData] = useState([
    { id: 1, name: 'Goa Trip Fund', icon: '✈️', current: 12500, target: 50000, percentage: 25 },
    { id: 2, name: 'Concert Tickets', icon: '🎵', current: 6000, target: 8000, percentage: 75 },
  ])

  const [badgesData] = useState([
    { name: 'Impulse Ignorer', description: 'Avoided 5 impulse buys', color: '#00D9FF' },
    { name: 'Goal Getter', description: 'Hit a savings goal', color: '#8338EC' },
    { name: 'Subscription Slayer', description: 'Cancel an unused sub', color: '#FFBE0B', locked: true },
    { name: 'Budget Boss', description: 'Stay under budget', color: '#FF006E', locked: true },
  ])

  const [leaderboard] = useState([
    { rank: 1, name: 'You', points: 1250, avatar: '👤', isUser: true },
    { rank: 2, name: 'Aarav', points: 1180, avatar: '👤' },
    { rank: 3, name: 'Priya', points: 950, avatar: '👤' },
  ])

  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [hoveredMerchant, setHoveredMerchant] = useState(null)
  const [expandedGoal, setExpandedGoal] = useState(null)
  
  const totalExpenditure = expenditureData.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-primary/40 rounded-lg p-3 shadow-lg animate-pulse-glow">
          <p className="font-bold text-foreground text-sm">{data.name}</p>
          <p className="text-primary font-black text-sm">₹{data.value.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{data.percentage}% of total</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8 mt-6">
      <div className="flex items-start justify-between gap-8">
        <div>
          <h1 className="font-black text-4xl text-foreground mb-2">Sensei's Insights</h1>
          <p className="text-sm text-muted-foreground">Discover spending patterns and unlock achievements</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-muted-foreground">Your personalized</p>
          <p className="text-sm font-semibold text-muted-foreground">financial cheat codes</p>
        </div>
      </div>

      {/* Two Column Layout: Insights Cards + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Spending Hotspot & Recurring Patterns */}
        <div className="space-y-4">
          {/* Spending Hotspot Card */}
          <Card className="p-6 animate-slide-in hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/95 border-l-4 border-primary">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <span className="text-xl">📍</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wide">Spending Hotspot</p>
                <p className="text-lg font-black text-foreground">Snacks cost you ₹2,400 last month</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">That's 8% of your total spend! Cutting back could seriously boost your savings.</p>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">Sensei's Suggestion:</p>
              <p className="text-sm text-foreground">Try setting a weekly snack limit. Small change, big win!</p>
            </div>
          </Card>

          {/* Repeating Patterns Card */}
          <Card className="p-6 animate-slide-in hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/95 border-l-4 border-accent">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <span className="text-xl">🔄</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-accent uppercase tracking-wide">Repeating Patterns</p>
                <p className="text-lg font-black text-foreground">4 Active Subscriptions</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">You're spending ₹1,250/month on recurring charges. Are you using all of them?</p>
            <div className="flex gap-3">
              <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Review Subs</Button>
              <Button variant="outline" className="flex-1">Ignore</Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Your Goals */}
        <Card className="p-6 animate-slide-in hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/95">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-foreground">Your Goals</h3>
            <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Manage Goals</a>
          </div>

          <div className="space-y-5">
            {goalsData.map((goal, index) => (
              <div key={goal.id} className="space-y-2 cursor-pointer" onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{goal.name}</p>
                      <p className="text-xs text-muted-foreground">₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary">{goal.percentage}%</p>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full transition-all duration-500 hover:shadow-lg hover:shadow-primary/40"
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Meme Badges Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground">Meme Badges Unlocked</h3>
          <a href="#" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">View All</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badgesData.map((badge, index) => (
            <Card
              key={index}
              className={`p-4 text-center animate-slide-in transition-all duration-300 cursor-pointer hover:scale-105 ${
                badge.locked ? 'opacity-40 grayscale' : 'hover:shadow-lg'
              } bg-gradient-to-br from-card to-card/95`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl transition-all duration-300 ${
                  badge.locked ? 'bg-muted/40' : ''
                }`}
                style={{ backgroundColor: badge.locked ? undefined : `${badge.color}20`, border: `2px solid ${badge.color}` }}
              >
                {badge.locked ? '🔒' : '✨'}
              </div>
              <p className="font-bold text-sm text-foreground mb-1">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Weekly Leaderboard */}
      <Card className="p-6 animate-slide-in hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-card to-card/95">
        <h3 className="text-lg font-black text-foreground mb-4">Weekly Leaderboard</h3>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl flex items-center justify-between transition-all duration-300 ${
                entry.isUser
                  ? 'bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary scale-105'
                  : 'bg-muted/40 hover:bg-muted/60'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="font-black text-lg text-primary w-6">{entry.rank}</span>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg">{entry.avatar}</span>
                </div>
                <p className={`font-semibold ${entry.isUser ? 'text-primary' : 'text-foreground'}`}>{entry.name}</p>
              </div>
              <p className="font-black text-lg text-primary">{entry.points} pts</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
