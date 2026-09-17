# Store distribution

Lince (aka Price Lens) ships as one Next.js app on Vercel. Store listings wrap that same deployment — no second UI.

| Platform    | Approach                                                                                                     | Directory                        |
| ----------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **Android** | [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity) (Chrome, full-screen) | [`android-twa/`](./android-twa/) |
| **iOS**     | [Capacitor](https://capacitorjs.com/) shell loading production URL + native plugins                          | [`ios-shell/`](./ios-shell/)     |
| **Desktop** | Website (unchanged)                                                                                          | repo root                        |

## Prerequisites (both stores)

- Privacy policy live at `/privacy`
- Production URL: `https://price-lens.vercel.app` (or your custom domain)
- App icons under `public/icons/`
- PWA manifest: `src/app/site.webmanifest`

## Android (Play Store) — start here

1. Create a [Google Play Console](https://play.google.com/console) account ($25 one-time).
2. Follow [`android-twa/README.md`](./android-twa/README.md) to build an AAB with Bubblewrap.
3. Set Vercel env vars (see `.env.example`):
   - `ANDROID_PACKAGE_NAME` — e.g. `pt.pricelens.app`
   - `ANDROID_SIGNING_SHA256` — upload key + Play App Signing SHA-256 (comma-separated)
4. Verify `https://<your-domain>/.well-known/assetlinks.json` returns your fingerprints.
5. Upload AAB to internal testing, then production.

Deploys to Vercel update the Android app instantly (no store review for UI).

## iOS (App Store)

1. Enroll in [Apple Developer Program](https://developer.apple.com/programs/) (~€99/year).
2. Follow [`ios-shell/README.md`](./ios-shell/README.md) to open the Capacitor project in Xcode.
3. Before submit, confirm:
   - Google Sign-In uses system browser (`src/lib/native-auth.ts` + `@capacitor/browser`)
   - Barcode scan uses native camera plugin (not WKWebView `getUserMedia`)
   - Push notifications wired for price alerts (APNs)
   - Face ID optional lock for returning users
4. In App Store Connect review notes, list native features (camera scan, push, biometrics).

Apple Guideline 4.2 rejects thin website wrappers. The shell must add real device value.

## Web app hygiene (already in repo)

- `src/lib/app-shell.ts` — hides PWA install prompts in standalone / Capacitor
- `src/app/.well-known/assetlinks.json/route.ts` — Digital Asset Links for TWA
- `/admin/` disallowed in `robots.ts`
