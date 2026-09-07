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
        <linearGradient id="jnv-mark-gradient" x1="29" y1="82" x2="80" y2="15" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A1F44" />
          <stop offset="0.46" stopColor="#155BC4" />
          <stop offset="1" stopColor="#3B8DFF" />
        </linearGradient>
      </defs>
      <path
        d="M25 81C39 83 46 70 50 52C54 33 63 18 78 15C80 15 81 15 82 15"
        stroke="url(#jnv-mark-gradient)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 17C41 17 62 17 82 15M43 56C53 50 65 45 78 42"
        stroke="url(#jnv-mark-gradient)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
