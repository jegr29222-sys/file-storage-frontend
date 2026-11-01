'use client';

import { useEffect, useRef } from 'react';

export function AuroraBackground({ className = '', style = {} }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let running = true;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const lerp = (a, b, t) => a + (b - a) * t;

    const drawAurora = (t) => {
      ctx.clearRect(0, 0, width, height);

      const gradientCount = 4;
      const baseHue = 260;

      for (let i = 0; i < gradientCount; i++) {
        const phase = (t * 0.00015) + i * 2.5;
        const x = width * 0.5 + Math.sin(phase * 0.7) * width * 0.4;
        const y = height * 0.5 + Math.cos(phase * 0.5) * height * 0.4;
        const radius = Math.max(width, height) * (0.5 + i * 0.15);

        const hue = (baseHue + Math.sin(t * 0.00008 + i) * 30 + i * 40) % 360;
        const saturation = 70 + Math.sin(t * 0.00012 + i * 1.5) * 20;
        const lightness = 45 + Math.cos(t * 0.0001 + i * 2) * 10;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.25)`);
        gradient.addColorStop(0.3, `hsla(${hue + 20}, ${saturation}%, ${lightness - 5}%, 0.12)`);
        gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');

        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
    };

    const animate = (timestamp) => {
      if (!running) return;
      timeRef.current = timestamp;
      drawAurora(timestamp);
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 pointer-events-none ${className}`}
      style={{
        opacity: 0.6,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}