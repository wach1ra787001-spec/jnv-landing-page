import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import Link from "next/link"

export function AICoachingCard() {
  return (
    <Card className="border border-border bg-card">
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">AI Trading Coach</h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                You are over-leveraging on Fridays. Consider reducing position sizes at the end of the week. 
                Your win rate drops by 23% on Friday afternoon trades.
              </p>
            </div>
          </div>
          <Button 
            asChild
            className="shrink-0 bg-foreground text-background hover:bg-foreground/90 dark:bg-card-foreground dark:text-card dark:hover:bg-card-foreground/90 active:scale-[0.98] transition-transform"
          >
            <Link href="/dashboard/coach">
              Analyze My Trades
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
