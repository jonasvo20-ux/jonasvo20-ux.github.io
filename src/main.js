// Theme toggle
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');
const THEME_KEY = 'jonas-theme';

function applyTheme(theme) {
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  const dark = theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);
  themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

try {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);
  else applyTheme(null);
} catch {
  applyTheme(null);
}

themeBtn.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch {}
});

// Live clock (Europe/Brussels)
const hhEl = document.getElementById('clock-hh');
const mmEl = document.getElementById('clock-mm');
const tzEl = document.getElementById('clock-tz');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Brussels', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
function tickClock() {
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map(p => [p.type, p.value]));
  hhEl.textContent = parts.hour;
  mmEl.textContent = parts.minute;
  tzEl.textContent = parts.timeZoneName;
}
tickClock();
setInterval(tickClock, 10000);

// Scroll progress bar + active section tracking
const progressBar = document.getElementById('progress-bar');
const idxLabel = document.getElementById('idx-label');
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const sections = Array.from(document.querySelectorAll('main [data-sec]'));

function onScroll() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progressBar.style.transform = `scaleX(${p})`;

  let idx = 0;
  const vh = window.innerHeight;
  sections.forEach(s => {
    if (s.getBoundingClientRect().top < vh * 0.45) idx = +s.dataset.sec;
  });
  idxLabel.textContent = `${String(idx).padStart(2, '0')} / 04`;
  navLinks.forEach(a => a.classList.toggle('active', +a.dataset.sec === idx));
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Scroll-reveal via IntersectionObserver
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion && 'IntersectionObserver' in window) {
  // A "mask" element starts translateY(110%) inside its overflow:hidden
  // wrapper — i.e. clipped out of view by design. Observing the element
  // itself means it can never register as intersecting, so we observe its
  // wrapper (which is never clipped) and reveal the mask span through it.
  const revealTargets = new Map();
  document.querySelectorAll('[data-r]').forEach(el => {
    const target = el.dataset.r === 'mask' ? el.parentElement : el;
    const list = revealTargets.get(target) || [];
    list.push(el);
    revealTargets.set(target, list);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      (revealTargets.get(en.target) || []).forEach(el => {
        const delay = +(el.dataset.d || 0);
        setTimeout(() => el.classList.add('in'), delay);
      });
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -6% 0px' });
  revealTargets.forEach((_, target) => io.observe(target));
} else {
  document.querySelectorAll('[data-r]').forEach(el => el.classList.add('in'));
}

// Work list hover: dim siblings + follow cursor tooltip
const listWrap = document.getElementById('work-list-wrap');
const workItems = Array.from(document.querySelectorAll('#work-list li'));
const cursorTip = document.getElementById('cursor-tip');
const cursorTipSpan = cursorTip.querySelector('span');

workItems.forEach(li => {
  const link = li.querySelector('a');
  li.addEventListener('mouseenter', () => {
    workItems.forEach(other => other.classList.toggle('dim', other !== li));
    cursorTipSpan.textContent = link.dataset.cta || '';
    cursorTip.style.opacity = '1';
    cursorTip.style.transform = 'scale(1)';
  });
  li.addEventListener('mouseleave', () => {
    workItems.forEach(other => other.classList.remove('dim'));
    cursorTip.style.opacity = '0';
    cursorTip.style.transform = 'scale(.85)';
  });
});
listWrap.addEventListener('mousemove', e => {
  const r = listWrap.getBoundingClientRect();
  cursorTip.style.transform = `translate(${e.clientX - r.left + 14}px, ${e.clientY - r.top + 14}px) scale(1)`;
});

// Copy email button
const copyBtn = document.getElementById('copy-btn');
let copyTimer;
copyBtn.addEventListener('click', () => {
  navigator.clipboard?.writeText('hello@jonasvo.me').catch(() => {});
  copyBtn.classList.add('copied');
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => copyBtn.classList.remove('copied'), 1800);
});
