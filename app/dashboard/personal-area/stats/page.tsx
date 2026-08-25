import Link from "next/link"

const stats = [
  ["Discipline Score", "Measure how consistently you follow your playbook rules.", "discipline-score"],
  ["Opportunity Capture", "Review the opportunities you identify and act on.", "opportunity-capture"],
  ["Appearance Streaks", "Explore your recurring trading patterns and streaks.", "appearance-streaks"],
  ["Users RDE", "Personal RDE insights and performance context.", "users-rde"],
]

export default function PersonalStatsPage() {
  return <main className="space-y-6"><div><h1 className="text-2xl font-semibold text-foreground">Personal Stats</h1><p className="mt-1 text-sm text-muted-foreground">Choose a personal statistics view to explore later.</p></div><div className="grid gap-4 md:grid-cols-2">{stats.map(([title, description, slug]) => <Link key={slug} href={`/dashboard/personal-area/stats/${slug}`} className="rounded-lg border border-border/60 bg-card p-5 transition-colors hover:border-primary/50"><h2 className="font-medium text-foreground">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p></Link>)}</div></main>
}
