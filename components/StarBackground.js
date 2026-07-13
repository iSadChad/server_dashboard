"use client";

import { useEffect, useRef } from "react";

const particleColors = [
  { hue: 186, saturation: 95, lightness: 72 },
  { hue: 282, saturation: 90, lightness: 76 },
  { hue: 322, saturation: 95, lightness: 72 },
  { hue: 48, saturation: 95, lightness: 74 },
];

export default function StarBackground() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;

    function resize() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function createParticles() {
      const count = Math.min(180, Math.max(55, Math.floor((width * height) / 9200)));

      particlesRef.current = Array.from({ length: count }, () => {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];

        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.62,
          radius: Math.random() * 1.35 + 0.35,
          drift: (Math.random() - 0.5) * 0.08,
          speed: Math.random() * 0.09 + 0.015,
          opacity: Math.random() * 0.5 + 0.18,
          pulse: Math.random() * 0.0018 + 0.0007,
          offset: Math.random() * Math.PI * 2,
          ...color,
        };
      });
    }

    function drawSun(horizon, time) {
      const sunX = width < 768 ? width * 0.72 : width * 0.76;
      const sunY = Math.min(height * 0.28, horizon - 105);
      const sunRadius = Math.max(68, Math.min(148, Math.min(width, height) * 0.14));
      const pulse = 1 + Math.sin(time * 0.0012) * 0.018;

      context.save();
      context.globalCompositeOperation = "screen";
      const aura = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.4);
      aura.addColorStop(0, "rgba(255, 117, 212, 0.30)");
      aura.addColorStop(0.35, "rgba(217, 70, 239, 0.12)");
      aura.addColorStop(0.72, "rgba(109, 40, 217, 0.04)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = aura;
      context.beginPath();
      context.arc(sunX, sunY, sunRadius * 2.4, 0, Math.PI * 2);
      context.fill();
      context.restore();

      context.save();
      context.translate(sunX, sunY);
      context.scale(pulse, pulse);
      context.beginPath();
      context.arc(0, 0, sunRadius, 0, Math.PI * 2);
      context.clip();

      const disk = context.createLinearGradient(0, -sunRadius, 0, sunRadius);
      disk.addColorStop(0, "#fff27a");
      disk.addColorStop(0.26, "#ffb35c");
      disk.addColorStop(0.58, "#ff5db1");
      disk.addColorStop(1, "#c026d3");
      context.fillStyle = disk;
      context.fillRect(-sunRadius, -sunRadius, sunRadius * 2, sunRadius * 2);

      context.fillStyle = "rgba(20, 5, 44, 0.72)";
      let stripeY = sunRadius * 0.08;
      let stripeHeight = 3;
      while (stripeY < sunRadius) {
        context.fillRect(-sunRadius, stripeY, sunRadius * 2, stripeHeight);
        stripeY += stripeHeight * 2.15;
        stripeHeight += 0.9;
      }
      context.restore();
    }

    function drawMountains(horizon, time) {
      const layers = [
        {
          baseline: horizon + 12,
          amplitude: 54,
          frequency: 0.0105,
          phase: 0.000015,
          stroke: "rgba(217, 70, 239, 0.38)",
          fill: "rgba(64, 19, 102, 0.52)",
        },
        {
          baseline: horizon + 22,
          amplitude: 36,
          frequency: 0.017,
          phase: -0.000025,
          stroke: "rgba(34, 211, 238, 0.42)",
          fill: "rgba(11, 24, 62, 0.72)",
        },
      ];

      for (const layer of layers) {
        context.beginPath();
        context.moveTo(0, height);
        context.lineTo(0, layer.baseline);

        for (let x = 0; x <= width + 12; x += 12) {
          const peak =
            Math.abs(Math.sin(x * layer.frequency + time * layer.phase)) * layer.amplitude +
            Math.abs(Math.sin(x * layer.frequency * 0.41 + 1.7)) * layer.amplitude * 0.34;
          context.lineTo(x, layer.baseline - peak);
        }

        context.lineTo(width, height);
        context.closePath();
        context.fillStyle = layer.fill;
        context.fill();
        context.strokeStyle = layer.stroke;
        context.lineWidth = 1.2;
        context.stroke();
      }
    }

    function drawGrid(horizon, time) {
      const floor = context.createLinearGradient(0, horizon, 0, height);
      floor.addColorStop(0, "rgba(25, 8, 56, 0.50)");
      floor.addColorStop(0.52, "rgba(11, 6, 33, 0.72)");
      floor.addColorStop(1, "rgba(5, 2, 19, 0.94)");
      context.fillStyle = floor;
      context.fillRect(0, horizon, width, height - horizon);

      context.save();
      context.globalCompositeOperation = "screen";
      const vanishingX = width * 0.53;
      const bottomStep = Math.max(62, width / 16);

      for (let bottomX = -width; bottomX <= width * 2; bottomX += bottomStep) {
        const edgeDistance = Math.min(1, Math.abs(bottomX - vanishingX) / width);
        context.beginPath();
        context.moveTo(vanishingX, horizon);
        context.lineTo(bottomX, height);
        context.strokeStyle = `rgba(34, 211, 238, ${0.14 + edgeDistance * 0.09})`;
        context.lineWidth = 0.8;
        context.stroke();
      }

      const travel = (time * 0.00011) % 1;
      for (let index = 0; index < 24; index += 1) {
        const depth = (index / 24 + travel) % 1;
        const perspective = depth * depth;
        const y = horizon + perspective * (height - horizon);
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.strokeStyle = `rgba(217, 70, 239, ${0.10 + depth * 0.25})`;
        context.lineWidth = 0.6 + depth * 0.8;
        context.stroke();
      }

      const horizonGlow = context.createLinearGradient(0, 0, width, 0);
      horizonGlow.addColorStop(0, "rgba(217, 70, 239, 0)");
      horizonGlow.addColorStop(0.25, "rgba(217, 70, 239, 0.65)");
      horizonGlow.addColorStop(0.62, "rgba(34, 211, 238, 0.78)");
      horizonGlow.addColorStop(1, "rgba(34, 211, 238, 0)");
      context.strokeStyle = horizonGlow;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(0, horizon + 0.5);
      context.lineTo(width, horizon + 0.5);
      context.stroke();
      context.restore();
    }

    function drawWireframe(time, horizon) {
      const centerX = width * 0.89;
      const centerY = horizon + Math.min(100, (height - horizon) * 0.24);
      const size = Math.max(24, Math.min(52, width * 0.045));

      context.save();
      context.translate(centerX, centerY);
      context.rotate(time * 0.00016);
      context.globalCompositeOperation = "screen";
      context.strokeStyle = "rgba(103, 232, 249, 0.30)";
      context.lineWidth = 1;
      context.shadowColor = "rgba(34, 211, 238, 0.32)";
      context.shadowBlur = 8;

      context.beginPath();
      context.moveTo(0, -size);
      context.lineTo(size * 0.86, size * 0.5);
      context.lineTo(-size * 0.86, size * 0.5);
      context.closePath();
      context.stroke();
      context.beginPath();
      context.moveTo(0, size);
      context.lineTo(size * 0.86, -size * 0.5);
      context.lineTo(-size * 0.86, -size * 0.5);
      context.closePath();
      context.stroke();
      context.restore();
    }

    function drawParticles(time) {
      for (const particle of particlesRef.current) {
        if (!reducedMotion) {
          particle.x += particle.drift;
          particle.y += particle.speed;
        }

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y > height * 0.62) particle.y = -8;

        const twinkle = 0.6 + Math.sin(time * particle.pulse + particle.offset) * 0.4;
        const alpha = particle.opacity * twinkle;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${alpha})`;
        context.fill();

        if (particle.radius > 1.15) {
          context.save();
          context.globalCompositeOperation = "screen";
          context.strokeStyle = `hsla(${particle.hue}, ${particle.saturation}%, ${particle.lightness}%, ${alpha * 0.48})`;
          context.lineWidth = 0.65;
          context.beginPath();
          context.moveTo(particle.x - particle.radius * 3, particle.y);
          context.lineTo(particle.x + particle.radius * 3, particle.y);
          context.moveTo(particle.x, particle.y - particle.radius * 3);
          context.lineTo(particle.x, particle.y + particle.radius * 3);
          context.stroke();
          context.restore();
        }
      }
    }

    function draw(time = 0) {
      const horizon = height * (width < 768 ? 0.63 : 0.57);
      context.clearRect(0, 0, width, height);

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#060214");
      sky.addColorStop(0.34, "#16072f");
      sky.addColorStop(0.57, "#2b0b48");
      sky.addColorStop(1, "#050212");
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      const magentaGlow = context.createRadialGradient(width * 0.76, height * 0.25, 0, width * 0.76, height * 0.25, Math.max(width, height) * 0.58);
      magentaGlow.addColorStop(0, "rgba(236, 72, 153, 0.15)");
      magentaGlow.addColorStop(0.44, "rgba(126, 34, 206, 0.07)");
      magentaGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = magentaGlow;
      context.fillRect(0, 0, width, height);

      const cyanGlow = context.createRadialGradient(width * 0.12, height * 0.48, 0, width * 0.12, height * 0.48, Math.max(width, height) * 0.52);
      cyanGlow.addColorStop(0, "rgba(34, 211, 238, 0.09)");
      cyanGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = cyanGlow;
      context.fillRect(0, 0, width, height);

      drawParticles(time);
      drawSun(horizon, time);
      drawMountains(horizon, time);
      drawGrid(horizon, time);
      drawWireframe(time, horizon);

      if (!reducedMotion) {
        animationRef.current = requestAnimationFrame(draw);
      }
    }

    resize();
    createParticles();
    draw();

    function handleResize() {
      resize();
      createParticles();
      if (reducedMotion) draw();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div className="vapor-background pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div
        className="vapor-vignette absolute inset-0"
        style={{ background: "radial-gradient(circle at 58% 38%, transparent 24%, rgba(3, 1, 12, 0.18) 62%, rgba(3, 1, 12, 0.72) 100%)" }}
      />
      <div
        className="vapor-film-grain absolute inset-0 opacity-20 mix-blend-soft-light"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 4px)",
        }}
      />

      <div className="vapor-orbit absolute top-[15%] -right-24 h-72 w-72 animate-spin rounded-full border border-fuchsia-300/10 [animation-duration:34s]">
        <span className="absolute top-8 left-3 h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.85)]" />
      </div>
      <div className="vapor-comet absolute top-[19%] left-[8%] h-px w-24 -rotate-12 bg-linear-to-r from-transparent via-cyan-200/45 to-transparent blur-[0.3px]" />
      <div className="vapor-horizon absolute right-0 bottom-[42%] left-0 h-px bg-linear-to-r from-transparent via-fuchsia-400/10 to-transparent" />
    </div>
  );
}
