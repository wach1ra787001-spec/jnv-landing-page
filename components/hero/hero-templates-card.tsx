import { mockTemplatesData } from '@/lib/mock/templates-data'

export function HeroTemplatesCard() {
  const template = mockTemplatesData[0]

  return (
    <div className="w-full h-full p-4 bg-gradient-to-br from-background to-background/95 flex flex-col overflow-hidden">
      {/* Header */}
      <h3 className="text-sm font-bold text-foreground mb-3">Trading Templates</h3>

      {/* Template Card */}
      <div className="flex-1 border border-border rounded-lg p-3 bg-white/50 backdrop-blur-sm">
        {/* Avatar & Title */}
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {template.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate">{template.title}</h4>
            <p className="text-xs text-muted-foreground">by {template.author}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center mb-3">
          <div>
            <p className="text-xs font-medium text-foreground">{template.winRate}%</p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{template.trades}</p>
            <p className="text-xs text-muted-foreground">Trades</p>
          </div>
          <div>
            <p className="text-xs font-medium text-green-600">${template.pnl}k</p>
            <p className="text-xs text-muted-foreground">P&L</p>
          </div>
          <div>
            <p className="text-xs font-medium text-foreground">{template.month}</p>
            <p className="text-xs text-muted-foreground">Month</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap">
          {template.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
