import { NextRequest, NextResponse } from "next/server"

type Data = {
  name: string
}

export async function GET(req: NextRequest) {
  const response: Data = { name: "John Doe" }
  return NextResponse.json(response, { status: 200 })
}
