import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { CheckIcon, CopyIcon } from "lucide-react"

export function ButtonCopy({ content, children, ...props }: { content: string } & ButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 1500)
  }

  return (
    <Button onClick={handleCopy} {...props} disabled={copied}>
      {children}
      {copied ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}
