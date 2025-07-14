"use client"

import { signOut } from "@/app/login/actions"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { MailIcon, ArrowLeftIcon } from "lucide-react"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading } = useUser()

  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  if (!user) {
    router.push("/login")
    return null
  }

  function getVerifiedIcon() {
    const provider = user?.app_metadata?.provider

    switch (provider) {
      case "google":
        return <GoogleIcon />
      default:
        return <MailIcon className="h-4 w-4" />
    }
  }

  const avatarUrl = user.user_metadata?.avatar_url?.replace(/=s96-c/, "=s400-c")
  const verifiedIcon = getVerifiedIcon()
  const username = user.user_metadata?.full_name || "User"
  const userInitial = user.email ? user.email[0].toUpperCase() : "U"
  const accountCreatedAt = new Date(user.created_at).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  })

  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
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
        <div className="hidden flex-col items-center md:flex md:w-1/4">
          <Avatar className="mx-auto mb-4 h-40 w-40">
            <AvatarImage src={avatarUrl} alt={user.user_metadata?.full_name || "User avatar"} />
            <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
          </Avatar>

          <p className="mb-0 text-xl font-bold transition-opacity duration-200">{username}</p>
          <div className="mb-1 flex items-center gap-1">
            {verifiedIcon}
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            {profile?.plan && (
              <Badge variant="default" roundedness="sm" className="capitalize">
                {profile.plan}
              </Badge>
            )}
            {profile?.role && (
              <Badge variant="outline" roundedness="sm" className="capitalize">
                {profile.role}
              </Badge>
            )}
          </div>
        </div>

        {/* Tabs Column */}
        <div className="md:w-3/4 md:pl-12">
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="contact-us">Contact Us</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <p>Member since {accountCreatedAt}</p>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function ProfilePageSkeleton() {
  const router = useRouter()
  return (
    <div className="container mx-auto max-w-6xl space-y-6 p-6">
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
        <div className="hidden flex-col items-center md:flex md:w-1/4">
          <Skeleton className="mx-auto mb-4 h-40 w-40 rounded-full" />

          <Skeleton className="mb-2 h-6 w-3/4" />
          <Skeleton className="mb-4 h-4 w-full" />

          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>

          <Skeleton className="mt-2 h-4 w-1/2" />
        </div>

        {/* Tabs Column */}
        <div className="md:w-3/4 md:pl-12">
          <div className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-muted p-1">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="mt-4 rounded-md border">
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
