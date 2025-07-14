"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { signOut } from "@/app/login/actions"
import { CalendarDays, Mail, Shield, Clock, User, ArrowLeftIcon } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading } = useUser()

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const userInitial = user.email ? user.email[0].toUpperCase() : "U"
  const createdAt = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const lastSignIn = user.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Never"

  return (
    <div className="container mx-auto max-w-5xl space-y-6 p-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between pb-8">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeftIcon className="h-4 w-4" />
            Back to core
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col gap-4 md:flex-row">
        {/* Profile Card Column */}
        <div className="hidden space-y-8 md:block md:w-1/4">
          <Avatar className="h-40 w-40">
            <AvatarImage
              src={user.user_metadata?.avatar_url || "/placeholder.svg"}
              alt={user.user_metadata?.full_name || "User avatar"}
            />
            <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
          </Avatar>
        </div>

        {/* Tabs Column */}
        <div className="md:w-3/4 md:pl-12">
          <Tabs defaultValue="account">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="contact-us">Contact Us</TabsTrigger>
            </TabsList>
            <TabsContent value="account"></TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{user.user_metadata?.full_name || "User"}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                    {user.email_confirmed_at ? "Verified" : "Unverified"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Separator />

            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                Account Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    Member Since
                  </div>
                  <p className="font-medium">{createdAt}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last Sign In
                  </div>
                  <p className="font-medium">{lastSignIn}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Authentication Info */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Shield className="h-5 w-5" />
                Authentication
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">User ID</div>
                  <p className="rounded bg-muted p-2 font-mono text-sm">{user.id}</p>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Provider</div>
                  <p className="font-medium capitalize">{user.app_metadata?.provider || "Email"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={signOut}>
              <Button variant="destructive" className="w-full">
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info Card */}
      {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Metadata</CardTitle>
            <CardDescription>Additional information from your authentication provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {Object.entries(user.user_metadata).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-sm text-muted-foreground">
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
