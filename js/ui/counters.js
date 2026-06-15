import { reduced } from '../state.js';

export function initCounters() {
  const co = new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      co.unobserve(e.target);
      const el = e.target, target = +el.dataset.count, dur = 1400, t0 = performance.now();
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
  }, { threshold: .4 });

  document.querySelectorAll('[data-count]').forEach(el => {
    if (reduced) { el.textContent = (+el.dataset.count).toLocaleString(); }
    else co.observe(el);
  });
}
