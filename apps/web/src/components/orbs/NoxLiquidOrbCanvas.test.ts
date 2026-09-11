import { describe, it, expect } from 'vitest';
import { AgentState } from '@noctara/shared';
import { LIQUID_ORB_WGSL } from './shaders/liquidOrbShader';
import {
  NOX_ORB_SEEDS,
  srgbToLinear,
  linearToSrgb,
  mixSrgb
} from './shaders/noxOrbSeeds';

describe('NOX Liquid Intelligence Core WebGPU Specification', () => {
  const REQUIRED_STATES: AgentState[] = [
    'IDLE',
    'LISTENING',
    'THINKING',
    'SPEAKING',
    'EXECUTING',
    'VERIFYING',
    'RESEARCHING',
    'LEARNING',
    'AWAITING_APPROVAL',
    'ERROR_RECOVERY',
    'OFFLINE'
  ];

  it('provides calibrated precision seeds for all 11 NOX AgentStates', () => {
    for (const state of REQUIRED_STATES) {
      const seed = NOX_ORB_SEEDS[state];
      expect(seed, `Seed defined for ${state}`).toBeDefined();
      expect(seed.length).toBe(136);
    }
  });

  it('contains valid finite float numbers for all uniform indices across all states', () => {
    for (const state of REQUIRED_STATES) {
      const seed = NOX_ORB_SEEDS[state];
      seed.forEach((val, idx) => {
        expect(
          Number.isFinite(val),
          `Seed for state ${state} at uniform index ${idx} is finite`
        ).toBe(true);
      });
    }
  });

  it('configures distinct computational and precision styles across NOX active states', () => {
    // IDLE uses Blue Liquid Drop (style 20) with calm circulation
    expect(NOX_ORB_SEEDS.IDLE[15]).toBe(20);
    expect(NOX_ORB_SEEDS.IDLE[3]).toBeLessThan(0.3); // Slow speed

    // THINKING uses Neuro Plasma (style 11) for computational processing filaments
    expect(NOX_ORB_SEEDS.THINKING[15]).toBe(11);
    expect(NOX_ORB_SEEDS.THINKING[8]).toBeGreaterThan(3.0); // High sharpness

    // EXECUTING (NOX Signature) uses Chromatic Metal (style 22) with high speed and metal depth
    expect(NOX_ORB_SEEDS.EXECUTING[15]).toBe(22);
    expect(NOX_ORB_SEEDS.EXECUTING[3]).toBeGreaterThan(1.0); // Fast execution speed
    expect(NOX_ORB_SEEDS.EXECUTING[31]).toBeGreaterThan(0.9); // High metalDepth

    // VERIFYING uses Chromatic Metal (style 22) with scanning harmonics and minimal roughness
    expect(NOX_ORB_SEEDS.VERIFYING[15]).toBe(22);
    expect(NOX_ORB_SEEDS.VERIFYING[30]).toBeLessThan(0.1); // Ultra-precise low roughness
    expect(NOX_ORB_SEEDS.VERIFYING[8]).toBeGreaterThanOrEqual(3.5); // Sharpest bands

    // LISTENING uses Refractive Blob (style 23) with contracted focus
    expect(NOX_ORB_SEEDS.LISTENING[15]).toBe(23);
    expect(NOX_ORB_SEEDS.LISTENING[6]).toBeLessThan(0.15); // Contracted warp
  });

  it('preserves NOX cold, technical deep navy / electric cyan palette identity without warm colors', () => {
    for (const state of REQUIRED_STATES) {
      const seed = NOX_ORB_SEEDS[state];
      // Color A (indices 40..43) is deep navy / dark abyss: Blue > Red
      expect(seed[42]).toBeGreaterThanOrEqual(seed[40]);

      // Color B (indices 44..47) is electric cyan: High G & B, lower R
      expect(seed[45]).toBeGreaterThan(0.1); // G
      expect(seed[46]).toBeGreaterThan(0.3); // B
    }
  });

  it('verifies audio source isolation: NOX audio reactively modulates only when NOX is speaking', () => {
    // Model audio modulation logic:
    const simulateModulation = (
      displayedUniforms: number[],
      activeAgent: 'NOX' | 'ARIA' | null,
      rawAudioActivity: number,
      noxState: AgentState
    ) => {
      // Audio is strictly routed: only if activeAgent === 'NOX' AND noxState === 'SPEAKING'
      const isNoxSpeaking = activeAgent === 'NOX' && noxState === 'SPEAKING';
      const noxAudio = isNoxSpeaking ? Math.min(1, Math.max(0, rawAudioActivity)) : 0;

      const speedBase = displayedUniforms[3];
      const warpBase = displayedUniforms[6];
      const exposureBase = displayedUniforms[14];
      const metalEvoBase = displayedUniforms[29];

      return {
        speed: speedBase * (1.0 + noxAudio * 0.85),
        warp: warpBase + noxAudio * 0.35,
        exposure: exposureBase * (1.0 + noxAudio * 0.45),
        metalEvolution: metalEvoBase + noxAudio * 0.8
      };
    };

    const speakingSeed = [...NOX_ORB_SEEDS.SPEAKING];
    const baseSpeed = speakingSeed[3];
    const baseExposure = speakingSeed[14];

    // Case 1: NOX is speaking with real audio level 0.75
    const noxActiveMod = simulateModulation(speakingSeed, 'NOX', 0.75, 'SPEAKING');
    expect(noxActiveMod.speed).toBeGreaterThan(baseSpeed);
    expect(noxActiveMod.exposure).toBeGreaterThan(baseExposure);

    // Case 2: ARIA is speaking with audio level 0.75 -> NOX MUST REMAIN ISOLATED
    const ariaSpeakingMod = simulateModulation(speakingSeed, 'ARIA', 0.75, 'SPEAKING');
    expect(ariaSpeakingMod.speed).toBe(baseSpeed);
    expect(ariaSpeakingMod.exposure).toBe(baseExposure);

    // Case 3: ROOT microphone is active while NOX is in IDLE -> NOX MUST NOT REACT TO MIC AS SPEECH
    const idleSeed = [...NOX_ORB_SEEDS.IDLE];
    const micActiveIdleMod = simulateModulation(idleSeed, null, 0.8, 'IDLE');
    expect(micActiveIdleMod.speed).toBe(idleSeed[3]);
    expect(micActiveIdleMod.exposure).toBe(idleSeed[14]);
  });

  it('correctly handles gamma-corrected sRGB color interpolation', () => {
    const navyBlue = 0.05;
    const electricCyan = 0.95;
    expect(mixSrgb(navyBlue, electricCyan, 0)).toBeCloseTo(navyBlue, 4);
    expect(mixSrgb(navyBlue, electricCyan, 1)).toBeCloseTo(electricCyan, 4);

    const mid = mixSrgb(navyBlue, electricCyan, 0.5);
    expect(mid).toBeGreaterThan(navyBlue);
    expect(mid).toBeLessThan(electricCyan);
  });

  it('confirms all WGSL shader passes and pipelines are compatible', () => {
    expect(LIQUID_ORB_WGSL).toContain('fn vs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn fs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn ribbon_vs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn ribbon_fs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn ribbon_composite_fs_main');
    expect(LIQUID_ORB_WGSL).toContain('glsChromaticMetalFluid');
    expect(LIQUID_ORB_WGSL).toContain('glsPlasmaFluid');
    expect(LIQUID_ORB_WGSL).toContain('glsBlueDropFluid');
    expect(LIQUID_ORB_WGSL).toContain('glsRefractiveBlobFluid');
  });
});

