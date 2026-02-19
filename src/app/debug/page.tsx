"use client"

import { useState } from "react"
import { AxiosError } from "axios"
import type { ErrorReason } from "@/lib/errors"

import { Button } from "@/components/ui/button"
import { ErrorStateView, EmptyStateView } from "@/components/ui/combo/state-views"

import {
  HeartIcon,
  ScaleIcon,
  BrainCogIcon,
  SearchIcon,
  ShoppingCartIcon,
  PackageIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Fake errors that mimic real Axios / JS errors for each ErrorReason
// ---------------------------------------------------------------------------

function makeFakeAxiosError(opts: { code?: string; status?: number; message?: string }): AxiosError {
  const error = new AxiosError(opts.message ?? "Request failed", opts.code)
  if (opts.status) {
    error.response = { status: opts.status, data: {}, headers: {}, statusText: "", config: {} as never }
  }
  return error
}

const FAKE_ERRORS: Record<ErrorReason, unknown> = {
  timeout: makeFakeAxiosError({ code: "ECONNABORTED", message: "timeout of 15000ms exceeded" }),
  network: makeFakeAxiosError({ code: "ERR_NETWORK", message: "Network Error" }),
  unavailable: makeFakeAxiosError({ status: 503, message: "Request failed with status code 503" }),
  rate_limit: makeFakeAxiosError({ status: 429, message: "Request failed with status code 429" }),
  unknown: new Error("Something unexpected happened"),
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-border rounded-lg border">
      <button
        type="button"
        className="hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-3 text-left font-semibold transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDownIcon className="size-4" /> : <ChevronRightIcon className="size-4" />}
        {title}
      </button>
      {open && <div className="border-border space-y-6 border-t px-4 py-6">{children}</div>}
    </div>
  )
}

function Subsection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{label}</p>
      {children}
    </div>
  )
}

export default function DebugPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">UI Showcase</h1>
        <p className="text-muted-foreground text-sm">Preview components and states without breaking the app.</p>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Error States */}
      {/* ----------------------------------------------------------------- */}
      <Section title="ErrorStateView — by error reason">
        <div className="grid gap-6">
          {(Object.keys(FAKE_ERRORS) as ErrorReason[]).map((reason) => (
            <Subsection key={reason} label={reason}>
              <ErrorStateView error={FAKE_ERRORS[reason]} onRetry={() => alert(`Retry: ${reason}`)} />
            </Subsection>
          ))}

          <Subsection label="no error prop (fallback)">
            <ErrorStateView onRetry={() => alert("Retry: fallback")} />
          </Subsection>

          <Subsection label="without retry button">
            <ErrorStateView error={FAKE_ERRORS.timeout} />
          </Subsection>

          <Subsection label="custom title override">
            <ErrorStateView
              error={FAKE_ERRORS.unavailable}
              title="Failed to load price comparison"
              onRetry={() => {}}
            />
          </Subsection>
        </div>
      </Section>

      {/* ----------------------------------------------------------------- */}
      {/* Empty States */}
      {/* ----------------------------------------------------------------- */}
      <Section title="EmptyStateView — various contexts">
        <div className="grid gap-6">
          <Subsection label="products — no search results (with query)">
            <EmptyStateView
              title="No results found"
              message='We couldn&apos;t find any products matching "arroz integral". Try a different search term or clear your filters.'
              actions={
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Clear filters
                  </Button>
                  <Button variant="outline" size="sm">
                    Return home
                  </Button>
                </div>
              }
            />
          </Subsection>

          <Subsection label="products — no search results (no query)">
            <EmptyStateView
              title="No results found"
              message="Try adjusting your filters to find what you're looking for."
              actions={
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              }
            />
          </Subsection>

          <Subsection label="favorites — empty">
            <EmptyStateView
              icon={HeartIcon}
              title="No favorites yet"
              message="Start adding products to your favorites to see them here."
              actions={
                <Button variant="outline" size="sm">
                  <SearchIcon className="size-4" />
                  Find products
                </Button>
              }
            />
          </Subsection>

          <Subsection label="favorites — no search match">
            <EmptyStateView
              icon={HeartIcon}
              title="No favorites match your search"
              message='We couldn&apos;t find any favorites matching "leite".'
              actions={
                <Button variant="outline" size="sm">
                  Clear filters
                </Button>
              }
            />
          </Subsection>

          <Subsection label="compare prices — none available">
            <EmptyStateView
              icon={ScaleIcon}
              title="No price comparisons available"
              message="We couldn't find this product listed at other stores right now. Check back later as availability updates regularly."
            />
          </Subsection>

          <Subsection label="related products — none found">
            <EmptyStateView
              title="No related products found"
              message="We couldn't find related products for this item right now. Check back later as our catalog updates regularly."
            />
          </Subsection>

          <Subsection label="identical cross-store — none">
            <EmptyStateView
              icon={BrainCogIcon}
              title="No identical products found"
              message="We couldn't find this product in other stores right now."
            />
          </Subsection>

          <Subsection label="cart (hypothetical)">
            <EmptyStateView
              icon={ShoppingCartIcon}
              title="Your cart is empty"
              message="Browse products and add items to get started."
              actions={
                <Button variant="outline" size="sm">
                  <PackageIcon className="size-4" />
                  Browse products
                </Button>
              }
            />
          </Subsection>

          <Subsection label="minimal — title only">
            <EmptyStateView title="Nothing here" />
          </Subsection>
        </div>
      </Section>
    </div>
  )
}
