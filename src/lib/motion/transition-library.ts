import type { TransitionConfig, TransitionType } from "@/lib/types/motion";

export const transitionPresets: Record<
  TransitionType,
  {
    duration: number;
    intensity: number;
    direction?: "left" | "right" | "up" | "down";
  }
> = {
  fade: { duration: 0.45, intensity: 1 },
  zoom: { duration: 0.55, intensity: 1.15 },
  slide: { duration: 0.5, intensity: 1, direction: "left" },
  wipe: { duration: 0.6, intensity: 1.2, direction: "left" },
  blur: { duration: 0.55, intensity: 1.2 },
  flash: { duration: 0.3, intensity: 1.3 },
  scale: { duration: 0.4, intensity: 1.2 },
  whip: { duration: 0.6, intensity: 1.4, direction: "right" },
};

export function normalizeTransition(config?: Partial<TransitionConfig>) {
  const base = config ?? { type: "fade" };
  const preset = transitionPresets[base.type ?? "fade"];
  return {
    type: base.type ?? "fade",
    duration: base.duration ?? preset.duration,
    easing: base.easing ?? "easeInOutCubic",
    direction: base.direction ?? preset.direction ?? "left",
    intensity: base.intensity ?? preset.intensity,
  };
}
