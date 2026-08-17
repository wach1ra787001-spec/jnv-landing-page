// Mock data for hero section mockups - production-like sample data

export const heroPreviewData = {
  // Dashboard mockup data
  dashboard: {
    greeting: {
      name: 'Trader',
      quote: '"Consistency compounds. Protect capital first."',
      disciplinedDaysCount: 5,
    },
    kpis: [
      {
        label: 'TOTAL PNL',
        value: '+$2,847.50',
        change: '+12% vs last month',
        icon: 'TrendingUp',
        color: '#10b981',
      },
      {
        label: 'GROWTH',
        value: '+8.2%',
        change: '+2.1% vs last month',
        icon: 'BarChart3',
        color: '#3b82f6',
      },
      {
        label: 'CONSISTENCY',
        value: '78%',
        change: 'Win rate tracking',
        icon: 'Target',
        color: '#8b5cf6',
      },
      {
        label: 'WIN RATE',
        value: '68%',
        change: 'Risk: 1.2%',
        icon: 'AlertCircle',
        color: '#f59e0b',
      },
    ],
    openPositions: [
      {
        id: 1,
        pair: 'EUR/USD',
        type: 'Long',
        entry: 1.0945,
        current: 1.0987,
        pnl: '+$182.50',
        riskStatus: 'safe',
      },
      {
        id: 2,
        pair: 'GBP/JPY',
        type: 'Long',
        entry: 193.45,
        current: 194.20,
        pnl: '+$156.00',
        riskStatus: 'safe',
      },
      {
        id: 3,
        pair: 'AUD/USD',
        type: 'Short',
        entry: 0.6845,
        current: 0.6823,
        pnl: '+$89.75',
        riskStatus: 'caution',
      },
    ],
    notifications: [
      {
        id: 1,
        type: 'rule-breach',
        message: 'Risk exceeded on GBP/JPY - Position size 2.5% (limit: 2%)',
        severity: 'warning',
        timestamp: '2 min ago',
      },
      {
        id: 2,
        type: 'rule-breach',
        message: 'Daily loss limit approaching - Current: -$425 (limit: -$500)',
        severity: 'caution',
        timestamp: '5 min ago',
      },
      {
        id: 3,
        type: 'info',
        message: 'AUD/USD approaching stop loss target',
        severity: 'info',
        timestamp: '12 min ago',
      },
    ],
  },

  // Real-Time Analytics card data
  analytics: {
    title: 'Real-Time Analytics',
    description: 'Live market data & position tracking',
    stats: [
      {
        label: 'Open Positions',
        value: '3',
        change: '+2 today',
        trend: 'up',
      },
      {
        label: 'P&L (Today)',
        value: '$547.20',
        change: '+2.3%',
        trend: 'up',
      },
      {
        label: 'Alerts',
        value: '2',
        change: 'Price targets hit',
        trend: 'neutral',
      },
    ],
    recentActivity: [
      { time: '14:32', event: 'EUR/USD hit TP', pnl: '+$182' },
      { time: '12:45', event: 'GBP/JPY entry signal', pnl: '+$156' },
    ],
  },

  // Trade Journal preview
  tradeJournal: {
    title: 'Trade Journal',
    description: 'Track every trade with detailed notes',
    latestTrades: [
      {
        id: 1,
        pair: 'EUR/USD',
        type: 'Long',
        entry: 1.0945,
        exit: 1.0987,
        pnl: '+$182.50',
        notes: 'Strong support bounce',
        tags: ['breakout', 'support'],
      },
      {
        id: 2,
        pair: 'GBP/JPY',
        type: 'Long',
        entry: 193.45,
        exit: 194.20,
        pnl: '+$156.00',
        notes: 'Momentum continuation',
        tags: ['momentum', 'trend'],
      },
    ],
  },

  // Goals section
  goals: {
    title: 'Trading Goals',
    description: 'Set & track performance targets',
    goals: [
      {
        id: 1,
        name: 'Monthly Profit Target',
        target: '$5,000',
        current: '$2,847.50',
        progress: 57,
        status: 'on-track',
      },
      {
        id: 2,
        name: 'Win Rate Goal',
        target: '70%',
        current: '68%',
        progress: 97,
        status: 'on-track',
      },
      {
        id: 3,
        name: 'Consistency Streak',
        target: '30 days',
        current: '5 days',
        progress: 17,
        status: 'in-progress',
      },
    ],
  },

  // Import strategies section
  importStrategies: [
    { platform: 'Interactive Brokers', strategyCount: 12 },
    { platform: 'MetaTrader 5', strategyCount: 8 },
    { platform: 'TradingView', strategyCount: 15 },
  ],

  // AI Coach section
  aiCoach: {
    insight: 'Your EUR/USD trades show +2.5% better returns when entered on support bounces. Keep focusing on that pattern.',
    stats: [
      { label: 'Avg Trade', value: '+$145.60' },
      { label: 'Best Day', value: 'June 28' },
      { label: 'Improvement', value: '+8.5%' },
      { label: 'Next Session', value: '2:15 PM' },
    ],
  },
};
