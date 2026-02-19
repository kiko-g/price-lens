import axios from "axios"

export type ErrorReason = "timeout" | "unavailable" | "network" | "rate_limit" | "unknown"

const ERROR_MESSAGES: Record<ErrorReason, { title: string; message: string }> = {
  timeout: {
    title: "Request timed out",
    message: "The server took too long to respond. It might be under heavy load — try again in a moment.",
  },
  unavailable: {
    title: "Service unavailable",
    message: "The service is temporarily unavailable. This usually resolves on its own — try again shortly.",
  },
  network: {
    title: "Connection failed",
    message: "Couldn't reach the server. Please check your internet connection and try again.",
  },
  rate_limit: {
    title: "Too many requests",
    message: "You're sending requests too quickly. Please wait a moment before trying again.",
  },
  unknown: {
    title: "Something went wrong",
    message: "An unexpected error occurred. Please try again.",
  },
}

export function getErrorReason(error: unknown): ErrorReason {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) return "timeout"
    if (error.code === "ERR_NETWORK" || !error.response) return "network"

    const status = error.response?.status
    if (status === 408 || status === 504) return "timeout"
    if (status === 429) return "rate_limit"
    if (status === 502 || status === 503) return "unavailable"
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (msg.includes("timeout")) return "timeout"
    if (msg.includes("network") || msg.includes("fetch failed")) return "network"
  }

  return "unknown"
}

export function getErrorDisplay(error: unknown): { title: string; message: string } {
  return ERROR_MESSAGES[getErrorReason(error)]
}
