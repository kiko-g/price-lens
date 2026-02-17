import { describe, it, expect, vi, beforeEach } from "vitest"
import { withTimeout, CircuitBreaker } from "@/lib/resilience"

describe("withTimeout", () => {
  it("resolves when promise completes before deadline", async () => {
    const result = await withTimeout(Promise.resolve("ok"), 1000)
    expect(result).toBe("ok")
  })

  it("rejects when promise exceeds deadline", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 5000))
    await expect(withTimeout(slow, 50)).rejects.toThrow("Timeout after 50ms")
  })

  it("propagates the original error if promise rejects before timeout", async () => {
    const failing = Promise.reject(new Error("db down"))
    await expect(withTimeout(failing, 1000)).rejects.toThrow("db down")
  })

  it("clears the timer after resolution (no leaked timers)", async () => {
    const clearSpy = vi.spyOn(global, "clearTimeout")
    await withTimeout(Promise.resolve(1), 1000)
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })
})

describe("CircuitBreaker", () => {
  let cb: CircuitBreaker

  beforeEach(() => {
    cb = new CircuitBreaker({ threshold: 3, cooldownMs: 1000, name: "test" })
  })

  it("starts closed", () => {
    expect(cb.isOpen()).toBe(false)
  })

  it("stays closed below threshold", () => {
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.isOpen()).toBe(false)
  })

  it("opens after reaching threshold", () => {
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.isOpen()).toBe(true)
  })

  it("resets on success", () => {
    cb.recordFailure()
    cb.recordFailure()
    cb.recordSuccess()
    cb.recordFailure()
    cb.recordFailure()
    // only 2 failures since last success — still closed
    expect(cb.isOpen()).toBe(false)
  })

  it("closes again after cooldown expires", async () => {
    const fastCb = new CircuitBreaker({ threshold: 2, cooldownMs: 50, name: "fast" })
    fastCb.recordFailure()
    fastCb.recordFailure()
    expect(fastCb.isOpen()).toBe(true)

    await new Promise((r) => setTimeout(r, 60))
    expect(fastCb.isOpen()).toBe(false)
  })

  it("reset() clears all state", () => {
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(cb.isOpen()).toBe(true)
    cb.reset()
    expect(cb.isOpen()).toBe(false)
  })

  it("logs a warning when circuit opens", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    cb.recordFailure()
    cb.recordFailure()
    cb.recordFailure()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Circuit breaker OPEN"))
    warnSpy.mockRestore()
  })
})
