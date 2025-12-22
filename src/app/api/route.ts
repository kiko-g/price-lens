import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Hello World", url: req.url }, { status: 200 })
}
