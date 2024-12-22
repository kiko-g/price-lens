"use client"

import React from "react"

export function ReactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-10.5 -9.45 21 18.9" fill="#149eca" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="0" cy="0" r="2" fill="#149eca"></circle>
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="10" ry="4.5"></ellipse>
        <ellipse rx="10" ry="4.5" transform="rotate(60)"></ellipse>
        <ellipse rx="10" ry="4.5" transform="rotate(120)"></ellipse>
      </g>
    </svg>
  )
}
