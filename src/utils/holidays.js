// src/utils/holidays.js

/**
 * 모듈 내부 캐시 (앱 생애 동안 1회만 로드).
 * SPA 환경이라 새로고침 안 하는 한 캐시 유지.
 */
let _holidays = null;

/**
 * holidays.json 로드 (앱 부팅 시 1회 호출)
 *
 * v3.4 HI-10 변경: 5초 timeout 추가 (네트워크 끊김 시 무한 대기 방지)
 *
 * @param {number} timeoutMs - 타임아웃 (기본 5000ms)
 * @returns {Promise<Holidays>}
 * @throws {Error} 네트워크 실패 / 타임아웃 / JSON 파싱 실패 시
 */
export async function loadHolidays(timeoutMs = 5000) {
  if (_holidays) return _holidays;

  // import.meta.env.BASE_URL: GitHub Pages 서브 경로 (vite.config의 base와 동기화)
  const url = (import.meta.env?.BASE_URL ?? "/") + "holidays.json";

  // 5초 timeout (HI-10): AbortController 사용
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`holidays.json 로드 실패: ${res.status}`);
    }
    _holidays = await res.json();
    return _holidays;
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(`holidays.json 로드 timeout (${timeoutMs}ms)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 캐시된 holidays 즉시 반환 (loadHolidays 이후에만 호출)
 * 컴포넌트 props로 전달받지 않고 utils에서 호출할 때 사용
 *
 * @returns {Holidays}
 * @throws {Error} loadHolidays() 호출 전이면
 */
export function getHolidays() {
  if (!_holidays) {
    throw new Error("loadHolidays()를 먼저 호출하세요");
  }
  return _holidays;
}

/**
 * 테스트용 캐시 리셋
 */
export function _resetHolidaysCache() {
  _holidays = null;
}
