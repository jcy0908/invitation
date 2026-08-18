// 샘플 행사 일시 (실제 배포 시 교체)
const EVENT_DATE = new Date('2026-10-17T13:00:00+09:00');
const EVENT_DAY_END = new Date('2026-10-18T00:00:00+09:00');
const padNumber = (value) => String(value).padStart(2, '0');

const ddayBadge = document.getElementById('dday-badge');
const daysEl = document.getElementById('cd-days');
const hoursEl = document.getElementById('cd-hours');
const minutesEl = document.getElementById('cd-minutes');
const secondsEl = document.getElementById('cd-seconds');
const countdownEl = document.getElementById('countdown');

function updateCountdown() {
  const now = new Date();
  const diff = EVENT_DATE - now;

  if (diff <= 0) {
    const isEventDay = now < EVENT_DAY_END;
    ddayBadge.textContent = isEventDay ? 'D-DAY' : '종료';
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
    countdownEl.setAttribute(
      'aria-label',
      isEventDay ? '오늘은 결혼식 날입니다' : '결혼식이 종료되었습니다'
    );
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const dday = Math.ceil(diff / 86400000);
  ddayBadge.textContent = `D-${String(dday).padStart(3, '0')}`;
  daysEl.textContent = padNumber(days);
  hoursEl.textContent = padNumber(hours);
  minutesEl.textContent = padNumber(minutes);
  secondsEl.textContent = padNumber(seconds);
  countdownEl.setAttribute(
    'aria-label',
    `결혼식까지 ${days}일 ${hours}시간 ${minutes}분 ${seconds}초 남았습니다`
  );
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
