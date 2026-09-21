import {renderJobStore} from "@/lib/rendering/render-job-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: {params: Promise<{id: string}>}) { const {id} = await context.params; const job = renderJobStore.get(id); return job ? Response.json({success: job.status !== "failed", renderId: job.id, status: job.status, videoUrl: job.videoUrl, error: job.error}) : Response.json({success: false, error: "Render not found."}, {status: 404}); }
