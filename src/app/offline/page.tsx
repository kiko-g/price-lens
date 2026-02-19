import { WifiOffIcon } from "lucide-react"

export const metadata = {
  title: "Offline",
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <WifiOffIcon className="text-muted-foreground h-16 w-16" />
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="text-muted-foreground max-w-sm">
        Price Lens needs an internet connection to show the latest prices. Please check your connection and try again.
      </p>
    </main>
  )
}
