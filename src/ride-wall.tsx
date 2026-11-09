// Ride wall: every bike ride since 2018 as one ridge in a slowly drifting
// mountain range, drawn faintly behind the home page. Purely decorative: no
// text, no interaction, hidden from assistive tech, and still for visitors who
// prefer reduced motion.
//
// Each ridge is a ride's elevation profile (48 points over distance, exported
// from the strava repo by `loam export-site --no-names` into assets/rides.json;
// no GPS, heart rate or power). Rides stream past chronologically: a ridge
// appears faint at the horizon, drifts forward and grows, and slides off the
// bottom, looping forever. Each ridge carries a soft ink wash under its crest.
//
// Source of truth for js/ride-wall.js — build with `pnpm build`. See
// photo-strip.tsx for why the vendored imports use ../js/vendor/ paths.
import { h, render } from "../js/vendor/preact-10.29.8.module.js";
import { useLayoutEffect, useRef } from "../js/vendor/preact-hooks-10.29.8.module.js";

/** One ride as written by `loam export-site`; only the profile is drawn. */
interface Ride {
  km: number;
  p: number[]; // altitude above the ride's lowest point, evenly over distance
}

interface Data {
  rides: Ride[];
}

// Scene geometry, as fractions of the canvas.
const VISIBLE = 36; // ridges in depth on a canvas 1.6× as wide as it is tall
const FAR_Z = 5; // perspective depth of the horizon relative to the front ridge
const HORIZON = 0.03;
const GROUND = 0.97; // where the front ridge's baseline sits
const AMPLITUDE = 0.55; // front-ridge height of a 1,000 m climb
const RIDES_PER_S = 1 / 4; // on that 1.6:1 canvas; wider ones scale it up
const EASE_S = 0.6; // time constant for starting and stopping the drift

interface Ridge {
  xs: Float32Array;
  ys: Float32Array;
  baseY: number;
  top: number; // highest point (smallest y)
  z: number; // perspective depth, 1 at the front
}

