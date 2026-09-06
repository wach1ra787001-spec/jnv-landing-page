import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const nextConfig = require("eslint-config-next/core-web-vitals")

export default [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "supabase/functions/**"],
  },
]
