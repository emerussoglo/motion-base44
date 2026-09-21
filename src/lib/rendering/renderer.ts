// Legacy experimental Motion Canvas adapter. The production API uses node-renderer.ts.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { JSDOM } from "jsdom";
import { createCanvas, Image as CanvasImage } from "@napi-rs/canvas";
import {
  makeProject,
  Renderer as MotionRenderer,
  Vector2,
} from "@motion-canvas/core";
import { makeScene2D, Circle, Rect, Txt, Node, Img } from "@motion-canvas/2d";
import { spawn } from "child_process";
import { motionProjectSpecificationSchema } from "@/lib/validation/motion-schema";
import type {
  MotionProjectSpecification,
  Scene,
  SceneElement,
} from "@/lib/types/motion";

const DOM = new JSDOM("<!doctype html><html><body></body></html>");
const canvasCtor = createCanvas(100, 100)
  .constructor as typeof HTMLCanvasElement;

const globalAssignments = {
  window: DOM.window,
  document: DOM.window.document,
  navigator: DOM.window.navigator,
  HTMLElement: DOM.window.HTMLElement,
  Node: DOM.window.Node,
  Image: CanvasImage,
  HTMLCanvasElement: canvasCtor,
  self: DOM.window,
  getComputedStyle: DOM.window.getComputedStyle.bind(DOM.window),
  requestAnimationFrame: (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
};

for (const [key, value] of Object.entries(globalAssignments)) {
  // @ts-expect-error runtime assignment for jsdom compatibility
  globalThis[key] = value;
}

export interface RenderOutput {
  renderId: string;
  outputPath: string;
  videoUrl?: string;
}

export async function renderMotionProject(
  spec: MotionProjectSpecification,
): Promise<RenderOutput> {
  const validated = motionProjectSpecificationSchema.parse(spec);
  const renderId = randomUUID();
  const outDir = path.resolve(
    process.cwd(),
    process.env.RENDER_OUTPUT_DIR ?? "./tmp/renders",
  );
  await fs.promises.mkdir(outDir, { recursive: true });

  const mp4Path = path.join(outDir, `${renderId}.mp4`);
  const imagesDir = path.join(outDir, `${renderId}-frames`);
  await fs.promises.mkdir(imagesDir, { recursive: true });

  const scenes = validated.scenes.map((scene) =>
    createSceneDefinition(scene, validated),
  );
  const project = makeProject({
    name: validated.id,
    scenes,
    variables: {
      accentColor: validated.brand.accentColor,
      primaryColor: validated.brand.primaryColor,
      secondaryColor: validated.brand.secondaryColor,
    },
  });

  const renderer = new MotionRenderer(project);
  const settings = {
    name: validated.id,
    size: new Vector2(validated.width, validated.height),
    resolutionScale: 1,
    colorSpace: "srgb" as const,
    background: validated.background,
    fps: validated.fps,
    range: [0, validated.duration],
    exporter: {
      name: "@motion-canvas/core/image-sequence",
      options: { fileType: "image/png", quality: 100, groupByScene: false },
    },
  };

  await renderer.render(settings);

  const framePattern = path.join(imagesDir, "*.png");
  const ffmpegArgs = [
    "-y",
    "-framerate",
    String(validated.fps),
    "-pattern_type",
    "glob",
    "-i",
    framePattern.replace(/\\/g, "/"),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4Path,
  ];

  const ffmpeg = spawn(process.env.FFMPEG_PATH ?? "ffmpeg", ffmpegArgs, {
    stdio: "pipe",
  });

  await new Promise<void>((resolve, reject) => {
    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    ffmpeg.on("error", reject);
  });

  return {
    renderId,
    outputPath: mp4Path,
    videoUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/render/${renderId}`,
  };
}

function createSceneDefinition(
  scene: Scene,
  project: MotionProjectSpecification,
) {
  return makeScene2D(function* (view) {
    const background = new Rect({
      width: project.width,
      height: project.height,
      fill: scene.background ?? project.background,
      x: 0,
      y: 0,
    });

    view.add(background);

    for (const element of scene.elements) {
      const node = buildElementNode(element, project);
      if (node) {
        view.add(node);
      }
    }

    yield* new Node().scale(1, 1);
  });
}

function buildElementNode(
  element: SceneElement,
  project: MotionProjectSpecification,
): Node | null {
  if (element.type === "text" && element.text) {
    const text = new Txt({
      text: element.text,
      x: element.x ?? 0,
      y: element.y ?? 0,
      fontSize: 64,
      fill: element.color ?? project.brand.primaryColor,
      fontFamily: project.brand.fontFamily,
      opacity: element.opacity ?? 1,
    });
    return text;
  }

  if (element.type === "image" && element.src) {
    const img = new Img({
      src: element.src,
      x: element.x ?? 0,
      y: element.y ?? 0,
      width: element.width ?? 360,
      height: element.height ?? 360,
      opacity: element.opacity ?? 1,
    });
    return img;
  }

  if (element.type === "shape") {
    return new Rect({
      width: element.width ?? 200,
      height: element.height ?? 200,
      fill: element.color ?? "#ffffff",
      x: element.x ?? 0,
      y: element.y ?? 0,
      opacity: element.opacity ?? 1,
    });
  }

  if (element.type === "logo") {
    return new Circle({
      radius: 42,
      fill: project.brand.accentColor,
      x: element.x ?? 0,
      y: element.y ?? 0,
      opacity: element.opacity ?? 1,
    });
  }

  return null;
}
