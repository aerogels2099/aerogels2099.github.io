import { reduced } from '../state.js';

export function initBoot() {
  const boot = document.getElementById('boot');
  const endBoot = () => boot.classList.add('done');
  /* only play the sequence on the first load of a session; on repeat
     navigations (back button, re-open) skip straight to content */
  if (reduced || sessionStorage.getItem('booted')) {
    endBoot();
  } else {
    sessionStorage.setItem('booted', '1');
    setTimeout(endBoot, 1300);
    boot.addEventListener('click', endBoot);
  }
}
