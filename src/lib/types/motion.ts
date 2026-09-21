export type SceneType =
  | "hook"
  | "text"
  | "kinetic"
  | "image"
  | "logo"
  | "caption"
  | "mixed";

export type AnimationType =
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "zoomIn"
  | "zoomOut"
  | "scaleIn"
  | "scaleOut"
  | "blurIn"
  | "blurOut"
  | "rotateIn"
  | "rotateOut"
  | "bounce"
  | "overshoot"
  | "reveal"
  | "maskReveal"
  | "typewriter"
  | "characterReveal"
  | "wordReveal"
  | "splitText"
  | "pop"
  | "shake";

export type TransitionType =
  | "fade"
  | "zoom"
  | "slide"
  | "wipe"
  | "blur"
  | "flash"
  | "scale"
  | "whip";

export type CaptionStyle =
  | "centered"
  | "bottom"
  | "highlighted"
  | "kinetic"
  | "word-emphasis";

export type CameraMotionType =
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

export type ElementType = "text" | "image" | "logo" | "shape";

export interface AnimationConfig {
  type: AnimationType;
  duration?: number;
  delay?: number;
  easing?: string;
  intensity?: number;
  direction?: "left" | "right" | "up" | "down";
  scale?: number;
  rotation?: number;
  startAt?: number;
}

export interface TransitionConfig {
  type: TransitionType;
  duration?: number;
  easing?: string;
  direction?: "left" | "right" | "up" | "down";
  intensity?: number;
}

export interface BrandSettings {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface Voiceover {
  url: string;
  volume: number;
}

export interface SoundEffect {
  type: string;
  url?: string;
  start: number;
  duration?: number;
  volume?: number;
  loop?: boolean;
}

export interface Caption {
  id?: string;
  text: string;
  start: number;
  end: number;
  style?: CaptionStyle;
  emphasis?: string[];
  animation?: AnimationConfig;
}

export interface SceneElement {
  id?: string;
  type: ElementType;
  text?: string;
  src?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  animation?: AnimationConfig;
  transitionIn?: TransitionConfig;
  transitionOut?: TransitionConfig;
  fit?: "cover" | "contain";
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "center";
  scale?: number;
  rotation?: number;
  blur?: number;
}

export interface TextElement extends SceneElement {
  type: "text";
  text: string;
}

export interface ImageElement extends SceneElement {
  type: "image";
  src: string;
}

export interface LogoElement extends SceneElement {
  type: "logo";
  src?: string;
  text?: string;
}

export interface ShapeElement extends SceneElement {
  type: "shape";
  color: string;
}

export interface CameraConfig {
  type: CameraMotionType;
  intensity?: number;
  duration?: number;
  ease?: string;
  offsetX?: number;
  offsetY?: number;
  zoom?: number;
}

export interface Scene {
  id?: string;
  start: number;
  duration: number;
  type: SceneType;
  background?: string;
  elements: SceneElement[];
  transitionIn?: TransitionConfig;
  transitionOut?: TransitionConfig;
  camera?: CameraConfig;
  soundEffects?: string[];
}

export interface MotionProjectSpecification {
  id: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  background: string;
  voiceover: Voiceover;
  brand: BrandSettings;
  assets: string[];
  scenes: Scene[];
  captions: Caption[];
  soundEffects: SoundEffect[];
  metadata?: Record<string, unknown>;
}

export interface RenderStatus {
  success: boolean;
  renderId: string;
  status: "queued" | "processing" | "completed" | "failed";
  videoUrl?: string;
  error?: string;
  outputPath?: string;
}

export interface RenderRequestBody extends MotionProjectSpecification {
  renderOptions?: {
    outputDir?: string;
    timeoutMs?: number;
  };
}
