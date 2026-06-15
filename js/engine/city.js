const NS = 'http://www.w3.org/2000/svg';

function svgEl(n, attrs) {
  const e = document.createElementNS(NS, n);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

function jitter(hex, amt) {
  const v = parseInt(hex.slice(1), 16), d = ((Math.random() * 2 - 1) * amt) | 0;
  const cl = x => Math.max(0, Math.min(255, x + d));
  return 'rgb(' + cl(v >> 16) + ',' + cl((v >> 8) & 255) + ',' + cl(v & 255) + ')';
}

let gradId = 0;

/* vertical body gradient: building colour at the top → near-black at the base */
function bodyGrad(defs, fill) {
  const id = 'g' + (gradId++);
  const grad = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': fill }));
  grad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#000000', 'stop-opacity': '0.55' }));
  defs.appendChild(grad);
  return 'url(#' + id + ')';
}

const GROUND = 360;  /* waterline: buildings sit here, the bottom 40px is water */

/* Manhattan height profile: two supertall clusters (Downtown + Midtown)
   with a lower dip between them — the classic across-the-river silhouette. */
function envelope(x) {
  const down = Math.exp(-Math.pow((x - 520) / 300, 2));
  const mid  = Math.exp(-Math.pow((x - 1080) / 260, 2));
  return 0.66 + 0.34 * Math.min(1, down + mid);
}

export function skyline(cls, baseColor, opts) {
  const svg = svgEl('svg', { viewBox: '0 0 1600 400', preserveAspectRatio: 'xMidYMax slice' });
  svg.classList.add(cls);
  const defs = svgEl('defs', {}); svg.appendChild(defs);

  /* water surface: a dark tint that deepens downward + a lit waterline seam */
  if (opts.water) {
    const id = 'g' + (gradId++);
    const wg = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    wg.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#0A1020', 'stop-opacity': '0' }));
    wg.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#05070E', 'stop-opacity': '0.6' }));
    defs.appendChild(wg);
    svg.appendChild(svgEl('rect', { x: 0, y: GROUND, width: 1600, height: 400 - GROUND, fill: 'url(#' + id + ')' }));
    svg.appendChild(svgEl('rect', { x: 0, y: GROUND - 1, width: 1600, height: 2, fill: 'rgba(63,167,255,.14)' }));
  }

  let x = -10, wi = 0;

  while (x < 1600) {
    const bw = 34 + Math.random() * 86;
    const bh = (opts.minH + Math.random() * opts.varH) * envelope(x + bw / 2);
    const top = GROUND - bh;
    const fill = jitter(baseColor, 10);
    const bodyFill = bodyGrad(defs, fill);

    svg.appendChild(svgEl('rect', { x, y: top, width: bw, height: bh, fill: bodyFill }));
    svg.appendChild(svgEl('rect', { x: x + bw - 3, y: top, width: 3, height: bh, fill: 'rgba(0,0,0,.45)' }));

    const tall     = opts.detail && bh > opts.minH + opts.varH * 0.5;
    const veryTall = opts.detail && bh > opts.minH + opts.varH * 0.72;

    /* Art-Deco setbacks: narrower stepped tiers stacked on the roof */
    let crownX = x + bw / 2, crownY = top;
    if (tall) {
      let tw = bw;
      for (let t = 0, tiers = veryTall ? 2 : 1; t < tiers; t++) {
        const ntw = tw * (0.52 + Math.random() * 0.16);
        const th = 14 + Math.random() * 12;
        const ntx = x + bw / 2 - ntw / 2;
        crownY -= th;
        svg.appendChild(svgEl('rect', { x: ntx, y: crownY, width: ntw, height: th, fill: bodyGrad(defs, jitter(baseColor, 8)) }));
        svg.appendChild(svgEl('rect', { x: ntx + ntw - 2, y: crownY, width: 2, height: th, fill: 'rgba(0,0,0,.4)' }));
        tw = ntw;
      }
    } else if (opts.detail && Math.random() < .4) {
      const pw = bw * (0.3 + Math.random() * 0.3);
      svg.appendChild(svgEl('rect', { x: x + (bw - pw) / 2, y: top - 8, width: pw, height: 8, fill }));
    }

    /* spire / antenna crowned by a red aircraft-warning beacon */
    if (veryTall || (opts.detail && bh > opts.minH + opts.varH * 0.6 && Math.random() < .55)) {
      let spH = veryTall ? 28 + Math.random() * 28 : 18 + Math.random() * 8;
      spH = Math.min(spH, crownY - 4);
      if (spH > 4) {
        const apex = crownY - spH;
        if (veryTall) {
          svg.appendChild(svgEl('polygon', {
            points: (crownX - 2.5) + ',' + crownY + ' ' + (crownX + 2.5) + ',' + crownY + ' ' + crownX + ',' + apex,
            fill: jitter(baseColor, 6)
          }));
        } else {
          svg.appendChild(svgEl('rect', { x: crownX - 1, y: apex, width: 2, height: spH, fill: 'rgba(160,160,170,.5)' }));
        }
        const bc = svgEl('circle', { cx: crownX, cy: apex - 2, r: 2.4, fill: 'rgba(255,84,70,.9)' });
        bc.classList.add('beacon');
        svg.appendChild(bc);
      }
    }

    /* rooftop water tanks on stilts — quintessentially New York */
    if (opts.detail && Math.random() < .16 && bw > 50) {
      const tx = x + 8 + Math.random() * (bw - 26);
      svg.appendChild(svgEl('rect', { x: tx, y: top - 14, width: 13, height: 10, fill: jitter('#1A1410', 8) }));
      svg.appendChild(svgEl('rect', { x: tx + 2, y: top - 4, width: 2, height: 4, fill: 'rgba(0,0,0,.6)' }));
      svg.appendChild(svgEl('rect', { x: tx + 9, y: top - 4, width: 2, height: 4, fill: 'rgba(0,0,0,.6)' }));
    }

    const floorH = 14, colW = 11, lit = [];
    for (let wy = top + 10; wy < GROUND - 4; wy += floorH) {
      const litFloor = opts.detail && Math.random() < .06;
      if (litFloor) {
        svg.appendChild(svgEl('rect', { x: x + 3, y: wy, width: bw - 6, height: 6, fill: 'rgba(120,190,255,' + (opts.winA * .5) + ')' }));
        continue;
      }
      for (let wx = x + 5; wx < x + bw - 8; wx += colW) {
        if (Math.random() < opts.winP) {
          const teal = Math.random() < .1;
          const a = opts.winA * (0.55 + Math.random() * 0.45);
          const col = teal
            ? 'rgba(120,225,200,' + a + ')'
            : 'rgba(' + (120 + (Math.random() * 60 | 0)) + ',' + (180 + (Math.random() * 50 | 0)) + ',255,' + a + ')';
          if (opts.glow && Math.random() < .3) {
            svg.appendChild(svgEl('rect', { x: wx - 1, y: wy - 1, width: 6, height: 8, fill: col.replace(/[\d.]+\)$/, '0.12)') }));
          }
          const w = svgEl('rect', { x: wx, y: wy, width: 4, height: 6, fill: col });
          if (++wi % opts.blink === 0) w.classList.add('win');
          svg.appendChild(w);
          lit.push({ x: wx, col });
        }
      }
    }

    /* reflection in the water: a faded smear of the tower plus a few
       shimmering vertical streaks under its lit windows */
    if (opts.water) {
      if (tall) {
        const id = 'g' + (gradId++);
        const rg = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
        rg.appendChild(svgEl('stop', { offset: '0%', 'stop-color': fill, 'stop-opacity': '0.22' }));
        rg.appendChild(svgEl('stop', { offset: '100%', 'stop-color': fill, 'stop-opacity': '0' }));
        defs.appendChild(rg);
        svg.appendChild(svgEl('rect', { x: x + 2, y: GROUND, width: bw - 4, height: 400 - GROUND, fill: 'url(#' + id + ')' }));
      }
      const a = (opts.winA * 0.5).toFixed(2);
      for (let s = 0, n = Math.min(lit.length, 2 + (Math.random() * 3 | 0)); s < n; s++) {
        const L = lit[(Math.random() * lit.length) | 0];
        svg.appendChild(svgEl('rect', {
          x: L.x + (Math.random() * 2 - 1), y: GROUND, width: 2.5,
          height: 6 + Math.random() * (400 - GROUND - 6),
          fill: L.col.replace(/[\d.]+\)$/, a + ')')
        }));
      }
    }

    x += bw + (3 + Math.random() * 14);
  }
  return svg;
}
