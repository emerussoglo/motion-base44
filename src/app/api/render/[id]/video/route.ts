import {createReadStream, existsSync} from "node:fs";
import {Readable} from "node:stream";
import {renderJobStore} from "@/lib/rendering/render-job-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: {params: Promise<{id: string}>}) { const {id} = await context.params; const job = renderJobStore.get(id); if (!job?.outputPath || !existsSync(job.outputPath)) return Response.json({success: false, error: "Video not found."}, {status: 404}); return new Response(Readable.toWeb(createReadStream(job.outputPath)) as ReadableStream, {headers: {"content-type": "video/mp4", "content-disposition": `inline; filename="${id}.mp4"`}}); }
