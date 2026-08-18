#!/bin/sh
# dday.wasm을 만든다. Emscripten이 필요 없다 — clang과 wasm-ld면 된다.
#
#   sh cpp/build.sh
#
# 결과는 js/dday.wasm이며 그대로 커밋한다. 이 프로젝트에는 빌드 단계가
# 없고 GitHub Pages가 파일을 그대로 서빙하기 때문이다.
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
out="$root/js/dday.wasm"

clang++ \
  --target=wasm32 -O3 -std=c++17 \
  -nostdlib -ffreestanding -fno-exceptions -fno-rtti \
  -Wl,--no-entry -Wl,--strip-all \
  -Wl,--export=dday_scratch \
  -Wl,--export=dday_scratch_size \
  -Wl,--export=dday_compute \
  -o "$out" \
  "$root/cpp/dday.cpp"

echo "만들었습니다: js/dday.wasm ($(wc -c < "$out")바이트)"
