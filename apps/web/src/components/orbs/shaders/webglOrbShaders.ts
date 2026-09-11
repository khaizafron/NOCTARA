/**
 * WebGL 1.0 / 2.0 Procedural Liquid Glass Orb Shaders
 * Provides full visual parity with the WebGPU renderer for mobile devices
 * (iOS Safari, Android Chrome, tablets) and platforms without WebGPU support.
 */

export const QUAD_VS = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * ARIA: Ethereal Liquid Violet-Lavender Intelligence Sphere
 * Complete with volumetric fluid wave bands, Snell glass boundary refraction,
 * Fresnel glow, chromatic dispersion, and vocal audio resonance.
 */
export const ARIA_WEBGL_FS = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio;
uniform int u_state; // 0:IDLE, 1:LISTENING, 2:THINKING, 3:SPEAKING, etc.

mat2 rot2d(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = rot2d(0.37);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.05 + vec2(1.2, -0.8);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float dist = length(uv);
  float R = 0.76;

  float aura = exp(-dist * dist * 3.8);
  vec3 auraColor = mix(vec3(0.55, 0.35, 0.95), vec3(0.25, 0.65, 0.98), uv.y * 0.5 + 0.5) * aura * 0.42;

  if (dist > R) {
    float rimFade = smoothstep(R + 0.18, R, dist);
    gl_FragColor = vec4(auraColor * rimFade, aura * rimFade * 0.6);
    return;
  }

  float z = sqrt(max(R * R - dist * dist, 0.0));
  vec3 N = normalize(vec3(uv, z));

  vec2 refrP = uv * 1.18 + N.xy * 0.16;

  float speed = 0.9 + u_audio * 0.85;
  if (u_state == 2) speed *= 1.4;
  if (u_state == 3) speed *= 1.25;
  float t = u_time * speed;

  vec2 q = rot2d(t * 0.15) * refrP;
  float drift = t * 1.8;
  float envelope = cos(clamp(dist / R, 0.0, 1.0) * 1.5707);
  envelope = envelope * envelope;

  float wave1 = sin(q.x * 2.4 + drift) * 0.32 * envelope;
  float wave2 = sin(q.x * 3.8 - drift * 0.7 + 1.4) * 0.18 * envelope;
  float fbmFlow = (fbm(q * 2.2 + vec2(t * 0.3, -t * 0.2)) - 0.5) * 0.35;

  float mainBand = abs(q.y - wave1 - fbmFlow);
  float secBand = abs(q.y - wave2 + fbmFlow * 0.5);

  float coreLine = exp(-mainBand * mainBand * 32.0);
  float glowBand = exp(-mainBand * 4.5);
  float secLine = exp(-secBand * secBand * 24.0);

  vec3 cDeep = vec3(0.08, 0.03, 0.22);
  vec3 cViolet = vec3(0.52, 0.25, 0.95);
  vec3 cElectricBlue = vec3(0.22, 0.65, 0.98);
  vec3 cMagenta = vec3(0.88, 0.32, 0.82);
  vec3 cLavender = vec3(0.78, 0.72, 1.0);
  vec3 cWhite = vec3(0.98, 0.98, 1.0);

  vec3 fluidColor = cDeep;
  fluidColor = mix(fluidColor, cViolet, glowBand * 0.9);
  fluidColor = mix(fluidColor, cElectricBlue, coreLine * 0.85);
  fluidColor = mix(fluidColor, cMagenta, secLine * 0.75);
  fluidColor = mix(fluidColor, cLavender, (coreLine * secLine) * 1.2);
  fluidColor += cWhite * exp(-mainBand * mainBand * 120.0) * (0.8 + u_audio * 0.6);

  float fresnel = pow(1.0 - z / R, 2.6);
  vec3 rimColor = mix(cElectricBlue, cMagenta, N.x * 0.5 + 0.5);
  fluidColor += rimColor * fresnel * 1.1;

  vec3 lightDir = normalize(vec3(-0.45, 0.65, 0.85));
  float spec = pow(max(dot(N, lightDir), 0.0), 18.0);
  fluidColor += cWhite * spec * 0.35;

  float edgeAlpha = smoothstep(R, R - 0.015, dist);
  vec3 finalColor = fluidColor + auraColor * 0.25;

  gl_FragColor = vec4(finalColor * edgeAlpha, edgeAlpha);
}
`;

/**
 * NOX: Computational Liquid Intelligence Core
 * Complete with deep navy abyss, electric cyan hydrodynamic circulation,
 * ultramarine depth, metallic scan harmonics, and vocal audio resonance.
 */
export const NOX_WEBGL_FS = `
precision highp float;
varying vec2 v_uv;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio;
uniform int u_state; // 0:IDLE, 1:LISTENING, 2:THINKING, 3:SPEAKING, 4:EXECUTING, etc.

