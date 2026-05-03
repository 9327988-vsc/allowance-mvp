// src/hooks/useCalendar.js
import { useState, useCallback, useMemo } from "react";
import { loadCalendarMonth, saveCalendarMonth, saveMeta, loadMeta } from "../utils/storage";
import { calculateMonthlyAllowance } from "../utils/calculator";
import { getHolidays } from "../utils/holidays";
import { isNextMonthDisabled } from "../utils/dateLimit";
import { showToast } from "../utils/toastManager";

function todayYM() {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() + 1 };
}

/**
 * 캘린더 상태 관리 훅
 * - 현재 표시 월 관리
 * - 캘린더 데이터 로드/저장
 * - 월 이동
 * - 계산 결과 제공
 */
export function useCalendar(settings) {
  const { year: todayY, month: todayM } = todayYM();

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM);
  // 캘린더 데이터 갱신 트리거용
  const [revision, setRevision] = useState(0);

  const holidays = useMemo(() => {
    try { return getHolidays(); } catch { return {}; }
  }, []);

  const calendar = useMemo(() => {
    // revision을 의존성에 포함하여 저장 후 재로드
    void revision;
    return loadCalendarMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth, revision]);

  const calc = useMemo(() => {
    if (!settings) return null;
    try {
      return calculateMonthlyAllowance(viewYear, viewMonth, settings, calendar, holidays);
    } catch (e) {
      console.error("[useCalendar] 계산 오류:", e);
      return null;
    }
  }, [viewYear, viewMonth, settings, calendar, holidays]);

  const goToPrevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 1) {
        setViewYear(y => y - 1);
        return 12;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    if (isNextMonthDisabled(viewYear, viewMonth)) {
      showToast({ type: "warning", message: "📅 12개월 후까지만 표시됩니다", duration: 4000 });
      return;
    }
    setViewMonth(m => {
      if (m === 12) {
        setViewYear(y => y + 1);
        return 1;
      }
      return m + 1;
    });
  }, [viewYear, viewMonth]);

  const goToMonth = useCallback((year, month) => {
    setViewYear(year);
    setViewMonth(month);
    // meta 갱신
    try {
      const meta = loadMeta();
      if (meta) {
        meta.current_view_month = `${year}-${String(month).padStart(2, "0")}`;
        saveMeta(meta);
      }
    } catch {}
  }, []);

  const saveCell = useCallback((date, cellData) => {
    const cal = loadCalendarMonth(viewYear, viewMonth);
    // cellData가 비어있으면 삭제
    const hasData = (cellData.extra_items && cellData.extra_items.length > 0) ||
                    (cellData.memo && cellData.memo.trim() !== "");
    if (hasData) {
      cal.cells[date] = cellData;
    } else {
      delete cal.cells[date];
    }
    const result = saveCalendarMonth(cal);
    if (result.success) {
      setRevision(r => r + 1);
      showToast({ type: "success", message: "✅ 저장되었습니다" });
    } else if (result.error === "QUOTA_EXCEEDED") {
      // S-108 트리거: pendingSave 정보 반환
      result.pendingSave = { fn: saveCalendarMonth, args: [cal] };
    } else {
      showToast({ type: "error", message: "저장 실패. 다시 시도해주세요", duration: 5000 });
    }
    return result;
  }, [viewYear, viewMonth]);

  const nextDisabled = isNextMonthDisabled(viewYear, viewMonth);

  return {
    viewYear,
    viewMonth,
    calendar,
    calc,
    holidays,
    todayY,
    todayM,
    nextDisabled,
    goToPrevMonth,
    goToNextMonth,
    goToMonth,
    saveCell,
    refresh: () => setRevision(r => r + 1),
  };
}
