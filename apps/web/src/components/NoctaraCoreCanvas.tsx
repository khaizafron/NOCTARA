'use client';

import React, { useEffect, useRef } from 'react';
import { AgentState } from '@noctara/shared';

interface CoreCanvasProps {
  state: AgentState;
  audioActivity?: number; // 0.0 to 1.0
  className?: string;
  size?: number; // CSS pixel dimensions (default 360)
}

// GLSL Vertex Shader: Simple full-screen quad
const VS_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// GLSL Fragment Shader: Volumetric raytraced AI intelligence sphere
const FS_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio;
uniform int u_state; // 0:IDLE, 1:LISTENING, 2:THINKING, 3:SPEAKING, 4:EXECUTING, 5:ERROR

// 2D Rotation
mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// 3D Simplex-style pseudo noise
vec3 hash33(vec3 p) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yxz + 19.19);
  return -1.0 + 2.0 * fract((p.xxy + p.yxx) * p.zyx);
}

float snoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  return mix(
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 0.0)), f - vec3(0.0, 0.0, 0.0)),
          dot(hash33(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0)),
          dot(hash33(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(
      mix(dot(hash33(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0)),
          dot(hash33(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0)), u.x),
      mix(dot(hash33(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0)),
          dot(hash33(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0)), u.x), u.y), u.z);
}

// Multi-octave fractional Brownian motion
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.55;
  mat2 r = rot(0.5);
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p.xy = r * p.xy;
    p = p * 2.15 + vec3(1.7, 0.8, 1.2);
    a *= 0.48;
  }
  return v;
}

