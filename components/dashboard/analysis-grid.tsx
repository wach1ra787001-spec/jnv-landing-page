import { Database } from "@/types/supabase"

type Trade = Database['public']['Tables']['trades']['Row']

interface AnalysisGridProps {
  userId: string
  currency: string
  trades: Trade[]
}

export function AnalysisGrid({ userId, currency, trades }: AnalysisGridProps) {
  return null
}
