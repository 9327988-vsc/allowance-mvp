// src/hooks/useGeneralCalendar.js — 일반계정 캘린더 훅
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { loadCalendarMonth, saveCalendarMonth, saveMeta, loadMeta } from "../utils/storage";
import { calculateGeneralMonthly } from "../utils/generalCalculator";
import { getHolidays, getHolidaysLoadError, retryLoadHolidays } from "../utils/holidays";
import { isNextMonthDisabled } from "../utils/dateLimit";
import { showToast } from "../utils/toastManager";

export function useGeneralCalendar() {
  const [todayDate, setTodayDate] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`;
  });

  useEffect(() => {
    let timerId;
    let mounted = true;
    function scheduleNext() {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const ms = tomorrow - now;
      timerId = setTimeout(() => {
        if (!mounted) return;
        const n = new Date();
        setTodayDate(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`);
        scheduleNext();
      }, ms);
    }
    scheduleNext();
    return () => { mounted = false; clearTimeout(timerId); };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const now = new Date();
        const nowStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
        setTodayDate(prev => prev !== nowStr ? nowStr : prev);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const todayY = parseInt(todayDate.split("-")[0], 10);
  const todayM = parseInt(todayDate.split("-")[1], 10);

  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM);
  const viewRef = useRef({ year: todayY, month: todayM });
  useEffect(() => { viewRef.current = { year: viewYear, month: viewMonth }; }, [viewYear, viewMonth]);
  const [revision, setRevision] = useState(0);

  // 공휴일
  const [holidays, setHolidays] = useState(() => getHolidays());
  const holidayRetried = useRef(false);
  useEffect(() => {
    let mounted = true;
    if (getHolidaysLoadError() && !holidayRetried.current) {
      holidayRetried.current = true;
      showToast({ type: "warning", message: "공휴일 데이터를 불러오지 못했습니다.", duration: 5000 });
      retryLoadHolidays().then(h => {
        if (mounted) {
          setHolidays(h);
          holidayRetried.current = false;
        }
      }).catch((err) => { console.warn("useGeneralCalendar:", err); });
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handler = () => setRevision(r => r + 1);
    window.addEventListener("sync-downloaded", handler);
    return () => window.removeEventListener("sync-downloaded", handler);
  }, []);

  const calendar = useMemo(() => {
    void revision;
    return loadCalendarMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth, revision]);

  const calc = useMemo(() => {
    try {
      return calculateGeneralMonthly(viewYear, viewMonth, calendar, holidays);
    } catch (e) {
      console.error("[useGeneralCalendar] 계산 오류:", e);
      return null;
    }
  }, [viewYear, viewMonth, calendar, holidays]);

  const goToPrevMonth = useCallback(() => {
    const v = viewRef.current;
    if (v.year === 2024 && v.month === 1) {
      showToast({ type: "warning", message: "2024년 1월 이전으로는 이동할 수 없습니다" });
      return;
    }
    if (v.month === 1) {
      setViewYear(v.year - 1);
      setViewMonth(12);
    } else {
      setViewMonth(v.month - 1);
    }
  }, []);

  const goToNextMonth = useCallback(() => {
    const v = viewRef.current;
    if (isNextMonthDisabled(v.year, v.month)) {
      showToast({ type: "warning", message: "12개월 후까지만 표시됩니다", duration: 4000 });
      return;
    }
    if (v.month === 12) {
      setViewYear(v.year + 1);
      setViewMonth(1);
    } else {
      setViewMonth(v.month + 1);
    }
  }, []);

  const goToMonth = useCallback((year, month) => {
    setViewYear(year);
    setViewMonth(month);
    try {
      const meta = loadMeta();
      if (meta) {
        meta.current_view_month = `${year}-${String(month).padStart(2, "0")}`;
        saveMeta(meta);
      }
    } catch { /* ignored */ }
  }, []);

  const saveCell = useCallback((date, cellData) => {
    const { year, month } = viewRef.current;
    const cal = loadCalendarMonth(year, month);
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
      window.dispatchEvent(new CustomEvent("mock-data-mutated"));
      showToast({ type: "success", message: "저장되었습니다" });
    } else if (result.error === "QUOTA_EXCEEDED") {
      result.pendingSave = { fn: saveCalendarMonth, args: [cal] };
    } else {
      showToast({ type: "error", message: "저장 실패. 다시 시도해주세요", duration: 5000 });
    }
    return result;
  }, []);

  const nextDisabled = isNextMonthDisabled(viewYear, viewMonth);

  const refreshFn = useCallback(() => setRevision(r => r + 1), []);

  return {
    viewYear, viewMonth, calendar, calc, holidays,
    todayY, todayM, nextDisabled,
    goToPrevMonth, goToNextMonth, goToMonth,
    saveCell, refresh: refreshFn,
  };
}
