---
name: mobile-and-pwa-verification
description: >-
  Verify mobile- and PWA-sensitive UI before shipping. Use when changing
  modals, fixed navigation, full-viewport layouts, camera, barcode scan,
  inputs that open the keyboard, or installable PWA behavior.
---

# Mobile & PWA verification (Price Lens)

## When to use

Apply this workflow when touching:

- Modals, bottom sheets, or overlays (`Dialog`, fixed layers)
- Camera / `getUserMedia` / barcode scanning
- Fixed bottom navigation or safe-area insets
- Anything that uses `100vh`, full-screen height, or `visualViewport`

## What desktop emulation misses

Responsive width in DevTools does not replicate: virtual keyboard, `visualViewport` vs layout viewport, iOS Safari vs Chrome, standalone PWA, or touch scrolling.

## Minimum verification

1. **HTTPS preview** (e.g. Vercel preview URL) on a **real phone** — especially for camera and PWA.
2. **Two engines**: **Mobile Safari (iOS)** and **Chrome (Android)** if possible.
3. **Keyboard path**: focus inputs, confirm no broken layout or stray visible page behind modals.

## Quick checklist

- [ ] Dialog/sheet behaves with **keyboard up** (no huge layout jump / odd gaps)
- [ ] Fixed bottom UI clears **home indicator** (safe area)
- [ ] Barcode / camera tested on device over **HTTPS**
- [ ] PWA: open from **Add to Home Screen** once if the change affects standalone mode

## Codebase hints

- Barcode scanner: `src/components/scan/BarcodeScanButton.tsx`
- Dialog + optional `overlayVisualViewportSync`: `src/components/ui/dialog.tsx`
- Project rules: `.cursor/rules/mobile-pwa-ux.mdc`, `.cursor/rules/product-context.mdc`
