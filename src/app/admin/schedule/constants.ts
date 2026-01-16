export const PRIORITY_CONFIG: Record<number, { name: string; color: string; bgColor: string }> = {
  5: { name: "Premium", color: "text-purple-500", bgColor: "bg-purple-500" },
  4: { name: "High", color: "text-blue-500", bgColor: "bg-blue-500" },
  3: { name: "Medium", color: "text-emerald-500", bgColor: "bg-emerald-500" },
  2: { name: "Low", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  1: { name: "Minimal", color: "text-orange-500", bgColor: "bg-orange-500" },
  0: { name: "None", color: "text-gray-500", bgColor: "bg-gray-500" },
}

export function formatThreshold(hours: number | null): string {
  if (hours === null) return "—"
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return days === 1 ? "1 day" : `${days} days`
}
