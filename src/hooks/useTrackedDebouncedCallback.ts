import { useState, useMemo } from "react"
import { useDebouncedCallback } from "use-debounce"

/**
 * Wraps `useDebouncedCallback` with animation-key and completion tracking,
 * useful for showing a progress indicator during the debounce window and
 * bridging the gap between debounce firing and the resulting async work starting.
 */
export function useTrackedDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delayMs: number,
): {
  trigger: ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void }
  animKey: number
  completed: boolean
  setCompleted: (value: boolean) => void
} {
  const [animKey, setAnimKey] = useState(0)
  const [completed, setCompleted] = useState(false)

  const debounced = useDebouncedCallback((...args: Parameters<T>) => {
    setCompleted(true)
    callback(...args)
  }, delayMs)

  const trigger = useMemo(() => {
    const fn = (...args: Parameters<T>) => {
      setAnimKey((k) => k + 1)
      setCompleted(false)
      debounced(...args)
    }
    fn.cancel = () => debounced.cancel()
    fn.flush = () => debounced.flush()
    return fn
  }, [debounced]) as ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void }

  return { trigger, animKey, completed, setCompleted }
}
