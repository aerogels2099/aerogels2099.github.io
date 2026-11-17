/* Motion for the page, in six parts:
   1. reveals   – blocks resolve out of blur, heading letters rise out of a mask
   2. scroll    – hero recedes, nav / section marker follow the current section
   3. ridge     – the signal terrain behind the hero (and again at the end)
   4. waves     – section dividers that ring with scroll speed
   5. strings   – the dividers can be plucked with the pointer, with opt-in sound
   6. figures   – small generative drawings on the project cards */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = matchMedia('(hover:hover)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const $$ = s => [...document.querySelectorAll(s)];
const DPR = Math.min(devicePixelRatio || 1, 2);
const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
const accentRGB = [1, 3, 5].map(i => parseInt(accent.slice(i, i + 2), 16)).join(',');

const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/* ---------- 1. reveals ---------- */
/* wrap every letter of a .split heading: word = mask, letter = moving part */
let chIndex = 0;
function split(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 1) { split(child); continue; }
    if (child.nodeType !== 3) continue;
    const frag = document.createDocumentFragment();
    for (const part of child.textContent.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.append(' '); continue; }
      const w = document.createElement('span');
      w.className = 'w';
      for (const c of part) {
        const s = document.createElement('span');
        s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', chIndex++);
        w.append(s);
      }
      frag.append(w);
    }
    child.replaceWith(frag);
  }
}

if (!reduced) {
  document.documentElement.classList.add('js');
  for (const h of $$('.split')) {
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    chIndex = 0; split(h);
    for (const w of h.children) w.setAttribute('aria-hidden', 'true');
  }
  /* stagger siblings (hero sets its own order in CSS) */
  for (const list of $$('.items, .cards, .skill-grid')) [...list.children].forEach((el, i) => el.style.setProperty('--i', i));

  /* reveal on the way in; re-arm only once an element has dropped back below
     the viewport, so scrolling up never blanks what you're reading */
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) e.target.classList.add('in');
      else if (e.boundingClientRect.top > 0) e.target.classList.remove('in');
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  for (const el of $$('.r, .split, .wave')) io.observe(el);
} else {
  for (const el of $$('.wave')) el.classList.add('in');
}

/* experience timeline: rows and bars highlight each other, and "now" is placed
   on the 2023–2027 axis from today's date */
for (const el of $$('[data-k]')) {
  const set = on => () => $$(`[data-k="${el.dataset.k}"]`).forEach(o => o.classList.toggle('hot', on));
  el.addEventListener('pointerenter', set(true));
  el.addEventListener('pointerleave', set(false));
}
{
  const nowEl = document.querySelector('.tl-now'), d = new Date();
  const pct = ((d.getFullYear() - 2023) * 12 + d.getMonth() + d.getDate() / 30) / 48 * 100;
  if (pct >= 0 && pct <= 100) nowEl.style.setProperty('--l', pct.toFixed(2) + '%'); else nowEl.remove();
}

/* ---------- 2. scroll state ---------- */
const hero = document.getElementById('top');
const nav = document.querySelector('nav');
const marker = document.getElementById('marker');
const [mNum, mName] = marker.children;
const sections = $$('main section');
const skills = document.getElementById('skills');
const inverter = skills.querySelector('.invert');
const links = $$('.nav-links a');

let heroP = 0, endQ = 0, current = null, lastY = scrollY, vel = 0, energy = 0, swapTimer = 0;

