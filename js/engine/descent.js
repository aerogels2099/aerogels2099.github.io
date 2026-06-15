import { reduced, state } from '../state.js';
import { skyline } from './city.js';

const cloudsEl = document.getElementById('clouds');
const cityEl   = document.getElementById('city');
const dirtBand = document.getElementById('dirtBand');
const auroraEl = document.getElementById('aurora');

/* ---- clouds: blurred blobs with per-cloud scroll speed ---- */
const clouds = [];
(function buildClouds() {
  const CLOUD_N = innerWidth < 760 ? 5 : 9;
  for (let i = 0; i < CLOUD_N; i++) {
    const el = document.createElement('div');
    const far = i % 3 === 0;
    el.className = 'cloud' + (far ? ' far' : '');
    const w = far ? 280 + Math.random() * 260 : 380 + Math.random() * 420;
    el.style.width  = w + 'px';
    el.style.height = (w * 0.38) + 'px';
    el.style.top    = (8 + Math.random() * 70) + '%';
    cloudsEl.appendChild(el);
    clouds.push({ el, baseX: Math.random(), speed: (far ? .12 : .3) + Math.random() * .25, dir: Math.random() < .5 ? 1 : -1 });
  }
})();

/* ---- night city: three skyline rows with atmospheric perspective ---- */
const cityFar   = skyline('row-far',   '#2A3050', { minH: 60, varH: 180, winP: .20, winA: .16, blink: 23, detail: false, glow: false, water: false });
const cityMid   = skyline('row-mid',   '#161A2B', { minH: 80, varH: 240, winP: .34, winA: .38, blink: 12, detail: true,  glow: false, water: true  });
const cityFront = skyline('row-front', '#080910', { minH: 60, varH: 200, winP: .42, winA: .62, blink: 8,  detail: true,  glow: true,  water: true  });
cityEl.appendChild(cityFar); cityEl.appendChild(cityMid); cityEl.appendChild(cityFront);
/* haze sits between mid and front for depth */
cityEl.insertBefore(cityEl.querySelector('.haze'), cityFront);

/* ---- bedrock texture for the thin footer band (dark rock, no grass) ---- */
function pixelTile(wCells, hCells, palette) {
  const cell = 3, c = document.createElement('canvas');
  c.width = wCells * cell; c.height = hCells * cell;
  const g = c.getContext('2d');
  for (let ry = 0; ry < hCells; ry++)
    for (let rx = 0; rx < wCells; rx++) {
      g.fillStyle = palette[(Math.random() * palette.length) | 0];
      g.fillRect(rx * cell, ry * cell, cell, cell);
    }
  return c.toDataURL();
}
const rockPal = ['#0E0F12', '#121319', '#0A0B0E', '#15161C', '#0C0D11', '#181922', '#101116', '#070709'];
dirtBand.style.backgroundImage = 'url(' + pixelTile(20, 20, rockPal) + ')';

/* ---- zone math ---- */
function offTop(sel) { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top + scrollY : 1e9; }
const sstep = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hexMix = (h1, h2, t) => {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16);
  const r = ((a >> 16) + (((b >> 16) - (a >> 16)) * t)) | 0,
        g = (((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t)) | 0,
        c = ((a & 255) + (((b & 255) - (a & 255)) * t)) | 0;
  return 'rgb(' + r + ',' + g + ',' + c + ')';
};
function rgbToHex(rgb) { const m = rgb.match(/\d+/g); return ((+m[0] << 16) + (+m[1] << 8) + (+m[2])).toString(16).padStart(6, '0'); }
const BG = { space: '#060A10', sky: '#0C1A2D', city: '#0A1420' };

let cv, bounds = {}, queued = false;

function measure() {
  bounds = { exp: offTop('#experience'), skills: offTop('#skills') };
}

function descend() {
  queued = false;
  const vh = innerHeight, c = scrollY + vh * .5, w = vh * .55;
  const s1 = sstep(c, bounds.exp - w,    bounds.exp + w * .25);   /* into clouds */
  const s2 = sstep(c, bounds.skills - w, bounds.skills + w * .25);/* into city   */

  state.spaceO = 1 - s1;
  const cloudO = s1 * (1 - s2), cityO = s2; /* city holds to the bottom */

  cv.style.opacity       = state.spaceO.toFixed(3);
  auroraEl.style.opacity = (.5 * state.spaceO).toFixed(3);
  cloudsEl.style.opacity = cloudO.toFixed(3);
  cityEl.style.opacity   = cityO.toFixed(3);
  /* fully-faded layers are hidden so their heavy blur/animations aren't composited */
  auroraEl.style.visibility = state.spaceO > .02 ? 'visible' : 'hidden';
  cloudsEl.style.visibility = cloudO       > .01 ? 'visible' : 'hidden';
  cityEl.style.visibility   = cityO        > .01 ? 'visible' : 'hidden';

  /* base colour of the world */
  let col = hexMix(BG.space, BG.sky, s1);
  col = hexMix('#' + rgbToHex(col), BG.city, s2);
  document.body.style.setProperty('--bgc', col);

  /* crosshair + HUD belong to the title zone */
  document.body.classList.toggle('no-aim', state.spaceO < .5);

  if (!reduced) {
    /* clouds ride the scroll */
    if (cloudO > 0.01) {
      const total = innerWidth + 700, dy = scrollY - bounds.exp;
      for (const cl of clouds) {
        const px = ((cl.baseX * total + dy * cl.speed * cl.dir) % total + total) % total - 350;
        cl.el.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + (dy * -0.04).toFixed(1) + 'px,0)';
      }
    }
    /* skyline parallax: three depths */
    if (cityO > 0.01) {
      const dy = scrollY - bounds.skills;
      cityFar.style.transform   = 'translate3d(' + (dy * -0.01).toFixed(1)  + 'px,' + (dy * -0.012).toFixed(1) + 'px,0)';
      cityMid.style.transform   = 'translate3d(' + (dy *  0.015).toFixed(1) + 'px,' + (dy * -0.006).toFixed(1) + 'px,0)';
      cityFront.style.transform = 'translate3d(' + (dy *  0.035).toFixed(1) + 'px,0,0)';
    }
  }
}

export function initDescent(canvasEl) {
  cv = canvasEl;
  measure();
  addEventListener('resize', measure);
  setTimeout(measure, 600); /* re-measure after fonts settle */
  addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(descend); }
  }, { passive: true });
  descend();
}
