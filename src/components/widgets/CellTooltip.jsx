// src/components/widgets/CellTooltip.jsx — S-402 셀 호버 툴팁
import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryIcon } from "../../constants/categories";
import { loadCustomCategories } from "../../utils/storage";
import { formatAmountShort } from "../../utils/formatAmount";

const MAX_WIDTH = 280;

export default function CellTooltip({ cell, anchorRect, settings }) {
  const ref = useRef(null);
  const prevRect = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const extraCategories = cell?.extra_items?.map(i => i.category).join(",") || "";
  const customCategories = useMemo(() => loadCustomCategories(), [extraCategories]);

  useEffect(() => {
    if (!ref.current || !anchorRect) return;
    if (prevRect.current &&
        prevRect.current.top === anchorRect.top &&
        prevRect.current.left === anchorRect.left) return;
    prevRect.current = anchorRect;
    const tt = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const isMobile = vw < 768;

    let top, left;

    if (isMobile) {
      // 모바일: 셀 상단 중앙. 화면 상단 80px 이내면 셀 하단
      left = anchorRect.left + anchorRect.width / 2 - tt.width / 2;
      if (anchorRect.top < 80) {
        top = anchorRect.bottom + 4;
      } else {
        top = anchorRect.top - tt.height - 4;
      }
    } else {
      // PC: 셀 우측 8px. 초과 시 좌측
      top = anchorRect.top;
      left = anchorRect.right + 8;
      if (left + tt.width > vw) {
        left = anchorRect.left - tt.width - 8;
      }
    }

    // 화면 밖 보정
    if (left < 4) left = 4;
    if (left + tt.width > vw - 4) left = vw - tt.width - 4;
    if (top < 4) top = 4;

    setPos({ top, left });
  }, [anchorRect]);

  if (!cell || !anchorRect) return null;

  const { date, weekday, is_holiday, school_fee, academy_fee, extra_items, memo } = cell;
  const parts = date.split("-");
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const weekdayKor = { sun: "일", mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토" }[weekday] || "";

  // 빈 셀 체크
  const hasContent = school_fee > 0 || academy_fee > 0 || (extra_items && extra_items.length > 0);
  if (!hasContent) return null;
  const cellTotal = cell.total || 0;

  // 학교/학원 단가 계산
  const busTrips = settings?.school?.round_trip ? 2 : 1;
  const busFare = settings?.school?.fare || 0;
  const schoolPerTrip = busFare * busTrips;

  const truncatedMemo = memo && memo.length > 50 ? memo.slice(0, 50) + "..." : memo;

  return (
    <div
      ref={ref}
      className="cell-tooltip"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        maxWidth: MAX_WIDTH,
        zIndex: "var(--z-tooltip)",
        pointerEvents: "none",
      }}
    >
      <div className="cell-tooltip__header">
        {month}월 {day}일 ({weekdayKor})
      </div>

      <div className="cell-tooltip__body">
        {school_fee > 0 && (
          <div className="cell-tooltip__row">
            🏫 학교: {schoolPerTrip > 0
              ? `${formatAmountShort(busFare)} × ${busTrips} = ${formatAmountShort(school_fee)}`
              : formatAmountShort(school_fee)
            }
          </div>
        )}
        {academy_fee > 0 && (
          <div className="cell-tooltip__row">
            ✏️ 학원: {formatAmountShort(academy_fee)}
          </div>
        )}
        {extra_items && extra_items.map(item => (
          <div key={item.id} className="cell-tooltip__row">
            {getCategoryIcon(item.category, customCategories)} {item.name}: {formatAmountShort(item.amount)}
          </div>
        ))}

        <div className="cell-tooltip__divider" />
        <div className="cell-tooltip__total">
          합계: {formatAmountShort(cellTotal)}<span className="amount-unit">원</span>
        </div>
      </div>

      {truncatedMemo && (
        <div className="cell-tooltip__memo">
          📝 메모: {truncatedMemo}
        </div>
      )}
    </div>
  );
}