function readScroll() {
  const y = scrollY, vh = innerHeight;
  const maxY = document.documentElement.scrollHeight - vh;
  heroP = clamp(y / (vh * 0.9));
  endQ = clamp(1 - (maxY - y) / (vh * 0.8));
  if (!reduced) hero.style.setProperty('--p', heroP.toFixed(3));
  nav.classList.toggle('solid', y > vh * 0.6);

  /* skills inversion: the circle opens as the section rises into view and
     closes again as it leaves, centred on the middle of the screen */
  if (!reduced) {
    const st = skills.offsetTop - y, sh = skills.offsetHeight;
    let k = Math.min(clamp((vh * 0.62 - st) / (vh * 0.6)), clamp((st + sh - vh * 0.38) / (vh * 0.6)));
    k = k * k;
    inverter.style.setProperty('--ir', (k * Math.hypot(skills.offsetWidth, sh)).toFixed(1) + 'px');
    inverter.style.setProperty('--iy', clamp(vh / 2 - st, 0, sh).toFixed(1) + 'px');
  }

  let now = -1;
  sections.forEach((s, i) => { if (s.offsetTop - y <= vh * 0.45) now = i; });
  if (y >= maxY - 2) now = sections.length - 1;
  if (now !== current) {
    current = now;
    links.forEach((a, i) => a.classList.toggle('on', i === now));
    marker.classList.toggle('show', now >= 0);
    if (now >= 0) {
      marker.classList.add('swap');
      clearTimeout(swapTimer);
      swapTimer = setTimeout(() => {
        mNum.textContent = String(now + 1).padStart(2, '0');
        mName.textContent = sections[now].dataset.name;
        marker.classList.remove('swap');
      }, reduced ? 0 : 260);
    }
  }
}

/* ---------- 3. ridge ---------- */
const ridge = document.getElementById('ridge');
const rctx = ridge.getContext('2d');
const LINES = 30, STEP = 6, ACCENT_LINE = 21;
let W = 0, H = 0, ys = new Float32Array(0);
const t0 = performance.now();
/* the pointer carries a warm spot over the terrain: lines near it lift a
   little and take on the accent colour, fading back to white on either side */
let px = 0, py = 0, pk = 0, ptx = 0, pty = 0, pkTarget = 0;
/* On narrow screens the hero and contact text fill the whole viewport, so the
   terrain can't sit behind them. It is anchored in page coordinates just below
   each block of links instead and scrolls in underneath. These hold those
   anchors (bottom of the links, in px from the top of the page). */
let anchorHero = 0, anchorEnd = 0;
const docBottom = el => { let y = el.offsetHeight; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };

function drawRidge(t) {
  rctx.clearRect(0, 0, W, H);
  const narrow = W < 760;
  /* desktop: fade/flatten as soon as the hero scrolls; narrow: only once the
     terrain itself has scrolled above mid-screen */
  const p = narrow ? clamp((scrollY - Math.max(0, anchorHero - H * 0.5)) / (H * 0.7)) : heroP;
  const vis = Math.max(1 - p, endQ * 0.6);
  if (vis < 0.01) return false;
  const intro = reduced ? 1 : 1 - Math.pow(1 - clamp((performance.now() - t0) / 2200), 3);
  const ampK = Math.max(Math.pow(1 - p, 1.5), endQ * 0.7) * intro;
  const amp = H * (narrow ? 0.16 : 0.24), span = H * (narrow ? 0.3 : 0.4);
  /* the tallest peaks reach about 0.32·amp above the first line, so offset by that */
  const top0 = narrow
    ? (endQ > 0 ? anchorEnd : anchorHero) + 20 + 0.32 * amp - scrollY
    : H * 0.66 + (endQ > 0 ? 0 : -heroP * H * 0.18);
  const cx = W * (narrow ? 0.5 : 0.72), sig = W * (narrow ? 0.3 : 0.18);
  const n = Math.floor(W / STEP) + 2;

  for (let i = 0; i < LINES; i++) {
    const f = i / (LINES - 1);
    const base = top0 + span * Math.pow(f, 1.5);
    const a = amp * ampK * (0.35 + 0.65 * f);
    const near = pk * Math.exp(-(((base - py) / (H * 0.1)) ** 2));   // how close this line is to the pointer
    for (let j = 0; j < n; j++) {
      const x = j * STEP;
      const env = Math.exp(-(((x - cx) / sig) ** 2));
      const n1 = noise(x * 0.006 + i * 0.13, i * 0.31 - t * 0.22);
      const n2 = noise(x * 0.022, i * 1.7 + t * 0.5);
      ys[j] = base - a * (env * 0.95 * (n1 * 0.75 + n2 * 0.25) + 0.035 * n2)
        - near * 26 * Math.exp(-(((x - px) / 130) ** 2));
    }
    /* black fill under each line hides the lines behind it */
    rctx.beginPath(); rctx.moveTo(0, ys[0]);
    for (let j = 1; j < n; j++) rctx.lineTo(j * STEP, ys[j]);
    rctx.lineTo(W + STEP, H + 4); rctx.lineTo(0, H + 4); rctx.closePath();
    rctx.fillStyle = '#000'; rctx.fill();
    rctx.beginPath(); rctx.moveTo(0, ys[0]);
    for (let j = 1; j < n; j++) rctx.lineTo(j * STEP, ys[j]);
    const alpha = 0.1 + 0.6 * f;
    if (i === ACCENT_LINE) rctx.strokeStyle = accent;
    else if (near > 0.03) {
      const g = rctx.createLinearGradient(px - 300, 0, px + 300, 0);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(0.5, `rgba(${accentRGB},${Math.min(1, alpha + near)})`);
      g.addColorStop(1, `rgba(255,255,255,${alpha})`);
      rctx.strokeStyle = g;
    } else rctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    rctx.globalAlpha = vis;
    rctx.lineWidth = i === ACCENT_LINE ? 1.5 : 1 + near * 0.6;
    rctx.stroke();
    rctx.globalAlpha = 1;
  }
  return true;
}

