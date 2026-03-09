"use client"

import { useState } from "react"
import Link from "next/link"
import { deleteAccount, signOut } from "@/app/login/actions"
import { toast } from "sonner"

import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import { BugIcon, LogOutIcon, MailIcon, PlusIcon, TrashIcon } from "lucide-react"

const contactLinks = [
  {
    title: "Questions?",
    description: "Email Price Lens developer directly at kikojpgoncalves@gmail.com",
    icon: MailIcon,
    href: "mailto:kikojpgoncalves@gmail.com",
  },
  {
    title: "Found a bug?",
    description: "UI glitches or formatting issues? Report them here!",
    icon: BugIcon,
    href: "https://github.com/kiko-g/pricelens/issues",
  },
  {
    title: "Feature request?",
    description: "We're always looking for new ideas! Let us know what you'd like to see.",
    icon: PlusIcon,
    href: "https://github.com/kiko-g/pricelens/issues",
  },
]

export function SettingsTab() {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDeleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return
    setIsDeleting(true)
    try {
      await deleteAccount()
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account. Please try again.")
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-muted-foreground text-xs">Switch between light and dark mode</p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <Separator />

      {/* Contact & Feedback */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Contact & Feedback</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {contactLinks.map((item) => (
            <Link key={item.title} href={item.href} className="block">
              <Card className="hover:bg-accent hover:text-accent-foreground h-full transition-colors">
                <CardHeader className="p-4 pb-0">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1.5">
                  <p className="text-muted-foreground text-xs">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* Account */}
      <section className="space-y-3">
        <h3 className="text-base font-semibold">Account</h3>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-muted-foreground text-xs">Sign out of your Price Lens account on this device</p>
          </div>

          <Button variant="outline" size="sm" onClick={() => signOut()} className="w-fit">
            <LogOutIcon className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </section>

      <Separator />

      {/* Danger zone */}
      <section className="space-y-3">
        <h3 className="text-destructive text-base font-semibold">Danger Zone</h3>
        <p className="text-muted-foreground text-xs">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
          <TrashIcon className="h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete account"}
        </Button>
      </section>
    </div>
  )
}
