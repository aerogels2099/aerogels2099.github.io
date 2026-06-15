import { initBoot }                    from './ui/boot.js';
import { initCursor, initTilt }        from './ui/cursor.js';
import { initReveal, initSpectrogram } from './ui/reveal.js';
import { initCounters }                from './ui/counters.js';
import { initTicker }                  from './ui/ticker.js';
import { initGitGraph }                from './ui/gitgraph.js';
import { initRipple }                  from './ui/ripple.js';
import { cv, startLoop }               from './engine/canvas.js';
import { initAsteroids }               from './engine/asteroids.js';
import { initDescent }                 from './engine/descent.js';

/* scroll progress bar */
const prog = document.getElementById('progress');
addEventListener('scroll', () => {
  const h = document.documentElement;
  prog.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100) + '%';
}, { passive: true });

/* init everything */
initBoot();
const cur = initCursor();
initTilt();
initReveal();
initSpectrogram();
initCounters();
initTicker();
initGitGraph();
initRipple();
initAsteroids(cur);
initDescent(cv);
startLoop();
