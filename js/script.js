// 청첩장 — D-day와 남은 시간.
//
// 날짜 계산은 C++로 쓰여 WebAssembly로 빌드된 모듈(js/dday.wasm, 595B)이
// 맡습니다. 받지 못하면 같은 API의 JS 구현(js/dday.js)으로 되돌아갑니다.
//
// 왜 옮겼는가: 예전에는 남은 '경과 시간'으로 D-day를 만들어서 같은 날짜라도
// 시각에 따라 답이 달라졌습니다. 13시 예식이면 당일 오전에 D-001이 뜨고
// (D-DAY여야 합니다) 하루 전 오전에는 D-002가 떴습니다(D-1이어야 합니다).
// D-day는 시간의 뺄셈이 아니라 달력 날짜의 뺄셈입니다.
//
// 두 구현이 같은 값을 낸다는 것은 tools/dday_equivalence.mjs가 확인합니다 —
// 6개 시간대 × 20,464개 시각, 122,784건.

let dday;
let ddayEngine = 'JavaScript';
try {
  dday = await import('./dday-wasm.js');
  await dday.loadDdayWasm();
  ddayEngine = 'WebAssembly (C++)';
} catch (err) {
  dday = await import('./dday.js');
}
console.info(`청첩장 — 날짜 계산: ${ddayEngine}`);

// 샘플 행사 일시 (실제 배포 시 교체)
const EVENT_SEC = Date.parse('2026-10-17T13:00:00+09:00') / 1000;
const KST_OFFSET_MINUTES = 540;

const ddayBadge = document.getElementById('dday-badge');
const daysEl = document.getElementById('cd-days');
const hoursEl = document.getElementById('cd-hours');
const minutesEl = document.getElementById('cd-minutes');
const secondsEl = document.getElementById('cd-seconds');

const pad2 = (n) => String(n).padStart(2, '0');

function updateCountdown() {
  const r = dday.compute(Date.now() / 1000, EVENT_SEC, KST_OFFSET_MINUTES);

  ddayBadge.textContent = dday.label(r);
  daysEl.textContent = pad2(r.days);
  hoursEl.textContent = pad2(r.hours);
  minutesEl.textContent = pad2(r.minutes);
  secondsEl.textContent = pad2(r.seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ==========================================================================
// Fluid — 누르는 즉시 반응한다 (Apple, Designing Fluid Interfaces §1)
// click을 기다리면 죽은 것처럼 느껴진다.
// ==========================================================================
document.querySelectorAll('.map-btn').forEach((el) => {
  el.addEventListener('pointerdown', () => el.classList.add('is-pressed'));
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((evt) =>
    el.addEventListener(evt, () => el.classList.remove('is-pressed'))
  );
});

// ===========================================================================
// 에디토리얼 리빌 — 화면 진입 때 한 번만, 느리고 짧게 드러난다.
// JavaScript나 IntersectionObserver가 없으면 콘텐츠는 처음부터 보인다.
// ===========================================================================
const revealSections = document.querySelectorAll('.reveal');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reduceMotion) {
  revealSections.forEach((section) => section.classList.add('is-animated'));

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );

  revealSections.forEach((section) => revealObserver.observe(section));
}

// ===========================================================================
// Scroll system — 한 번의 rAF에서 상단 chrome, 진행률, hero 표현값을 함께 갱신한다.
// 콘텐츠와 링크는 JavaScript가 없어도 그대로 남는다.
// ===========================================================================
const chrome = document.getElementById('invitation-chrome');
const progressBar = document.getElementById('scroll-progress-bar');
const hero = document.querySelector('[data-scroll-hero]');
const sectionLinks = [...document.querySelectorAll('.chrome-nav a[href^="#"]')];
const trackedSections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);
let scrollFrame = 0;

function updateScrollPresentation() {
  scrollFrame = 0;
  const scrollTop = window.scrollY;
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
  progressBar.style.transform = `scaleX(${progress})`;
  const isChromeVisible = scrollTop > 56;
  chrome.classList.toggle('is-visible', isChromeVisible);
  chrome.toggleAttribute('inert', !isChromeVisible);
  if (isChromeVisible) chrome.removeAttribute('aria-hidden');
  else chrome.setAttribute('aria-hidden', 'true');

  if (hero && !reduceMotion) {
    const heroProgress = Math.min(Math.max(scrollTop / Math.max(hero.offsetHeight * 0.72, 1), 0), 1);
    hero.style.setProperty('--hero-drift', `${heroProgress * 20}px`);
    hero.style.setProperty('--hero-fade', String(1 - heroProgress * 0.42));
  }

  let activeSection = null;
  const marker = window.innerHeight * 0.32;
  trackedSections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) activeSection = section;
  });
  sectionLinks.forEach((link) => {
    const isActive = activeSection && link.getAttribute('href') === `#${activeSection.id}`;
    if (isActive) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function requestScrollUpdate() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScrollPresentation);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
updateScrollPresentation();
