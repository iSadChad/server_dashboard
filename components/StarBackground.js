"use client";

import { useEffect, useRef } from "react";

const particleColors = [
  { hue: 186, saturation: 95, lightness: 72 },
  { hue: 282, saturation: 90, lightness: 76 },
  { hue: 322, saturation: 95, lightness: 72 },
  { hue: 48, saturation: 95, lightness: 74 },
];

const MAX_FRAME_RATE = 60;
const FRAME_INTERVAL = 1000 / MAX_FRAME_RATE;

export default function StarBackground() {
  const staticCanvasRef = useRef(null);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const staticCanvas = staticCanvasRef.current;
    const canvas = canvasRef.current;
    if (!staticCanvas || !canvas) return;

    const staticContext = staticCanvas.getContext("2d", { alpha: false });
    const context = canvas.getContext("2d");
    if (!staticContext || !context) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reducedMotion = motionPreference.matches;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let horizonGlow = null;
    let resizeFrame = null;
    let running = false;
    let lastFrameTime = 0;
    let lastDrawTime = 0;

    function resizeCanvas(targetCanvas, targetContext, alpha) {
      targetCanvas.width = Math.round(width * pixelRatio);
      targetCanvas.height = Math.round(height * pixelRatio);
      targetCanvas.style.width = `${width}px`;
      targetCanvas.style.height = `${height}px`;
      targetContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      if (!alpha) {
        targetContext.imageSmoothingEnabled = true;
      }
    }

    function drawSun(target, horizon) {
      const sunX = width < 768 ? width * 0.72 : width * 0.76;
      const sunY = Math.min(height * 0.28, horizon - 105);
      const sunRadius = Math.max(68, Math.min(148, Math.min(width, height) * 0.14));

      target.save();
      target.globalCompositeOperation = "screen";
      const aura = target.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.4);
      aura.addColorStop(0, "rgba(255, 117, 212, 0.30)");
      aura.addColorStop(0.35, "rgba(217, 70, 239, 0.12)");
      aura.addColorStop(0.72, "rgba(109, 40, 217, 0.04)");
      aura.addColorStop(1, "rgba(0, 0, 0, 0)");
      target.fillStyle = aura;
      target.beginPath();
      target.arc(sunX, sunY, sunRadius * 2.4, 0, Math.PI * 2);
      target.fill();
      target.restore();

      target.save();
      target.translate(sunX, sunY);
      target.beginPath();
      target.arc(0, 0, sunRadius, 0, Math.PI * 2);
      target.clip();

      const disk = target.createLinearGradient(0, -sunRadius, 0, sunRadius);
      disk.addColorStop(0, "#fff27a");
      disk.addColorStop(0.26, "#ffb35c");
      disk.addColorStop(0.58, "#ff5db1");
      disk.addColorStop(1, "#c026d3");
      target.fillStyle = disk;
      target.fillRect(-sunRadius, -sunRadius, sunRadius * 2, sunRadius * 2);

      target.fillStyle = "rgba(20, 5, 44, 0.72)";
      let stripeY = sunRadius * 0.08;
      let stripeHeight = 3;
      while (stripeY < sunRadius) {
        target.fillRect(-sunRadius, stripeY, sunRadius * 2, stripeHeight);
        stripeY += stripeHeight * 2.15;
        stripeHeight += 0.9;
      }
      target.restore();
    }

    function drawMountains(target, horizon) {
      const layers = [
        {
          baseline: horizon + 12,
          amplitude: 54,
          frequency: 0.0105,
          stroke: "rgba(217, 70, 239, 0.38)",
          fill: "rgba(64, 19, 102, 0.52)",
        },
        {
          baseline: horizon + 22,
          amplitude: 36,
          frequency: 0.017,
          stroke: "rgba(34, 211, 238, 0.42)",
          fill: "rgba(11, 24, 62, 0.72)",
        },
      ];

      for (const layer of layers) {
        target.beginPath();
        target.moveTo(0, height);
        target.lineTo(0, layer.baseline);

        for (let x = 0; x <= width + 16; x += 16) {
          const peak =
            Math.abs(Math.sin(x * layer.frequency)) * layer.amplitude +
            Math.abs(Math.sin(x * layer.frequency * 0.41 + 1.7)) * layer.amplitude * 0.34;
          target.lineTo(x, layer.baseline - peak);
        }

        target.lineTo(width, height);
        target.closePath();
        target.fillStyle = layer.fill;
        target.fill();
        target.strokeStyle = layer.stroke;
        target.lineWidth = 1.2;
        target.stroke();
      }
    }

    function drawGridBase(target, horizon) {
      const floor = target.createLinearGradient(0, horizon, 0, height);
      floor.addColorStop(0, "rgba(25, 8, 56, 0.50)");
      floor.addColorStop(0.52, "rgba(11, 6, 33, 0.72)");
      floor.addColorStop(1, "rgba(5, 2, 19, 0.94)");
      target.fillStyle = floor;
      target.fillRect(0, horizon, width, height - horizon);

      target.save();
      target.globalCompositeOperation = "screen";
      const vanishingX = width * 0.53;
      const bottomStep = Math.max(74, width / 14);

      for (let bottomX = -width; bottomX <= width * 2; bottomX += bottomStep) {
        const edgeDistance = Math.min(1, Math.abs(bottomX - vanishingX) / width);
        target.beginPath();
        target.moveTo(vanishingX, horizon);
        target.lineTo(bottomX, height);
        target.strokeStyle = `rgba(34, 211, 238, ${0.14 + edgeDistance * 0.09})`;
        target.lineWidth = 0.8;
        target.stroke();
      }

      horizonGlow = context.createLinearGradient(0, 0, width, 0);
      horizonGlow.addColorStop(0, "rgba(217, 70, 239, 0)");
      horizonGlow.addColorStop(0.25, "rgba(217, 70, 239, 0.65)");
      horizonGlow.addColorStop(0.62, "rgba(34, 211, 238, 0.78)");
      horizonGlow.addColorStop(1, "rgba(34, 211, 238, 0)");

      const staticHorizonGlow = target.createLinearGradient(0, 0, width, 0);
      staticHorizonGlow.addColorStop(0, "rgba(217, 70, 239, 0)");
      staticHorizonGlow.addColorStop(0.25, "rgba(217, 70, 239, 0.65)");
      staticHorizonGlow.addColorStop(0.62, "rgba(34, 211, 238, 0.78)");
      staticHorizonGlow.addColorStop(1, "rgba(34, 211, 238, 0)");
      target.strokeStyle = staticHorizonGlow;
      target.lineWidth = 1.4;
      target.beginPath();
      target.moveTo(0, horizon + 0.5);
      target.lineTo(width, horizon + 0.5);
      target.stroke();
      target.restore();
    }

    function rebuildStaticScene() {
      const horizon = height * (width < 768 ? 0.63 : 0.57);
      staticContext.clearRect(0, 0, width, height);

      const sky = staticContext.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#060214");
      sky.addColorStop(0.34, "#16072f");
      sky.addColorStop(0.57, "#2b0b48");
      sky.addColorStop(1, "#050212");
      staticContext.fillStyle = sky;
      staticContext.fillRect(0, 0, width, height);

      const glowRadius = Math.max(width, height);
      const magentaGlow = staticContext.createRadialGradient(
        width * 0.76,
        height * 0.25,
        0,
        width * 0.76,
        height * 0.25,
        glowRadius * 0.58,
      );
      magentaGlow.addColorStop(0, "rgba(236, 72, 153, 0.15)");
      magentaGlow.addColorStop(0.44, "rgba(126, 34, 206, 0.07)");
      magentaGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      staticContext.fillStyle = magentaGlow;
      staticContext.fillRect(0, 0, width, height);

      const cyanGlow = staticContext.createRadialGradient(
        width * 0.12,
        height * 0.48,
        0,
        width * 0.12,
        height * 0.48,
        glowRadius * 0.52,
      );
      cyanGlow.addColorStop(0, "rgba(34, 211, 238, 0.09)");
      cyanGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      staticContext.fillStyle = cyanGlow;
      staticContext.fillRect(0, 0, width, height);

      drawSun(staticContext, horizon);
      drawMountains(staticContext, horizon);
      drawGridBase(staticContext, horizon);
    }

    function createParticles() {
      const areaCount = Math.floor((width * height) / 16500);
      const count = Math.min(width < 768 ? 64 : 110, Math.max(36, areaCount));

      particlesRef.current = Array.from({ length: count }, () => {
        const color = particleColors[Math.floor(Math.random() * particleColors.length)];

        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.54,
          radius: Math.random() * 1.25 + 0.3,
          drift: (Math.random() - 0.5) * 4.8,
          speed: Math.random() * 5.4 + 0.9,
          opacity: Math.random() * 0.5 + 0.18,
          pulse: Math.random() * 0.0018 + 0.0007,
          offset: Math.random() * Math.PI * 2,
          color: `hsl(${color.hue} ${color.saturation}% ${color.lightness}%)`,
        };
      });
    }

    function drawMovingGrid(horizon, time) {
      context.save();
      context.globalCompositeOperation = "screen";
      const travel = (time * 0.00011) % 1;

      for (let index = 0; index < 20; index += 1) {
        const depth = (index / 20 + travel) % 1;
        const perspective = depth * depth;
        const y = horizon + perspective * (height - horizon);
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.strokeStyle = `rgba(217, 70, 239, ${0.10 + depth * 0.25})`;
        context.lineWidth = 0.6 + depth * 0.8;
        context.stroke();
      }

      if (horizonGlow) {
        context.strokeStyle = horizonGlow;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(0, horizon + 0.5);
        context.lineTo(width, horizon + 0.5);
        context.stroke();
      }
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

      for (const [lineWidth, strokeStyle] of [
        [3, "rgba(34, 211, 238, 0.08)"],
        [1, "rgba(103, 232, 249, 0.32)"],
      ]) {
        context.strokeStyle = strokeStyle;
        context.lineWidth = lineWidth;
        context.beginPath();
        context.moveTo(0, -size);
        context.lineTo(size * 0.86, size * 0.5);
        context.lineTo(-size * 0.86, size * 0.5);
        context.closePath();
        context.moveTo(0, size);
        context.lineTo(size * 0.86, -size * 0.5);
        context.lineTo(-size * 0.86, -size * 0.5);
        context.closePath();
        context.stroke();
      }
      context.restore();
    }

    function drawParticles(time, deltaSeconds) {
      context.save();
      context.globalCompositeOperation = "screen";

      for (const particle of particlesRef.current) {
        if (!reducedMotion) {
          particle.x += particle.drift * deltaSeconds;
          particle.y += particle.speed * deltaSeconds;
        }

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y > height * 0.56) particle.y = -8;

        const twinkle = 0.6 + Math.sin(time * particle.pulse + particle.offset) * 0.4;
        const alpha = particle.opacity * twinkle;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        if (particle.radius > 1.2) {
          context.globalAlpha = alpha * 0.45;
          context.strokeStyle = particle.color;
          context.lineWidth = 0.65;
          context.beginPath();
          context.moveTo(particle.x - particle.radius * 3, particle.y);
          context.lineTo(particle.x + particle.radius * 3, particle.y);
          context.moveTo(particle.x, particle.y - particle.radius * 3);
          context.lineTo(particle.x, particle.y + particle.radius * 3);
          context.stroke();
        }
      }

      context.restore();
    }

    function draw(time = 0) {
      const horizon = height * (width < 768 ? 0.63 : 0.57);
      const deltaSeconds = lastDrawTime ? Math.min((time - lastDrawTime) / 1000, 0.05) : 0;
      lastDrawTime = time;
      context.clearRect(0, 0, width, height);
      drawParticles(time, deltaSeconds);
      drawMovingGrid(horizon, time);
      drawWireframe(time, horizon);
    }

    function animate(time) {
      if (!running) return;

      const elapsed = time - lastFrameTime;
      if (!lastFrameTime || elapsed >= FRAME_INTERVAL) {
        lastFrameTime = lastFrameTime ? time - (elapsed % FRAME_INTERVAL) : time;
        draw(time);
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (running || reducedMotion || document.hidden) return;
      running = true;
      lastFrameTime = 0;
      lastDrawTime = 0;
      animationRef.current = requestAnimationFrame(animate);
    }

    function stopAnimation() {
      running = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    function resize() {
      const nextWidth = Math.max(1, window.innerWidth);
      const nextHeight = Math.max(1, window.innerHeight);
      const area = nextWidth * nextHeight;
      const ratioCap = area > 2200000 ? 1 : nextWidth < 768 ? 1.1 : 1.35;
      const nextPixelRatio = Math.min(window.devicePixelRatio || 1, ratioCap);
      if (nextWidth === width && nextHeight === height && nextPixelRatio === pixelRatio) return;

      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextPixelRatio;

      resizeCanvas(staticCanvas, staticContext, false);
      resizeCanvas(canvas, context, true);
      rebuildStaticScene();
      createParticles();
      lastDrawTime = 0;
      draw(performance.now());
    }

    function handleResize() {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        resize();
      });
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        stopAnimation();
      } else {
        lastDrawTime = 0;
        draw(performance.now());
        startAnimation();
      }
    }

    function handleMotionPreference(event) {
      reducedMotion = event.matches;
      stopAnimation();
      lastDrawTime = 0;
      draw(performance.now());
      startAnimation();
    }

    resize();
    if (reducedMotion) draw();
    startAnimation();

    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    motionPreference.addEventListener("change", handleMotionPreference);

    return () => {
      stopAnimation();
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      motionPreference.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return (
    <div className="vapor-background pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      <canvas ref={staticCanvasRef} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div
        className="vapor-vignette absolute inset-0"
        style={{ background: "radial-gradient(circle at 58% 38%, transparent 24%, rgba(3, 1, 12, 0.18) 62%, rgba(3, 1, 12, 0.72) 100%)" }}
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          animation: "none",
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
