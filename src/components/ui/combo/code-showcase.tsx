"use client"

import React, { useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { GeistMono } from "geist/font/mono"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coldarkDark } from "react-syntax-highlighter/dist/cjs/styles/prism"
import { CheckIcon, ClipboardIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  className?: string
  code: string
  language: string
  allowDownload?: boolean
}

export function CodeShowcase({ className, code, language, allowDownload = true }: Props) {
  const canCopy = useMemo(() => code !== "", [code])
  const canDownload = useMemo(() => allowDownload && code !== "", [allowDownload, code])

  return (
    <div
      className={cn(
        "code-block group relative mb-4 max-w-7xl overflow-auto rounded-xl",
        GeistMono.className,
        className,
      )}
    >
      <div className="absolute top-3 right-3 z-20 flex items-center justify-end gap-1 text-white">
        {canDownload ? <DownloadButton text={code} filename={`code.${language}`} /> : null}
        {canCopy ? <CopyCodeButton text={code} /> : null}
      </div>

      <SyntaxHighlighter
        language={language}
        style={coldarkDark}
        customStyle={{
          margin: "0",
          minHeight: "60px",
          lineHeight: "1.25",
          fontSize: "12px",
          letterSpacing: "-0.025em",
          borderRadius: "0.75rem",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

function CopyCodeButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 4000)
      })
      .catch(() => console.error("Failed to copy code to clipboard."))
  }, [text])

  return (
    <Button onClick={copyToClipboard} disabled={isCopied} variant="ghost-dark" size="icon">
      {isCopied ? <CheckIcon /> : <ClipboardIcon />}
    </Button>
  )
}

function DownloadButton({ text, filename }: { text: string; filename: string }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const download = () => {
    setIsDownloading(true)
    try {
      const blob = new Blob([text], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.warn("Failed to download code.", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button onClick={download} disabled={isDownloading} variant="ghost-dark" size="icon">
      {isDownloading ? <CheckIcon /> : <DownloadIcon />}
    </Button>
  )
}
