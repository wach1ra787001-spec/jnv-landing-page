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
        <linearGradient id="jnv-mark-gradient" x1="15" y1="82" x2="86" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0A1F44" />
          <stop offset="1" stopColor="#2F80ED" />
        </linearGradient>
      </defs>
      <path
        fill="url(#jnv-mark-gradient)"
        d="M24 83c-5.2 0-9.4-4.2-9.4-9.4V27.2C14.6 16.1 23.7 7 34.8 7h43.8c5.2 0 9.4 4.2 9.4 9.4s-4.2 9.4-9.4 9.4H36.2v13.1h30.1c5.2 0 9.4 4.2 9.4 9.4s-4.2 9.4-9.4 9.4H36.2v15.9c0 5.2-4.2 9.4-9.4 9.4H24Z"
      />
      <path
        fill="url(#jnv-mark-gradient)"
        d="M52.2 53.2h15.1l15.1 21.4c3 4.2 2 10-2.2 13-4.2 3-10 2-13-2.2L52.2 64.1V53.2Z"
      />
    </svg>
  )
}