/* ---------- 4. waves ---------- */
const waves = $$('.wave').map(cv => ({ cv, ctx: cv.getContext('2d'), w: 0, h: 0, plucks: [] }));
let phase = 0, wavesDirty = true;

function drawWaves(nowMs) {
  const vh = innerHeight;
  for (const wv of waves) {
    while (wv.plucks.length && nowMs - wv.plucks[0].t > 2600) { wv.plucks.shift(); wavesDirty = true; }
    const r = wv.cv.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) continue;
    const { ctx, w, h } = wv;
    let ring = 0;
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const env = Math.sin(Math.PI * x / w);
      let y = h / 2 + env * energy * (h * 0.42) *
        (Math.sin(x * 0.021 + phase) * 0.6 + Math.sin(x * 0.057 - phase * 1.7) * 0.4);
      /* a plucked divider vibrates as a real fixed-end string: the first few
         standing-wave harmonics of a triangle pulled at x0, higher ones dying faster */
      for (const p of wv.plucks) {
        const tau = (nowMs - p.t) / 1000;
        ring = Math.max(ring, Math.exp(-2.2 * tau));
        for (let k = 1; k <= 5; k++) {
          y += p.a * Math.exp(-tau * (1.4 + k * 0.7)) * Math.sin(k * Math.PI * p.x0 / w) / (k * k)
            * Math.sin(k * Math.PI * x / w) * Math.cos(tau * k * 30);
        }
      }
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.strokeStyle = ring > 0.3 ? accent : `rgba(255,255,255,${0.22 + energy * 0.6})`;
    ctx.lineWidth = 1 + ring * 0.6;
    ctx.stroke();
  }
}

/* ---------- 5. strings: the section dividers can be played ---------- */
/* sound is opt-in (the nav button); the visual pluck works either way */
const soundBtn = document.getElementById('sound');
let actx = null, master = null, soundOn = false;
const WAVE_HZ = [196, 246.94, 293.66, 392];   // G3 B3 D4 G4: a G major arpeggio, one note per section

