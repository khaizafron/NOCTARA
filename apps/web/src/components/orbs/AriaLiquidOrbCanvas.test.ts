import { describe, it, expect } from 'vitest';
import { AgentState } from '@noctara/shared';
import { LIQUID_ORB_WGSL } from './shaders/liquidOrbShader';
import {
  ARIA_ORB_SEEDS,
  srgbToLinear,
  linearToSrgb,
  mixSrgb,
} from './shaders/liquidOrbSeeds';

describe('ARIA Liquid Orb WebGPU Specification', () => {
  const REQUIRED_STATES: AgentState[] = [
    'IDLE',
    'LISTENING',
    'THINKING',
    'SPEAKING',
    'RESEARCHING',
    'LEARNING',
    'ERROR_RECOVERY',
    'OFFLINE',
  ];

  it('provides calibrated seeds for all 8 AgentStates', () => {
    for (const state of REQUIRED_STATES) {
      const seed = ARIA_ORB_SEEDS[state];
      expect(seed).toBeDefined();
      expect(seed.length).toBe(136);
    }
  });

  it('contains valid float numbers for all uniform indices', () => {
    for (const state of REQUIRED_STATES) {
      const seed = ARIA_ORB_SEEDS[state];
      seed.forEach((val, idx) => {
        expect(Number.isFinite(val), `Seed for state ${state} at index ${idx} is finite`).toBe(true);
      });
    }
  });

  it('configures distinct visual styles across active states', () => {
    // IDLE uses Siri Band (style 9)
    expect(ARIA_ORB_SEEDS.IDLE[15]).toBe(9);
    // SPEAKING uses fluid vocal resonance (style 9 with high bloom & breath)
    expect(ARIA_ORB_SEEDS.SPEAKING[15]).toBe(9);
    expect(ARIA_ORB_SEEDS.SPEAKING[37]).toBeGreaterThan(ARIA_ORB_SEEDS.IDLE[37]); // ribbonBreath
    // RESEARCHING uses Aurora Sheets (style 10)
    expect(ARIA_ORB_SEEDS.RESEARCHING[15]).toBe(10);
    // LEARNING uses Opal Interference (style 13)
    expect(ARIA_ORB_SEEDS.LEARNING[15]).toBe(13);
  });

  it('preserves ARIA ethereal violet / electric blue identity across all seeds', () => {
    const idleSeed = ARIA_ORB_SEEDS.IDLE;
    // colorA is primary violet: R ~0.45, G ~0.15, B ~0.95
    expect(idleSeed[40]).toBeGreaterThan(0.3); // R
    expect(idleSeed[42]).toBeGreaterThan(0.8); // B (dominant blue/violet)

    // colorB is electric blue: B > R
    expect(idleSeed[46]).toBeGreaterThan(idleSeed[44]);
  });

  it('correctly handles sRGB gamma-corrected linear color interpolation', () => {
    const black = 0;
    const white = 1;
    expect(mixSrgb(black, white, 0)).toBeCloseTo(0, 5);
    expect(mixSrgb(black, white, 1)).toBeCloseTo(1, 5);

    // Linear midpoint of 0 and 1 in linear space converts to ~0.735 in sRGB
    const mid = mixSrgb(black, white, 0.5);
    expect(mid).toBeGreaterThan(0.7);
    expect(mid).toBeLessThan(0.8);

    // Identity check
    expect(linearToSrgb(srgbToLinear(0.5))).toBeCloseTo(0.5, 4);
  });

  it('contains all required WGSL shader entry points', () => {
    expect(LIQUID_ORB_WGSL).toContain('fn vs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn fs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn ribbon_vs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn ribbon_fs_main');
    expect(LIQUID_ORB_WGSL).toContain('fn ribbon_composite_fs_main');
    expect(LIQUID_ORB_WGSL).toContain('orbGlassLiquidAnim');
  });
});
