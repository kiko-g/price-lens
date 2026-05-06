"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  const t = useTranslations("common.a11y")
  return (
    <nav
      role="navigation"
      aria-label={t("paginationNavigation")}
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
)
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("text-sm font-medium", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className,
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const t = useTranslations("common.a11y")
  return (
    <PaginationLink
      aria-label={t("goToPreviousPage")}
      size="default"
      className={cn("gap-1 px-2", className)}
      {...props}
    >
      <span className="sr-only">{t("previousPage")}</span>
      <ChevronLeft className="h-4 w-4" />
    </PaginationLink>
  )
}
PaginationPrevious.displayName = "PaginationPrevious"

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const t = useTranslations("common.a11y")
  return (
    <PaginationLink aria-label={t("goToNextPage")} size="default" className={cn("gap-1 px-2", className)} {...props}>
      <span className="sr-only">{t("nextPage")}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  )
}
PaginationNext.displayName = "PaginationNext"

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  const t = useTranslations("common.a11y")
  return (
    <span aria-hidden className={cn("flex h-9 w-9 items-center justify-center", className)} {...props}>
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">{t("morePages")}</span>
    </span>
  )
}
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
