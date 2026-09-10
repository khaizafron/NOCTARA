'use client';

import React, { useEffect, useRef } from 'react';
import { AgentState } from '@noctara/shared';

interface CoreCanvasProps {
  state: AgentState;
  audioActivity?: number; // 0.0 to 1.0
}

export const NoctaraCoreCanvas: React.FC<CoreCanvasProps> = ({ state, audioActivity = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let angle = 0;

    // Handle high-DPI retina display scaling
    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 280;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 60 + audioActivity * 30;

      angle += state === 'THINKING' ? 0.08 : state === 'EXECUTING' ? 0.05 : 0.02;

      // Outer ethereal glow ring
      const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 1.5);
      gradient.addColorStop(0, state === 'LISTENING' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(99, 102, 241, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Rotating particle lattice
      const particleCount = state === 'THINKING' ? 32 : 24;
      ctx.strokeStyle = state === 'SPEAKING' ? 'rgba(245, 158, 11, 0.8)' : 'rgba(0, 229, 255, 0.7)';
      ctx.lineWidth = 1.5;

      for (let i = 0; i < particleCount; i++) {
        const theta = angle + (i * Math.PI * 2) / particleCount;
        const wave = Math.sin(theta * 3 + angle * 2) * (10 + audioActivity * 20);
        const r = baseRadius + wave;

        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;

        ctx.fillStyle = state === 'THINKING' ? '#00e5ff' : '#818cf8';
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }

      // Inner Core Orb
      ctx.fillStyle = state === 'LISTENING' ? '#00e5ff' : state === 'SPEAKING' ? '#f59e0b' : '#6366f1';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16 + audioActivity * 10, 0, Math.PI * 2);
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, audioActivity]);

  return (
    <div className="relative flex items-center justify-center w-[280px] h-[280px]">
      <canvas ref={canvasRef} className="w-[280px] h-[280px]" />
    </div>
  );
};
