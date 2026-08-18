// ==========================================================================
// dday_equivalence.mjs — js/dday.js와 dday.wasm이 같은 값을 내는가.
//
// 시각을 촘촘히, 그리고 험한 자리를 골라 넣는다. 자정 경계, 월말, 윤년
// 2월 29일, 연말, 1970년 이전(음수 초), 시간대 보정으로 날짜가 넘어가는
// 자리. 바닥 나눗셈을 틀리면 여기서 하루가 어긋난다.
//
//   node tools/dday_equivalence.mjs
// ==========================================================================

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const wasmPath = fileURLToPath(new URL('../js/dday.wasm', import.meta.url));
globalThis.fetch = async () =>
  new Response(readFileSync(wasmPath), { headers: { 'Content-Type': 'application/wasm' } });

const js = await import('../js/dday.js');
const wa = await import('../js/dday-wasm.js');
await wa.loadDdayWasm();

const KST = 540;
const EVENT = Date.parse('2026-10-17T13:00:00+09:00') / 1000;

const cases = [];

// 1. 행사 전후를 1초 단위로 훑는 구간들
const anchors = [
  ['예식 순간', EVENT],
  ['당일 자정(KST)', Date.parse('2026-10-17T00:00:00+09:00') / 1000],
  ['하루 전 자정', Date.parse('2026-10-16T00:00:00+09:00') / 1000],
];
for (const [, base] of anchors) {
  for (let d = -3; d <= 3; d += 1) cases.push(base + d);
}

// 2. 하루를 10분 간격으로 — 시각에 따라 D-day가 흔들리면 여기서 걸린다
for (let t = Date.parse('2026-10-15T00:00:00+09:00') / 1000;
     t <= Date.parse('2026-10-18T00:00:00+09:00') / 1000; t += 600) {
  cases.push(t);
}

// 3. 험한 날짜들 — 윤년, 월말, 연말, 1970년 이전
for (const iso of [
  '2024-02-29T23:59:59+09:00', '2024-03-01T00:00:00+09:00',
  '2023-12-31T23:59:59+09:00', '2024-01-01T00:00:00+09:00',
  '2000-02-29T12:00:00+09:00', '1900-03-01T00:00:00+09:00',
  '1969-12-31T23:59:59+09:00', '1970-01-01T00:00:00+09:00',
  '1960-06-15T08:30:00+09:00', '1900-01-01T00:00:00+09:00',
]) cases.push(Date.parse(iso) / 1000);

// 4. 무작위 — 넓은 범위에서
let seed = 12345;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
for (let i = 0; i < 20000; i += 1) {
  cases.push(Math.floor((rand() * 2 - 1) * 3e9)); // 대략 1875 ~ 2065년
}

// 여러 시간대에서도 확인한다
const zones = [540, 0, -300, 330, -720, 780];

let checked = 0;
let bad = 0;
const keys = ['dday', 'passed', 'days', 'hours', 'minutes', 'seconds', 'year', 'month', 'day'];

for (const tz of zones) {
  for (const now of cases) {
    const a = js.compute(now, EVENT, tz);
    const b = wa.compute(now, EVENT, tz);
    checked += 1;
    for (const k of keys) {
      if (a[k] !== b[k]) {
        bad += 1;
        if (bad <= 3) {
          console.log(`\n  x tz=${tz} now=${now} (${new Date(now * 1000).toISOString()}) — ${k}`);
          console.log('    dday.js  :', JSON.stringify(a));
          console.log('    wasm     :', JSON.stringify(b));
        }
        break;
      }
    }
  }
}

// 배지 문자열도 확인
const badgeCases = [
  ['2026-10-17T09:00:00+09:00', 'D-DAY'],
  ['2026-10-17T13:00:01+09:00', 'D-DAY'],
  ['2026-10-16T20:00:00+09:00', 'D-1'],
  ['2026-10-16T09:00:00+09:00', 'D-1'],
  ['2026-10-15T14:00:00+09:00', 'D-2'],
  ['2026-10-18T10:00:00+09:00', 'D+1'],
];
console.log('\n배지 (13시 예식 기준)\n');
let badgeBad = 0;
for (const [iso, want] of badgeCases) {
  const got = js.label(js.compute(Date.parse(iso) / 1000, EVENT, KST));
  const gotW = wa.label(wa.compute(Date.parse(iso) / 1000, EVENT, KST));
  const ok = got === want && gotW === want;
  if (!ok) badgeBad += 1;
  console.log(`  ${ok ? 'o' : 'x'} ${iso.slice(0, 16)} → ${got}${got === gotW ? '' : ` / wasm ${gotW}`}  (기대 ${want})`);
}

console.log('\njs/dday.js ↔ dday.wasm 동등성\n');
console.log(`  ${zones.length}개 시간대 × ${cases.length}개 시각 = ${checked}건 대조`);
console.log('  D-day · 지남 · 남은 일시분초 · 행사일 연월일');
console.log(`\n통과 ${checked - bad} / 실패 ${bad + badgeBad}\n`);
process.exit(bad + badgeBad === 0 ? 0 : 1);
