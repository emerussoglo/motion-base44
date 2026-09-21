import type { AnimationConfig } from "@/lib/types/motion";

export type KineticMode =
  | "wordByWord"
  | "characterByCharacter"
  | "highlightWord"
  | "scaleWord"
  | "popWord"
  | "shakeWord"
  | "rotateWord"
  | "jumpWord"
  | "maskReveal"
  | "splitReveal";

export interface KineticSegment {
  text: string;
  mode: KineticMode;
  emphasis?: boolean;
  index: number;
  color?: string;
  scale?: number;
  delay?: number;
  animation?: AnimationConfig;
}

export function generateKineticSegments(
  text: string,
  emphasisPhrase?: string,
): KineticSegment[] {
  const words = text.split(/\s+/);
  const target = emphasisPhrase?.trim().toLowerCase();

  return words.map((word, index) => {
    const normalized = word.toLowerCase();
    const isEmphasis = Boolean(target && normalized.includes(target));
    return {
      text: word,
      mode: index % 2 === 0 ? "wordByWord" : "scaleWord",
      emphasis: isEmphasis,
      index,
      color: isEmphasis ? "#00D47E" : undefined,
      scale: isEmphasis ? 1.18 : 1,
      delay: index * 0.08,
    };
  });
}

export function buildKineticText(text: string, emphasisPhrase?: string) {
  return {
    raw: text,
    emphasisPhrase: emphasisPhrase ?? "gagner du temps",
    segments: generateKineticSegments(text, emphasisPhrase),
  };
}
