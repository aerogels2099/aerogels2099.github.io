import { state, canvasSize, reduced } from '../state.js';

const asteroids = [], sparks = [], beams = [];
const MAX_AST = 5, MAX_SPARKS = 140;
let score = 0, nextSpawn = 1.2, hudOn = false;
let hud, scoreEl, cur;

function makeShape(r) {
  const v = 7 + (Math.random() * 4 | 0), pts = [];
  for (let i = 0; i < v; i++) {
    const a = i / v * Math.PI * 2, rr = r * (0.72 + Math.random() * 0.4);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return pts;
}

function spawnAsteroid(x, y, r, vx, vy) {
  const { W, H } = canvasSize;
  if (asteroids.length >= MAX_AST + 4) return;
  if (x === undefined) {
    const left = Math.random() < .5;
    r = 16 + Math.random() * 22;
    x = left ? -r - 10 : W + r + 10;
    y = H * 0.12 + Math.random() * H * 0.7;
    vx = (left ? 1 : -1) * (18 + Math.random() * 26);
    vy = (Math.random() - .5) * 14;
  }
  asteroids.push({
    x, y, r, vx, vy,
    rot: Math.random() * 6.28,
    vr: (Math.random() - .5) * 1.2,
    pts: makeShape(r),
    teal: Math.random() < .25,
    hp: r > 14 ? 2 : 1,
  });
}

function burst(x, y, teal, n) {
  for (let i = 0; i < n && sparks.length < MAX_SPARKS; i++) {
    const a = Math.random() * 6.28, s = 30 + Math.random() * 120;
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5 + Math.random() * .45, t: 0, teal });
  }
}

function interactive(el) {
  return el.closest && el.closest('a,button,input,textarea,select,.chip,nav,#boot');
}

export function initAsteroids(cursorEl) {
  cur = cursorEl;
  hud = document.getElementById('hud');
  scoreEl = document.getElementById('score');

  document.addEventListener('pointerdown', e => {
    if (reduced || state.spaceO < .5 || interactive(e.target)) return;
    const { W, H } = canvasSize;
    const tx = e.clientX, ty = e.clientY;
    beams.push({ x0: W / 2, y0: H + 6, x1: tx, y1: ty, t: 0, life: .14 });
    cur.classList.add('fire');
    setTimeout(() => cur.classList.remove('fire'), 130);

    let hit = null, hd = 1e9;
    for (const a of asteroids) {
      const dx = a.x - tx, dy = a.y - ty, d = dx * dx + dy * dy, rr = (a.r + 14) * (a.r + 14);
      if (d < rr && d < hd) { hd = d; hit = a; }
    }
    if (hit) {
      hit.hp--;
      if (hit.hp <= 0) {
        asteroids.splice(asteroids.indexOf(hit), 1);
        burst(hit.x, hit.y, hit.teal, hit.r > 14 ? 26 : 16);
        if (hit.r > 14) {
          for (let k = 0; k < 2; k++) {
            const a2 = Math.random() * 6.28, sp = 26 + Math.random() * 22;
            spawnAsteroid(hit.x, hit.y, hit.r * 0.5, hit.vx + Math.cos(a2) * sp, hit.vy + Math.sin(a2) * sp);
          }
        }
        score++;
        scoreEl.textContent = String(score).padStart(3, '0');
        if (!hudOn) { hudOn = true; hud.classList.add('on'); }
      } else {
        burst(tx, ty, hit.teal, 6);
      }
    } else {
      burst(tx, ty, false, 3);
    }
  });
}

export function tickSpawn(dt) {
  nextSpawn -= dt;
  if (nextSpawn <= 0 && state.spaceO > .5 && asteroids.filter(a => a.r > 13).length < MAX_AST) {
    spawnAsteroid();
    nextSpawn = 2.6 + Math.random() * 3;
  }
}

export function drawAsteroids(ctx, dt) {
  const { W, H } = canvasSize;
  ctx.lineWidth = 1.2;
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
    if (a.x < -80 || a.x > W + 80 || a.y < -80 || a.y > H + 80) { asteroids.splice(i, 1); continue; }
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot);
    ctx.beginPath();
    ctx.moveTo(a.pts[0][0], a.pts[0][1]);
    for (let k = 1; k < a.pts.length; k++) ctx.lineTo(a.pts[k][0], a.pts[k][1]);
    ctx.closePath();
    ctx.strokeStyle = a.teal ? 'rgba(63,217,188,.65)' : 'rgba(63,167,255,.6)';
    ctx.fillStyle = 'rgba(10,15,12,.55)';
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

export function drawBeams(ctx, dt) {
  for (let i = beams.length - 1; i >= 0; i--) {
    const b = beams[i]; b.t += dt;
    if (b.t > b.life) { beams.splice(i, 1); continue; }
    const a = 1 - b.t / b.life;
    ctx.strokeStyle = 'rgba(63,167,255,' + (0.7 * a).toFixed(3) + ')';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
    ctx.beginPath(); ctx.arc(b.x1, b.y1, 3.5 * a, 0, 7);
    ctx.fillStyle = 'rgba(150,210,255,' + (0.8 * a).toFixed(3) + ')'; ctx.fill();
  }
}

export function drawSparks(ctx, dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.t += dt;
    if (s.t > s.life) { sparks.splice(i, 1); continue; }
    s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.985; s.vy *= 0.985;
    const a = 1 - s.t / s.life;
    ctx.beginPath(); ctx.arc(s.x, s.y, 1.4, 0, 7);
    ctx.fillStyle = s.teal ? 'rgba(63,217,188,' + a.toFixed(3) + ')' : 'rgba(63,167,255,' + a.toFixed(3) + ')';
    ctx.fill();
  }
}
