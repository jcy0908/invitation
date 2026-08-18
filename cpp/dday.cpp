// ==========================================================================
// dday.cpp — D-day와 남은 시간을 센다.
//
// 왜 C++인가보다 왜 이 계산인가가 먼저다. 기존 구현은 남은 '경과 시간'으로
// D-day를 만들었다.
//
//     const days = Math.floor(totalSeconds / 86400);
//     badge = `D-${days + 1}`;
//
// 그래서 같은 날짜라도 시각에 따라 답이 달라졌다. 13시 예식이라면
// 당일 오전 9시에 D-001이 뜨고(D-DAY여야 한다), 하루 전 오전에는
// D-002가 뜬다(D-1이어야 한다).
//
// D-day는 시간의 뺄셈이 아니라 달력 날짜의 뺄셈이다. 그러려면 두 시각을
// 같은 시간대의 '날짜 번호'로 바꿔 빼야 하고, 거기서 두 가지가 걸린다.
//
//   1. 음수 방향의 나눗셈. C++의 정수 나눗셈은 0쪽으로 자르므로
//      1970년 이전이나 시간대 보정으로 음수가 되면 하루가 어긋난다.
//      바닥 나눗셈을 따로 쓴다.
//   2. 날짜 번호를 다시 연·월·일로 되돌리는 변환.
//
// Emscripten을 쓰지 않는다. clang의 wasm32 타깃과 wasm-ld만으로 빌드하며
// 힙도 표준 라이브러리도 쓰지 않는다.
// ==========================================================================

namespace {

constexpr int kSecPerDay = 86400;

// 스크래치 배치 — JS가 Int32Array를 얹어 읽는다
//   [0] D-day 수 (0이면 당일), [1] 이미 지났는가
//   [2] 남은 일, [3] 시, [4] 분, [5] 초
//   [6] 행사일 연, [7] 월, [8] 일
constexpr int kScratchSize = 9;
int g_scratch[kScratchSize] = {};

/// 바닥 나눗셈. C++ 기본 나눗셈은 0쪽으로 자르므로 음수에서 하루 어긋난다.
long long floorDiv(long long a, long long b) {
  long long q = a / b;
  if ((a % b != 0) && ((a < 0) != (b < 0))) --q;
  return q;
}

/// 날짜 번호(1970-01-01 = 0)를 연·월·일로. Howard Hinnant의 civil_from_days.
void civilFromDays(long long z, int& y, int& m, int& d) {
  z += 719468;
  const long long era = floorDiv(z, 146097);
  const unsigned long long doe = static_cast<unsigned long long>(z - era * 146097);
  const unsigned long long yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  const long long yr = static_cast<long long>(yoe) + era * 400;
  const unsigned long long doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  const unsigned long long mp = (5 * doy + 2) / 153;
  const unsigned long long dd = doy - (153 * mp + 2) / 5 + 1;
  const unsigned long long month = mp < 10 ? mp + 3 : mp - 9;
  y = static_cast<int>(yr + (month <= 2 ? 1 : 0));
  m = static_cast<int>(month);
  d = static_cast<int>(dd);
}

}  // namespace

extern "C" {

int* dday_scratch() { return g_scratch; }
int dday_scratch_size() { return kScratchSize; }

/// nowSec, eventSec는 유닉스 초. tzMinutes는 표시할 시간대의 UTC 오프셋(분).
/// 한국이면 540이다.
void dday_compute(double nowSec, double eventSec, int tzMinutes) {
  const long long now = static_cast<long long>(nowSec);
  const long long event = static_cast<long long>(eventSec);
  const long long tz = static_cast<long long>(tzMinutes) * 60;

  // 그 시간대에서의 '날짜 번호'. 여기서 바닥 나눗셈이 필요하다.
  const long long nowDay = floorDiv(now + tz, kSecPerDay);
  const long long eventDay = floorDiv(event + tz, kSecPerDay);

  g_scratch[0] = static_cast<int>(eventDay - nowDay);
  g_scratch[1] = (now >= event) ? 1 : 0;

  long long remain = event - now;
  if (remain < 0) remain = 0;
  g_scratch[2] = static_cast<int>(remain / kSecPerDay);
  g_scratch[3] = static_cast<int>((remain % kSecPerDay) / 3600);
  g_scratch[4] = static_cast<int>((remain % 3600) / 60);
  g_scratch[5] = static_cast<int>(remain % 60);

  int y = 0, m = 0, d = 0;
  civilFromDays(eventDay, y, m, d);
  g_scratch[6] = y;
  g_scratch[7] = m;
  g_scratch[8] = d;
}

}  // extern "C"
