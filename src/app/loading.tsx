export default function RootLoading() {
  return (
    <div
      className="bg-background flex min-h-svh w-full flex-col items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
    </div>
  )
}
