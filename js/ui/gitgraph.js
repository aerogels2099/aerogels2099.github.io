import { reduced } from '../state.js';

/* A low-key "water surface" for the hero band: a few thin sine contours that
   drift slowly past each other, with a faint gradient fill below the top line
   to suggest depth. Glow is a wide low-alpha pass under a thin bright one, so
   there is no per-node shadowBlur. */

export function initGitGraph() {
  const host = document.getElementById('signalBand');
  if (!host) return;
  const cv = host.querySelector('.git-canvas');
  const ctx = cv.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* y: vertical position (fraction of height), amp: px, len: wavelength as a
     fraction of width, sp: drift speed in cycles/sec (small = calm) */
  const waves = [
    { y: 0.40, amp: 8,  len: 0.95, sp:  0.05, w: 1.6, col: 'rgba(63,167,255,.55)', glow: 'rgba(63,167,255,.16)' },
    { y: 0.54, amp: 12, len: 0.70, sp: -0.04, w: 1.3, col: 'rgba(63,217,188,.42)', glow: 'rgba(63,217,188,.12)' },
    { y: 0.66, amp: 6,  len: 1.30, sp:  0.03, w: 1.1, col: 'rgba(63,167,255,.28)', glow: null },
  ];

  let W = 0, H = 0, t = 0;
  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!running) draw(0);
  }

  const waveY = (wv, x) => {
    const k = (Math.PI * 2) / (W * wv.len);
    return H * wv.y
      + Math.sin(x * k + t * wv.sp * Math.PI * 2) * wv.amp
      + Math.sin(x * k * 2.3 - t * wv.sp * 1.7 * Math.PI * 2) * wv.amp * 0.22;
  };

  function trace(wv) {
    ctx.beginPath();
    for (let x = 0; x <= W; x += 8) { const y = waveY(wv, x); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  }

  /* translucent body of water beneath the surface line */
  function fillBelow(wv) {
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, waveY(wv, x));
    ctx.lineTo(W, H); ctx.closePath();
    const grad = ctx.createLinearGradient(0, H * wv.y - 12, 0, H);
    grad.addColorStop(0, 'rgba(63,167,255,.10)');
    grad.addColorStop(1, 'rgba(63,167,255,0)');
    ctx.fillStyle = grad; ctx.fill();
  }

  function draw(dt) {
    t += dt;
    ctx.clearRect(0, 0, W, H);
    ctx.lineJoin = ctx.lineCap = 'round';
    fillBelow(waves[0]);
    for (const wv of waves) {
      if (wv.glow) { trace(wv); ctx.strokeStyle = wv.glow; ctx.lineWidth = wv.w + 4; ctx.stroke(); }
      trace(wv); ctx.strokeStyle = wv.col; ctx.lineWidth = wv.w; ctx.stroke();
    }
  }

  let raf = 0, prev = 0, running = false, onScreen = true;
  function loop(t2) {
    const dt = Math.min((t2 - prev) / 1000, 0.05); prev = t2;
    draw(dt);
    if (running) raf = requestAnimationFrame(loop);
  }
  function start() {
    if (reduced) { draw(0); return; }
    if (running || !onScreen || document.hidden) return;
    running = true; prev = performance.now(); raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  addEventListener('resize', resize);
  if (reduced) { draw(0); return; }

  new IntersectionObserver(es => {
    onScreen = es[es.length - 1].isIntersecting;
    onScreen ? start() : stop();
  }, { threshold: 0 }).observe(host);
  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
  start();
}
