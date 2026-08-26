import type { CapacitorConfig } from "@capacitor/cli"

const productionUrl = process.env.CAPACITOR_SERVER_URL ?? "https://price-lens.vercel.app"

const config: CapacitorConfig = {
  appId: "pt.pricelens.app",
  appName: "Price Lens",
  webDir: "www",
  server: {
    url: productionUrl,
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    scheme: "Price Lens",
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#09090b",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#09090b",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
}

export default config
