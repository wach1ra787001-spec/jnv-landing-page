import { 
  BookOpen, 
  LineChart, 
  Brain, 
  Target, 
  Camera, 
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    title: 'Smart Trade Journal',
    description: 'Log every trade with rich annotations, emotional tags, and strategy markers. Automatic MT5 sync keeps your data complete.',
  },
  {
    icon: LineChart,
    title: 'Performance Analytics',
    description: 'Deep-dive into 50+ metrics including win rate, profit factor, expectancy, and risk-adjusted returns across any timeframe.',
  },
  {
    icon: Brain,
    title: 'AI Behavioral Coach',
    description: 'Get personalized insights on your trading psychology. Identify patterns, biases, and receive actionable improvement plans.',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Set and track daily, weekly, and monthly goals. Monitor progress with visual dashboards and achievement streaks.',
  },
  {
    icon: Camera,
    title: 'Chart Screenshots',
    description: 'Capture and annotate chart setups directly in your journal. Build a visual library of your best and worst trades.',
  },
  {
    icon: Zap,
    title: 'Real-Time Sync',
    description: 'Automatic synchronization with MT5 platform. Your trades appear instantly with full execution details.',
  },
  {
    icon: TrendingUp,
    title: 'Equity Curves',
    description: 'Visualize your account growth with detailed equity curves, drawdown analysis, and benchmark comparisons.',
  },
  {
    icon: Shield,
    title: 'Risk Management',
    description: 'Track position sizing, risk per trade, and maximum drawdown. Get alerts when you exceed your risk parameters.',
  },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 px-6 py-24 lg:px-8 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Trade Better
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Professional-grade tools that institutional traders use, now accessible to everyone serious about their edge.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/50 hover:bg-card"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
