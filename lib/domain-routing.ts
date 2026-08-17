const MARKETING_HOST = "jnvtradingjournal.com"
const APP_HOST = "app.jnvtradingjournal.com"
const APP_ORIGIN = `https://${APP_HOST}`

export function isProductionDomainHost(hostname: string) {
  return hostname === MARKETING_HOST || hostname === `www.${MARKETING_HOST}` || hostname === APP_HOST
}

export function isAppHost(hostname: string) {
  return hostname === APP_HOST
}

export function getAppOrigin(hostname?: string) {
  if (hostname && isProductionDomainHost(hostname)) return APP_ORIGIN
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
}

export function getAuthCookieOptions(hostname?: string) {
  return hostname && isProductionDomainHost(hostname)
    ? { domain: `.${MARKETING_HOST}`, path: "/", sameSite: "lax" as const, secure: true }
    : { path: "/", sameSite: "lax" as const, secure: false }
}

export function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard"
  return value
}

export { APP_HOST, APP_ORIGIN, MARKETING_HOST }
