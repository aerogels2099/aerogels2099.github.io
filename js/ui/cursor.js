import { reduced } from '../state.js';

export function initCursor() {
  const cur = document.getElementById('cursor');
  if (!reduced && matchMedia('(hover:hover)').matches) {
    /* track the pointer directly — no easing, so the ring sits on the cursor
       with zero lag, and we drop the permanent requestAnimationFrame loop */
    addEventListener('mousemove', e => {
      cur.style.left = e.clientX + 'px';
      cur.style.top  = e.clientY + 'px';
    }, { passive: true });
    document.querySelectorAll('a,button,.chip,.proj').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('hot'));
      el.addEventListener('mouseleave', () => cur.classList.remove('hot'));
    });
  }
  return cur;
}

export function initTilt() {
  if (reduced || !matchMedia('(hover:hover)').matches) return;
  document.querySelectorAll('.tilt').forEach(card => {
    const inner = card.querySelector('.proj-inner');
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
      card.style.transform = 'rotateY(' + ((x - .5) * 8) + 'deg) rotateX(' + ((.5 - y) * 8) + 'deg) translateY(-4px)';
      inner.style.setProperty('--mx', (x * 100) + '%');
      inner.style.setProperty('--my', (y * 100) + '%');
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}
