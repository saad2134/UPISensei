"use client"

interface TransactionProps {
  transaction: {
    id: number
    type: 'sent' | 'received'
    name: string
    emoji: string
    amount: number
    time: string
    category: string
  }
}

export default function TransactionCard({ transaction }: TransactionProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-colors animate-slide-in">
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-2xl">
          {transaction.emoji}
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="font-bold text-sm text-foreground">{transaction.name}</p>
          <p className="text-xs text-muted-foreground">{transaction.category}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{transaction.time}</p>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right">
        <p
          className={`font-black text-lg ${
            transaction.type === 'sent'
              ? 'text-foreground'
              : 'text-secondary'
          }`}
        >
          {transaction.type === 'sent' ? '-' : '+'}₹{transaction.amount}
        </p>
        <p className="text-xs font-semibold text-muted-foreground">
          {transaction.type === 'sent' ? 'Spent' : 'Received'}
        </p>
      </div>
    </div>
  )
}
