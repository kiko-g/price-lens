/**
 * Resilience primitives: timeout wrapper and circuit breaker.
 * Used by kv.ts (Redis) and query layers (Supabase) to fail fast
 * when external services are slow or unreachable.
 */

// ============================================================================
// Timeout
// ============================================================================

export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    clearTimeout(timer!)
  }
}

// ============================================================================
// Circuit Breaker
// ============================================================================

export interface CircuitBreakerOptions {
  threshold: number
  cooldownMs: number
  name?: string
}

export class CircuitBreaker {
  private failures = 0
  private openUntil = 0
  private readonly threshold: number
  private readonly cooldownMs: number
  private readonly name: string

  constructor(options: CircuitBreakerOptions) {
    this.threshold = options.threshold
    this.cooldownMs = options.cooldownMs
    this.name = options.name ?? "CircuitBreaker"
  }

  isOpen(): boolean {
    if (this.failures < this.threshold) return false
    if (Date.now() > this.openUntil) {
      this.failures = 0
      return false
    }
    return true
  }

  recordFailure(): void {
    this.failures++
    if (this.failures >= this.threshold) {
      this.openUntil = Date.now() + this.cooldownMs
      console.warn(`[${this.name}] Circuit breaker OPEN — skipping for ${this.cooldownMs / 1000}s`)
    }
  }

  recordSuccess(): void {
    this.failures = 0
  }

  /** Reset state (useful for testing) */
  reset(): void {
    this.failures = 0
    this.openUntil = 0
  }
}
