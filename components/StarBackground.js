"use client";

import { useEffect, useRef } from "react";

export default function StarBackground() {
  const canvasRef = useRef(null);
  const starsRef = useRef([]);
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

    function createStars() {
      const count = Math.floor((width * height) / 5000);
      starsRef.current = [];
      for (let i = 0; i < count; i++) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.5 + 0.3,
          dx: (Math.random() - 0.5) * 0.12,
          dy: (Math.random() - 0.5) * 0.08,
          opacity: Math.random() * 0.6 + 0.2,
          twinkleSpeed: Math.random() * 0.008 + 0.002,
          twinkleOffset: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.5 ? 0 : 340 + Math.random() * 30,
          sat: Math.random() > 0.5 ? 60 + Math.random() * 30 : Math.random() * 25,
        });
      }
    }

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);
      time += 1;

      for (const s of starsRef.current) {
        s.x += s.dx;
        s.y += s.dy;

        if (s.x < -5) s.x = width + 5;
        if (s.x > width + 5) s.x = -5;
        if (s.y < -5) s.y = height + 5;
        if (s.y > height + 5) s.y = -5;

        const twinkle =
          0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
        const alpha = s.opacity * twinkle;

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, 82%, ${alpha})`;
        ctx.fill();

        if (s.r > 0.9) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, 70%, ${alpha * 0.08})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();

    const onResize = () => {
      resize();
      createStars();
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