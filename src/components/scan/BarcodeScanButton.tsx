"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BrowserMultiFormatReader } from "@zxing/browser"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { CameraIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react"

function navigateToCompare(router: ReturnType<typeof useRouter>, barcode: string) {
  router.push(`/identical?barcode=${encodeURIComponent(barcode)}`)
}

function isProductBarcode(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 14
}

export function BarcodeScanButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
    setIsScanning(false)
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
      }
      setOpen(isOpen)
    },
    [stopScanning],
  )

  const startScanning = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      streamRef.current = stream
      setIsScanning(true)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError(
        "Unable to access camera. Please ensure you have granted camera permissions.",
      )
    }
  }, [])

  useEffect(() => {
    if (!isScanning || !streamRef.current) return
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
          if (
            !v ||
            !canvas ||
            v.readyState !== v.HAVE_ENOUGH_DATA ||
            !streamRef.current
          )
            return
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
  }, [isScanning, handleScanSuccess, stopScanning])

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
    return () => stopScanning()
  }, [stopScanning])

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="icon-xl"
        roundedness="circular"
        className="border-transparent"
        onClick={() => setOpen(true)}
        aria-label="Scan barcode"
      >
        <CameraIcon className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-[95vw] sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={() => handleOpenChange(false)}
        >
          <DialogHeader>
            <DialogTitle>Scan barcode</DialogTitle>
            <DialogDescription>
              Scan product barcodes with your camera or upload an image.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            {isScanning ? (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                  />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="border-primary/60 h-1/2 w-3/4 rounded-lg border-2 shadow-lg" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={stopScanning}
                >
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
                  disabled={isProcessing}
                >
                  <CameraIcon className="h-5 w-5" />
                  Start camera
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
                  {isProcessing ? (
                    <Loader2Icon className="h-5 w-5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
