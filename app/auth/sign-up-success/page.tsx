import { Suspense } from "react"
import { TrendingUp } from "lucide-react"
import { SignUpSuccessContent } from "@/components/auth/sign-up-success-content"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-foreground">JNV | PRO</span>
        </div>

        <Suspense fallback={<div className="h-80 bg-muted rounded-lg animate-pulse" />}>
          <SignUpSuccessContent />
        </Suspense>
      </div>
    </div>
  )
}