void main() {
  vec2 coord = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  float dist = length(coord);

  // Core base radius with state breathing & audio reactivity
  float baseRadius = 0.32;
  float pulse = sin(u_time * 1.6) * 0.012;

  if (u_state == 1) { // LISTENING: responsive compression & ripple
    baseRadius -= 0.015 + u_audio * 0.02;
    pulse = sin(u_time * 4.0) * (0.015 + u_audio * 0.03);
  } else if (u_state == 2) { // THINKING: rapid energetic pulsation
    pulse = sin(u_time * 5.0) * 0.018;
  } else if (u_state == 3) { // SPEAKING: rhythmic amplitude expansion
    pulse = sin(u_time * 3.5) * 0.025 + u_audio * 0.04;
  } else if (u_state == 4) { // EXECUTING: focused high-energy vibration
    pulse = sin(u_time * 6.0) * 0.012;
  }

  float R = baseRadius + pulse;

  // Colors: NOCTARA signature palette
  vec3 c_deepVoid = vec3(0.02, 0.03, 0.08);       // Obsidian base
  vec3 c_indigo   = vec3(0.18, 0.12, 0.55);       // Royal ultraviolet
  vec3 c_cyan     = vec3(0.00, 0.88, 1.00);       // NOX electric cyan
  vec3 c_magenta  = vec3(0.82, 0.16, 0.68);       // Ethereal magenta
  vec3 c_amber    = vec3(1.00, 0.65, 0.12);       // ARIA solar gold
  vec3 c_white    = vec3(0.98, 0.99, 1.00);       // Specular nucleus

  // State color modulation
  if (u_state == 5) { // ERROR: chromatic solarized warning
    c_cyan = vec3(1.0, 0.2, 0.1);
    c_indigo = vec3(0.4, 0.05, 0.05);
  }

  // Atmospheric halo / bloom outside sphere
  float outerHalo = exp(-11.0 * max(0.0, dist - R));
  vec3 haloColor = mix(c_indigo, c_cyan, 0.55) * outerHalo * (0.45 + u_audio * 0.4);

  // Soft atmospheric outer ring
  float ring = smoothstep(0.02, 0.0, abs(dist - (R + 0.035 + u_audio * 0.02)));
  haloColor += c_cyan * ring * 0.35;

  if (dist > R + 0.14) {
    // Far outer void with subtle falloff
    gl_FragColor = vec4(haloColor, outerHalo * 0.6);
    return;
  }

  // Inside the sphere: 3D hemisphere ray-tracing
  float z = sqrt(max(0.0, R * R - dist * dist));
  vec3 normal = vec3(coord.x, coord.y, z) / R;
  vec3 view = vec3(0.0, 0.0, 1.0);

  // Fresnel rim lighting
  float fresnel = pow(1.0 - max(0.0, dot(normal, view)), 2.8);

  // Volumetric fluid coordinates with multi-frequency flow
  float flowSpeed = 0.55;
  if (u_state == 2) flowSpeed = 2.4; // THINKING: accelerated swirl
  if (u_state == 4) flowSpeed = 1.9; // EXECUTING: high energy flow
  if (u_state == 3) flowSpeed = 1.4; // SPEAKING: lively flow

  vec3 p = normal * 2.2;
  p.xy = rot(u_time * 0.25 * flowSpeed) * p.xy;
  p.yz = rot(u_time * 0.18 * flowSpeed) * p.yz;

  // Fluid noise sampling
  float n1 = fbm(p + vec3(0.0, 0.0, u_time * 0.35 * flowSpeed));
  float n2 = fbm(p * 1.6 - vec3(u_time * 0.25 * flowSpeed, 0.0, 0.0));
  float plasma = (n1 + n2 * 0.7) * 0.6 + 0.5; // 0.0 to 1.0

  // Multi-stop volumetric gradient interpolation
  vec3 sphereColor = mix(c_deepVoid, c_indigo, smoothstep(0.1, 0.5, plasma));
  sphereColor = mix(sphereColor, c_magenta, smoothstep(0.4, 0.75, plasma));
  sphereColor = mix(sphereColor, c_cyan, smoothstep(0.6, 0.9, plasma));

  // ARIA solar amber accent in deep layers
  float amberAccent = smoothstep(0.65, 0.95, n2);
  sphereColor = mix(sphereColor, c_amber, amberAccent * 0.45);

  // Internal luminous core nucleus
  float coreNucleus = exp(-8.5 * dist) * (1.0 + u_audio * 0.8);
  sphereColor += c_white * coreNucleus * 0.85;

  // Glass-like chromatic dispersion & Fresnel rim
  vec3 rimColor = mix(c_cyan, c_magenta, sin(u_time + normal.x * 3.0) * 0.5 + 0.5);
  sphereColor += rimColor * fresnel * 1.4;

  // Surface anti-aliasing blend into outer halo
  float alpha = smoothstep(R, R - 0.008, dist);
  vec3 finalColor = mix(haloColor, sphereColor + haloColor * 0.3, alpha);
  float finalAlpha = max(alpha, outerHalo * 0.85);

  gl_FragColor = vec4(finalColor, clamp(finalAlpha, 0.0, 1.0));
}
`;

export const NoctaraCoreCanvas: React.FC<CoreCanvasProps> = ({
  state,
  audioActivity = 0,
  className = '',
  size = 360
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<AgentState>(state);
  const audioRef = useRef<number>(audioActivity);

  // Keep mutable references updated without triggering re-renders
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioRef.current = audioActivity;
  }, [audioActivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Map AgentState to shader integer
    const getStateInt = (s: AgentState): number => {
      switch (s) {
        case 'LISTENING': return 1;
        case 'THINKING': return 2;
        case 'SPEAKING': return 3;
        case 'EXECUTING': return 4;
        case 'ERROR_RECOVERY': return 5;
        default: return 0; // IDLE, READY, AWAITING_APPROVAL, etc.
      }
    };

    // Try WebGL first
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    } catch {
      gl = null;
    }

    let animId: number;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    if (gl) {
      // -------------------------------------------------------------
      // WEBGL HIGH-FIDELITY VOLUMETRIC SPHERE RENDERER
      // -------------------------------------------------------------
      const compileShader = (type: number, src: string): WebGLShader | null => {
        const shader = gl!.createShader(type);
        if (!shader) return null;
        gl!.shaderSource(shader, src);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
          console.warn('Shader compile failed:', gl!.getShaderInfoLog(shader));
          gl!.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VS_SOURCE);
      const fs = compileShader(gl.FRAGMENT_SHADER, FS_SOURCE);

      if (!vs || !fs) {
        gl = null; // Fallback to 2D
      } else {
        const prog = gl.createProgram();
        if (!prog) {
          gl = null;
        } else {
          gl.attachShader(prog, vs);
          gl.attachShader(prog, fs);
          gl.linkProgram(prog);

          if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.warn('Program link failed:', gl.getProgramInfoLog(prog));
            gl = null;
          } else {
            gl.useProgram(prog);

            const posBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.bufferData(
              gl.ARRAY_BUFFER,
              new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
              gl.STATIC_DRAW
            );

            const aPos = gl.getAttribLocation(prog, 'a_position');
            gl.enableVertexAttribArray(aPos);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            const uRes = gl.getUniformLocation(prog, 'u_resolution');
            const uTime = gl.getUniformLocation(prog, 'u_time');
            const uAudio = gl.getUniformLocation(prog, 'u_audio');
            const uState = gl.getUniformLocation(prog, 'u_state');

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            let startTime = performance.now();
            let smoothedAudio = 0;

            const renderGL = () => {
              const now = performance.now();
              const elapsed = (now - startTime) * 0.001;

              // Smooth audio damping
              const targetAudio = audioRef.current;
              smoothedAudio += (targetAudio - smoothedAudio) * 0.14;

              gl!.clearColor(0, 0, 0, 0);
              gl!.clear(gl!.COLOR_BUFFER_BIT);

              gl!.uniform2f(uRes, canvas.width, canvas.height);
              gl!.uniform1f(uTime, elapsed);
              gl!.uniform1f(uAudio, smoothedAudio);
              gl!.uniform1i(uState, getStateInt(stateRef.current));

              gl!.drawArrays(gl!.TRIANGLES, 0, 6);
              animId = requestAnimationFrame(renderGL);
            };

            animId = requestAnimationFrame(renderGL);
            return () => {
              cancelAnimationFrame(animId);
              if (gl && prog) {
                gl.deleteProgram(prog);
                gl.deleteShader(vs);
                gl.deleteShader(fs);
              }
            };
          }
        }
      }
    }

    // -------------------------------------------------------------
    // CANVAS 2D PROCEDURAL FALLBACK (If WebGL is unavailable)
    // -------------------------------------------------------------
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    let angle = 0;
    let smoothedAudio = 0;

    const render2D = () => {
      const targetAudio = audioRef.current;
      smoothedAudio += (targetAudio - smoothedAudio) * 0.12;

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const currentState = stateRef.current;
      const speed = currentState === 'THINKING' ? 0.06 : currentState === 'EXECUTING' ? 0.04 : 0.018;
      angle += speed;

      const r = 90 + smoothedAudio * 35;

      // Layer 1: Ethereal atmospheric glow
      const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.8);
      halo.addColorStop(0, 'rgba(0, 229, 255, 0.28)');
      halo.addColorStop(0.5, 'rgba(99, 102, 241, 0.18)');
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Harmonic wave orbits
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle * (i % 2 === 0 ? 1 : -1) + (i * Math.PI) / 3);
        ctx.strokeStyle = i === 0 ? 'rgba(0, 229, 255, 0.45)' : i === 1 ? 'rgba(217, 70, 239, 0.35)' : 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r + i * 8, (r + i * 8) * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Layer 3: Solid volumetric sphere body
      const sphere = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 4, cx, cy, r);
      sphere.addColorStop(0, '#ffffff');
      sphere.addColorStop(0.2, '#00e5ff');
      sphere.addColorStop(0.5, '#6366f1');
      sphere.addColorStop(0.85, '#1e1b4b');
      sphere.addColorStop(1, '#050713');
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 35;
      ctx.fill();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render2D);
    };

    animId = requestAnimationFrame(render2D);
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Ambient background bloom halation */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-35 transition-all duration-700 pointer-events-none"
        style={{
          background:
            state === 'LISTENING'
              ? 'radial-gradient(circle, rgba(0,229,255,0.45) 0%, rgba(99,102,241,0.2) 50%, transparent 80%)'
              : state === 'SPEAKING'
              ? 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(217,70,239,0.25) 50%, transparent 80%)'
              : state === 'THINKING'
              ? 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(0,229,255,0.3) 50%, transparent 80%)'
              : state === 'ERROR_RECOVERY'
              ? 'radial-gradient(circle, rgba(239,68,68,0.45) 0%, rgba(185,28,28,0.2) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(0,229,255,0.25) 0%, rgba(99,102,241,0.15) 50%, transparent 80%)'
        }}
      />
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="relative z-10"
      />
    </div>
  );
};
