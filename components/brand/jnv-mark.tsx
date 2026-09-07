"use client"

import { cn } from "@/lib/utils"

interface JnvMarkProps {
  className?: string
  title?: string
}

export function JnvMark({ className, title = "JnV Journal" }: JnvMarkProps) {
  const titleId = title ? "jnv-mark-title" : undefined

  return (
    <svg
      className={cn("h-8 w-8 shrink-0", className)}
      viewBox="0 0 100 100"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-labelledby={titleId}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title id={titleId}>{title}</title> : null}
      <defs>
        <linearGradient id="jnv-mark-gradient" x1="27" y1="84" x2="76" y2="14" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A1F44" />
          <stop offset="0.52" stopColor="#155BC4" />
          <stop offset="1" stopColor="#2F80ED" />
        </linearGradient>
      </defs>
      <path
        d="M25 81C43 82 46 64 50 48C54 31 64 18 77 15C79 15 81 15 82 15"
        stroke="url(#jnv-mark-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 17C43 17 61 16 82 15M43 56C54 49 65 45 78 42"
        stroke="url(#jnv-mark-gradient)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
