import { motionProjectSpecificationSchema } from "@/lib/validation/motion-schema";
import { renderJobStore } from "@/lib/rendering/render-job-store";
import { renderMotionProject } from "@/lib/rendering/node-renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!authorised(request))
    return Response.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }
  const parsed = motionProjectSpecificationSchema.safeParse(body);
  if (!parsed.success)
    return Response.json(
      {
        success: false,
        error: "Invalid Motion Project Specification.",
        details: parsed.error.issues,
      },
      { status: 422 },
    );
  const job = renderJobStore.create();
  console.info(`[RENDER] queued ${job.id}`);
  void run(job.id, parsed.data);
  return Response.json(
    { success: true, renderId: job.id, status: "queued" },
    { status: 202 },
  );
}
async function run(
  id: string,
  spec: typeof motionProjectSpecificationSchema._output,
) {
  renderJobStore.update(id, { status: "processing" });
  console.info(`[RENDER] processing ${id}`);
  try {
    const output = await renderMotionProject(spec, { renderId: id });
    renderJobStore.update(id, {
      status: "completed",
      outputPath: output.outputPath,
      videoUrl: output.videoUrl,
    });
    console.info(`[RENDER] completed ${id}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Rendering failed.";
    renderJobStore.update(id, { status: "failed", error: message });
    console.error(`[RENDER] failed ${id}: ${message}`);
  }
}
function authorised(request: Request) {
  const secret = process.env.MOTION_RENDER_SECRET;
  return (
    Boolean(secret) &&
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}
