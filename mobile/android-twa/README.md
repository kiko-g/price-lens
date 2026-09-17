# Android — Trusted Web Activity (Play Store)

Packages the live Lince (aka Price Lens) PWA as a Play Store app using Chrome Trusted Web Activity (TWA). No WebView — Chrome renders your site full-screen.

## Current package

|                        |                                                                    |
| ---------------------- | ------------------------------------------------------------------ |
| **Package name**       | `pt.pricelens.app`                                                 |
| **AAB (upload this)**  | `mobile/android-twa/app-release-bundle.aab`                        |
| **Upload-key SHA-256** | `DB8D94D9C423F4B2FDC1C90D4AB91B37EA86FCC0DBEFA26ADAE95A220B456F1A` |

The signing keystore is **gitignored**. Back up both files somewhere safe (password manager + encrypted drive):

- `mobile/android-twa/android.keystore`
- `mobile/android-twa/.keystore-pass`

Losing them means you cannot ship updates until you reset the upload key in Play Console (only possible after Play App Signing is on).

## 1. Deploy Digital Asset Links (required before testers install)

Production currently 404s `/site.webmanifest` and `/.well-known/assetlinks.json` until these files are on `main`.

After deploy, set in Vercel:

```env
ANDROID_PACKAGE_NAME=pt.pricelens.app
ANDROID_SIGNING_SHA256=DB8D94D9C423F4B2FDC1C90D4AB91B37EA86FCC0DBEFA26ADAE95A220B456F1A
```

Fingerprints are SHA-256 **without colons**, uppercase. After the first Play upload, add the **Play App Signing** fingerprint too (comma-separated): Play Console → Setup → App signing → App signing key certificate.

Verify:

```bash
curl -s https://price-lens.vercel.app/site.webmanifest | head
curl -s https://price-lens.vercel.app/.well-known/assetlinks.json
```

If verification fails, the app opens with a Chrome URL bar instead of full-screen TWA.

## 2. Play Console — create the app

1. [Play Console](https://play.google.com/console) → **Create app**
2. Name: **Lince (aka Price Lens)**
3. Default language: **Portuguese (Portugal)**
4. App or game: **App**
5. Free
6. Accept declarations (Play policies, US export)

## 3. Store listing copy (pt-PT)

**Short description** (max 80 characters):

```
Compara preços no Continente, Auchan e Pingo Doce. Poupa no supermercado.
```

**Full description:**

```
O Lince (aka Price Lens) acompanha os preços dos supermercados em Portugal para comprares no momento certo.

• Pesquisa produtos no Continente, Auchan e Pingo Doce
• Vê o histórico de preços e as descidas de hoje
• Lê códigos de barras na loja
• Guarda favoritos e recebe alertas de preço
• Compara o mesmo produto entre cadeias

Tudo o que precisas para gastar menos no supermercado.
```

- **App category:** Shopping
- **Privacy policy:** `https://price-lens.vercel.app/privacy`
- **Hi-res icon:** `public/icons/android-chrome-512x512.png`
- **Feature graphic:** `mobile/android-twa/play-listing/feature-graphic.png` (1024×500)
- **Screenshots:** at least 2 phone screenshots (home, product, scan). Take them on a device after internal testing.

## 4. Upload the AAB

1. Release → **Testing** → **Internal testing** → Create release
2. Upload `mobile/android-twa/app-release-bundle.aab`
3. Add yourself as a tester (email on the Play account)
4. Install from the internal testing link on a physical Android phone
5. Check: Google login, barcode scan, favorites, offline `/offline`

Then complete: content rating questionnaire, target audience, Data safety (no sale of data; camera for barcodes).

Promote to production only after internal testing looks right.

## 5. Rebuild later

```bash
cd mobile/android-twa
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/.bubblewrap/android_sdk"
export BUBBLEWRAP_KEYSTORE_PASSWORD="$(cat .keystore-pass)"
export BUBBLEWRAP_KEY_PASSWORD="$BUBBLEWRAP_KEYSTORE_PASSWORD"
pnpm exec bubblewrap update
pnpm exec bubblewrap build --skipPwaValidation
```

UI and API changes still deploy with `git push` → Vercel. A new AAB is only needed when changing native wrapper config (package name, splash, signing).
