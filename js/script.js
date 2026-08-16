// 샘플 행사 일시 (실제 배포 시 교체)
const EVENT_DATE = new Date('2026-10-17T13:00:00+09:00');
const padNumber = (value) => String(value).padStart(2, '0');

function updateCountdown() {
  const now = new Date();
  const diff = EVENT_DATE - now;

  const ddayBadge = document.getElementById('dday-badge');
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');
  const countdownEl = document.getElementById('countdown');

  if (diff <= 0) {
    ddayBadge.textContent = 'D-DAY';
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
    countdownEl.setAttribute('aria-label', '오늘은 결혼식 날입니다');
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  ddayBadge.textContent = `D-${String(days + 1).padStart(3, '0')}`;
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
