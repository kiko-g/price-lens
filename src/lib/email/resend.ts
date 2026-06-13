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

// Default to Resend's shared sender (works on the free tier without a verified
// domain, but can only deliver to the account owner's email). Override with
// RESEND_FROM_EMAIL once a domain is verified.
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Price Lens <onboarding@resend.dev>"
