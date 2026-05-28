"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'

export default function InsightsCategoryDetails() {
  const [expenditureData] = useState([
    { name: 'Food & Dining', value: 4500, percentage: 35, color: '#FF006E' },
    { name: 'Electricity & Bills', value: 1800, percentage: 14, color: '#FFB703' },
    { name: 'Transport', value: 2200, percentage: 17, color: '#00D9FF' },
    { name: 'Entertainment', value: 2000, percentage: 15, color: '#8338EC' },
    { name: 'Shopping & Others', value: 2500, percentage: 19, color: '#FFBE0B' },
  ])

  const [hoveredIndex, setHoveredIndex] = useState(null)

  return (
    <div className="space-y-4 mt-6">
      <h3 className="font-bold text-foreground text-sm">Category Details</h3>
      {expenditureData.map((category, index) => (
        <Card
          key={index}
          className="p-4 border-l-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer animate-slide-in bg-gradient-to-r hover:from-card/80 hover:to-card"
          style={{ borderLeftColor: category.color }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-bold text-foreground text-sm">{category.name}</p>
              <p className="text-xs text-muted-foreground">
                {category.percentage}% of total spending
              </p>
            </div>
            <div className="text-right">
              <p className="font-black transition-colors duration-300" style={{ color: category.color }}>
                ₹{category.value.toLocaleString()}
              </p>
              <div className="w-24 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full transition-all duration-700 ease-out"
                  style={{ 
                    width: `${category.percentage}%`,
                    background: `linear-gradient(90deg, ${category.color}, ${category.color}dd)`,
                    boxShadow: hoveredIndex === index ? `0 0 8px ${category.color}` : 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Smart Insight Card */}
      <Card className="p-4 animate-slide-in border-primary/30 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 hover:from-primary/10 hover:via-accent/10 hover:to-secondary/10 transition-all duration-300">
        <p className="text-sm font-bold text-foreground mb-2">💡 Smart Insight</p>
        <p className="text-sm text-foreground leading-relaxed">
          Your food spending is 35% of your budget. Consider cooking at home to save ₹1000+ monthly. You're doing great with transport though!
        </p>
      </Card>
    </div>
  )
}
