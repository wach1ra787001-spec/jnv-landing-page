import Link from "next/link"

const stats = [
  ["Discipline Score", "discipline-score"],
  ["Opportunity Capture", "opportunity-capture"],
  ["Appearance Streaks", "appearance-streaks"],
  ["Users RDE", "users-rde"],
]

export default function PersonalStatsPage() {
  return <main className="space-y-6"><div><h1 className="text-2xl font-semibold text-foreground">Personal Stats</h1><p className="mt-1 text-sm text-muted-foreground">Select a statistics view to continue.</p></div><nav className="flex flex-wrap gap-1 border-b border-border" aria-label="Personal stats"><Link href="/dashboard/personal-area/stats/discipline-score" className="rounded-t-md px-4 py-3 text-sm font-medium text-primary">Discipline Score</Link>{stats.slice(1).map(([title, slug]) => <Link key={slug} href={`/dashboard/personal-area/stats/${slug}`} className="rounded-t-md px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">{title}</Link>)}</nav><section className="rounded-lg border border-border/60 bg-card p-8"><h2 className="text-lg font-semibold text-foreground">Personal Stats</h2><p className="mt-2 text-sm text-muted-foreground">These statistics will be available here soon.</p></section></main>
}
