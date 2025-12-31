import { cn } from "@/lib/utils"

export function Code({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <pre
      className={cn("bg-base-100 dark:bg-base-900 overflow-auto rounded p-4 font-mono text-xs text-wrap", className)}
    >
      {children}
    </pre>
  )
}
