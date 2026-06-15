export function initReveal() {
  const io = new IntersectionObserver(es => {
    for (const e of es) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }
  }, { threshold: .12 });
  /* the bedrock footer band rides the same reveal — it stays put while
     everything else parallaxes, then rises in once when it scrolls into view */
  document.querySelectorAll('.reveal, .dirt-band').forEach(el => io.observe(el));
}

export function initSpectrogram() {
  document.querySelectorAll('.proj .spec').forEach(spec => {
    for (let i = 0; i < 26; i++) {
      const bar = document.createElement('i');
      bar.style.animationDelay    = (Math.random() * 1.2) + 's';
      bar.style.animationDuration = (0.7 + Math.random() * 1.1) + 's';
      bar.style.height            = (20 + Math.random() * 80) + '%';
      spec.appendChild(bar);
    }
  });
}