function play(freq, vol) {
  if (!soundOn) return;
  const t = actx.currentTime;
  const g = actx.createGain(), lp = actx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(freq * 7, t);
  lp.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.5);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  for (const [type, mult, detune] of [['triangle', 1, 0], ['sine', 2, 4]]) {
    const o = actx.createOscillator();
    o.type = type; o.frequency.value = freq * mult; o.detune.value = detune;
    o.connect(lp); o.start(t); o.stop(t + 1.9);
  }
  lp.connect(g); g.connect(master);
}

soundBtn.addEventListener('click', () => {
  if (!actx) {
    actx = new AudioContext();
    master = actx.createGain(); master.gain.value = 0.18;
    const delay = actx.createDelay(), fb = actx.createGain(), wet = actx.createGain();
    delay.delayTime.value = 0.29; fb.gain.value = 0.3; wet.gain.value = 0.28;
    master.connect(actx.destination);
    master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(actx.destination);
  }
  soundOn = !soundOn;
  soundOn ? actx.resume() : actx.suspend();
  soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off';
  soundBtn.setAttribute('aria-pressed', soundOn);
});

if (!reduced && canHover) {
  let prevY = null;
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const x = e.clientX, y = e.clientY;
    ptx = x; pty = y; pkTarget = 1;
    if (!lensOn) { lensOn = true; lx = x; ly = y; lens.classList.add('on'); }
    kick();
    /* a divider is plucked when the pointer passes through it */
    if (prevY !== null && y !== prevY) {
      waves.forEach((wv, idx) => {
        const r = wv.cv.getBoundingClientRect(), mid = r.top + r.height / 2;
        if (x > r.left && x < r.right && (prevY - mid) * (y - mid) < 0) {
          if (wv.plucks.length > 1) wv.plucks.shift();
          wv.plucks.push({ x0: x - r.left, t: performance.now(), a: (y > prevY ? 1 : -1) * 15 });
          play(WAVE_HZ[idx % WAVE_HZ.length], 0.45);
          kick();
        }
      });
    }
    prevY = y;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pkTarget = 0; });
  /* the lens swells over things worth a closer look */
  addEventListener('pointerover', e => {
    const el = e.target.closest ? e.target : null;
    lsTarget = !el ? 1 : el.closest('a, button') ? 2.6 : el.closest('h1, h2, .skill p, .marquee') ? 6 : 1;
    kick();
  }, { passive: true });
}

/* lens cursor + marquee state (both advanced in the frame loop) */
const lens = document.getElementById('lens');
let lensOn = false, lx = 0, ly = 0, ls = 1, lsTarget = 1;
const track = document.querySelector('.marquee-track');
let marqX = 0, marqHalf = 0, marqOn = false, skew = 0;
if (!reduced) {
  track.innerHTML += track.innerHTML;   // second copy so the loop is seamless
  new IntersectionObserver(es => { marqOn = es[es.length - 1].isIntersecting; kick(); }).observe(track.parentElement);
}

/* ---------- 6. project figures ---------- */
/* each card gets a small line drawing of what the project does; they only
   animate while on screen */
