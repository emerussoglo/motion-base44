import type { CameraConfig } from "@/lib/types/motion";

export type CameraMotion =
  | "zoom-in"
  | "zoom-out"
  | "pan-left"
  | "pan-right"
  | "pan-up"
  | "pan-down"
  | "shake"
  | "rotate"
  | "overshoot"
  | "light-move"
  | "parallax";

export function buildCameraMotion(config?: CameraConfig) {
  return {
    type: config?.type ?? "light-move",
    intensity: config?.intensity ?? 1,
    duration: config?.duration ?? 1,
    ease: config?.ease ?? "easeInOutCubic",
    offsetX: config?.offsetX ?? 0,
    offsetY: config?.offsetY ?? 0,
    zoom: config?.zoom ?? 1,
  };
}

export function applyCameraMotion(type: CameraMotion, intensity = 1) {
  const presets: Record<
    CameraMotion,
    { x?: number; y?: number; zoom?: number; rotation?: number }
  > = {
    "zoom-in": { zoom: 1 + 0.12 * intensity },
    "zoom-out": { zoom: 1 - 0.1 * intensity },
    "pan-left": { x: -24 * intensity },
    "pan-right": { x: 24 * intensity },
    "pan-up": { y: -18 * intensity },
    "pan-down": { y: 18 * intensity },
    shake: { x: 8 * intensity, rotation: 6 * intensity },
    rotate: { rotation: 10 * intensity },
    overshoot: { zoom: 1.14 * intensity },
    "light-move": { x: 10 * intensity, y: 6 * intensity },
    parallax: { x: 8 * intensity, y: 4 * intensity },
  };

  return presets[type] ?? { x: 0, y: 0, zoom: 1, rotation: 0 };
}
