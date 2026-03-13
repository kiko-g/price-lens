export default function RootLoading() {
  return (
    <div
      className="bg-background fixed inset-0 z-9999 flex min-h-svh w-full flex-col items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="flex animate-[fadeInScale_0.6s_ease-out_both] flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/price-lens-64.svg"
          alt=""
          width={64}
          height={64}
          fetchPriority="high"
          loading="eager"
          className="size-16 drop-shadow-[0_0_24px_rgba(99,106,215,0.4)]"
        />
        <span className="text-foreground text-lg font-bold tracking-tight">Price Lens</span>
      </div>

      <div className="absolute bottom-16 flex items-center gap-1.5">
        <div className="bg-foreground/30 size-1.5 animate-[dotPulse_1.4s_ease-in-out_infinite] rounded-full" />
        <div className="bg-foreground/30 size-1.5 animate-[dotPulse_1.4s_ease-in-out_0.2s_infinite] rounded-full" />
        <div className="bg-foreground/30 size-1.5 animate-[dotPulse_1.4s_ease-in-out_0.4s_infinite] rounded-full" />
      </div>
    </div>
  )
}
