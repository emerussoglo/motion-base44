import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { motionProjectSpecificationSchema } from "@/lib/validation/motion-schema";
import type { SKRSContext2D } from "@napi-rs/canvas";
import type {
  AnimationConfig,
  MotionProjectSpecification,
  SceneElement,
} from "@/lib/types/motion";
import { RenderError } from "./render-error";

export interface RenderOutput {
  renderId: string;
  outputPath: string;
  videoUrl: string;
}
export interface RenderOptions {
  renderId?: string;
  timeoutMs?: number;
}

/** Deterministic Node timeline renderer; FFmpeg performs the real MP4 encoding. */
export async function renderMotionProject(
  input: unknown,
  options: RenderOptions = {},
): Promise<RenderOutput> {
  const spec = motionProjectSpecificationSchema.parse(input);
  const renderId = options.renderId ?? randomUUID();
  const outputDir = path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    process.env.RENDER_OUTPUT_DIR ?? "./tmp/renders",
  );
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(
    /*turbopackIgnore: true*/ outputDir,
    `${renderId}.mp4`,
  );
  const { createCanvas } = await import("@napi-rs/canvas");
  const ffmpeg = await startEncoder(spec, outputPath);
  const timeout = setTimeout(
    () => ffmpeg.kill("SIGKILL"),
    options.timeoutMs ?? Number(process.env.RENDER_TIMEOUT_MS ?? 300_000),
  );
  try {
    const canvas = createCanvas(spec.width, spec.height);
    const context = canvas.getContext("2d");
    for (
      let frame = 0;
      frame < Math.ceil(spec.duration * spec.fps);
      frame += 1
    ) {
      drawFrame(context, spec, frame / spec.fps);
      if (!ffmpeg.stdin.write(canvas.toBuffer("image/png")))
        await onceDrain(ffmpeg.stdin);
    }
    ffmpeg.stdin.end();
    await waitForProcess(ffmpeg);
  } catch (cause) {
    ffmpeg.kill("SIGKILL");
    throw cause instanceof RenderError
      ? cause
      : new RenderError("Le rendu vidéo a échoué.");
  } finally {
    clearTimeout(timeout);
  }
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return {
    renderId,
    outputPath,
    videoUrl: `${baseUrl}/api/render/${renderId}/video`,
  };
}

async function startEncoder(
  spec: MotionProjectSpecification,
  outputPath: string,
) {
  const audio = spec.voiceover.url
    ? [
        "-i",
        spec.voiceover.url,
        "-filter:a",
        `volume=${spec.voiceover.volume}`,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0?",
      ]
    : [];
  const child = spawn(
    await resolveFfmpegPath(),
    [
      "-y",
      "-f",
      "image2pipe",
      "-vcodec",
      "png",
      "-r",
      String(spec.fps),
      "-i",
      "-",
      ...audio,
      "-t",
      String(spec.duration),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      ...(audio.length ? ["-c:a", "aac", "-shortest"] : []),
      outputPath,
    ],
    { stdio: ["pipe", "ignore", "pipe"] },
  );
  child.on("error", () => undefined);
  return child;
}
async function resolveFfmpegPath() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0)
    return "ffmpeg";
  try {
    const bundled = await import("@ffmpeg-installer/ffmpeg");
    return bundled.path;
  } catch {
    return "ffmpeg";
  }
}
function waitForProcess(process: ReturnType<typeof spawn>) {
  return new Promise<void>((resolve, reject) => {
    process.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new RenderError(
              "FFmpeg n’a pas pu encoder le MP4. Vérifiez FFMPEG_PATH et les fichiers audio.",
              500,
              "FFMPEG_FAILED",
            ),
          ),
    );
    process.once("error", () =>
      reject(
        new RenderError(
          "FFmpeg est introuvable. Installez-le ou définissez FFMPEG_PATH.",
          500,
          "FFMPEG_UNAVAILABLE",
        ),
      ),
    );
  });
}
function onceDrain(stream: NodeJS.WritableStream) {
  return new Promise<void>((resolve) => stream.once("drain", resolve));
}

