import { AgentState } from '@noctara/shared';
import { mixSrgb } from './liquidOrbSeeds';

export { srgbToLinear, linearToSrgb, mixSrgb } from './liquidOrbSeeds';

/**
 * NOX Visual Identity:
 * Cold, technical, powerful, precise, computational, autonomous.
 * Palette: Deep Navy, Electric Cyan, Ultramarine, Steel Blue, White-Hot Highlights.
 * No warm amber/gold/pink.
 */

interface NoxSeedParams {
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
  style?: number; // 11: Neuro Plasma, 20: Blue Liquid Drop, 22: Chromatic Metal, 23: Refractive Blob
  glassEnabled?: number;
  glassOpacity?: number;
  contourDeform?: number;
  bandDensity?: number;
  chromaticShift?: number;
  metalScale?: number;
  metalStretch?: number;
  metalAngle?: number;
  metalOffset?: number;
  metalPhase?: number;
  metalEvolution?: number;
  metalRoughness?: number;
  metalDepth?: number;
  colorA: [number, number, number, number]; // Deep Navy / Abyss
  colorB: [number, number, number, number]; // Electric Cyan / Primary Energy
  colorC: [number, number, number, number]; // Ultramarine / Deep Vector
  colorD: [number, number, number, number]; // Sky Blue / Cold Atmospheric Sheen
  highlightColor?: [number, number, number, number];
  shellInner?: [number, number, number, number];
  shellMid?: [number, number, number, number];
  shellEdge?: [number, number, number, number];
  sheenColor?: [number, number, number, number];
  specColor?: [number, number, number, number];
  glowColor?: [number, number, number, number];
}

function createNoxSeed(params: NoxSeedParams): number[] {
  const seed = new Array(136).fill(0);

  // Resolution & Base
  seed[0] = 1; // size.x
  seed[1] = 1; // size.y
  seed[2] = 0; // time
  seed[3] = params.speed;
  seed[4] = params.radius ?? 0.74;
  seed[5] = params.zoom ?? 0.42;
  seed[6] = params.warp;
  seed[7] = params.ridgeAmt;
  seed[8] = params.sharp;
  seed[9] = params.shade ?? 0.22;
  seed[10] = params.sheen ?? 0.85;
  seed[11] = params.gloss ?? 0.45;
  seed[12] = params.shellMidAlpha ?? 0.32;
  seed[13] = params.shellEdgeAlpha ?? 0.24;
  seed[14] = params.exposure;
  seed[15] = params.style ?? 22; // Default to Chromatic Metal / Computational Core

  // Edge & Glass Optics
  seed[16] = 0.005; // edgeSoftness
  seed[17] = 0.45;  // edgeGlow
  seed[18] = 0.0;   // paletteCount (0 = 4-stop custom ramp)
  seed[19] = params.glassEnabled ?? 1.0; // glass shell enabled
  seed[20] = params.glassOpacity ?? 0.78;
  seed[21] = params.contourDeform ?? 0.02;

  // Technical Metal / Harmonic Flow Parameters
  seed[22] = params.bandDensity ?? 2.5;
  seed[23] = params.chromaticShift ?? 0.35;
  seed[24] = params.metalScale ?? 0.48;
  seed[25] = params.metalStretch ?? 0.85;
  seed[26] = params.metalAngle ?? 45.0; // 45-degree tactical vector angle
  seed[27] = params.metalOffset ?? 0.0;
  seed[28] = params.metalPhase ?? 0.0;
  seed[29] = params.metalEvolution ?? 0.8;
  seed[30] = params.metalRoughness ?? 0.22;
  seed[31] = params.metalDepth ?? 0.75;

  // Particle / Ribbon defaults
  seed[32] = 0.85; // particleDensity
  seed[33] = 4.0;  // ribbonCount
  seed[34] = 0.45; // ribbonWidth
  seed[35] = 0.95; // ribbonTwist
  seed[36] = 0.55; // ribbonFold
  seed[37] = 0.32; // ribbonBreath
  seed[38] = 1.1;  // particleSize
  seed[39] = 0.65; // particleBloom

  // 16-byte aligned Colors (indices 40..87)
  const writeVec4 = (offset: number, rgba: [number, number, number, number]) => {
    seed[offset] = rgba[0];
    seed[offset + 1] = rgba[1];
    seed[offset + 2] = rgba[2];
    seed[offset + 3] = rgba[3];
  };

  writeVec4(40, params.colorA);
  writeVec4(44, params.colorB);
  writeVec4(48, params.colorC);
  writeVec4(52, params.colorD);
  writeVec4(56, params.highlightColor ?? [0.94, 0.99, 1.0, 1.0]); // White-hot cyan diamond
  writeVec4(60, params.shellInner ?? [0.01, 0.08, 0.22, 1.0]);    // Deep refractive shell
  writeVec4(64, params.shellMid ?? [0.0, 0.82, 1.0, 1.0]);        // Cyan rim dispersion
  writeVec4(68, params.shellEdge ?? [0.0, 0.45, 0.95, 1.0]);       // Ultramarine outer bevel
  writeVec4(72, params.sheenColor ?? [0.75, 0.95, 1.0, 1.0]);     // Polarized cold specular
  writeVec4(76, params.specColor ?? [0.0, 0.9, 1.0, 1.0]);        // Cyan fill specular
  writeVec4(80, [0.003, 0.008, 0.02, 0.0]);                      // Transparent canvas background
  writeVec4(84, params.glowColor ?? [0.0, 0.85, 1.0, 1.0]);       // Laser-cyan atmospheric bleed

  return seed;
}

