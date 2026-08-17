export const mockDashboardData = {
  greeting: {
    name: 'USER',
    quote: '"Consistency compounds. Protect capital first."',
    monthlyPerformanceUrl: '/dashboard',
    disciplinedDaysCount: 0,
  },
  kpis: [
    {
      label: 'TOTAL PNL',
      value: '+$0',
      change: '+0%',
      icon: 'TrendingUp',
      color: '#10b981',
    },
    {
      label: 'GROWTH',
      value: '0%',
      change: '+0% vs last month',
      icon: 'BarChart3',
      color: '#3b82f6',
    },
    {
      label: 'CONSISTENCY',
      value: '0%',
      change: 'Win streak tracking',
      icon: 'Target',
      color: '#8b5cf6',
    },
    {
      label: 'WIN RATE',
      value: '0%',
      change: 'Risk: 0%',
      icon: 'Circle',
      color: '#f59e0b',
    },
  ],
}
