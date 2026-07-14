import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Lightweight health check for uptime monitors / keep-alive cron.
// GET /api/health -> { ok: true, service: "sloe", time }
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "sloe",
    time: new Date().toISOString(),
  })
}
