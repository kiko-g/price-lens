import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Database actions go under this route /api/supabase" })
}
