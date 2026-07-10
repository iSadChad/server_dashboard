"use client";

import { useEffect, useRef } from "react";

export default function StarBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let width, height;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticles() {
      const count = Math.floor((width * height) / 7600);
      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.7 + 0.4,
          dx: (Math.random() - 0.5) * 0.18,
          dy: Math.random() * 0.18 + 0.03,
          opacity: Math.random() * 0.22 + 0.08,
          pulse: Math.random() * 0.01 + 0.003,
          offset: Math.random() * Math.PI * 2,
          hue: [0, 220, 235, 260][Math.floor(Math.random() * 4)],
        });
      }
    }

    let time = 0;

    function draw() {
      time += 0.8;
      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#010204");
      bg.addColorStop(0.45, "#030407");
      bg.addColorStop(1, "#000102");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const glowOne = ctx.createRadialGradient(
        width * 0.18,
        height * 0.12,
        0,
        width * 0.18,
        height * 0.12,
        Math.max(width, height) * 0.7
      );
      glowOne.addColorStop(0, "rgba(71, 85, 105, 0.09)");
      glowOne.addColorStop(0.38, "rgba(30, 41, 59, 0.06)");
      glowOne.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowOne;
      ctx.fillRect(0, 0, width, height);

      const glowTwo = ctx.createRadialGradient(
        width * 0.86,
        height * 0.78,
        0,
        width * 0.86,
        height * 0.78,
        Math.max(width, height) * 0.58
      );
      glowTwo.addColorStop(0, "rgba(127, 29, 29, 0.12)");
      glowTwo.addColorStop(0.42, "rgba(15, 23, 42, 0.07)");
      glowTwo.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowTwo;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.lineWidth = 1;
      const grid = 56;
      const drift = (time * 0.22) % grid;

      for (let x = -grid + drift; x < width + grid; x += grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height * 0.22, height);
        ctx.stroke();
      }

      for (let y = -grid + drift; y < height + grid; y += grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y - width * 0.08);
        ctx.stroke();
      }
      ctx.restore();

      for (const s of particlesRef.current) {
        s.x += s.dx;
        s.y += s.dy;

        if (s.x < -5) s.x = width + 5;
        if (s.x > width + 5) s.x = -5;
        if (s.y < -5) s.y = height + 5;
        if (s.y > height + 5) s.y = -5;

        const twinkle = 0.55 + 0.45 * Math.sin(time * s.pulse + s.offset);
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 38%, 70%, ${alpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 42%, 58%, ${alpha * 0.035})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    const onResize = () => {
      resize();
      createParticles();
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