// A stable pseudo-random number in [0, 1) per ride, so each ridge keeps its place.
function hash(i: number): number {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Lay out ridge `index` at stream position `s` (in rides) on a w×h canvas. */
function layout(
  ride: Ride, index: number, s: number, rows: number, w: number, hgt: number,
): Ridge {
  const t = (index - s) / rows; // 0 = front, 1 = horizon
  const z = 1 + t * (FAR_Z - 1);
  const horizonY = hgt * HORIZON;
  const baseY = horizonY + (hgt * GROUND - horizonY) / z;
  const sx = 0.55 + 0.45 / z; // gentle horizontal perspective
  // Mountains are sized by the canvas height, so a wide canvas shows more of
  // them side by side rather than stretching each one.
  const unit = Math.min(w, hgt * 1.6);
  const span = unit * (0.3 + 0.5 * Math.min(1, Math.sqrt(ride.km / 120))) * sx;
  const cx = w / 2 + (hash(index) - 0.5) * (w - unit * 0.5) * sx;
  const amp = (hgt * AMPLITUDE) / z;

  // Flat to the left edge, a short ease up into the profile, the profile, an
  // ease back down, flat to the right edge.
  const p = ride.p;
  const n = p.length;
  const ramp = span * 0.06;
  const x0 = cx - span / 2;
  const xs = new Float32Array(n + 4);
  const ys = new Float32Array(n + 4);
  const lift = (alt: number) => baseY - amp * Math.pow(Math.max(alt, 0) / 1000, 0.8);
  let top = baseY;
  xs[0] = -2;
  ys[0] = baseY;
  xs[1] = x0 - ramp;
  ys[1] = baseY;
  for (let j = 0; j < n; j++) {
    const y = lift(p[j] ?? 0);
    xs[j + 2] = x0 + (span * j) / (n - 1);
    ys[j + 2] = y;
    top = Math.min(top, y);
  }
  xs[n + 2] = x0 + span + ramp;
  ys[n + 2] = baseY;
  xs[n + 3] = w + 2;
  ys[n + 3] = baseY;
  return { xs, ys, baseY, top, z };
}

function tracePath(ctx: CanvasRenderingContext2D, r: Ridge) {
  const { xs, ys } = r;
  ctx.moveTo(xs[0]!, ys[0]!);
  // Quadratic segments through the midpoints: smooth, and still exact at the ends.
  for (let j = 1; j < xs.length - 1; j++) {
    const mx = (xs[j]! + xs[j + 1]!) / 2;
    const my = (ys[j]! + ys[j + 1]!) / 2;
    ctx.quadraticCurveTo(xs[j]!, ys[j]!, mx, my);
  }
  ctx.lineTo(xs[xs.length - 1]!, ys[ys.length - 1]!);
}

function RideWall({ data }: { data: Data }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Layout effect: set up the canvas right after render rather than after the
  // next animation frame, so the first drawing is never a frame late.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rides = data.rides;
    const count = rides.length;
    const rideAt = (i: number) => rides[((i % count) + count) % count]!;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const darkMode = matchMedia("(prefers-color-scheme: dark)");
    let bg = "";
    let fg = "";
    const readColours = () => {
      const css = getComputedStyle(canvas);
      bg = css.getPropertyValue("--bg").trim();
      fg = css.getPropertyValue("--fg").trim();
    };
    readColours();
    let w = 0;
    let hgt = 0;
    // Wide canvases hold proportionally more ridges (several mountains per
    // depth), and stream them faster so the drift itself keeps the same pace.
    let rows = VISIBLE;
    const speed = () => (RIDES_PER_S * rows) / VISIBLE;
    // Open on the most recent rides, the newest at the horizon.
    let s = count - VISIBLE;
    let v = reduceMotion.matches ? 0 : RIDES_PER_S;
    let visible = false;
    let frame = 0;
    let last = 0;

    const draw = () => {
      if (!w || !hgt) return;
      ctx.clearRect(0, 0, w, hgt);
      ctx.lineJoin = "round";
      // Painter's algorithm: back to front, each ridge filled with the page
      // background so nearer ridges hide what is behind them.
      const extra = Math.ceil(rows / 12); // already sliding off the bottom
      for (let i = Math.floor(s) + rows; i >= Math.floor(s) - extra; i--) {
        const r = layout(rideAt(i), i, s, rows, w, hgt);
        const t = (i - s) / rows;
        const enter = Math.min(1, Math.max(0, (1 - t) / 0.12));
        const alpha = enter * (0.12 + 0.68 * Math.pow(Math.max(0, 1 - t), 1.4));

        ctx.beginPath();
        tracePath(ctx, r);
        ctx.lineTo(w + 2, hgt + 2);
        ctx.lineTo(-2, hgt + 2);
        ctx.closePath();
        ctx.fillStyle = bg;
        ctx.fill();

        // Ink wash: the colour pools just under the crest and fades downward.
        const depth = r.baseY - r.top;
        const wash = ctx.createLinearGradient(0, r.top, 0, r.baseY + depth * 0.2 + 12 / r.z);
        wash.addColorStop(0, fg);
        wash.addColorStop(1, "transparent");
        ctx.globalAlpha = alpha * 0.16;
        ctx.fillStyle = wash;
        ctx.fill();

        ctx.beginPath();
        tracePath(ctx, r);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = fg;
        ctx.lineWidth = 0.6 + 0.9 * Math.max(0, 1 - t);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      hgt = rect.height;
      const wide = hgt ? w / (hgt * 1.6) : 1;
      const was = rows;
      rows = Math.round(VISIBLE * Math.min(3, Math.max(1, wide)));
      s += was - rows; // keep the newest ride at the horizon
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hgt * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const target = reduceMotion.matches ? 0 : speed();
      v += (target - v) * (1 - Math.exp(-dt / EASE_S));
      if (target === 0 && v < 1e-3) v = 0;
      s += v * dt;
      if (s > count * 1000) s -= count * 1000; // keep the float precise forever
      draw();
      // Stopped and meant to stay stopped: no frames until something wakes us.
      if (v !== 0 || target !== 0) schedule();
    };

    const wake = () => {
      if (!frame) last = performance.now();
      schedule();
    };
    const onScheme = () => {
      readColours();
      draw();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) wake();
    });
    const ro = new ResizeObserver(resize);
    io.observe(canvas);
    ro.observe(canvas);
    darkMode.addEventListener("change", onScheme);
    reduceMotion.addEventListener("change", wake);
    document.addEventListener("visibilitychange", wake);
    resize(); // draw now; the observers above take it from here

    return () => {
      if (frame) cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      darkMode.removeEventListener("change", onScheme);
      reduceMotion.removeEventListener("change", wake);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [data]);

  return <canvas class="ride-wall" ref={canvasRef} aria-hidden="true" />;
}

// Load after the page itself, so the backdrop never competes with first paint.
const container = document.querySelector<HTMLElement>("[data-ride-wall]");
const src = container?.dataset.rideWall;
if (container && src) {
  const start = async () => {
    try {
      const res = await fetch(src);
      if (!res.ok) return;
      const data = (await res.json()) as Data;
      if (data.rides.length > VISIBLE) render(<RideWall data={data} />, container);
    } catch {
      // The wall is decoration; a failed fetch leaves the page as it was.
    }
  };
  if (document.readyState === "complete") void start();
  else addEventListener("load", () => void start(), { once: true });
}