// Canonical NOX Palettes
const NAVY_ABYSS: [number, number, number, number] = [0.008, 0.025, 0.085, 1.0];
const ELECTRIC_CYAN: [number, number, number, number] = [0.0, 0.9, 1.0, 1.0];
const ULTRAMARINE: [number, number, number, number] = [0.0, 0.28, 0.78, 1.0];
const STEEL_BLUE: [number, number, number, number] = [0.25, 0.65, 0.92, 1.0];
const CYAN_HOT: [number, number, number, number] = [0.85, 0.98, 1.0, 1.0];
const COLD_VIOLET_BLUE: [number, number, number, number] = [0.12, 0.15, 0.45, 1.0];

export const NOX_ORB_SEEDS: Record<AgentState, number[]> = {
  // 1. IDLE: Calm, powered, cold, machine waiting for instruction.
  IDLE: createNoxSeed({
    speed: 0.22,
    warp: 0.18,
    ridgeAmt: 0.25,
    sharp: 2.1,
    exposure: 0.85,
    style: 20, // Blue Liquid Drop / Coherent fluid mass
    metalEvolution: 0.4,
    metalRoughness: 0.28,
    metalDepth: 0.7,
    colorA: NAVY_ABYSS,
    colorB: [0.0, 0.65, 0.95, 1.0],
    colorC: ULTRAMARINE,
    colorD: [0.15, 0.5, 0.85, 1.0]
  }),

  // 2. LISTENING: Energy contracts inward, central highlight sharpens, ordered field.
  LISTENING: createNoxSeed({
    speed: 0.38,
    radius: 0.72,
    zoom: 0.48,
    warp: 0.12,
    ridgeAmt: 0.42,
    sharp: 2.8,
    exposure: 1.05,
    style: 23, // Refractive Blob with focused caustic ribbon
    contourDeform: 0.015,
    colorA: NAVY_ABYSS,
    colorB: ELECTRIC_CYAN,
    colorC: ULTRAMARINE,
    colorD: CYAN_HOT
  }),

  // 3. THINKING: Computational, high plasma frequency, directional filaments, "processing".
  THINKING: createNoxSeed({
    speed: 0.82,
    zoom: 0.52,
    warp: 0.45,
    ridgeAmt: 0.68,
    sharp: 3.2,
    exposure: 1.25,
    style: 11, // Neuro Plasma (intricate neural interference lines)
    chromaticShift: 0.4,
    colorA: NAVY_ABYSS,
    colorB: ELECTRIC_CYAN,
    colorC: [0.0, 0.4, 0.9, 1.0],
    colorD: CYAN_HOT,
    glowColor: ELECTRIC_CYAN
  }),

  // 4. EXECUTING: NOX's signature state. Directional energy, fast chromatic shear, high-power compute.
  EXECUTING: createNoxSeed({
    speed: 1.18,
    radius: 0.75,
    zoom: 0.58,
    warp: 0.55,
    ridgeAmt: 0.78,
    sharp: 3.4,
    exposure: 1.45,
    style: 22, // Chromatic Metal (intense directional travelling waves)
    metalEvolution: 1.75,
    metalRoughness: 0.12,
    metalDepth: 0.95,
    metalAngle: 35.0,
    metalStretch: 1.15,
    bandDensity: 3.8,
    chromaticShift: 0.52,
    colorA: [0.01, 0.03, 0.12, 1.0],
    colorB: ELECTRIC_CYAN,
    colorC: [0.05, 0.45, 1.0, 1.0],
    colorD: CYAN_HOT,
    glowColor: [0.0, 0.95, 1.0, 1.0]
  }),

  // 5. VERIFYING: Surgical precision, scanning-like internal behavior, tighter energy bands.
  VERIFYING: createNoxSeed({
    speed: 0.48,
    radius: 0.73,
    zoom: 0.44,
    warp: 0.08,
    ridgeAmt: 0.85,
    sharp: 3.8,
    exposure: 1.15,
    style: 22, // Chromatic Metal (tight scanning specular bands)
    metalEvolution: 0.55,
    metalRoughness: 0.06,
    metalDepth: 0.88,
    bandDensity: 4.8,
    chromaticShift: 0.22,
    colorA: NAVY_ABYSS,
    colorB: [0.35, 0.88, 1.0, 1.0],
    colorC: ULTRAMARINE,
    colorD: [0.92, 0.98, 1.0, 1.0]
  }),

  // 6. SPEAKING: Vocal cadence synthesis, vibrant radiant acoustic envelope.
  SPEAKING: createNoxSeed({
    speed: 0.65,
    zoom: 0.46,
    warp: 0.38,
    ridgeAmt: 0.48,
    sharp: 2.6,
    exposure: 1.2,
    style: 20, // Blue Liquid Drop with fluid acoustic resonance
    colorA: NAVY_ABYSS,
    colorB: ELECTRIC_CYAN,
    colorC: ULTRAMARINE,
    colorD: CYAN_HOT,
    glowColor: ELECTRIC_CYAN
  }),

  // 7. RESEARCHING: Broad exploratory scan, deep multi-dimensional search.
  RESEARCHING: createNoxSeed({
    speed: 0.58,
    zoom: 0.48,
    warp: 0.32,
    ridgeAmt: 0.52,
    sharp: 2.4,
    exposure: 1.08,
    style: 23, // Refractive Blob
    colorA: NAVY_ABYSS,
    colorB: [0.0, 0.75, 0.95, 1.0],
    colorC: COLD_VIOLET_BLUE,
    colorD: STEEL_BLUE
  }),

  // 8. LEARNING: Inward convergence, precise synchronization, state consolidation.
  LEARNING: createNoxSeed({
    speed: 0.35,
    radius: 0.71,
    zoom: 0.5,
    warp: 0.16,
    ridgeAmt: 0.58,
    sharp: 3.0,
    exposure: 1.12,
    style: 11, // Neuro Plasma (tight synaptic crystallization)
    colorA: NAVY_ABYSS,
    colorB: [0.1, 0.82, 1.0, 1.0],
    colorC: ULTRAMARINE,
    colorD: [0.8, 0.95, 1.0, 1.0]
  }),

  // 9. AWAITING_APPROVAL: Deliberate visual hold, alert, awaiting ROOT authorization.
  AWAITING_APPROVAL: createNoxSeed({
    speed: 0.14,
    radius: 0.73,
    zoom: 0.4,
    warp: 0.1,
    ridgeAmt: 0.75,
    sharp: 2.9,
    exposure: 1.0,
    style: 22, // Chromatic Metal (stable metallic lattice)
    metalEvolution: 0.15,
    metalRoughness: 0.18,
    colorA: NAVY_ABYSS,
    colorB: [0.0, 0.7, 0.9, 1.0],
    colorC: ULTRAMARINE,
    colorD: [0.6, 0.85, 1.0, 1.0]
  }),

  // 10. ERROR_RECOVERY: Desynchronized energy, subtle chromatic shift, controlled instability.
  ERROR_RECOVERY: createNoxSeed({
    speed: 0.75,
    radius: 0.75,
    zoom: 0.55,
    warp: 0.72,
    ridgeAmt: 0.65,
    sharp: 2.2,
    exposure: 1.1,
    style: 23,
    contourDeform: 0.065,
    chromaticShift: 0.85, // Noticeable chromatic aberration warning
    colorA: [0.03, 0.015, 0.09, 1.0],
    colorB: [0.0, 0.85, 1.0, 1.0],
    colorC: [0.55, 0.08, 0.25, 1.0], // Deep ruby-cyan tension without tacky red flash
    colorD: [0.8, 0.35, 0.45, 1.0]
  }),

  // 11. OFFLINE: Dormant, minimal residual cold blue trace.
  OFFLINE: createNoxSeed({
    speed: 0.05,
    radius: 0.68,
    zoom: 0.3,
    warp: 0.05,
    ridgeAmt: 0.1,
    sharp: 1.5,
    exposure: 0.28,
    style: 20,
    colorA: [0.002, 0.005, 0.015, 1.0],
    colorB: [0.0, 0.2, 0.35, 1.0],
    colorC: [0.0, 0.08, 0.2, 1.0],
    colorD: [0.05, 0.15, 0.25, 1.0],
    glowColor: [0.0, 0.15, 0.25, 0.5]
  })
};

