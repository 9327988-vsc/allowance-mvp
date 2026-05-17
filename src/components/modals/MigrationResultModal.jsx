// src/components/modals/MigrationResultModal.jsx — S-2-206 마이그레이션 결과
// react import removed — no hooks used in this component

/**
 * @param {{
 *   result: { migrated: boolean, migrated_count: number, attempted: number },
 *   onConfirm: () => void,
 *   onRetry: () => void
 * }} props
 */
export default function MigrationResultModal({ result, onConfirm, onRetry }) {
  const isSuccess = result.migrated && result.migrated_count === result.attempted;
  const isPartial = result.migrated && result.migrated_count < result.attempted;
  const isAlreadyDone = !result.migrated;

  return (
    <div
      className="modal-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="migration-result-title"
    >
      <div
        className="modal-content"
        style={{ maxWidth: 400, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="migration-result-title" className="modal-title">
            {isSuccess ? "마이그레이션 완료" : isPartial ? "마이그레이션 부분 성공" : "마이그레이션 완료"}
          </h2>
        </div>

        <div className="modal-body" style={{ textAlign: "center" }}>
          {/* 아이콘 */}
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }}>
            {isSuccess || isAlreadyDone ? "✅" : "⚠️"}
          </div>

          {/* 메시지 */}
          {isSuccess && (
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
              데이터 가져오기 성공!<br />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                {result.migrated_count}건의 청구가 등록되었어요
              </span>
            </p>
          )}

          {isPartial && (
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
              일부 항목이 마이그레이션되지 않았습니다<br />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                {result.attempted}건 중 {result.migrated_count}건 성공
              </span>
            </p>
          )}

          {isAlreadyDone && (
            <p style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-primary)", marginBottom: "var(--space-4)" }}>
              이미 마이그레이션이 완료되었어요<br />
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                이전에 {result.migrated_count}건이 등록됨
              </span>
            </p>
          )}

          {/* 결과 상세 */}
          <div className="detail-card" style={{ textAlign: "left" }}>
            <div className="detail-card__body">
              <div className="detail-row">
                <span className="detail-row__label">📤 시도</span>
                <span className="detail-row__amount">{result.attempted}건</span>
              </div>
              <div className="detail-row">
                <span className="detail-row__label">✅ 성공</span>
                <span className="detail-row__amount" style={{ color: "var(--color-success)" }}>{result.migrated_count}건</span>
              </div>
              {result.attempted > result.migrated_count && (
                <div className="detail-row">
                  <span className="detail-row__label">❌ 실패</span>
                  <span className="detail-row__amount" style={{ color: "var(--color-error)" }}>{result.attempted - result.migrated_count}건</span>
                </div>
              )}
            </div>
          </div>

          {/* 안내 */}
          <div className="modal-hint" style={{ marginTop: "var(--space-3)" }}>
            <span>💡</span>
            <span>로컬 데이터는 90일간 보존됩니다.</span>
          </div>
        </div>

        <div className="modal-footer modal-footer--stretch">
          {isPartial ? (
            <>
              <button onClick={onConfirm} className="btn btn--secondary">
                건너뛰기
              </button>
              <button onClick={onRetry} className="btn btn--primary" autoFocus>
                🔄 재시도
              </button>
            </>
          ) : (
            <button onClick={onConfirm} className="btn btn--primary btn--full" autoFocus>
              확인
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
