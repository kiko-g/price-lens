import { getHomeStats } from "@/lib/queries/home-stats"
import { LoginClient } from "./login-client"

export default async function LoginPage() {
  const stats = await getHomeStats()
  return <LoginClient stats={stats} />
}
