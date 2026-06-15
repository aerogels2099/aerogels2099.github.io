import { reduced } from '../state.js';

/* a water-droplet ripple where you click the education card */
export function initRipple() {
  if (reduced) return;
  document.querySelectorAll('.edu').forEach(card => {
    card.addEventListener('pointerdown', e => {
      const r = card.getBoundingClientRect();
      const d = document.createElement('span');
      d.className = 'ripple';
      d.style.left = (e.clientX - r.left) + 'px';
      d.style.top  = (e.clientY - r.top)  + 'px';
      card.appendChild(d);
      d.addEventListener('animationend', () => d.remove());
    });
  });
}
