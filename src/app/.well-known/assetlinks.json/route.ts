import { NextResponse } from "next/server"

/**
 * Digital Asset Links for Android Trusted Web Activity (Play Store).
 * Set ANDROID_PACKAGE_NAME and ANDROID_SIGNING_SHA256 in Vercel env vars.
 * Use comma-separated SHA-256 fingerprints (upload key + Play App Signing key).
 *
 * @see https://developer.chrome.com/docs/android/trusted-web-activity/quick-start
 */
export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME ?? "pt.pricelens.app"
  const fingerprintsRaw = process.env.ANDROID_SIGNING_SHA256

  if (!fingerprintsRaw?.trim()) {
    return NextResponse.json([], {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    })
  }

  const fingerprints = fingerprintsRaw
    .split(",")
    .map((f) => f.trim().replace(/:/g, "").toUpperCase())
    .filter(Boolean)

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: packageName,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ]

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
