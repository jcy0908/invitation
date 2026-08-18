// ==========================================================================
// dday-wasm.js — dday.js와 같은 API. 계산만 C++/WebAssembly가 맡는다.
//
// 옮긴 것은 달력 날짜 산술이다. 시간대 보정과 바닥 나눗셈, 날짜 번호를
// 연·월·일로 되돌리는 변환. 화면에 무엇을 그릴지는 JS가 그대로 한다.
//
// 두 구현이 같은 값을 낸다는 것은 tools/dday_equivalence.mjs가 확인한다.
// ==========================================================================

import { label } from './dday.js';
export { label };

const WASM_URL = new URL('./dday.wasm', import.meta.url);
let mod = null;

export async function loadDdayWasm() {
  if (mod) return mod;
  const response = await fetch(WASM_URL);
  if (!response.ok) throw new Error(`dday.wasm ${response.status}`);

  let instance;
  if (typeof WebAssembly.instantiateStreaming === 'function') {
    try {
      ({ instance } = await WebAssembly.instantiateStreaming(response.clone(), {}));
    } catch (err) {
      // 서버가 application/wasm을 주지 않는 경우 — 바이트로 다시 시도한다
      ({ instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {}));
    }
  } else {
    ({ instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {}));
  }

  const e = instance.exports;
  mod = { exports: e, scratch: new Int32Array(e.memory.buffer, e.dday_scratch(), e.dday_scratch_size()) };
  return mod;
}

export function compute(nowSec, eventSec, tzMinutes) {
  mod.exports.dday_compute(nowSec, eventSec, tzMinutes);
  const s = mod.scratch;
  return {
    dday: s[0],
    passed: s[1] === 1,
    days: s[2],
    hours: s[3],
    minutes: s[4],
    seconds: s[5],
    year: s[6],
    month: s[7],
    day: s[8],
  };
}
