"use client"

import { useUser } from "@/hooks/useUser"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Clock, AlertCircle, CheckCircle } from "lucide-react"
import { AUTH_CONFIG, formatSessionExpiry } from "@/lib/auth-config"

export function SessionMonitor() {
  const { user, session, getSessionInfo, refreshSession, lastActivity } = useUser()
  const [sessionInfo, setSessionInfo] = useState(getSessionInfo())
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionInfo(getSessionInfo())
    }, 1000) // Update every second

    return () => clearInterval(interval)
  }, [getSessionInfo])

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    const result = await refreshSession()
    console.log("Manual refresh result:", result)
    setIsRefreshing(false)
  }

  const formatLastActivity = () => {
    if (!lastActivity) return "Never"
    const now = Date.now()
    const diff = now - lastActivity
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minutes ago`
  }

  // Only show in development if enabled in config
  if (!AUTH_CONFIG.development.enableSessionMonitor) {
    return null
  }

  return (
    <Card className="mx-auto mb-4 w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Session Monitor (Dev)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={user ? "default" : "secondary"}>{user ? "Authenticated" : "Not Authenticated"}</Badge>
        </div>

        {sessionInfo && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Session Expiry:</span>
              <div className="flex items-center gap-2">
                {sessionInfo.isExpired ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm">{formatSessionExpiry(sessionInfo.expiresAt ?? 0)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Access Token:</span>
              <Badge variant={sessionInfo.accessToken === "Present" ? "default" : "destructive"}>
                {sessionInfo.accessToken}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Refresh Token:</span>
              <Badge variant={sessionInfo.refreshToken === "Present" ? "default" : "destructive"}>
                {sessionInfo.refreshToken}
              </Badge>
            </div>
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Last Activity:</span>
          <span className="text-muted-foreground text-sm">{formatLastActivity()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Refresh Interval:</span>
          <span className="text-muted-foreground text-sm">{AUTH_CONFIG.session.refreshInterval / 60000} minutes</span>
        </div>

        {user && (
          <Button onClick={handleManualRefresh} disabled={isRefreshing} size="sm" className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Manual Refresh"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
