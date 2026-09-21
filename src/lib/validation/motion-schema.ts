import { z } from "zod";

export const animationConfigSchema = z.object({
  type: z.enum([
    "fadeIn",
    "fadeOut",
    "slideUp",
    "slideDown",
    "slideLeft",
    "slideRight",
    "zoomIn",
    "zoomOut",
    "scaleIn",
    "scaleOut",
    "blurIn",
    "blurOut",
    "rotateIn",
    "rotateOut",
    "bounce",
    "overshoot",
    "reveal",
    "maskReveal",
    "typewriter",
    "characterReveal",
    "wordReveal",
    "splitText",
    "pop",
    "shake",
  ]),
  duration: z.number().positive().optional(),
  delay: z.number().nonnegative().optional(),
  easing: z.string().optional(),
  intensity: z.number().min(0).optional(),
  direction: z.enum(["left", "right", "up", "down"]).optional(),
  scale: z.number().positive().optional(),
  rotation: z.number().optional(),
  startAt: z.number().nonnegative().optional(),
});

export const transitionConfigSchema = z.object({
  type: z.enum([
    "fade",
    "zoom",
    "slide",
    "wipe",
    "blur",
    "flash",
    "scale",
    "whip",
  ]),
  duration: z.number().positive().optional(),
  easing: z.string().optional(),
  direction: z.enum(["left", "right", "up", "down"]).optional(),
  intensity: z.number().min(0).optional(),
});

export const voiceoverSchema = z.object({
  url: z.string().url().or(z.literal("")),
  volume: z.number().min(0).max(1).default(1),
});

export const brandSettingsSchema = z.object({
  logo: z.string().optional().default(""),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  fontFamily: z.string().min(1).default("Arial"),
});

export const soundEffectSchema = z.object({
  type: z.string().min(1),
  url: z.string().optional(),
  start: z.number().nonnegative(),
  duration: z.number().positive().optional(),
  volume: z.number().min(0).max(1).optional(),
  loop: z.boolean().optional(),
});

export const captionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  start: z.number().nonnegative(),
  end: z.number().positive(),
  style: z
    .enum(["centered", "bottom", "highlighted", "kinetic", "word-emphasis"])
    .optional(),
  emphasis: z.array(z.string()).optional(),
  animation: animationConfigSchema.optional(),
});

export const cameraConfigSchema = z.object({
  type: z.enum([
    "zoom-in",
    "zoom-out",
    "pan-left",
    "pan-right",
    "pan-up",
    "pan-down",
    "shake",
    "rotate",
    "overshoot",
    "light-move",
    "parallax",
  ]),
  intensity: z.number().min(0).optional(),
  duration: z.number().positive().optional(),
  ease: z.string().optional(),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
  zoom: z.number().positive().optional(),
});

export const sceneElementSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(["text", "image", "logo", "shape"]),
    text: z.string().optional(),
    src: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    color: z.string().optional(),
    opacity: z.number().min(0).max(1).optional(),
    animation: animationConfigSchema.optional(),
    transitionIn: transitionConfigSchema.optional(),
    transitionOut: transitionConfigSchema.optional(),
    fit: z.enum(["cover", "contain"]).optional(),
    position: z
      .enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"])
      .optional(),
    scale: z.number().positive().optional(),
    rotation: z.number().optional(),
    blur: z.number().nonnegative().optional(),
  })
  .refine(
    (value) => {
      if (value.type === "text")
        return typeof value.text === "string" && value.text.length > 0;
      if (value.type === "image")
        return typeof value.src === "string" && value.src.length > 0;
      if (value.type === "logo")
        return typeof value.src === "string" || typeof value.text === "string";
      return typeof value.color === "string";
    },
    {
      message: "Element content is invalid for its type.",
    },
  );

export const sceneSchema = z.object({
  id: z.string().optional(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  type: z.enum([
    "hook",
    "text",
    "kinetic",
    "image",
    "logo",
    "caption",
    "mixed",
  ]),
  background: z.string().optional(),
  elements: z.array(sceneElementSchema).min(1),
  transitionIn: transitionConfigSchema.optional(),
  transitionOut: transitionConfigSchema.optional(),
  camera: cameraConfigSchema.optional(),
  soundEffects: z.array(z.string()).optional(),
});

export const motionProjectSpecificationSchema = z.object({
  id: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  fps: z.number().int().positive().min(1).max(120),
  duration: z.number().positive(),
  background: z.string().min(1),
  voiceover: voiceoverSchema,
  brand: brandSettingsSchema,
  assets: z.array(z.string()).default([]),
  scenes: z.array(sceneSchema).min(1),
  captions: z.array(captionSchema).default([]),
  soundEffects: z.array(soundEffectSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type MotionProjectSpecificationInput = z.infer<
  typeof motionProjectSpecificationSchema
>;
