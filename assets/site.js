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

/* Issue line: always show the current month, like a magazine dateline */
const issueDate = document.querySelector('.issue-date');
if (issueDate) {
  const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  issueDate.textContent = `Faisalabad, ${month}`;
}

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
const duotone = document.querySelector('.portrait');
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

/* Background words: scattered English and Urdu, faint enough to never compete with the content */
const bgLayer = document.querySelector('.bg-words');
if (bgLayer) {
  const WORDS = [
    ['en', 'becoming'], ['ur', 'خواب'], ['en', 'code'], ['ur', 'لفظ'], ['en', 'distance'],
    ['ur', 'سفر'], ['en', 'reckoning'], ['ur', 'امید'], ['en', 'signal'], ['ur', 'شاعری'],
    ['en', 'grief'], ['ur', 'خاموشی'], ['en', 'build'], ['ur', 'یاد'], ['en', 'patterns'],
    ['ur', 'روشنی'], ['en', 'curious'], ['ur', 'منزل'], ['en', 'ink'], ['ur', 'دل'],
    ['en', 'data'], ['ur', 'وقت'], ['en', 'listen'], ['ur', 'تلاش'], ['en', 'quiet'],
    ['ur', 'کوڈ'], ['en', 'wander'], ['ur', 'سکون']
  ];
  // Small deterministic generator so the layout is the same on every visit
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // Solid blocks a background word must never sit on, plus every actual line of text (measured below)
  const SOLID = '.nameplate, .btn, .portrait, .ticker, .lead-feature, .certs, .writing, .book';
  const PAD = 14; // room for the slow drift animation

  // Where a box will sit once its scroll-reveal slide-in has finished
  const settled = (rect, node) => {
    const rev = node.closest?.('.reveal');
    if (!rev) return rect;
    const m = new DOMMatrixReadOnly(getComputedStyle(rev).transform);
    return { left: rect.left - m.m41, right: rect.right - m.m41, top: rect.top - m.m42, bottom: rect.bottom - m.m42, width: rect.width, height: rect.height };
  };

  const textLineRects = () => {
    const rects = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => node.textContent.trim() && !node.parentElement.closest('.bg-words, .ticker, .nameplate, script, style')
        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const range = document.createRange();
    while (walker.nextNode()) {
      range.selectNodeContents(walker.currentNode);
      for (const r of range.getClientRects()) rects.push(settled(r, walker.currentNode.parentElement));
    }
    return rects;
  };

  const place = () => {
    bgLayer.textContent = '';
    const narrow = window.innerWidth < 720;
    const rowGap = narrow ? 300 : 340;
    const rows = Math.max(4, Math.floor(document.documentElement.scrollHeight / rowGap));
    const perRow = narrow ? 1 : 2;
    const layer = bgLayer.getBoundingClientRect();
    const blocked = [...[...document.querySelectorAll(SOLID)].map(b => settled(b.getBoundingClientRect(), b)), ...textLineRects()]
      .filter(r => r.width && r.height)
      .map(r => ({ l: r.left - layer.left - PAD, t: r.top - layer.top - PAD, r: r.right - layer.left + PAD, b: r.bottom - layer.top + PAD }));
    const clashes = el => {
      const r = el.getBoundingClientRect();
      const box = { l: r.left - layer.left, t: r.top - layer.top, r: r.right - layer.left, b: r.bottom - layer.top };
      return box.r > layer.width || blocked.some(k => box.l < k.r && box.r > k.l && box.t < k.b && box.b > k.t);
    };

    seed = 7;
    let n = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < perRow; col++) {
        const [lang, text] = WORDS[n++ % WORDS.length];
        const el = document.createElement('span');
        el.className = 'bg-word ' + lang + (rand() > 0.72 ? ' tint' : '');
        el.lang = lang === 'ur' ? 'ur' : 'en';
        if (lang === 'ur') el.dir = 'rtl';
        el.textContent = text;
        const size = lang === 'ur' ? 34 + rand() * 40 : 44 + rand() * 62;
        el.style.setProperty('--fs', (narrow ? size * 0.65 : size).toFixed(0) + 'px');
        el.style.setProperty('--r', (rand() * 16 - 8).toFixed(1) + 'deg');
        el.style.setProperty('--o', (0.06 + rand() * 0.04).toFixed(3));
        el.style.setProperty('--dx', (rand() * 36 - 18).toFixed(0) + 'px');
        el.style.setProperty('--dy', (rand() * 36 - 18).toFixed(0) + 'px');
        el.style.setProperty('--dur', (16 + rand() * 14).toFixed(1) + 's');
        el.style.setProperty('--delay', (rand() * 1.2 + 0.4).toFixed(2) + 's');
        bgLayer.appendChild(el);

        // Try a handful of spots in this row; keep the word only where it touches no content
        const colWidth = 100 / perRow;
        let free = false;
        for (let attempt = 0; attempt < 30 && !free; attempt++) {
          el.style.left = (col * colWidth + rand() * (colWidth - 4)) + '%';
          el.style.top = ((row + rand() * 0.9) * rowGap) + 'px';
          free = !clashes(el);
        }
        if (!free) el.remove();
      }
    }
  };

  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  fontsReady.then(place);
  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return;   // ignore mobile URL-bar height changes
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(place, 250);
  });
}
