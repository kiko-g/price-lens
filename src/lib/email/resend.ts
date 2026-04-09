import { Resend } from "resend"

let resendInstance: Resend | null = null

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error("RESEND_API_KEY is not set")
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Price Lens <alerts@pricelens.app>"
