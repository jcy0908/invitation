// 샘플 행사 일시 (실제 배포 시 교체)
const EVENT_DATE = new Date('2026-10-17T13:00:00+09:00');

function updateCountdown() {
  const now = new Date();
  const diff = EVENT_DATE - now;

  const ddayBadge = document.getElementById('dday-badge');
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minutesEl = document.getElementById('cd-minutes');
  const secondsEl = document.getElementById('cd-seconds');

  if (diff <= 0) {
    ddayBadge.textContent = 'D-DAY';
    daysEl.textContent = '00';
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  ddayBadge.textContent = `D-${String(days + 1).padStart(3, '0')}`;
  daysEl.textContent = String(days).padStart(2, '0');
  hoursEl.textContent = String(hours).padStart(2, '0');
  minutesEl.textContent = String(minutes).padStart(2, '0');
  secondsEl.textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);
