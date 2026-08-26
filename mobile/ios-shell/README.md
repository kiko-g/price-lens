# iOS — Capacitor shell (App Store)

Loads the production Price Lens site in a native shell. Same UI as the website; native plugins satisfy App Store Guideline 4.2.

## Setup

```bash
cd mobile/ios-shell
pnpm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Set a custom server URL for local testing:

```bash
CAPACITOR_SERVER_URL=http://192.168.x.x:3000 npx cap sync ios
```

## Before App Store submit

### 1. Google Sign-In (required)

Google blocks OAuth inside WKWebView. The web app uses `src/lib/native-auth.ts` to open auth in the system browser when `Capacitor.isNativePlatform()` is true.

Wire login to call `openExternalAuthUrl()` instead of the server-action redirect when on native. Register URL scheme / universal links for `auth/callback`.

Plugins: `@capacitor/browser` (already in `package.json`).

### 2. Barcode scanner (required for 4.2)

Replace in-aisle `getUserMedia` with a native scanner plugin, e.g.:

- `@capacitor-mlkit/barcode-scanning`, or
- `@capacitor-community/barcode-scanner`

Bridge scan results back to `/products/barcode/[code]`.

### 3. Push notifications (recommended)

Price alerts already exist server-side. Register APNs in Capacitor:

- `@capacitor/push-notifications`
- Store device tokens in Supabase (new table or profile column)
- Extend alert worker to send APNs in addition to email

### 4. Face ID (recommended)

Use `@capgo/capacitor-native-biometric` or similar to lock app resume — cheap 4.2 signal.

### 5. Info.plist strings (Portuguese)

```xml
<key>NSCameraUsageDescription</key>
<string>O Price Lens precisa da câmara para ler códigos de barras nos produtos.</string>
```

Add in Xcode → Target → Info.

### 6. App Store Connect

- **Privacy policy:** `https://price-lens.vercel.app/privacy`
- **Review notes:** list native camera scan, push alerts, Face ID, offline page
- **Screenshots:** iPhone 6.7" and 6.1" required

## Build & archive

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select **Any iOS Device (arm64)**
3. Product → Archive → Distribute App → App Store Connect

## Updates

With `server.url` pointing at production, most UI changes ship via Vercel without an App Store release.

Submit a new build when changing native plugins, `Info.plist`, or Capacitor config.

## Guideline 4.2

Apple rejects apps that are “just a website.” This shell must demonstrate:

- Native barcode scanning (in-aisle use case)
- Push notifications for price drops
- System browser OAuth (not embedded Google login)
- Graceful offline (`/offline` via service worker)

Document these in review notes with screenshot of each.
