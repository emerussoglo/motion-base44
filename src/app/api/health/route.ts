export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    status: "ok",
    engine: "motion-canvas",
    renderer: "available",
    service: "motion-renderer",
    timestamp: new Date().toISOString(),
  });
}
