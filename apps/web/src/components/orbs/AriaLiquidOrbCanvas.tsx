'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AgentState } from '@noctara/shared';
import { LIQUID_ORB_WGSL } from './shaders/liquidOrbShader';
import { ARIA_ORB_SEEDS, mixSrgb } from './shaders/liquidOrbSeeds';
import { QUAD_VS, ARIA_WEBGL_FS } from './shaders/webglOrbShaders';

export interface AriaLiquidOrbCanvasProps {
  state: AgentState;
  audioActivity?: number;
  size?: number;
  className?: string;
}

const RIBBON_STYLE_INDEX = 24;
const RIBBON_INSTANCE_COUNT = 221184;
const ACTIVATION_DURATION_MS = 350;
const SETTLE_DURATION_MS = 650;

export const AriaLiquidOrbCanvas: React.FC<AriaLiquidOrbCanvasProps> = ({
  state,
  audioActivity = 0,
  size = 112,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null);

  // Keep state & audioActivity refs for the animation loop
  const stateRef = useRef<AgentState>(state);
  const audioActivityRef = useRef<number>(audioActivity);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    audioActivityRef.current = audioActivity;
  }, [audioActivity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let stopped = false;
    let animationFrame = 0;
    let device: any = null;
    let ribbonTarget: any = null;
    let lastFrameAt: number | null = null;
    let motionPhase = 0;

    // Check WebGPU availability
    const hasWebGPU =
      typeof navigator !== 'undefined' &&
      'gpu' in navigator &&
      Boolean((navigator as any).gpu);

    if (!hasWebGPU) {
      setWebGpuSupported(false);
      startFallbackAnimation(canvas);
      return;
    }

    async function initWebGPU() {
      try {
        const navGpu = (navigator as any).gpu;
        if (!navGpu) {
          throw new Error('WebGPU unsupported');
        }

        const adapter = await navGpu.requestAdapter({
          powerPreference: 'high-performance',
        });
        if (!adapter) {
          throw new Error('No compatible WebGPU adapter');
        }

        const dev = await adapter.requestDevice();
        if (stopped) {
          dev.destroy();
          return;
        }
        device = dev;

        const context = canvas!.getContext('webgpu') as any;
        if (!context) {
          throw new Error('Unable to create WebGPU canvas context');
        }

        const format = navGpu.getPreferredCanvasFormat();
        context.configure({
          device: dev,
          format,
          alphaMode: 'premultiplied',
        });

        const shader = dev.createShaderModule({ code: LIQUID_ORB_WGSL });
        const compilation = await shader.getCompilationInfo();
        const errors = compilation.messages.filter((m: any) => m.type === 'error');
        if (errors.length > 0) {
          const errMsg = errors.map((m: any) => `${m.lineNum}:${m.linePos} ${m.message}`).join('\n');
          throw new Error(`WGSL Compile Error: ${errMsg}`);
        }

        const pipeline = dev.createRenderPipeline({
          layout: 'auto',
          vertex: { module: shader, entryPoint: 'vs_main' },
          fragment: {
            module: shader,
            entryPoint: 'fs_main',
            targets: [
              {
                format,
                blend: {
                  color: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add',
                  },
                  alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add',
                  },
                },
              },
            ],
          },
          primitive: { topology: 'triangle-list' },
        });

        const ribbonPipeline = dev.createRenderPipeline({
          layout: 'auto',
          vertex: { module: shader, entryPoint: 'ribbon_vs_main' },
          fragment: {
            module: shader,
            entryPoint: 'ribbon_fs_main',
            targets: [
              {
                format,
                blend: {
                  color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                  alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add',
                  },
                },
              },
            ],
          },
          primitive: { topology: 'triangle-list' },
        });

        const ribbonCompositePipeline = dev.createRenderPipeline({
          layout: 'auto',
          vertex: { module: shader, entryPoint: 'vs_main' },
          fragment: {
            module: shader,
            entryPoint: 'ribbon_composite_fs_main',
            targets: [
              {
                format,
                blend: {
                  color: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add',
                  },
                  alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add',
                  },
                },
              },
            ],
          },
          primitive: { topology: 'triangle-list' },
        });

        const initialSeed = ARIA_ORB_SEEDS[stateRef.current] || ARIA_ORB_SEEDS.IDLE;
        const displayedUniforms = new Float32Array(initialSeed);
        let fromUniforms = new Float32Array(initialSeed);
        let targetUniforms = new Float32Array(initialSeed);
        let currentState = stateRef.current;
        let transitionTargetState = currentState;
        let transitionStartedAt = performance.now();
        let activeTransitionDuration = 0;

        const uniformBuffer = dev.createBuffer({
          size: displayedUniforms.byteLength,
          usage: 0x0040 | 0x0008, // GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const bindGroup = dev.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });

        const ribbonBindGroup = dev.createBindGroup({
          layout: ribbonPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
        });

        const ribbonSampler = dev.createSampler({
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge',
          magFilter: 'linear',
          minFilter: 'linear',
        });

        let ribbonCompositeBindGroup: any = null;

        dev.lost.then(() => {
          if (!stopped) {
            setWebGpuSupported(false);
            startFallbackAnimation(canvas!);
          }
        });

        dev.addEventListener('uncapturederror', (event: any) => {
          console.warn('WebGPU uncaptured error:', event.error?.message);
        });

        setWebGpuSupported(true);

        function triggerStateTransition(nextState: AgentState) {
          if (nextState === currentState) return;
          const now = performance.now();
          sampleTransition(now);
          fromUniforms = new Float32Array(displayedUniforms);
          const nextSeed = ARIA_ORB_SEEDS[nextState] || ARIA_ORB_SEEDS.IDLE;
          targetUniforms = new Float32Array(nextSeed);
          transitionTargetState = nextState;
          transitionStartedAt = now;
          activeTransitionDuration =
            nextState === 'THINKING' ? ACTIVATION_DURATION_MS : SETTLE_DURATION_MS;
          currentState = nextState;
        }

        function transitionProgress(now: number) {
          if (activeTransitionDuration === 0) return 1;
          const raw = Math.min(
            1,
            Math.max(0, (now - transitionStartedAt) / activeTransitionDuration)
          );
          return transitionTargetState === 'THINKING'
            ? 1 - Math.pow(1 - raw, 3)
            : raw * raw * (3 - 2 * raw);
        }

        function sampleTransition(now: number) {
          const progress = transitionProgress(now);
          for (let index = 3; index < displayedUniforms.length; index += 1) {
            const colorComponent = index >= 40 && (index - 40) % 4 < 3;
            displayedUniforms[index] = colorComponent
              ? mixSrgb(fromUniforms[index], targetUniforms[index], progress)
              : fromUniforms[index] +
                (targetUniforms[index] - fromUniforms[index]) * progress;
          }
        }

        let consecutiveErrors = 0;

        function frame(now: number) {
          if (stopped || !canvas) return;

          try {
            if (canvas.clientWidth <= 0 || canvas.clientHeight <= 0) {
              animationFrame = requestAnimationFrame(frame);
              return;
            }

            if (stateRef.current !== currentState) {
              triggerStateTransition(stateRef.current);
            }

            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
            const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
              ribbonTarget?.destroy();
              ribbonTarget = null;
              ribbonCompositeBindGroup = null;
            }

            sampleTransition(now);

            // Dynamic audio reactivity modulation
            const audio = Math.min(1, Math.max(0, audioActivityRef.current));
            const speedBase = displayedUniforms[3];
            const warpBase = displayedUniforms[6];
            const breathBase = displayedUniforms[37];
            const bloomBase = displayedUniforms[39];

            const modulatedValues = new Float32Array(displayedUniforms);
            modulatedValues[3] = speedBase * (1.0 + audio * 0.75);
            modulatedValues[6] = warpBase + audio * 0.4;
            modulatedValues[37] = breathBase + audio * 1.6;
            modulatedValues[39] = bloomBase + audio * 1.8;

            const frameDelta =
              lastFrameAt === null
                ? 0
                : Math.min(0.1, Math.max(0, (now - lastFrameAt) / 1000));
            lastFrameAt = now;
            motionPhase += frameDelta * Math.max(modulatedValues[3], 0);

            modulatedValues[0] = width;
            modulatedValues[1] = height;
            modulatedValues[2] = motionPhase / Math.max(modulatedValues[3], 0.001);

            dev.queue.writeBuffer(uniformBuffer, 0, modulatedValues);

            const isParticleRibbon =
              Math.round(modulatedValues[15]) === RIBBON_STYLE_INDEX;
            const encoder = dev.createCommandEncoder();

            if (isParticleRibbon) {
              if (!ribbonTarget || !ribbonCompositeBindGroup) {
                ribbonTarget = dev.createTexture({
                  size: { width, height },
                  format,
                  usage: 0x10 | 0x04, // RENDER_ATTACHMENT | TEXTURE_BINDING
                });
                ribbonCompositeBindGroup = dev.createBindGroup({
                  layout: ribbonCompositePipeline.getBindGroupLayout(0),
                  entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                    { binding: 1, resource: ribbonTarget.createView() },
                    { binding: 2, resource: ribbonSampler },
                  ],
                });
              }

              const particlePass = encoder.beginRenderPass({
                colorAttachments: [
                  {
                    view: ribbonTarget.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                  },
                ],
              });
              particlePass.setPipeline(ribbonPipeline);
              particlePass.setBindGroup(0, ribbonBindGroup);
              particlePass.draw(6, RIBBON_INSTANCE_COUNT);
              particlePass.end();
            }

            const currentTexture = context.getCurrentTexture();
            const pass = encoder.beginRenderPass({
              colorAttachments: [
                {
                  view: currentTexture.createView(),
                  clearValue: { r: 0, g: 0, b: 0, a: 0 },
                  loadOp: 'clear',
                  storeOp: 'store',
                },
              ],
            });

            if (isParticleRibbon) {
              pass.setPipeline(ribbonCompositePipeline);
              pass.setBindGroup(0, ribbonCompositeBindGroup!);
            } else {
              pass.setPipeline(pipeline);
              pass.setBindGroup(0, bindGroup);
            }

            pass.draw(3);
            pass.end();

            dev.queue.submit([encoder.finish()]);
            consecutiveErrors = 0;
            animationFrame = requestAnimationFrame(frame);
          } catch (err) {
            consecutiveErrors++;
            if (consecutiveErrors > 8) {
              console.warn('WebGPU Render unrecoverable for ARIA, engaging WebGL liquid fallback:', err);
              setWebGpuSupported(false);
              startFallbackAnimation(canvas!);
            } else {
              animationFrame = requestAnimationFrame(frame);
            }
          }
        }

        animationFrame = requestAnimationFrame(frame);
      } catch (err) {
        console.warn('WebGPU Init unavailable for ARIA, engaging high-fidelity WebGL liquid orb:', err);
        setWebGpuSupported(false);
        startFallbackAnimation(canvas!);
      }
    }

    function getStateInt(s: AgentState): number {
      switch (s) {
        case 'IDLE': return 0;
        case 'LISTENING': return 1;
        case 'THINKING': return 2;
        case 'SPEAKING': return 3;
        case 'EXECUTING': return 4;
        case 'RESEARCHING': return 5;
        case 'VERIFYING': return 6;
        case 'LEARNING': return 7;
        case 'AWAITING_APPROVAL': return 8;
        case 'ERROR_RECOVERY': return 9;
        case 'OFFLINE': return 10;
        default: return 0;
      }
    }

    function startFallbackAnimation(cvs: HTMLCanvasElement) {
      // 1. Try High-Fidelity WebGL Procedural Liquid Shader (works on 100% of mobile phones)
      let gl: WebGLRenderingContext | null = null;
      try {
        gl = cvs.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false }) as WebGLRenderingContext | null;
      } catch {
        gl = null;
      }

      if (gl) {
        const compile = (type: number, src: string): WebGLShader | null => {
          const s = gl!.createShader(type);
          if (!s) return null;
          gl!.shaderSource(s, src);
          gl!.compileShader(s);
          if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
            gl!.deleteShader(s);
            return null;
          }
          return s;
        };

        const vs = compile(gl.VERTEX_SHADER, QUAD_VS);
        const fs = compile(gl.FRAGMENT_SHADER, ARIA_WEBGL_FS);

        if (vs && fs) {
          const prog = gl.createProgram();
          if (prog) {
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);

            if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
              gl.useProgram(prog);

              const posBuf = gl.createBuffer();
              gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
              gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                gl.STATIC_DRAW
              );

              const posLoc = gl.getAttribLocation(prog, 'a_position');
              gl.enableVertexAttribArray(posLoc);
              gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

              const resLoc = gl.getUniformLocation(prog, 'u_resolution');
              const timeLoc = gl.getUniformLocation(prog, 'u_time');
              const audioLoc = gl.getUniformLocation(prog, 'u_audio');
              const stateLoc = gl.getUniformLocation(prog, 'u_state');

              const startTime = performance.now();

              function renderWebGL(now: number) {
                if (stopped || !cvs || !gl) return;
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                const w = Math.max(1, Math.floor(cvs.clientWidth * dpr));
                const h = Math.max(1, Math.floor(cvs.clientHeight * dpr));

                if (cvs.width !== w || cvs.height !== h) {
                  cvs.width = w;
                  cvs.height = h;
                }

                gl.viewport(0, 0, w, h);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);

                const elapsed = (now - startTime) / 1000;
                const audio = Math.min(1, Math.max(0, audioActivityRef.current || 0));
                const curStateInt = getStateInt(stateRef.current);

                gl.uniform2f(resLoc, w, h);
                gl.uniform1f(timeLoc, elapsed);
                gl.uniform1f(audioLoc, audio);
                gl.uniform1i(stateLoc, curStateInt);

                gl.drawArrays(gl.TRIANGLES, 0, 6);
                animationFrame = requestAnimationFrame(renderWebGL);
              }

              animationFrame = requestAnimationFrame(renderWebGL);
              return;
            }
          }
        }
      }

      // 2. Canvas2D Fallback for ultra-restricted headless environments
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      let angle = 0;
      function render2DFallback() {
        if (stopped) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.max(1, Math.floor(cvs.clientWidth * dpr));
        const h = Math.max(1, Math.floor(cvs.clientHeight * dpr));
        if (cvs.width !== w || cvs.height !== h) {
          cvs.width = w;
          cvs.height = h;
        }

        const audio = audioActivityRef.current || 0;
        const curState = stateRef.current;
        const cx = w / 2;
        const cy = h / 2;
        const baseR = Math.min(w, h) * 0.38 * (1.0 + audio * 0.2);

        ctx!.clearRect(0, 0, w, h);
        angle += (curState === 'THINKING' ? 0.04 : 0.015) * (1 + audio * 0.5);

        const auraGrad = ctx!.createRadialGradient(cx, cy, baseR * 0.2, cx, cy, baseR * 1.5);
        auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
        auraGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.25)');
        auraGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.1)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx!.fillStyle = auraGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseR * 1.5, 0, Math.PI * 2);
        ctx!.fill();

        const orbGrad = ctx!.createRadialGradient(
          cx - baseR * 0.3 * Math.cos(angle),
          cy - baseR * 0.3 * Math.sin(angle),
          baseR * 0.05,
          cx,
          cy,
          baseR
        );
        orbGrad.addColorStop(0, 'rgba(230, 225, 255, 0.9)');
        orbGrad.addColorStop(0.3, 'rgba(168, 85, 247, 0.8)');
        orbGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.6)');
        orbGrad.addColorStop(1, 'rgba(15, 23, 42, 0.3)');
        ctx!.fillStyle = orbGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseR, 0, Math.PI * 2);
        ctx!.fill();

        animationFrame = requestAnimationFrame(render2DFallback);
      }

      animationFrame = requestAnimationFrame(render2DFallback);
    }

    initWebGPU();

    return () => {
      stopped = true;
      cancelAnimationFrame(animationFrame);
      ribbonTarget?.destroy();
      ribbonTarget = null;
      if (device) {
        try {
          device.destroy();
        } catch {
          // ignore already destroyed
        }
        device = null;
      }
    };
  }, []);

  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          imageRendering: 'auto',
          background: 'transparent',
        }}
        aria-label="ARIA Liquid Orb"
      />
    </div>
  );
};

export default AriaLiquidOrbCanvas;

