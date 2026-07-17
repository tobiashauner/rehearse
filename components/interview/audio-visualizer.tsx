"use client";

import { useEffect, useRef } from "react";

const BAR_COUNT = 40;

/**
 * Live frequency bars for an active microphone AnalyserNode. Draws with
 * `currentColor`, so tint it with a text-* class (e.g. `text-primary`).
 * Runs its own rAF loop against the canvas — no React state per frame.
 */
export function AudioVisualizer({
  analyser,
  className,
}: {
  analyser: AnalyserNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(canvas).color;
      const slot = width / BAR_COUNT;
      for (let i = 0; i < BAR_COUNT; i++) {
        const v = data[i * step] / 255;
        const h = Math.max(3, v * height);
        ctx.beginPath();
        ctx.roundRect(i * slot + slot * 0.2, (height - h) / 2, slot * 0.6, h, 2);
        ctx.fill();
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={64}
      className={className}
      aria-hidden="true"
    />
  );
}
