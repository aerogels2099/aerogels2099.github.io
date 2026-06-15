import { reduced, state, canvasSize } from '../state.js';
import { tickSpawn, drawAsteroids, drawBeams, drawSparks } from './asteroids.js';

export const cv = document.getElementById('field');
const ctx = cv.getContext('2d');
const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

function resize() {
  canvasSize.W = innerWidth;
  canvasSize.H = innerHeight;
  cv.width  = canvasSize.W * DPR;
  cv.height = canvasSize.H * DPR;
  cv.style.width  = canvasSize.W + 'px';
  cv.style.height = canvasSize.H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
resize();
addEventListener('resize', resize);

const N = Math.min(60, Math.floor(innerWidth / 22));
const parts = [];
for (let i = 0; i < N; i++) {
  parts.push({
    x: Math.random() * canvasSize.W, y: Math.random() * canvasSize.H,
    vx: (Math.random() - .5) * 13, vy: (Math.random() - .5) * 13,
    r: Math.random() * 1.5 + .4, teal: Math.random() < .3,
  });
}
const rings = [];

let prev = performance.now(), ringT = 0, running = false;

function frame(t) {
  const { W, H } = canvasSize;
  const dt = Math.min((t - prev) / 1000, .05); prev = t;

  if (state.spaceO <= 0.02) {        /* space faded out — idle the loop until we scroll back up */
    ctx.clearRect(0, 0, W, H);
    running = false;
    return;
  }
  ctx.clearRect(0, 0, W, H);

  /* particles */
  for (const p of parts) {
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
    ctx.fillStyle = p.teal ? 'rgba(63,217,188,.5)' : 'rgba(63,167,255,.45)';
    ctx.fill();
  }

  /* particle links */
  ctx.lineWidth = .5;
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    for (let j = i + 1; j < parts.length; j++) {
      const b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
      if (d < 11000) {
        ctx.strokeStyle = 'rgba(150,170,155,' + (0.10 * (1 - d / 11000)).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  /* sonar rings */
  ringT += dt;
  if (ringT > 3.8) { ringT = 0; rings.push({ x: Math.random() * W, y: Math.random() * H, r: 0 }); }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.r += 84 * dt;
    if (r.r > 260) { rings.splice(i, 1); continue; }
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 7);
    ctx.strokeStyle = 'rgba(63,167,255,' + (0.16 * (1 - r.r / 260)).toFixed(3) + ')';
    ctx.lineWidth = 1; ctx.stroke();
  }

  tickSpawn(dt);
  drawAsteroids(ctx, dt);
  drawBeams(ctx, dt);
  drawSparks(ctx, dt);

  if (!document.hidden) requestAnimationFrame(frame); else running = false;
}

/* (re)start the loop only when it isn't already running and the tab is visible */
export function kick() {
  if (running || reduced || document.hidden) return;
  running = true; prev = performance.now(); requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
addEventListener('scroll', kick, { passive: true });

export function startLoop() { kick(); }
