"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BrowserMultiFormatReader } from "@zxing/browser"
import { Slot } from "@radix-ui/react-slot"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { CameraIcon, FlashlightIcon, ImageIcon, Loader2Icon, XIcon } from "lucide-react"

function navigateToCompare(router: ReturnType<typeof useRouter>, barcode: string) {
  router.push(`/products/barcode/${encodeURIComponent(barcode)}`)
}

function isProductBarcode(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 8 && digits.length <= 14
}

type GetUserMediaConstraints = MediaStreamConstraints & { signal?: AbortSignal }

async function requestCameraStream(signal: AbortSignal): Promise<MediaStream> {
  const attempts: MediaStreamConstraints[] = [
    {
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    { video: { facingMode: { ideal: "environment" } } },
    { video: true },
  ]
  let lastError: unknown
  for (const videoOnly of attempts) {
    try {
      const c: GetUserMediaConstraints = { ...videoOnly, signal }
      return await navigator.mediaDevices.getUserMedia(c)
    } catch (err) {
      lastError = err
      if (err instanceof DOMException && err.name === "AbortError") throw err
    }
  }
  throw lastError
}

function trackSupportsTorch(track: MediaStreamTrack): boolean {
  try {
    const c = track.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
    return !!c && "torch" in c
  } catch {
    return false
  }
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
  const [torchSupported, setTorchSupported] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [manualTextOpen, setManualTextOpen] = useState(false)
  const [manualTextValue, setManualTextValue] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraAbortRef = useRef<AbortController | null>(null)

  const stopScanning = useCallback(() => {
    cameraAbortRef.current?.abort()
    cameraAbortRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanningCamera(false)
    setIsStartingCamera(false)
    setTorchSupported(false)
    setTorchOn(false)
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

  const handleOpenManualEntry = useCallback(() => {
    if (isScanningCamera || isStartingCamera) {
      stopScanning()
    }
    setManualTextOpen(true)
  }, [isScanningCamera, isStartingCamera, stopScanning])

  const startScanning = useCallback(async () => {
    cameraAbortRef.current?.abort()
    const ac = new AbortController()
    cameraAbortRef.current = ac
    const { signal } = ac

    try {
      setError(null)
      setIsStartingCamera(true)
      const stream = await requestCameraStream(signal)
      if (signal.aborted) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const vtrack = stream.getVideoTracks()[0]
      setTorchSupported(vtrack ? trackSupportsTorch(vtrack) : false)
      setTorchOn(false)
      setIsScanningCamera(true)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return
      console.error("[BarcodeScanButton] camera access failed:", err)
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError(
          "Camera access was denied. Allow camera for this site in your browser settings (site permissions / lock icon in the address bar), then try again.",
        )
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setError("No camera was found on this device.")
      } else {
        setError("Unable to access the camera. Check permissions and try again.")
      }
    } finally {
      if (!signal.aborted) {
        setIsStartingCamera(false)
      }
      cameraAbortRef.current = null
    }
  }, [])

  const handleResumeCameraFromManual = useCallback(() => {
    setManualTextOpen(false)
    setError(null)
    setIsStartingCamera(true)
    startScanning()
  }, [startScanning])

  const handleToggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track || !torchSupported) return
    const next = !torchOn
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet & { torch: boolean }],
      })
      setTorchOn(next)
    } catch (err) {
      console.error("[BarcodeScanButton] torch toggle failed:", err)
      setError("Flashlight is not available on this device or browser.")
    }
  }, [torchOn, torchSupported])

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
        console.error("[BarcodeScanButton] video play failed:", err)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    return () => stopScanning()
  }, [stopScanning])

  const showViewfinder = open && (isStartingCamera || isScanningCamera)
  const showFallbackControls = open && !isStartingCamera && !isScanningCamera

  return (
    <>
      <Slot
        onClick={() => {
          setOpen(true)
          setIsStartingCamera(true)
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            setOpen(true)
            setIsStartingCamera(true)
          }
        }}
      >
        {children}
      </Slot>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          overlayVisualViewportSync={open}
          className={cn(
            "max-w-[95vw] sm:max-w-md",
            // Bottom sheet on narrow viewports: avoids huge jump when the mobile keyboard resizes the visual viewport (centered translate-y dialogs jump badly on iOS).
            "max-md:data-[state=closed]:slide-out-to-bottom max-md:data-[state=closed]:slide-out-to-left-0 max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=open]:slide-in-from-left-0",
            "max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:max-h-[min(92dvh,92svh)] max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0",
            "max-md:overflow-y-auto max-md:overscroll-contain max-md:rounded-t-2xl max-md:rounded-b-none max-md:border-x-0 max-md:border-b-0",
            "max-md:pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
          )}
        >
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

            {showViewfinder && (
              <div className="flex flex-col gap-3">
                <div className="relative aspect-video overflow-hidden rounded-md bg-black">
                  {isScanningCamera ? (
                    <>
                      <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="border-primary/60 h-1/2 w-3/4 rounded-lg border-2 shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground flex h-full min-h-[140px] flex-col items-center justify-center gap-3 px-4 text-center text-sm">
                      <Loader2Icon className="text-primary h-10 w-10 animate-spin" aria-hidden />
                      <span>Starting camera…</span>
                    </div>
                  )}
                </div>
                {isScanningCamera && <canvas ref={canvasRef} className="hidden" />}

                <div className="flex flex-wrap gap-2">
                  {isScanningCamera && torchSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="min-w-0 flex-1"
                      onClick={handleToggleTorch}
                      aria-pressed={torchOn}
                      aria-label={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                    >
                      <FlashlightIcon className={cn("h-5 w-5", torchOn && "text-amber-400")} aria-hidden />
                      {torchOn ? "Light off" : "Light"}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="min-w-0 flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? <Loader2Icon className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                    {isProcessing ? "Processing…" : "Upload image"}
                  </Button>
                </div>

                <Button type="button" variant="outline" className="w-full" size="lg" onClick={stopScanning}>
                  <XIcon className="h-5 w-5" aria-hidden />
                  {isScanningCamera ? "Stop scanning" : "Cancel"}
                </Button>
              </div>
            )}

            {showFallbackControls && !manualTextOpen && (
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
              </div>
            )}

            {manualTextOpen && !showViewfinder && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1"
                  onClick={handleResumeCameraFromManual}
                  disabled={isStartingCamera || isProcessing}
                >
                  {isStartingCamera ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CameraIcon className="h-4 w-4" />
                  )}
                  Use camera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-0 flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  Upload
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-hidden
              onChange={handleFileChange}
            />

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
                  enterKeyHint="done"
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
                onClick={handleOpenManualEntry}
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
