import { Send } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: 'text' | 'icon';
  icon?: React.ReactNode;
}

export function LiquidMetalButton({
  label = 'Get Started',
  onClick,
  viewMode = 'text',
  icon,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const dimensions = useMemo(() => {
    if (viewMode === 'icon') {
      return {
        width: 42,
        height: 42,
        innerWidth: 36,
        innerHeight: 36,
      };
    }

    return {
      width: 220,
      height: 62,
      innerWidth: 212,
      innerHeight: 56,
    };
  }, [viewMode]);

  useEffect(() => {
    const styleId = 'liquid-metal-button-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .liquid-metal-button-shell {
          position: relative;
          overflow: hidden;
          border-radius: 9999px;
          background: linear-gradient(135deg, rgba(12, 18, 32, 0.96) 0%, rgba(5, 10, 20, 0.96) 32%, rgba(11, 19, 34, 1) 100%);
          border: 1px solid rgba(125, 211, 252, 0.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -8px 22px rgba(2,6,23,0.9), 0 12px 12px rgba(2,6,23,0.2);
        }

        .liquid-metal-button-shell::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background:
            radial-gradient(circle at 18% 30%, rgba(191, 219, 254, 0.38), transparent 24%),
            radial-gradient(circle at 82% 20%, rgba(96, 165, 250, 0.26), transparent 26%),
            linear-gradient(120deg, rgba(34, 211, 238, 0.18), rgba(96, 165, 250, 0.08) 32%, rgba(59, 130, 246, 0.14) 60%, rgba(14, 116, 144, 0.12) 100%);
          opacity: 1;
          transition: opacity 0.25s ease;
        }

        .liquid-metal-button-shell::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: inherit;
          background:
            conic-gradient(
              from 0deg,
              rgba(14, 165, 233, 0.1),
              rgba(125, 211, 252, 0.36),
              rgba(34, 211, 238, 0.7),
              rgba(59, 130, 246, 0.28),
              rgba(14, 165, 233, 0.1),
              rgba(125, 211, 252, 0.3),
              rgba(8, 47, 73, 0.24),
              rgba(14, 165, 233, 0.12)
            );
          background-size: 200% 200%;
          animation: liquid-metal-flow 4s linear infinite;
          opacity: 0.8;
          filter: blur(0.5px);
        }

        .liquid-metal-button-shell.hovered::before {
          opacity: 1;
        }

        .liquid-metal-button-shell.hovered::after {
          opacity: 1;
          filter: brightness(1.2) saturate(1.2);
        }

        @keyframes liquid-metal-flow {
          0% { background-position: 0% 0%; }
          50% { background-position: 100% 100%; }
          100% { background-position: 0% 0%; }
        }

        @keyframes ripple-animation {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.7;
          }
          100% {
            transform: translate(-50%, -50%) scale(4.2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = { x, y, id: rippleId.current++ };

      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
      }, 600);
    }

    onClick?.();
  };

  return (
    <div className="relative inline-block" style={{ perspective: '1000px' }}>
      <div
        className={`liquid-metal-button-shell ${isHovered ? 'hovered' : ''}`}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: isPressed ? 'translateY(1px) scale(0.98)' : 'translateY(0) scale(1)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: isPressed
            ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 14px rgba(14, 116, 144, 0.24), 0 0 18px rgba(34, 211, 238, 0.15)'
            : isHovered
              ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 22px rgba(34, 211, 238, 0.28), 0 18px 18px rgba(2,6,23,0.26)'
              : 'inset 0 1px 0 rgba(255,255,255,0.08), 0 14px 18px rgba(2,6,23,0.18)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '2px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(6, 20, 36, 0.86) 0%, rgba(2, 6, 23, 0.94) 100%)',
            boxShadow: 'inset 0 0 26px rgba(34, 211, 238, 0.12)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {viewMode === 'icon' &&
            (icon || (
              <Send
                size={18}
                style={{
                  color: '#ecfeff',
                  filter: 'drop-shadow(0px 0px 12px rgba(34, 211, 238, 0.9)) drop-shadow(0px 2px 10px rgba(14, 116, 144, 0.8))',
                  transition: 'transform 0.2s ease',
                  transform: isPressed ? 'scale(0.96)' : 'scale(1)',
                }}
              />
            ))}

          {viewMode === 'text' && (
            <span
              style={{
                fontSize: '12px',
                color: '#E0F2FE',
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textShadow: '0px 0px 10px rgba(56, 189, 248, 0.8), 0px 1px 2px rgba(0, 0, 0, 0.6)',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          )}
        </div>

        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          aria-label={label}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: '9999px',
            cursor: 'pointer',
            outline: 'none',
            zIndex: 3,
            overflow: 'hidden',
          }}
        >
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              style={{
                position: 'absolute',
                left: `${ripple.x}px`,
                top: `${ripple.y}px`,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%)',
                pointerEvents: 'none',
                animation: 'ripple-animation 0.6s ease-out',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </button>
      </div>
    </div>
  );
}
