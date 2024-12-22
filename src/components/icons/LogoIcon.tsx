'use client'

import React from 'react'

export function LogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g opacity={1.0}>
        <rect
          width={45.255}
          height={45.255}
          x={37.99}
          y={107.632}
          fillOpacity={1.0}
          strokeWidth={2}
          strokeOpacity={0.0}
          rx={10}
          transform="rotate(-45 37.99 107.632)"
          className="fill-zinc-950 stroke-zinc-950 dark:fill-zinc-50 dark:stroke-zinc-50"
        />
      </g>
      <path
        fillOpacity={1.0}
        strokeWidth={2}
        strokeOpacity={0.0}
        d="M45.768 25.99 63.626 8.134a9 9 0 0 1 12.728 0L94.212 25.99a9 9 0 0 1 0 12.727L76.354 56.576a9 9 0 0 1-12.728 0L45.768 38.718a9 9 0 0 1 0-12.728Z"
        opacity={1.0}
        className="fill-zinc-950 stroke-zinc-950 dark:fill-zinc-50 dark:stroke-zinc-50"
      />
      <rect
        width={43.255}
        height={43.255}
        rx={9}
        x={77.043}
        y={69.993}
        fillOpacity={1.0}
        strokeWidth={2}
        strokeOpacity={0.0}
        opacity={1.0}
        transform="rotate(-45 77.043 69.993)"
        className="fill-zinc-950 stroke-zinc-950 dark:fill-zinc-50 dark:stroke-zinc-50"
      />
      <rect
        width={43.255}
        height={43.255}
        x={1.766}
        y={69.993}
        fillOpacity={1.0}
        strokeWidth={2}
        strokeOpacity={0.0}
        opacity={1.0}
        rx={9}
        transform="rotate(-45 1.766 69.993)"
        className="fill-zinc-950 stroke-zinc-950 dark:fill-zinc-50 dark:stroke-zinc-50"
      />
    </svg>
  )
}

export function LogoIconOld(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="16 16 42 42" {...props}>
      <path fill="url(#a)" d="M18.5 36c0-9.941 8.059-18 18-18s18 8.059 18 18-8.059 18-18 18-18-8.059-18-18Z" />
      <g opacity={1.0}>
        <rect
          width={9}
          height={9}
          x={29.929}
          y={43.485}
          fill="#fff"
          fillOpacity={0.5}
          rx={2}
          transform="rotate(-45 29.93 43.485)"
        />
        <rect
          width={8.5}
          height={8.5}
          x={30.283}
          y={43.485}
          stroke="#fff"
          strokeOpacity={1.0}
          strokeWidth={0.5}
          rx={1.75}
          transform="rotate(-45 30.283 43.485)"
        />
      </g>
      <rect
        width={9}
        height={9}
        x={29.929}
        y={28.515}
        fill="#fff"
        opacity={1.0}
        rx={2}
        transform="rotate(-45 29.93 28.515)"
      />
      <rect width={9} height={9} x={37.415} y={36} fill="#fff" opacity={1.0} rx={2} transform="rotate(-45 37.415 36)" />
      <rect width={9} height={9} x={22.444} y={36} fill="#fff" opacity={1.0} rx={2} transform="rotate(-45 22.444 36)" />
      <defs>
        <linearGradient id="a" x1={18.5} x2={54.5} y1={18} y2={54} gradientUnits="userSpaceOnUse">
          <stop offset={0.014} stopColor="#2393f8" />
          <stop offset={1} stopColor="#115ea4" />
        </linearGradient>
      </defs>
    </svg>
  )
}
