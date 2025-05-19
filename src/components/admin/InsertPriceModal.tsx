import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function InsertPriceModal() {
  const [open, setOpen] = useState(false)
  const [json, setJson] = useState("")

  const handleSubmit = async () => {
    const response = await fetch("/api/prices/put", {
      method: "PUT",
      body: json,
    })

    if (response.ok) {
      setOpen(false)
      setJson("")
    } else {
      console.error("Failed to insert price")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Insert</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Insert Price</DialogTitle>
          <DialogDescription>Insert a price for a product.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="json">JSON</Label>
            <Textarea
              id="json"
              rows={15}
              value={json}
              onChange={(e) => setJson(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
