// src/utils/holidays.js

/**
 * 모듈 내부 캐시 (앱 생애 동안 1회만 로드).
 * SPA 환경이라 새로고침 안 하는 한 캐시 유지.
 */
let _holidays = null;
let _loadError = null;
let _loading = false;
let _loadedAt = null; // 캐시 로드 시점 (Date)

/**
 * holidays.json 로드 (앱 부팅 시 1회 호출)
 *
 * v3.4 HI-10 변경: timeout 추가 (네트워크 끊김 시 무한 대기 방지)
 * L-3: 모바일 네트워크 대응 10초로 상향
 *
 * @param {number} timeoutMs - 타임아웃 (기본 10000ms)
 * @returns {Promise<Holidays>}
 * @throws {Error} 네트워크 실패 / 타임아웃 / JSON 파싱 실패 시
 */
export async function loadHolidays(timeoutMs = 10000) {
  if (_holidays) return _holidays;

  // import.meta.env.BASE_URL: GitHub Pages 서브 경로 (vite.config의 base와 동기화)
  const url = (import.meta.env?.BASE_URL ?? "/") + "holidays.json";

  // 5초 timeout (HI-10): AbortController 사용
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  _loading = true;
  _loadError = null;
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`holidays.json 로드 실패: ${res.status}`);
    }
    _holidays = await res.json();
    _loadError = null;
    _loadedAt = new Date();
    return _holidays;
  } catch (e) {
    const err = e.name === "AbortError"
      ? new Error(`holidays.json 로드 timeout (${timeoutMs}ms)`)
      : e;
    _loadError = err;
    throw err;
  } finally {
    _loading = false;
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
    // 로드 실패 시 빈 객체 반환 (silent failure 방지)
    return {};
  }

  // 캐시 만료 체크: 날짜가 바뀌었으면 백그라운드 재로드 (stale 데이터 유지)
  if (_loadedAt) {
    const now = new Date();
    const loadedDay = _loadedAt.toDateString();
    const todayDay = now.toDateString();
    if (loadedDay !== todayDay) {
      // stale 데이터를 유지하면서 백그라운드 재로드 (atomic: _holidays 유지)
      _loadedAt = null;
      retryLoadHolidays().catch(() => {});
      return _holidays;
    }
  }

  return _holidays;
}

/**
 * 공휴일 데이터 로드 성공 여부
 * @returns {boolean}
 */
export function isHolidaysLoaded() {
  return _holidays !== null;
}

/**
 * 공휴일 로드 에러 반환 (없으면 null)
 * @returns {Error|null}
 */
export function getHolidaysLoadError() {
  return _loadError;
}

/**
 * 공휴일 데이터 재로드 시도
 * @param {number} timeoutMs
 * @returns {Promise<Holidays>}
 */
export async function retryLoadHolidays(timeoutMs = 10000) {
  if (_loading) return _holidays ?? {};
  const stale = _holidays;
  _holidays = null;
  try {
    return await loadHolidays(timeoutMs);
  } catch (e) {
    // 실패 시 stale 데이터 복원
    if (!_holidays && stale) _holidays = stale;
    throw e;
  }
}

/**
 * 테스트용 캐시 리셋
 */
export function _resetHolidaysCache() {
  _holidays = null;
  _loadedAt = null;
}
