const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}));

/* Nameplate: wrap each letter so it can rise in one after another */
const nameplate = document.querySelector('.nameplate');
if (nameplate) {
  nameplate.setAttribute('aria-label', nameplate.textContent.trim().replace(/\s+/g, ' '));
  let i = 0;
  nameplate.querySelectorAll('.np-first, .np-last').forEach(line => {
    const text = line.textContent;
    line.textContent = '';
    line.setAttribute('aria-hidden', 'true');
    [...text].forEach(char => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.style.setProperty('--i', i++);
      span.textContent = char;
      line.appendChild(span);
    });
  });
}

/* Staggered groups: each child reveals a beat after the previous one */
document.querySelectorAll('.stagger').forEach(group => {
  [...group.children].forEach((child, n) => {
    child.classList.add('reveal', 'reveal-left');
    child.style.setProperty('--d', n);
  });
});

/* Two-column feature grid: offset the right column slightly */
document.querySelectorAll('.feature-list .feature').forEach((card, n) => {
  card.style.setProperty('--d', n % 2);
});

/* Scroll reveal */
const revealables = document.querySelectorAll('.reveal, .feature-art');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealables.forEach(el => io.observe(el));
} else {
  revealables.forEach(el => el.classList.add('in'));
}

/* Scroll progress bar + active nav link */
const progress = document.querySelector('.progress');
const navLinks = [...document.querySelectorAll('#site-nav a')];
const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
let ticking = false;

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (progress) progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;

  const mid = window.innerHeight * 0.4;
  let current = null;
  sections.forEach(sec => { if (sec.getBoundingClientRect().top <= mid) current = sec.id; });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${current}`));
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

/* Portrait: the accent plate drifts toward the cursor, like a print slipping out of register */
const duotone = document.querySelector('.duotone');
if (duotone && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
  duotone.addEventListener('pointermove', e => {
    const r = duotone.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    duotone.style.setProperty('--mx', `${(x * 22).toFixed(1)}px`);
    duotone.style.setProperty('--my', `${(y * 22).toFixed(1)}px`);
  });
  duotone.addEventListener('pointerleave', () => {
    duotone.style.setProperty('--mx', '0px');
    duotone.style.setProperty('--my', '0px');
  });
}
