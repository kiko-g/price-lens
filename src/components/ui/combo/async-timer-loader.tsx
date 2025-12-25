import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface AsyncTimerLoaderProps {
  isLoading: boolean
  className?: string
}

export const AsyncTimerLoader = ({ isLoading, className }: AsyncTimerLoaderProps) => {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isLoading) return

    setStartTime(Date.now())
    setElapsed(0)

    const interval = setInterval(() => {
      setElapsed(Date.now() - (startTime || Date.now()))
    }, 50)

    return () => clearInterval(interval)
  }, [isLoading, startTime])

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10) // Show 2 digits
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
  }

  if (!isLoading) return null

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </div>
        <div className="font-mono text-xs font-semibold tracking-tight text-zinc-500 dark:text-zinc-400">
          {formatTime(elapsed)}
        </div>
      </div>
    </div>
  )
}
