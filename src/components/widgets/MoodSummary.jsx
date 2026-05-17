// src/components/widgets/MoodSummary.jsx — 월간 기분 요약
import { useMemo } from "react";
import { MOODS, MOOD_MAP } from "../../constants/moods";

export default function MoodSummary({ calendar }) {
  const summary = useMemo(() => {
    if (!calendar?.cells) return null;
    const counts = {};
    let total = 0;
    for (const cell of Object.values(calendar.cells)) {
      if (cell.mood) {
        counts[cell.mood] = (counts[cell.mood] || 0) + 1;
        total++;
      }
    }
    if (total === 0) return null;

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);

    return { counts, total, sorted, top: sorted[0] };
  }, [calendar]);

  if (!summary) {
    return (
      <div className="mood-summary mood-summary--empty">
        <p className="mood-summary__empty-text">이번 달 기분 기록이 없어요</p>
      </div>
    );
  }

  return (
    <div className="mood-summary">
      <div className="mood-summary__top">
        <span className="mood-summary__top-emoji">
          {MOOD_MAP[summary.top[0]]?.emoji}
        </span>
        <span className="mood-summary__top-text">
          이번 달 가장 많은 기분: <strong>{MOOD_MAP[summary.top[0]]?.label}</strong> ({summary.top[1]}일)
        </span>
      </div>
      <div className="mood-summary__bars">
        {MOODS.map(mood => {
          const count = summary.counts[mood.id] || 0;
          const pct = Math.round((count / summary.total) * 100);
          return (
            <div key={mood.id} className="mood-summary__bar-row">
              <span className="mood-summary__bar-emoji">{mood.emoji}</span>
              <div className="mood-summary__bar-track">
                <div
                  className="mood-summary__bar-fill"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="mood-summary__bar-count">{count}일</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
