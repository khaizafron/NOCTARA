'use client';

import React, { useRef, useEffect, useState } from 'react';
import { AgentState } from '@noctara/shared';
import { LIQUID_ORB_WGSL } from './shaders/liquidOrbShader';
import { NOX_ORB_SEEDS, mixSrgb } from './shaders/noxOrbSeeds';
import { QUAD_VS, NOX_WEBGL_FS } from './shaders/webglOrbShaders';

export interface NoxLiquidOrbCanvasProps {
  state: AgentState;
  audioActivity?: number;
  size?: number;
  className?: string;
  isSpeaking?: boolean;
}

const RIBBON_STYLE_INDEX = 24;
const RIBBON_INSTANCE_COUNT = 221184;
const ACTIVATION_DURATION_MS = 320;
const SETTLE_DURATION_MS = 600;

export const NoxLiquidOrbCanvas: React.FC<NoxLiquidOrbCanvasProps> = ({
  state,
  audioActivity = 0,
  size = 112,
  className = '',
  isSpeaking = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webGpuSupported, setWebGpuSupported] = useState<boolean | null>(null);

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
      return () => {
        stopped = true;
        cancelAnimationFrame(animationFrame);
      };
    }

    startWebGPU();

    async function startWebGPU() {
      try {
        const navGpu = (navigator as any).gpu;
        if (!navGpu) throw new Error('WebGPU unavailable');

        const adapter = await navGpu.requestAdapter({
          powerPreference: 'high-performance'
        });
        if (!adapter) throw new Error('No compatible WebGPU adapter');

        const dev = await adapter.requestDevice();
        if (stopped) {
          dev.destroy();
          return;
        }
        device = dev;

        const context = canvas!.getContext('webgpu') as any;
        if (!context) throw new Error('Unable to create WebGPU canvas context');

        const format = navGpu.getPreferredCanvasFormat();
        context.configure({
          device: dev,
          format,
          alphaMode: 'premultiplied'
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
                    operation: 'add'
                  },
                  alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                  }
                }
              }
            ]
          },
          primitive: { topology: 'triangle-list' }
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
                    operation: 'add'
                  }
                }
              }
            ]
          },
          primitive: { topology: 'triangle-list' }
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
                    operation: 'add'
                  },
                  alpha: {
                    srcFactor: 'one',
                    dstFactor: 'one-minus-src-alpha',
                    operation: 'add'
                  }
                }
              }
            ]
          },
          primitive: { topology: 'triangle-list' }
        });

        let currentState = stateRef.current;
        let transitionTargetState = currentState;
        const initialSeed = NOX_ORB_SEEDS[currentState] || NOX_ORB_SEEDS.IDLE;
        let fromUniforms = new Float32Array(initialSeed);
        let targetUniforms = new Float32Array(initialSeed);
        const displayedUniforms = new Float32Array(initialSeed);

        let transitionStartedAt = 0;
        let activeTransitionDuration = 0;

        const uniformBuffer = dev.createBuffer({
          size: displayedUniforms.byteLength,
          usage: 0x0040 | 0x0008 // GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const bindGroup = dev.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
        });

        const ribbonBindGroup = dev.createBindGroup({
          layout: ribbonPipeline.getBindGroupLayout(0),
          entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
        });

        const ribbonSampler = dev.createSampler({
          addressModeU: 'clamp-to-edge',
          addressModeV: 'clamp-to-edge',
          magFilter: 'linear',
          minFilter: 'linear'
        });

        let ribbonCompositeBindGroup: any = null;

        dev.lost.then((info: any) => {
          console.warn('WebGPU device lost for NOX:', info);
          setWebGpuSupported(false);
          startFallbackAnimation(canvas!);
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
          const nextSeed = NOX_ORB_SEEDS[nextState] || NOX_ORB_SEEDS.IDLE;
          targetUniforms = new Float32Array(nextSeed);
          transitionTargetState = nextState;
          transitionStartedAt = now;
          activeTransitionDuration =
            nextState === 'THINKING' || nextState === 'EXECUTING'
              ? ACTIVATION_DURATION_MS
              : SETTLE_DURATION_MS;
          currentState = nextState;
        }

        function transitionProgress(now: number) {
          if (activeTransitionDuration === 0) return 1;
          const raw = Math.min(
            1,
            Math.max(0, (now - transitionStartedAt) / activeTransitionDuration)
          );
          return transitionTargetState === 'THINKING' || transitionTargetState === 'EXECUTING'
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

            // Dynamic audio reactivity modulation (strictly isolated to NOX)
            const audio = Math.min(1, Math.max(0, audioActivityRef.current));
            const speedBase = displayedUniforms[3];
            const warpBase = displayedUniforms[6];
            const exposureBase = displayedUniforms[14];
            const metalEvoBase = displayedUniforms[29];
            const bloomBase = displayedUniforms[39];

            const modulatedValues = new Float32Array(displayedUniforms);
            modulatedValues[3] = speedBase * (1.0 + audio * 0.85);
            modulatedValues[6] = warpBase + audio * 0.35;
            modulatedValues[14] = exposureBase * (1.0 + audio * 0.45);
            modulatedValues[29] = metalEvoBase + audio * 0.8;
            modulatedValues[39] = bloomBase + audio * 1.5;

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
                  usage: 0x10 | 0x04 // RENDER_ATTACHMENT | TEXTURE_BINDING
                });
                ribbonCompositeBindGroup = dev.createBindGroup({
                  layout: ribbonCompositePipeline.getBindGroupLayout(0),
                  entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                    { binding: 1, resource: ribbonTarget.createView() },
                    { binding: 2, resource: ribbonSampler }
                  ]
                });
              }

              const particlePass = encoder.beginRenderPass({
                colorAttachments: [
                  {
                    view: ribbonTarget.createView(),
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store'
                  }
                ]
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
                  storeOp: 'store'
                }
              ]
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
              console.warn('WebGPU Render unrecoverable for NOX, engaging WebGL liquid fallback:', err);
              setWebGpuSupported(false);
              startFallbackAnimation(canvas!);
            } else {
              animationFrame = requestAnimationFrame(frame);
            }
          }
        }

        animationFrame = requestAnimationFrame(frame);
      } catch (err) {
        console.warn('WebGPU Init unavailable for NOX, engaging high-fidelity WebGL liquid core:', err);
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
        const fs = compile(gl.FRAGMENT_SHADER, NOX_WEBGL_FS);

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
        const baseR = Math.min(w, h) * 0.38 * (1.0 + audio * 0.15);

        ctx!.clearRect(0, 0, w, h);

        const speed =
          curState === 'EXECUTING'
            ? 0.05
            : curState === 'THINKING'
            ? 0.035
            : 0.015;
        angle += speed * (1 + audio * 0.6);

        // Technical Aura
        const auraGrad = ctx!.createRadialGradient(
          cx,
          cy,
          baseR * 0.2,
          cx,
          cy,
          baseR * 1.45
        );
        auraGrad.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
        auraGrad.addColorStop(0.5, 'rgba(0, 102, 255, 0.22)');
        auraGrad.addColorStop(0.8, 'rgba(2, 6, 23, 0.15)');
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx!.fillStyle = auraGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseR * 1.45, 0, Math.PI * 2);
        ctx!.fill();

        // Smooth ambient liquid body glow (no harsh outer rings)
        ctx!.fillStyle = auraGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseR * 1.35, 0, Math.PI * 2);
        ctx!.fill();

        // Solid Computational Core
        const coreGrad = ctx!.createRadialGradient(
          cx - baseR * 0.25 * Math.cos(angle * 0.8),
          cy - baseR * 0.25 * Math.sin(angle * 0.8),
          baseR * 0.05,
          cx,
          cy,
          baseR
        );

        if (curState === 'EXECUTING') {
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.2, '#00e5ff');
          coreGrad.addColorStop(0.6, '#0052cc');
          coreGrad.addColorStop(1, '#020617');
        } else if (curState === 'THINKING') {
          coreGrad.addColorStop(0, '#e0f7ff');
          coreGrad.addColorStop(0.3, '#00c3ff');
          coreGrad.addColorStop(0.7, '#082f49');
          coreGrad.addColorStop(1, '#020617');
        } else {
          coreGrad.addColorStop(0, '#bbf2f6');
          coreGrad.addColorStop(0.35, '#0284c7');
          coreGrad.addColorStop(0.75, '#031a3d');
          coreGrad.addColorStop(1, '#020617');
        }

        ctx!.fillStyle = coreGrad;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseR * 0.85, 0, Math.PI * 2);
        ctx!.shadowColor = '#00e5ff';
        ctx!.shadowBlur = 18 + audio * 12;
        ctx!.fill();
        ctx!.shadowBlur = 0;

        // Glass Rim Reflection
        ctx!.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseR * 0.85, angle, angle + Math.PI * 0.45);
        ctx!.stroke();

        animationFrame = requestAnimationFrame(render2DFallback);
      }

      animationFrame = requestAnimationFrame(render2DFallback);
    }

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
          background: 'transparent'
        }}
        aria-label="NOX Liquid Intelligence Core"
      />
    </div>
  );
};

export default NoxLiquidOrbCanvas;

