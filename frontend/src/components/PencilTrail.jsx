import { useEffect, useRef } from "react";

// A faint graphite line that follows the cursor and fades out, like pencil on paper.
// Only runs for mouse/trackpad users who haven't asked for reduced motion.
function PencilTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return undefined;

    const ctx = canvas.getContext("2d");
    const LIFE = 900; // ms a stroke stays visible
    let points = [];
    let frame = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const now = performance.now();
      points = points.filter((p) => now - p.t < LIFE);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (let i = 1; i < points.length; i += 1) {
        const a = points[i - 1];
        const b = points[i];
        if (b.t - a.t > 80) continue; // don't connect separate strokes
        const life = 1 - (now - b.t) / LIFE;
        ctx.strokeStyle = `rgba(40, 38, 34, ${0.38 * life})`;
        ctx.lineWidth = 0.6 + 1.3 * life;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      frame = points.length ? requestAnimationFrame(draw) : 0;
    };

    const onMove = (event) => {
      // tiny jitter so it reads as pencil, not a vector line
      points.push({
        x: event.clientX + (Math.random() - 0.5) * 0.8,
        y: event.clientY + (Math.random() - 0.5) * 0.8,
        t: performance.now(),
      });
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className="pencil-trail" aria-hidden="true" />;
}

export default PencilTrail;