mat2 rot2d(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  p = fract(p * vec2(178.43, 892.12));
  p += dot(p, p + 67.89);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = rot2d(0.48);
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = r * p * 2.12 + vec2(0.9, -1.1);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float dist = length(uv);
  float R = 0.76;

  float aura = exp(-dist * dist * 3.8);
  vec3 auraColor = mix(vec3(0.0, 0.55, 0.95), vec3(0.0, 0.9, 1.0), uv.y * 0.5 + 0.5) * aura * 0.38;

  if (dist > R) {
    float rimFade = smoothstep(R + 0.18, R, dist);
    gl_FragColor = vec4(auraColor * rimFade, aura * rimFade * 0.6);
    return;
  }

  float z = sqrt(max(R * R - dist * dist, 0.0));
  vec3 N = normalize(vec3(uv, z));

  float speed = 0.95 + u_audio * 0.9;
  if (u_state == 4) speed = 2.4;
  if (u_state == 6) speed = 1.6;
  if (u_state == 2) speed = 1.8;
  if (u_state == 3) speed = 1.35;
  float t = u_time * speed;

  vec2 refrP = uv * 1.15 + N.xy * 0.18;

  float rotAngle = -0.24 + t * 0.28 + sin(t * 0.45) * 0.15;
  vec2 q = rot2d(rotAngle) * refrP;

  vec2 driftA = vec2(t * 0.28, -t * 0.18);
  vec2 driftB = vec2(-t * 0.18, t * 0.24);
  float f1 = fbm(q * 1.8 + driftA);
  float f2 = fbm(rot2d(1.1) * q * 2.2 + driftB);

  vec2 flowed = q + vec2(f1 - 0.5, f2 - 0.5) * 0.42;
  flowed.x += sin(flowed.y * 2.8 + t * 0.85) * 0.08;
  flowed.y += sin(flowed.x * 2.2 - t * 0.75) * 0.09;

  float body = fbm(flowed * 2.2 + vec2(t * 0.16, -t * 0.12));
  float marble = abs(sin(flowed.x * 4.2 + flowed.y * 3.1 + t * 0.65));
  float fluidPattern = mix(body, body * 0.65 + marble * 0.45, 0.45);

  float execBands = 0.0;
  if (u_state == 4 || u_state == 6) {
    execBands = pow(abs(cos(flowed.y * 18.0 + t * 4.2)), 8.0) * 0.65;
  }
  float thinkFilaments = 0.0;
  if (u_state == 2) {
    thinkFilaments = pow(abs(cos(flowed.x * 14.0 + flowed.y * 14.0 - t * 3.2)), 5.0) * 0.55;
  }

  vec3 cNavyAbyss = vec3(0.01, 0.025, 0.09);
  vec3 cUltramarine = vec3(0.0, 0.18, 0.65);
  vec3 cSteelBlue = vec3(0.12, 0.48, 0.88);
  vec3 cElectricCyan = vec3(0.0, 0.88, 1.0);
  vec3 cWhiteHot = vec3(0.92, 0.98, 1.0);

  vec3 fluidColor = cNavyAbyss;
  fluidColor = mix(fluidColor, cUltramarine, smoothstep(0.12, 0.55, fluidPattern));
  fluidColor = mix(fluidColor, cSteelBlue, smoothstep(0.45, 0.78, fluidPattern));
  fluidColor = mix(fluidColor, cElectricCyan, smoothstep(0.72, 0.98, fluidPattern));

  fluidColor += cElectricCyan * execBands;
  fluidColor += cWhiteHot * thinkFilaments;

  float nucleus = exp(-dist * dist * 9.5) * (0.8 + u_audio * 0.8);
  fluidColor += cElectricCyan * nucleus * 0.75;
  fluidColor += cWhiteHot * exp(-dist * dist * 28.0) * (0.6 + u_audio * 0.5);

  float fresnel = pow(1.0 - z / R, 2.8);
  fluidColor += cElectricCyan * fresnel * 1.25;

  vec3 lightDir = normalize(vec3(-0.48, 0.62, 0.88));
  float spec = pow(max(dot(N, lightDir), 0.0), 20.0);
  fluidColor += cWhiteHot * spec * 0.38;

  float edgeAlpha = smoothstep(R, R - 0.015, dist);
  vec3 finalColor = fluidColor + auraColor * 0.25;

  gl_FragColor = vec4(finalColor * edgeAlpha, edgeAlpha);
}
`;