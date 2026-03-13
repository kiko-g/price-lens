"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Slot } from "@radix-ui/react-slot"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { CameraIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react"

function navigateToCompare(router: ReturnType<typeof useRouter>, barcode: string) {
  router.push(`/products/barcode/${encodeURIComponent(barcode)}`)
}

function isProductBarcode(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 14
}

type BarcodeScanButtonProps = {
  /** A single React element that will receive the trigger props (onClick, onKeyDown). Must be a button or interactive element. */
  children: React.ReactElement
}

export function BarcodeScanButton({ children }: BarcodeScanButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [isScanningCamera, setIsScanningCamera] = useState(false)
  const [isStartingCamera, setIsStartingCamera] = useState(false)
  const [manualTextOpen, setManualTextOpen] = useState(false)
  const [manualTextValue, setManualTextValue] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopScanning = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanningCamera(false)
  }, [])

  const handleScanSuccess = useCallback(
    (code: string) => {
      if (!isProductBarcode(code)) return
      stopScanning()
      setOpen(false)
      navigateToCompare(router, code)
    },
    [router, stopScanning],
  )

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        stopScanning()
        setError(null)
        setManualTextOpen(false)
        setManualTextValue("")
      }
      setOpen(isOpen)
    },
    [stopScanning],
  )

  const handleManualSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const digits = manualTextValue.replace(/\D/g, "")
      if (!isProductBarcode(digits)) {
        setError("Enter a valid barcode (8 to 14 digits).")
        return
      }
      setOpen(false)
      navigateToCompare(router, digits)
    },
    [manualTextValue, router],
  )

  const startScanning = useCallback(async () => {
    try {
      setError(null)
      setIsStartingCamera(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = stream
      setIsScanningCamera(true)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Unable to access camera. Please ensure you have granted camera permissions.")
    } finally {
      setIsStartingCamera(false)
    }
  }, [])

  useEffect(() => {
    if (!isScanningCamera || !streamRef.current) return
    const video = videoRef.current
    if (!video) return

    video.srcObject = streamRef.current
    video
      .play()
      .then(() => {
        const codeReader = new BrowserMultiFormatReader()
        scanIntervalRef.current = setInterval(async () => {
          const v = videoRef.current
          const canvas = canvasRef.current
          if (!v || !canvas || v.readyState !== v.HAVE_ENOUGH_DATA || !streamRef.current) return
          const ctx = canvas.getContext("2d")
          if (!ctx) return
          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
          try {
            const result = await codeReader.decodeFromCanvas(canvas)
            const code = result?.getText()
            if (code && isProductBarcode(code)) {
              handleScanSuccess(code)
            }
          } catch {
            // no barcode in frame
          }
        }, 300)
      })
      .catch((err) => {
        console.error("Video play failed:", err)
        setError("Unable to play camera stream.")
        stopScanning()
      })

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [isScanningCamera, handleScanSuccess, stopScanning])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (!file || !open) return

      setIsProcessing(true)
      setError(null)
      stopScanning()

      const imageUrl = URL.createObjectURL(file)
      const img = new Image()

      img.onload = async () => {
        try {
          const codeReader = new BrowserMultiFormatReader()
          const result = await codeReader.decodeFromImageUrl(imageUrl)
          const code = result?.getText()
          if (code && isProductBarcode(code)) {
            setOpen(false)
            navigateToCompare(router, code)
          } else {
            setError("No barcode found in image. Try another image.")
          }
        } catch {
          setError("No barcode found in image. Try another image.")
        } finally {
          URL.revokeObjectURL(imageUrl)
          setIsProcessing(false)
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl)
        setError("Failed to load image.")
        setIsProcessing(false)
      }
      img.src = imageUrl
    },
    [open, router, stopScanning],
  )

  useEffect(() => {
    if (open && !isScanningCamera) {
      startScanning()
    }
    // only trigger on open change, not isScanning
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    return () => stopScanning()
  }, [stopScanning])

  return (
    <>
      <Slot onClick={() => setOpen(true)} onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && setOpen(true)}>
        {children}
      </Slot>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan barcode</DialogTitle>
            <DialogDescription>Scan product barcodes with your camera or upload an image.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            {isScanningCamera ? (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                  <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="border-primary/60 h-1/2 w-3/4 rounded-lg border-2 shadow-lg" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button type="button" variant="outline" className="w-full" size="lg" onClick={stopScanning}>
                  <XIcon className="h-5 w-5" />
                  Stop scanning
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="default"
                  className="w-full"
                  size="lg"
                  onClick={startScanning}
                  disabled={isStartingCamera || isProcessing}
                >
                  {isStartingCamera ? (
                    <Loader2Icon className="h-5 w-5 animate-spin" />
                  ) : (
                    <CameraIcon className="h-5 w-5" />
                  )}
                  {isStartingCamera ? "Starting camera…" : "Start camera"}
                </Button>
                <div className="relative">
                  <span className="border-border absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </span>
                  <span className="text-muted-foreground relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2">or</span>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                  {isProcessing ? "Processing…" : "Upload image"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-hidden
                  onChange={handleFileChange}
                />
              </div>
            )}

            {manualTextOpen ? (
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g. 5601234567890"
                  value={manualTextValue}
                  onChange={(e) => setManualTextValue(e.target.value)}
                  autoFocus
                  className="text-sm"
                />
                <Button type="submit" size="sm" disabled={!manualTextValue.trim()}>
                  Go
                </Button>
              </form>
            ) : (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                onClick={() => setManualTextOpen(true)}
              >
                Type barcode manually
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
