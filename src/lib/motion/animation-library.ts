import type { AnimationConfig, AnimationType } from "@/lib/types/motion";

export interface AnimatedValue {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: string;
  intensity: number;
  direction: "left" | "right" | "up" | "down";
  scale: number;
  rotation: number;
}

export const DEFAULT_ANIMATION: AnimatedValue = {
  type: "fadeIn",
  duration: 0.6,
  delay: 0,
  easing: "easeOutCubic",
  intensity: 1,
  direction: "up",
  scale: 1,
  rotation: 0,
};

export function normalizeAnimation(
  config?: Partial<AnimationConfig>,
): AnimatedValue {
  const base = { ...DEFAULT_ANIMATION, ...(config ?? {}) } as AnimatedValue;
  return {
    type: base.type,
    duration: Number(base.duration ?? DEFAULT_ANIMATION.duration),
    delay: Number(base.delay ?? DEFAULT_ANIMATION.delay),
    easing: base.easing ?? DEFAULT_ANIMATION.easing,
    intensity: Number(base.intensity ?? DEFAULT_ANIMATION.intensity),
    direction: base.direction ?? DEFAULT_ANIMATION.direction,
    scale: Number(base.scale ?? DEFAULT_ANIMATION.scale),
    rotation: Number(base.rotation ?? DEFAULT_ANIMATION.rotation),
  };
}

export function getAnimationPreset(type: AnimationType) {
  return {
    fadeIn: { opacity: 0, toOpacity: 1 },
    fadeOut: { opacity: 1, toOpacity: 0 },
    slideUp: { y: 40, toY: 0 },
    slideDown: { y: -40, toY: 0 },
    slideLeft: { x: 60, toX: 0 },
    slideRight: { x: -60, toX: 0 },
    zoomIn: { scale: 0.8, toScale: 1 },
    zoomOut: { scale: 1.2, toScale: 1 },
    scaleIn: { scale: 0.9, toScale: 1 },
    scaleOut: { scale: 1.1, toScale: 1 },
    blurIn: { blur: 12, toBlur: 0 },
    blurOut: { blur: 0, toBlur: 12 },
    rotateIn: { rotation: -12, toRotation: 0 },
    rotateOut: { rotation: 0, toRotation: 12 },
    bounce: { scale: 0.7, toScale: 1.08 },
    overshoot: { scale: 0.85, toScale: 1.2 },
    reveal: { clip: 0, toClip: 1 },
    maskReveal: { clip: 0, toClip: 1, opacity: 0, toOpacity: 1 },
    typewriter: { opacity: 1, charProgress: 0 },
    characterReveal: { opacity: 0, toOpacity: 1 },
    wordReveal: { opacity: 0, toOpacity: 1 },
    splitText: { opacity: 0, toOpacity: 1 },
    pop: { scale: 0.8, toScale: 1.12 },
    shake: { x: 0, toX: 12 },
  }[type];
}

export const animationNames = Object.keys(getAnimationPreset("fadeIn"));

export function buildAnimationTimeline(
  type: AnimationType,
  config?: Partial<AnimationConfig>,
) {
  const normalized = normalizeAnimation(config);
  return {
    ...normalized,
    preset: getAnimationPreset(type),
  };
}
