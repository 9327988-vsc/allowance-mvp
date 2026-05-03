// src/components/drawers/NotesDrawer.jsx — S-201 비고 드로어/바텀시트
import { useEffect } from "react";
import { KOREAN_BUS_FARES } from "../../constants/fares";
import { useSwipeToClose } from "../../hooks/useSwipeToClose";

export default function NotesDrawer({ onClose }) {
  const swipeHandlers = useSwipeToClose(onClose);
  // ESC 닫기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fares = KOREAN_BUS_FARES;

  return (
    <div
      className="notes-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="notes-drawer"
        role="dialog"
        aria-label="비고"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        {...swipeHandlers}
      >
        {/* 드래그 핸들 (모바일) */}
        <div className="notes-drawer__handle" />

        {/* 헤더 */}
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold">📌 비고</h3>
          <button onClick={onClose} aria-label="닫기" className="text-xl px-2">×</button>
        </div>

        {/* 아이콘 안내 */}
        <section className="mb-5">
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
            아이콘 안내
          </h4>
          <div className="flex flex-col gap-2 text-sm">
            <div>🏫 학교 등교 (버스비)</div>
            <div>📚 학원 등원 (버스비)</div>
            <div>🎒 임시 항목 (체험학습 등)</div>
            <div style={{ color: "var(--color-holiday)" }}>🔴 법정공휴일</div>
          </div>
        </section>

        {/* 요금표 */}
        <section className="mb-5">
          <h4 className="text-sm font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>
            {fares.region} {fares.type} 요금
          </h4>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border-strong)" }}>
                <th className="text-left py-2 pr-2">구분</th>
                <th className="text-left py-2 pr-2">대상</th>
                <th className="text-right py-2 pr-2">편도</th>
                <th className="text-right py-2">왕복</th>
              </tr>
            </thead>
            <tbody>
              {fares.fares.map(f => (
                <tr
                  key={f.category}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    fontWeight: f.highlighted ? "var(--font-weight-bold)" : "normal",
                    color: f.highlighted ? "var(--color-primary)" : "inherit",
                  }}
                >
                  <td className="py-2 pr-2">
                    {f.category} {f.highlighted && "★"}
                  </td>
                  <td className="py-2 pr-2" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {f.age_range}
                  </td>
                  <td className="text-right py-2 pr-2">{f.one_way.toLocaleString()}원</td>
                  <td className="text-right py-2">{f.round_trip.toLocaleString()}원</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
            출처: {fares.source} | 시행일: {fares.effective_from}
          </p>
        </section>

        {/* 안내 */}
        <section>
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            ※ 거주 지역에 따라 요금이 다를 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
