"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeCameraScanConfig,
} from "html5-qrcode"

import { decodeBarcodeFromFile } from "@/lib/barcode-decode"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { CameraIcon, ImageIcon, Loader2Icon } from "lucide-react"

const SCANNER_ELEMENT_ID = "barcode-scanner-root"

const BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
]

function navigateToCompare(router: ReturnType<typeof useRouter>, barcode: string) {
  router.push(`/identical?barcode=${encodeURIComponent(barcode)}`)
}

export function BarcodeScanButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "starting" | "scanning" | "file-picking">("idle")
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
      scanner.clear()
    } finally {
      scannerRef.current = null
    }
  }, [])

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        stopScanner()
        setError(null)
        setStatus("idle")
      }
      setOpen(isOpen)
    },
    [stopScanner],
  )

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      stopScanner()
      setOpen(false)
      navigateToCompare(router, decodedText)
    },
    [router, stopScanner],
  )

  useEffect(() => {
    if (!open) return

    const element = document.getElementById(SCANNER_ELEMENT_ID)
    if (!element) return

    setStatus("starting")
    setError(null)

    const config: Html5QrcodeCameraScanConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => ({
        width: Math.min(viewfinderWidth, 320),
        height: Math.min(Math.round(viewfinderHeight * 0.4), 160),
      }),
    }
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
      formatsToSupport: BARCODE_FORMATS,
      verbose: false,
      useBarCodeDetectorIfSupported: true,
    })
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras?.length) {
          setError("No camera found. Use \"Pick image\" instead.")
          setStatus("idle")
          return
        }
        const cameraId = cameras[0].id
        return scanner.start(
          cameraId,
          config,
          (text) => handleScanSuccess(text),
          () => {},
        )
      })
      .then(() => {
        if (scannerRef.current?.isScanning) setStatus("scanning")
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Camera access failed"
        setError(message.includes("NotAllowedError") ? "Camera permission denied." : message)
        setStatus("idle")
      })

    return () => {
      stopScanner()
    }
  }, [open, handleScanSuccess, stopScanner])

  const handlePickImage = useCallback(() => {
    setStatus("file-picking")
    setError(null)
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ""
      if (!file || !open) return

      await stopScanner()
      setStatus("file-picking")

      try {
        const barcode = await decodeBarcodeFromFile(file)
        if (barcode) {
          setOpen(false)
          navigateToCompare(router, barcode)
        } else {
          setError("No barcode found in image.")
        }
      } catch {
        setError("No barcode found in image.")
      } finally {
        setStatus("idle")
      }
    },
    [open, router, stopScanner],
  )

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
              Point your camera at a product barcode, or pick an image.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div
              id={SCANNER_ELEMENT_ID}
              className="min-h-[200px] w-full overflow-hidden rounded-md bg-black"
            />
            {status === "starting" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Starting camera…
              </div>
            )}
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePickImage}
                disabled={status === "file-picking"}
              >
                <ImageIcon className="h-4 w-4" />
                Pick image
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden
            onChange={handleFileChange}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
