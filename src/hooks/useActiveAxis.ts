import { useState, useEffect } from "react"

const STORAGE_KEY = "activeAxis"
const DEFAULT_ACTIVE_AXIS = ["price", "price-recommended"]

export function useActiveAxis() {
  const [activeAxis, setActiveAxis] = useState<string[]>(DEFAULT_ACTIVE_AXIS)

  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY)
    if (storedValue) {
      try {
        const parsed = JSON.parse(storedValue)
        if (Array.isArray(parsed)) {
          setActiveAxis(parsed)
        }
      } catch (e) {
        console.error("Failed to parse stored activeAxis:", e)
      }
    }
  }, [])

  const updateActiveAxis = (newAxis: string[]) => {
    setActiveAxis(newAxis)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAxis))
  }

  return [activeAxis, updateActiveAxis] as const
}
