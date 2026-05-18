// src/components/modals/MigrationPreviewModal.jsx — S-2-205 마이그레이션 미리보기
import { useMemo, useCallback } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { loadSettings, loadCalendarMonth, loadCustomCategories } from "../../utils/storage";
import { createClaimSnapshot } from "../../utils/createClaimSnapshot";
import { generateClaimId, nanoid } from "../../utils/idGenerator";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";

/**
 * 로컬 1단계 데이터 스캔 → 마이그레이션 가능 항목 미리보기
 */
function scanLocalData() {
  const settings = loadSettings();
  const customCategories = loadCustomCategories();

  // calendar_v1_YYYY_MM 키 스캔
  const calendarMonths = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("calendar_v1_")) {
      const match = key.match(/^calendar_v1_(\d{4})_(\d{2})$/);
      if (match) {
        calendarMonths.push({ year: parseInt(match[1], 10), month: parseInt(match[2], 10) });
      }
    }
  }
  calendarMonths.sort((a, b) => a.year - b.year || a.month - b.month);

  // 임시 항목 수 + 데이터 크기 계산
  let extraItemCount = 0;
  let totalSize = 0;
  if (settings) totalSize += JSON.stringify(settings).length;
  if (customCategories.length > 0) totalSize += JSON.stringify(customCategories).length;

  for (const { year, month } of calendarMonths) {
    const cal = loadCalendarMonth(year, month);
    totalSize += JSON.stringify(cal).length;
    if (cal.cells) {
      Object.values(cal.cells).forEach((cell) => {
        if (cell.extra_items) extraItemCount += cell.extra_items.length;
      });
    }
  }

  return {
    hasSettings: !!settings,
    calendarMonths,
    extraItemCount,
    customCategoryCount: customCategories.length,
    estimatedSizeKB: Math.round(totalSize / 1024),
    hasData: !!settings || calendarMonths.length > 0,
  };
}

/**
 * @param {{
 *   onComplete: (result: object) => void,
 *   onSkip: () => void
 * }} props
 */
export default function MigrationPreviewModal({ onComplete, onSkip }) {
  const contentRef = useModalBase(onSkip);
  const { showToast } = useToast();
  const migrationId = useMemo(() => nanoid(16), []);

  const preview = useMemo(() => scanLocalData(), []);

  const monthRange = preview.calendarMonths.length > 0
    ? `${preview.calendarMonths[0].year}-${String(preview.calendarMonths[0].month).padStart(2, "0")} ~ ${preview.calendarMonths[preview.calendarMonths.length - 1].year}-${String(preview.calendarMonths[preview.calendarMonths.length - 1].month).padStart(2, "0")}`
    : "";

  const migrateAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 마이그레이션할 수 없어요" });
      return;
    }

    // 각 월별로 스냅샷 생성 → 청구 객체로 변환
    const claims = [];
    for (const { year, month } of preview.calendarMonths) {
      try {
        const snapshot = createClaimSnapshot(year, month);
        // 실제 금액이 있는 월만 마이그레이션
        if (snapshot.calculation && snapshot.calculation.total > 0) {
          claims.push({
            claim_id: generateClaimId(),
            year,
            month,
            is_extra: false,
            snapshot,
            submitted_at: new Date().toISOString(),
          });
        }
      } catch {
        // 스냅샷 생성 실패 시 해당 월 건너뛰기
      }
    }

    if (claims.length === 0) {
      showToast({ type: "info", message: "마이그레이션할 청구 데이터가 없어요" });
      onSkip();
      return;
    }

    const adapter = getKVAdapter();
    const result = await adapter.migrateFromLocal({
      idempotency_key: migrationId,
      claims,
    });

    onComplete({
      ...result,
      attempted: claims.length,
    });
  }, [preview.calendarMonths, migrationId, showToast, onSkip, onComplete]));

  // 데이터 없으면 건너뛰기
  if (!preview.hasData) {
    return (
      <div className="modal-backdrop">
        <div ref={contentRef} className="modal-content" style={{ maxWidth: 400, padding: 0 }} role="dialog" aria-modal="true" aria-label="데이터 가져오기">
          <div className="modal-header">
            <h2 className="modal-title">데이터 가져오기</h2>
          </div>
          <div className="modal-body" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-3)" }}>📭</div>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
              가져올 로컬 데이터가 없어요.<br />새로 시작합니다!
            </p>
            <button onClick={onSkip} className="btn btn--primary btn--full" autoFocus>
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleMigrate() {
    migrateAction.run().catch((err) => {
      if (err.code === "ALREADY_MIGRATED") {
        showToast({ type: "info", message: "이미 마이그레이션이 완료되었어요" });
        onSkip();
      } else {
        showToast({ type: "error", message: getMessageForError(err) });
      }
    });
  }

  return (
    <div className="modal-backdrop" onClick={migrateAction.loading ? undefined : onSkip}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 420, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="migration-title"
      >
        <div className="modal-header">
          <h2 id="migration-title" className="modal-title">📦 데이터 가져오기</h2>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
            기존에 저장한 데이터를 가족 서버로 가져올 수 있어요.
          </p>

          {/* 미리보기 항목 */}
          <div className="detail-card">
            <div className="detail-card__header">가져올 데이터</div>
            <div className="detail-card__body">
              <div className="detail-row">
                <span className="detail-row__label">⚙️ 자녀 설정</span>
                <span className="detail-row__amount" style={{ color: preview.hasSettings ? "var(--color-success)" : "var(--color-text-tertiary)" }}>
                  {preview.hasSettings ? "✔" : "없음"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">📅 캘린더</span>
                <span className="detail-row__amount">
                  {preview.calendarMonths.length}개월
                </span>
              </div>
              {preview.calendarMonths.length > 0 && (
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", padding: "0 var(--space-3)", marginTop: "calc(-1 * var(--space-1))", marginBottom: "var(--space-2)" }}>
                  ({monthRange})
                </div>
              )}
              <div className="detail-row">
                <span className="detail-row__label">🎒 임시 항목</span>
                <span className="detail-row__amount">{preview.extraItemCount}건</span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">🏷️ 사용자 카테고리</span>
                <span className="detail-row__amount">{preview.customCategoryCount}개</span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">💾 예상 크기</span>
                <span className="detail-row__amount">{preview.estimatedSizeKB} KB</span>
              </div>
            </div>
          </div>

          {/* 안내 */}
          <div className="modal-hint" style={{ marginTop: "var(--space-3)" }}>
            <span>💡</span>
            <span>마이그레이션 후 로컬 데이터는 90일간 보존됩니다.</span>
          </div>
        </div>

        <div className="modal-footer modal-footer--stretch">
          <button
            onClick={onSkip}
            disabled={migrateAction.loading}
            className="btn btn--secondary"
          >
            건너뛰기
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrateAction.loading}
            className="btn btn--primary"
            autoFocus
          >
            {migrateAction.loading ? (
              <><span className="spinner spinner--sm spinner--on-primary" /> 가져오는 중...</>
            ) : "📦 마이그레이션 시작"}
          </button>
        </div>
      </div>
    </div>
  );
}
