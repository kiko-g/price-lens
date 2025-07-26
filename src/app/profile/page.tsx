"use client"

import { signOut } from "@/app/login/actions"
import { useUser } from "@/hooks/useUser"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { HeroGridPattern } from "@/components/home/HeroGridPattern"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { ArrowLeftIcon, BellIcon, BugIcon, ChartNetworkIcon, MailIcon, PlusIcon, ShoppingBagIcon } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const { user, profile, isLoading } = useUser()

  if (!isLoading && !user) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <HeroGridPattern
        variant="grid"
        className="mask-[linear-gradient(to_top_left,rgba(255,255,255,0.4))]"
        width={16}
        height={16}
      />
      <div className="container mx-auto max-w-6xl space-y-6 p-6">
        <HeaderActions />

        {/* Content */}
        {isLoading ? <ProfileContentSkeleton /> : <ProfileContent user={user!} profile={profile} />}
      </div>
    </div>
  )
}

function HeaderActions() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between pb-8">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4" />
          Back to core
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="outline" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

function ProfileContent({ user, profile }: { user: any; profile: any }) {
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

  const upgradeNow = [
    {
      title: "Full price history",
      description: (
        <p className="text-muted-foreground text-sm">
          No more 14-day limit and access to unlimited custom product tracking
        </p>
      ),
      icon: <ChartNetworkIcon className="h-4 w-4" />,
    },
    {
      title: "Price alerts",
      description: (
        <p className="text-muted-foreground text-sm">
          Get notified of price changes and save money. Get breakdowns of evolutions of price points and campaigns.
        </p>
      ),
      icon: <BellIcon className="h-4 w-4" />,
    },
    {
      title: "Shopping list optimizer",
      description: (
        <p className="text-muted-foreground text-sm">
          Optimize your shopping list across different supermarket sources. Get the best deals and save time.
        </p>
      ),
      icon: <ShoppingBagIcon className="h-4 w-4" />,
    },
  ]

  const contactUs = [
    {
      title: "Questions?",
      description: (
        <p className="text-muted-foreground text-sm">
          Email PriceLens developer directly at{" "}
          <span className="text-primary group-hover:underline">kikojpgoncalves@gmail.com</span>
        </p>
      ),
      icon: <MailIcon className="h-4 w-4" />,
      link: "mailto:kikojpgoncalves@gmail.com",
    },
    {
      title: "Found a bug?",
      description: <p className="text-muted-foreground text-sm">UI glitches or formatting issues? Report them here!</p>,
      icon: <BugIcon className="h-4 w-4" />,
      link: "https://github.com/kikogoncalves/pricelens/issues",
    },
    {
      title: "Feature request?",
      description: (
        <p className="text-muted-foreground text-sm">
          We&apos;re always looking for new ideas! Let us know what you&apos;d like to see.
        </p>
      ),
      icon: <PlusIcon className="h-4 w-4" />,
      link: "https://github.com/kikogoncalves/pricelens/issues",
    },
  ]

  return (
    <div className="flex grow flex-col gap-4 md:flex-row">
      {/* Profile Card Column */}
      <div className="hidden flex-col items-center md:flex md:w-1/4">
        <Avatar className="mx-auto mb-4 h-40 w-40">
          <AvatarImage src={avatarUrl} alt={user.user_metadata?.full_name || "User avatar"} />
          <AvatarFallback className="text-2xl">{userInitial}</AvatarFallback>
        </Avatar>

        <p className="mb-0 text-xl font-bold transition-opacity duration-200">{username}</p>

        <Badge variant="default" size="xs" className="mb-2 flex items-center gap-1">
          {verifiedIcon}
          <span className="text-2xs">{user.email}</span>
        </Badge>

        <div className="flex items-center gap-2">
          {profile?.plan && (
            <Badge variant="primary" roundedness="sm" className="capitalize">
              {profile.plan}
            </Badge>
          )}
          {profile?.role && (
            <Badge variant="secondary" roundedness="sm" className="capitalize">
              {profile.role}
            </Badge>
          )}
        </div>

        <p className="text-2xs text-muted-foreground mx-auto mt-2 border-t pt-2 text-center">
          Member since {accountCreatedAt}
        </p>
      </div>

      {/* Tabs Column */}
      <div className="md:w-3/4 md:pl-12">
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
            <TabsTrigger value="contact-us">Contact Us</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mb-8">
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-center text-2xl font-bold md:text-left">Upgrade to Plus</h2>
              <div className="mt-2 flex flex-col items-center justify-center text-right md:mt-0 md:flex-row md:items-end md:justify-center md:text-right">
                <div className="text-xl font-bold md:text-3xl">
                  $5
                  <span className="text-muted-foreground text-base font-semibold">/month</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {upgradeNow.map((item) => (
                <Card key={item.title}>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="flex items-center gap-1 text-base font-semibold">
                      {item.icon}
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1.5">{item.description}</CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-4 md:flex-row">
              <Button variant="marketing" className="w-full md:w-1/2">
                Upgrade Now
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="customization" className="mb-8"></TabsContent>

          <TabsContent value="contact-us" className="mb-8">
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-center text-2xl font-bold md:text-left">We can help you out more</h2>
            </div>

            <div className="mt-4 grid w-3/4 gap-3 md:grid-cols-1">
              {contactUs.map((item) => (
                <Link key={item.title} href={item.link} className="block">
                  <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
                    <CardHeader className="p-4 pb-0">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <span>{item.icon}</span>
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1.5">{item.description}</CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ProfileContentSkeleton() {
  return (
    <div className="flex grow flex-col gap-4 md:flex-row">
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
        <div className="bg-muted inline-flex h-10 items-center justify-center gap-1 rounded-md p-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="mt-4 rounded-md border">
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    </div>
  )
}
