import { timingSafeEqual } from "node:crypto"
import { NextRequest } from "next/server"

export function hasValidCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!secret || !provided) return false
  const expectedBytes = Buffer.from(secret)
  const providedBytes = Buffer.from(provided)
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
}