const FIGS = {
  /* SkinSense: a mirror, a camera travelling along its top edge, a scan pass */
  mirror(ctx, w, h, t) {
    const mw = h * 0.5, mh = h * 0.74, x0 = (w - mw) / 2, y0 = (h - mh) / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.roundRect(x0, y0, mw, mh, mw / 2); ctx.stroke();
    const scan = y0 + mh * (0.5 + 0.42 * Math.sin(t * 0.9));
    const cols = 9, rows = 13;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const u = (c + 0.5) / cols * 2 - 1, v = (r + 0.5) / rows * 2 - 1;
      if (u * u + v * v > 0.8) continue;
      const x = x0 + mw / 2 + u * mw * 0.42, y = y0 + mh / 2 + v * mh * 0.44;
      const k = Math.exp(-(((y - scan) / 12) ** 2));
      ctx.fillStyle = k > 0.25 ? `rgba(${accentRGB},${0.4 + k * 0.6})` : 'rgba(255,255,255,.28)';
      ctx.beginPath(); ctx.arc(x, y, 1.3 + k * 1.3, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = `rgba(${accentRGB},.8)`;
    ctx.beginPath(); ctx.moveTo(x0 - 14, scan); ctx.lineTo(x0 + mw + 14, scan); ctx.stroke();
    const cxm = w / 2 + Math.sin(t * 0.6) * mw * 0.3, cym = y0 - 12;
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.beginPath(); ctx.arc(cxm, cym, 4, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.moveTo(cxm, cym + 4); ctx.lineTo(w / 2, y0 + mh / 2); ctx.stroke();
  },
  /* Instrument Detection: a mel-spectrogram scrolling past */
  spectrogram(ctx, w, h, t) {
    const cols = 44, rows = 18, pad = 16, cw = (w - pad * 2) / cols, ch = (h - pad * 2) / rows;
    const s = t * 5, shift = s % 1, first = Math.floor(s);
    ctx.save(); ctx.beginPath(); ctx.rect(pad, pad, w - pad * 2, h - pad * 2); ctx.clip();
    for (let c = 0; c <= cols; c++) for (let r = 0; r < rows; r++) {
      const ti = c + first;
      let v = noise(ti * 0.22, r * 0.45) * (0.45 + 0.55 * (1 - r / rows));
      v *= 0.55 + 0.45 * Math.sin(r * 1.05 + noise(ti * 0.05, 3) * 6) ** 2;   // harmonic banding
      v = clamp(v * 1.9 - 0.25);
      if (v < 0.05) continue;
      ctx.fillStyle = v > 0.6 ? `rgba(${accentRGB},${v})` : `rgba(255,255,255,${v * 0.8})`;
      ctx.fillRect(pad + (c - shift) * cw, pad + (rows - 1 - r) * ch, cw - 1.5, ch - 1.5);
    }
    ctx.restore();
  },
  /* Image-to-LaTeX: an equation image is read left to right and comes out as LaTeX */
  latex(ctx, w, h, t) {
    const src = '\\int x^2\\,dx = \\frac{1}{3}x^3';
    const bx = w * 0.14, by = h * 0.16, bw = w * 0.72, bh = h * 0.36;
    const p = clamp((t % 8) / 4.5);
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `italic ${bh * 0.5}px "Instrument Serif", Georgia, serif`;
    ctx.fillText('∫ x² dx = ⅓ x³', bx + bw / 2, by + bh / 2);
    if (p < 1) {
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(bx + bw * p, by - 6); ctx.lineTo(bx + bw * p, by + bh + 6); ctx.stroke();
    }
    const fs = Math.min(14, bw / src.length / 0.62);
    ctx.font = `${fs}px ui-monospace, Consolas, monospace`;
    ctx.textAlign = 'left';
    const out = src.slice(0, Math.round(src.length * p)), ty = h * 0.72;
    ctx.fillStyle = `rgba(${accentRGB},.95)`;
    ctx.fillText(out, bx, ty);
    if (p < 1 || t % 1 < 0.5) ctx.fillRect(bx + ctx.measureText(out).width + 2, ty - fs * 0.55, fs * 0.5, fs * 1.1);
  },
  /* Quantitative alpha research: a signal's cumulative return drawn against a flat benchmark */
  alpha(ctx, w, h, t) {
    const pad = 22, iw = w - pad * 2, ih = h - pad * 2 - 14, N = 90;
    const p = clamp((t % 9) / 3.5), e = 1 - (1 - p) ** 2;
    ctx.strokeStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ih); ctx.lineTo(w - pad, pad + ih); ctx.stroke();
    for (const [seed, drift, style, lw] of [[9, 0.5, 'rgba(255,255,255,.35)', 1], [5, 0.4, accent, 1.5]]) {
      let cum = 0;
      ctx.strokeStyle = style; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(pad, pad + ih * 0.8);
      for (let i = 1; i <= N * e; i++) {
        cum += (hash(i, seed) - drift) * 0.05;
        ctx.lineTo(pad + iw * i / N, pad + ih * clamp(0.8 - cum, 0.04, 0.98));
      }
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  },
};
const figs = $$('canvas[data-fig]').map(cv => ({ cv, ctx: cv.getContext('2d'), draw: FIGS[cv.dataset.fig], w: 0, h: 0, on: false }));
const figIO = new IntersectionObserver(entries => {
  for (const e of entries) figs.find(f => f.cv === e.target).on = e.isIntersecting;
  kick();
});
function drawFigs(t) {
  let live = false;
  for (const f of figs) {
    if (!f.on) continue;
    live = true;
    f.ctx.clearRect(0, 0, f.w, f.h);
    f.draw(f.ctx, f.w, f.h, t);
  }
  return live;
}

/* ---------- sizing + loop ---------- */
function fit(o) {
  o.w = o.cv.clientWidth; o.h = o.cv.clientHeight;
  o.cv.width = o.w * DPR; o.cv.height = o.h * DPR;
  o.ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
function resize() {
  W = innerWidth; H = innerHeight;
  ridge.width = W * DPR; ridge.height = H * DPR;
  rctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ys = new Float32Array(Math.floor(W / STEP) + 2);
  waves.forEach(fit); figs.forEach(fit);
  marqHalf = track.scrollWidth / 2 || 1;
  anchorHero = docBottom(document.querySelector('.hero .links'));
  anchorEnd = docBottom(document.querySelector('.contact .links'));
  wavesDirty = true;
  readScroll();
  kick();
}

let running = false, prev = 0;
function frame(now) {
  const dt = Math.min((now - prev) / 1000, 0.05); prev = now;
  const y = scrollY;
  vel += ((y - lastY) - vel) * 0.3; lastY = y;
  energy += (clamp(Math.abs(vel) / 45) - energy) * 0.12;
  if (energy < 0.004) energy = 0;
  phase += dt * (3 + energy * 9) * (vel < 0 ? -1 : 1);
  pk += (pkTarget - pk) * 0.07; px += (ptx - px) * 0.14; py += (pty - py) * 0.14;

  const t = (now - t0) / 1000;
  const ridgeLive = drawRidge(t);
  const figsLive = drawFigs(t);
  const ringing = waves.some(wv => wv.plucks.length);
  if (energy > 0 || wavesDirty || ringing) {
    wavesDirty = false;
    drawWaves(now);
    if (energy > 0) wavesDirty = true;
  }

  let lensLive = false;
  if (lensOn) {
    lx += (ptx - lx) * 0.2; ly += (pty - ly) * 0.2; ls += (lsTarget - ls) * 0.14;
    lens.style.transform = `translate(${lx.toFixed(1)}px,${ly.toFixed(1)}px) scale(${ls.toFixed(3)})`;
    lensLive = Math.abs(ptx - lx) + Math.abs(pty - ly) > 0.3 || Math.abs(lsTarget - ls) > 0.01;
  }
  if (marqOn) {
    skew += (clamp(vel * 0.35, -14, 14) - skew) * 0.15;
    marqX -= 45 * dt + vel * 0.8;
    marqX = ((marqX % marqHalf) - marqHalf) % marqHalf;   // keep within one copy's width, either direction
    track.style.transform = `translateX(${marqX.toFixed(1)}px) skewX(${(-skew).toFixed(2)}deg)`;
  }

  running = !reduced && (ridgeLive || figsLive || lensLive || marqOn || energy > 0 || wavesDirty || ringing);
  if (running) requestAnimationFrame(frame);
}
function kick() {
  if (running) return;
  running = true; prev = performance.now();
  requestAnimationFrame(frame);
}

addEventListener('scroll', () => { readScroll(); kick(); }, { passive: true });
addEventListener('resize', resize);
document.fonts?.ready.then(resize);   // web fonts change line wrapping, which moves the anchors
document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
resize();
for (const f of figs) figIO.observe(f.cv);
