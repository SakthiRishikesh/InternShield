"use client";

import { useEffect, useRef } from "react";

export default function MatrixBackground() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(0);
  const dropsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const letters = "01ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const fontSize = 14;

    const resizeCanvas = () => {
      const scale = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * scale;
      canvas.height = height * scale;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(scale, 0, 0, scale, 0, 0);

      const columns = Math.max(1, Math.floor(width / fontSize));
      dropsRef.current = Array(columns).fill(1);
    };

    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const drops = dropsRef.current;

      context.fillStyle = "rgba(0, 0, 0, 0.05)";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#00ffcc";
      context.font = `${fontSize}px monospace`;

      drops.forEach((drop, index) => {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));

        context.fillText(text, index * fontSize, drop * fontSize);

        if (drop * fontSize > height && Math.random() > 0.975) {
          drops[index] = 0;
        }

        drops[index] += 1;
      });

      animationFrameRef.current = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animationFrameRef.current = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed left-0 top-0 -z-10 h-full w-full" />;
}
