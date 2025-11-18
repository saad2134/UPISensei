"use client"

import { useState } from 'react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

export default function WeeklySpendingChart() {
  const data = [
    { name: 'Food 🍕', value: 35, color: '#DC2626' },
    { name: 'Groceries 🛒', value: 25, color: '#059669' },
    { name: 'Transport 🚗', value: 15, color: '#0284C7' },
    { name: 'Bills 📋', value: 15, color: '#D97706' },
    { name: 'Shopping 🛍️', value: 10, color: '#7C3AED' },
  ]

  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-bold text-foreground">{payload[0].name}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].payload.color }}>{payload[0].value}%</p>
        </div>
      )
    }
    return null
  }

  const handleSliceClick = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index)
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold">Monthly Expenditure Breakdown</h3>
        <a href="#" className="text-sm text-primary hover:text-accent transition-colors font-medium">
          View more
        </a>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                onClick={(_, index) => handleSliceClick(index)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full mt-6">
          {data.map((item, index) => (
            <div 
              key={index} 
              onClick={() => handleSliceClick(index)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer group border-2 ${
                activeIndex === index 
                  ? 'bg-primary/10 border-primary/50 shadow-md' 
                  : 'bg-muted/50 border-transparent hover:bg-muted hover:border-primary/30'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" 
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.name}</p>
                <p className="text-xs text-muted-foreground font-bold">{item.value}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
