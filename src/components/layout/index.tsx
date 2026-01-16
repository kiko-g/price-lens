export function Layout({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-1 flex-col">{children}</div>
}

export { MainLayout } from "./MainLayout"