function drawFrame(
  ctx: SKRSContext2D,
  spec: MotionProjectSpecification,
  time: number,
) {
  ctx.fillStyle = spec.background;
  ctx.fillRect(0, 0, spec.width, spec.height);
  for (const scene of spec.scenes)
    if (time >= scene.start && time < scene.start + scene.duration) {
      const local = time - scene.start;
      ctx.save();
      applyCamera(
        ctx,
        scene.camera?.type,
        scene.camera?.intensity ?? 1,
        local,
        scene.duration,
        spec.width,
        spec.height,
      );
      if (scene.background) {
        ctx.fillStyle = scene.background;
        ctx.fillRect(
          -spec.width,
          -spec.height,
          spec.width * 3,
          spec.height * 3,
        );
      }
      for (const element of scene.elements)
        drawElement(ctx, element, spec, local, scene.duration);
      ctx.restore();
    }
  for (const caption of spec.captions)
    if (time >= caption.start && time <= caption.end) {
      ctx.save();
      ctx.globalAlpha = animationProgress(
        caption.animation,
        time - caption.start,
        caption.end - caption.start,
      );
      ctx.font = `bold ${Math.round(spec.width * 0.043)}px ${spec.brand.fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillStyle =
        caption.style === "highlighted"
          ? spec.brand.accentColor
          : spec.brand.primaryColor;
      ctx.fillText(caption.text, spec.width / 2, spec.height * 0.88);
      ctx.restore();
    }
}
function drawElement(
  ctx: SKRSContext2D,
  element: SceneElement,
  spec: MotionProjectSpecification,
  elapsed: number,
  sceneDuration: number,
) {
  const p = animationProgress(element.animation, elapsed, sceneDuration),
    x = (element.x ?? 0) + spec.width / 2,
    y = (element.y ?? 0) + spec.height / 2,
    offset = animationOffset(element.animation, p, spec.width, spec.height);
  ctx.save();
  ctx.globalAlpha = (element.opacity ?? 1) * p;
  ctx.translate(x + offset.x, y + offset.y);
  ctx.rotate((((element.rotation ?? 0) + offset.rotation) * Math.PI) / 180);
  ctx.scale(
    (element.scale ?? 1) * offset.scale,
    (element.scale ?? 1) * offset.scale,
  );
  if (element.type === "text" && element.text) {
    ctx.fillStyle = element.color ?? spec.brand.primaryColor;
    ctx.font = `bold ${Math.round(spec.width * 0.064)}px ${spec.brand.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(element.text, 0, 0, element.width ?? spec.width * 0.85);
  }
  if (element.type === "shape") {
    ctx.fillStyle = element.color ?? spec.brand.accentColor;
    ctx.fillRect(
      -(element.width ?? 240) / 2,
      -(element.height ?? 240) / 2,
      element.width ?? 240,
      element.height ?? 240,
    );
  }
  if (element.type === "logo") {
    ctx.fillStyle = element.color ?? spec.brand.accentColor;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      Math.min(element.width ?? 128, element.height ?? 128) / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    if (element.text) {
      ctx.fillStyle = spec.brand.primaryColor;
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(element.text.slice(0, 3).toUpperCase(), 0, 9);
    }
  }
  if (element.type === "image") {
    ctx.strokeStyle = element.color ?? spec.brand.accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(
      -(element.width ?? 360) / 2,
      -(element.height ?? 360) / 2,
      element.width ?? 360,
      element.height ?? 360,
    );
  }
  ctx.restore();
}
function animationProgress(
  animation: AnimationConfig | undefined,
  elapsed: number,
  fallback: number,
) {
  const delay = animation?.delay ?? 0,
    duration = animation?.duration ?? Math.min(0.6, fallback);
  return Math.max(0, Math.min(1, (elapsed - delay) / duration));
}
function animationOffset(
  animation: AnimationConfig | undefined,
  p: number,
  width: number,
  height: number,
) {
  const type = animation?.type,
    amount = (animation?.intensity ?? 1) * (1 - p),
    scale =
      type === "zoomIn" || type === "scaleIn" || type === "pop"
        ? 0.8 + 0.2 * p
        : type === "zoomOut" || type === "scaleOut"
          ? 1 + 0.2 * amount
          : 1;
  return {
    x:
      type === "slideLeft"
        ? width * 0.12 * amount
        : type === "slideRight"
          ? -width * 0.12 * amount
          : type === "shake"
            ? Math.sin(p * 30) * 12 * amount
            : 0,
    y:
      type === "slideUp"
        ? height * 0.08 * amount
        : type === "slideDown"
          ? -height * 0.08 * amount
          : 0,
    rotation:
      type === "rotateIn"
        ? -18 * amount
        : type === "rotateOut"
          ? 18 * amount
          : 0,
    scale,
  };
}
function applyCamera(
  ctx: SKRSContext2D,
  type: string | undefined,
  intensity: number,
  elapsed: number,
  duration: number,
  width: number,
  height: number,
) {
  const p = Math.min(1, elapsed / duration);
  ctx.translate(width / 2, height / 2);
  if (type === "zoom-in")
    ctx.scale(1 + 0.12 * intensity * p, 1 + 0.12 * intensity * p);
  if (type === "pan-left") ctx.translate(-width * 0.06 * intensity * p, 0);
  if (type === "pan-right") ctx.translate(width * 0.06 * intensity * p, 0);
  if (type === "shake")
    ctx.translate(
      Math.sin(p * 30) * 8 * intensity,
      Math.cos(p * 24) * 5 * intensity,
    );
  ctx.translate(-width / 2, -height / 2);
}
