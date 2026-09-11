import { AgentState } from '@noctara/shared';

export function srgbToLinear(value: number): number {
  return value <= 0.04045
    ? value / 12.92
    : Math.pow((value + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(value: number): number {
  return value <= 0.0031308
    ? value * 12.92
    : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
}

export function mixSrgb(from: number, to: number, progress: number): number {
  return linearToSrgb(
    srgbToLinear(from) + (srgbToLinear(to) - srgbToLinear(from)) * progress
  );
}

/**
 * ARIA Palette Definition:
 * Violet, Lavender, Electric Blue, Soft Magenta, Subtle Cyan, White highlights.
 * Ethereal, intelligent, fluid, premium.
 */

// Helper to construct a standard 136-float Lersent seed
function createAriaSeed(params: {
  speed: number;
  radius?: number;
  zoom?: number;
  warp: number;
  ridgeAmt: number;
  sharp: number;
  shade?: number;
  sheen?: number;
  gloss?: number;
  shellMidAlpha?: number;
  shellEdgeAlpha?: number;
  exposure: number;
  style?: number; // 9 = Siri Band, 10 = Aurora, 14 = Spectrum, 19 = Voice Wave, 24 = Particle Ribbon
  contourDeform?: number;
  ribbonBreath?: number;
  particleBloom?: number;
  colorA: [number, number, number, number]; // Primary Deep (Violet)
  colorB: [number, number, number, number]; // Electric Blue
  colorC: [number, number, number, number]; // Soft Magenta
  colorD: [number, number, number, number]; // Lavender / Ambient
  highlightColor?: [number, number, number, number];
  sheenColor?: [number, number, number, number];
  glowColor?: [number, number, number, number];
}): number[] {
  const seed = new Array(136).fill(0);

  seed[0] = 1; // size.x (filled at runtime)
  seed[1] = 1; // size.y (filled at runtime)
  seed[2] = 0; // time
  seed[3] = params.speed;
  seed[4] = params.radius ?? 0.72;
  seed[5] = params.zoom ?? 0.35;
  seed[6] = params.warp;
  seed[7] = params.ridgeAmt;
  seed[8] = params.sharp;
  seed[9] = params.shade ?? 0.12;
  seed[10] = params.sheen ?? 0.65;
  seed[11] = params.gloss ?? 0.28;
  seed[12] = params.shellMidAlpha ?? 0.26;
  seed[13] = params.shellEdgeAlpha ?? 0.18;
  seed[14] = params.exposure;
  seed[15] = params.style ?? 9; // Siri fluid bands
  seed[16] = 0.005; // edgeSoftness
  seed[17] = 0.25; // edgeGlow
  seed[18] = 0; // paletteCount
  seed[19] = 1.0; // glassEnabled
  seed[20] = 0.85; // glassOpacity
  seed[21] = params.contourDeform ?? 0.0;
  seed[22] = 2.0; // bandDensity
  seed[23] = 0.45; // chromaticShift
  seed[24] = 0.77; // metalScale
  seed[25] = 0.23; // metalStretch
  seed[26] = 65; // metalAngle
  seed[27] = 0;
  seed[28] = 0;
  seed[29] = 1.0; // metalEvolution
  seed[30] = 0.22;
  seed[31] = 0.25;
  seed[32] = 0.75; // particleDensity
  seed[33] = 5.0; // ribbonCount
  seed[34] = 0.42; // ribbonWidth
  seed[35] = 1.25; // ribbonTwist
  seed[36] = 0.55; // ribbonFold
  seed[37] = params.ribbonBreath ?? 0.3;
  seed[38] = 1.2; // particleSize
  seed[39] = params.particleBloom ?? 0.75;

  // Colors
  const hl = params.highlightColor ?? [0.98, 0.98, 1.0, 1.0];
  const sheen = params.sheenColor ?? [0.77, 0.66, 1.0, 1.0];
  const glow = params.glowColor ?? [0.55, 0.36, 0.96, 1.0];

  seed.splice(40, 4, ...params.colorA);
  seed.splice(44, 4, ...params.colorB);
  seed.splice(48, 4, ...params.colorC);
  seed.splice(52, 4, ...params.colorD);
  seed.splice(56, 4, ...hl);
  seed.splice(60, 4, 1.0, 1.0, 1.0, 1.0); // shellInner
  seed.splice(64, 4, 0.61, 0.95, 1.0, 1.0); // shellMid (subtle cyan)
  seed.splice(68, 4, 0.77, 0.66, 1.0, 1.0); // shellEdge (lavender)
  seed.splice(72, 4, ...sheen);
  seed.splice(76, 4, 0.86, 0.92, 1.0, 1.0); // specColor
  seed.splice(80, 4, 0.0, 0.0, 0.0, 0.0); // canvasColor (premultiplied transparent)
  seed.splice(84, 4, ...glow);

  // Palette stops (smooth spectral ramp from deep violet through electric blue, lavender, soft magenta, cyan)
  const stops: [number, number, number, number][] = [
    [0.96, 0.98, 1.0, 1.0],
    [0.88, 0.93, 0.98, 1.0],
    [0.83, 0.90, 0.97, 1.0],
    [0.73, 0.84, 0.96, 1.0],
    [0.65, 0.78, 0.94, 1.0],
    [0.55, 0.45, 0.95, 1.0], // violet
    [0.45, 0.62, 0.95, 1.0], // electric blue
    [0.85, 0.40, 0.90, 1.0], // soft magenta
    [0.25, 0.85, 0.95, 1.0], // subtle cyan
    [0.72, 0.55, 1.0, 1.0],  // lavender
    [0.50, 0.35, 0.90, 1.0],
    [0.35, 0.25, 0.75, 1.0]
  ];

  for (let i = 0; i < 12; i++) {
    seed.splice(88 + i * 4, 4, ...stops[i]);
  }

  return seed;
}

// 1. ARIA IDLE: Calm, breathing ethereal liquid violet-lavender orb
const ariaIdleSeed = createAriaSeed({
  speed: 0.26,
  warp: 1.68,
  ridgeAmt: 0.24,
  sharp: 2.0,
  exposure: 1.45,
  style: 9,
  contourDeform: 0.04,
  ribbonBreath: 0.25,
  particleBloom: 0.65,
  colorA: [0.55, 0.35, 0.92, 1.0], // Deep Violet
  colorB: [0.25, 0.55, 0.98, 1.0], // Electric Blue
  colorC: [0.85, 0.35, 0.78, 1.0], // Soft Magenta
  colorD: [0.72, 0.62, 0.98, 1.0], // Ethereal Lavender
  glowColor: [0.55, 0.35, 0.92, 1.0]
});

// 2. ARIA LISTENING: Heightened sensitivity, subtle cyan & electric blue waves
const ariaListeningSeed = createAriaSeed({
  speed: 0.52,
  warp: 2.4,
  ridgeAmt: 0.38,
  sharp: 2.2,
  exposure: 1.75,
  style: 9,
  contourDeform: 0.18,
  ribbonBreath: 0.45,
  particleBloom: 0.9,
  colorA: [0.25, 0.55, 0.98, 1.0], // Electric Blue
  colorB: [0.15, 0.82, 0.95, 1.0], // Cyan Alert
  colorC: [0.65, 0.40, 0.95, 1.0], // Violet
  colorD: [0.80, 0.92, 1.0, 1.0],  // Ice White
  glowColor: [0.15, 0.82, 0.95, 1.0]
});

// 3. ARIA THINKING: Rapid neural plasma & vibrant filament interference
const ariaThinkingSeed = createAriaSeed({
  speed: 0.88,
  warp: 3.4,
  ridgeAmt: 0.52,
  sharp: 2.4,
  exposure: 2.1,
  style: 9,
  contourDeform: 0.22,
  ribbonBreath: 0.65,
  particleBloom: 1.1,
  colorA: [0.68, 0.28, 0.95, 1.0], // Electric Violet
  colorB: [0.35, 0.65, 1.0, 1.0],  // Vivid Blue
  colorC: [0.95, 0.35, 0.75, 1.0], // Vivid Magenta
  colorD: [0.85, 0.75, 1.0, 1.0],  // Lavender
  glowColor: [0.85, 0.35, 0.75, 1.0]
});

// 4. ARIA SPEAKING: Vocal fluid resonance, rich vocal crests, high dynamic range
const ariaSpeakingSeed = createAriaSeed({
  speed: 0.72,
  warp: 2.8,
  ridgeAmt: 0.48,
  sharp: 2.3,
  exposure: 2.05,
  style: 9,
  contourDeform: 0.28,
  ribbonBreath: 0.85,
  particleBloom: 1.25,
  colorA: [0.62, 0.32, 0.96, 1.0], // Radiant Violet
  colorB: [0.20, 0.70, 0.98, 1.0], // Radiant Cyan-Blue
  colorC: [0.92, 0.42, 0.82, 1.0], // Soft Magenta
  colorD: [0.78, 0.68, 1.0, 1.0],  // Lavender Crest
  glowColor: [0.62, 0.32, 0.96, 1.0]
});

// 5. ARIA RESEARCHING: Aurora ribbons, deep exploratory spectrum
const ariaResearchingSeed = createAriaSeed({
  speed: 0.48,
  warp: 2.2,
  ridgeAmt: 0.35,
  sharp: 2.1,
  exposure: 1.7,
  style: 10, // Aurora curtains
  contourDeform: 0.12,
  ribbonBreath: 0.4,
  particleBloom: 0.85,
  colorA: [0.45, 0.30, 0.85, 1.0],
  colorB: [0.20, 0.80, 0.90, 1.0],
  colorC: [0.75, 0.35, 0.90, 1.0],
  colorD: [0.60, 0.75, 1.0, 1.0],
  glowColor: [0.20, 0.80, 0.90, 1.0]
});

// 6. ARIA LEARNING: Crystalline iridescent opal evolution
const ariaLearningSeed = createAriaSeed({
  speed: 0.42,
  warp: 2.1,
  ridgeAmt: 0.32,
  sharp: 2.2,
  exposure: 1.65,
  style: 13, // Opal interference
  contourDeform: 0.08,
  ribbonBreath: 0.35,
  particleBloom: 0.8,
  colorA: [0.55, 0.40, 0.95, 1.0],
  colorB: [0.35, 0.70, 0.95, 1.0],
  colorC: [0.88, 0.45, 0.78, 1.0],
  colorD: [0.82, 0.88, 1.0, 1.0],
  glowColor: [0.55, 0.40, 0.95, 1.0]
});

// 7. ARIA ERROR_RECOVERY: Fractured amber-magenta distress pulse
const ariaErrorSeed = createAriaSeed({
  speed: 0.82,
  warp: 3.2,
  ridgeAmt: 0.65,
  sharp: 2.8,
  exposure: 1.85,
  style: 9,
  contourDeform: 0.35,
  ribbonBreath: 0.7,
  particleBloom: 1.2,
  colorA: [0.95, 0.25, 0.20, 1.0], // Crimson Warning
  colorB: [0.95, 0.55, 0.15, 1.0], // Amber Distress
  colorC: [0.65, 0.20, 0.75, 1.0], // Fractured Violet
  colorD: [1.0, 0.85, 0.60, 1.0],
  glowColor: [0.95, 0.35, 0.20, 1.0]
});

// 8. ARIA OFFLINE: Dim, desaturated slow ember
const ariaOfflineSeed = createAriaSeed({
  speed: 0.05,
  warp: 0.8,
  ridgeAmt: 0.15,
  sharp: 1.5,
  exposure: 0.45,
  style: 9,
  contourDeform: 0.0,
  ribbonBreath: 0.05,
  particleBloom: 0.15,
  colorA: [0.20, 0.18, 0.28, 1.0], // Muted Slate Violet
  colorB: [0.15, 0.20, 0.30, 1.0],
  colorC: [0.25, 0.18, 0.28, 1.0],
  colorD: [0.30, 0.28, 0.38, 1.0],
  glowColor: [0.15, 0.12, 0.22, 1.0]
});

export const ARIA_ORB_SEEDS: Record<AgentState, number[]> = {
  IDLE: ariaIdleSeed,
  LISTENING: ariaListeningSeed,
  THINKING: ariaThinkingSeed,
  SPEAKING: ariaSpeakingSeed,
  RESEARCHING: ariaResearchingSeed,
  LEARNING: ariaLearningSeed,
  AWAITING_APPROVAL: ariaListeningSeed,
  VERIFYING: ariaResearchingSeed,
  EXECUTING: ariaSpeakingSeed,
  ERROR_RECOVERY: ariaErrorSeed,
  OFFLINE: ariaOfflineSeed
};

