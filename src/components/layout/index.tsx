export function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex w-full flex-col">{children}</div>
}
