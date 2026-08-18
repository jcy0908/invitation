// ==========================================================================
// dday.js — D-day와 남은 시간. C++ 구현(cpp/dday.cpp)과 같은 알고리즘.
//
// D-day는 시간의 뺄셈이 아니라 달력 날짜의 뺄셈이다. 두 시각을 같은
// 시간대의 '날짜 번호'로 바꿔 빼야, 13시 예식이라도 당일 오전에 D-DAY가
// 뜨고 하루 전 오전에 D-1이 뜬다.
// ==========================================================================

const SEC_PER_DAY = 86400;

/** 날짜 번호(1970-01-01 = 0)를 연·월·일로. Howard Hinnant의 civil_from_days. */
export function civilFromDays(z) {
  z += 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const yr = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  return { year: yr + (m <= 2 ? 1 : 0), month: m, day: d };
}

/**
 * @param nowSec    지금 (유닉스 초)
 * @param eventSec  행사 시각 (유닉스 초)
 * @param tzMinutes 표시할 시간대의 UTC 오프셋(분). 한국이면 540.
 */
export function compute(nowSec, eventSec, tzMinutes) {
  const tz = tzMinutes * 60;
  const nowDay = Math.floor((nowSec + tz) / SEC_PER_DAY);
  const eventDay = Math.floor((eventSec + tz) / SEC_PER_DAY);

  const remain = Math.max(0, Math.floor(eventSec) - Math.floor(nowSec));
  const civil = civilFromDays(eventDay);

  return {
    dday: eventDay - nowDay,
    passed: Math.floor(nowSec) >= Math.floor(eventSec),
    days: Math.floor(remain / SEC_PER_DAY),
    hours: Math.floor((remain % SEC_PER_DAY) / 3600),
    minutes: Math.floor((remain % 3600) / 60),
    seconds: remain % 60,
    ...civil,
  };
}

/** 배지에 쓸 문자열. 당일이면 D-DAY, 지났으면 D+n. */
export function label(result) {
  if (result.dday === 0) return 'D-DAY';
  if (result.dday < 0) return `D+${Math.abs(result.dday)}`;
  return `D-${result.dday}`;
}
