// src/components/modals/ClaimHistoryModal.jsx — S-2-101 자녀 청구 이력

import { useState, useEffect, useMemo } from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useClaims } from "../../hooks/useClaims";
import { loadFamilyContext } from "../../utils/familyContext";
import { syncSubmittedClaims } from "../../utils/submittedClaims";
import { getKVAdapter } from "../../utils/kvAdapter";
import { isOnline } from "../../utils/onlineStatus";
import { showToast } from "../../utils/toastManager";
import ClaimCard from "../widgets/ClaimCard";
import ChildClaimDetailModal from "./ChildClaimDetailModal";

/**
 * @param {{ onClose: () => void }} props
 */
export default function ClaimHistoryModal({ onClose }) {
  const ctx = useMemo(() => loadFamilyContext(), []);
  const { claims, fetchClaims, loading } = useClaims(ctx?.family_id);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [receivingId, setReceivingId] = useState(null);
  const trapRef = useFocusTrap(!selectedClaim);

  // ESC 키 핸들러
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") { if (selectedClaim) return; onClose(); } };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, selectedClaim]);

  // 청구와 grant 분리
  const regularClaims = useMemo(() => claims.filter(c => c.type !== "grant"), [claims]);
  const grantClaims = useMemo(() => claims.filter(c => c.type === "grant"), [claims]);

  // 추가 지급 수령 확인
  async function handleReceiveGrant(grant) {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 확인할 수 없어요" });
      return;
    }
    setReceivingId(grant.claim_id);
    try {
      const adapter = getKVAdapter();
      await adapter.receiveGrant(grant.claim_id, { expected_updated_at: grant.updated_at });
      showToast({ type: "success", message: `💝 ${grant.name || "추가 보너스"} 수령 확인!` });
      await fetchClaims();
    } catch (err) {
      console.warn("grant receive failed:", err);
      showToast({ type: "error", message: "수령 확인 실패" });
    } finally {
      setReceivingId(null);
    }
  }

  useEffect(() => {
    if (ctx) {
      const adapter = getKVAdapter();
      adapter.setFamilyCode(ctx.family_code);
      fetchClaims();
    }
  }, [ctx, fetchClaims]);

  // 서버 데이터로 로컬 캐시 동기화
  useEffect(() => {
    if (claims.length > 0) {
      syncSubmittedClaims(claims);
    }
  }, [claims]);

  function handleDetailClose() {
    setSelectedClaim(null);
    fetchClaims();
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div
        ref={trapRef}
        className="modal-content"
        style={{ maxWidth: 440, maxHeight: "90vh", overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="history-title" className="modal-title">📜 청구 이력</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-4)" }}>
          {loading && claims.length === 0 && (
            <div className="modal-empty">
              <span className="spinner spinner--md" style={{ display: "block", margin: "0 auto var(--space-3)" }} />
              <p className="modal-empty__text">불러오는 중...</p>
            </div>
          )}

          {!loading && claims.length === 0 && (
            <div className="modal-empty">
              <div className="modal-empty__icon">📭</div>
              <p className="modal-empty__text">아직 제출한 청구가 없어요</p>
            </div>
          )}

          {/* 추가 보너스 */}
          {grantClaims.length > 0 && (
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h3 className="text-sm font-medium" style={{ marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>💝 추가 보너스</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {grantClaims.map((c, i) => (
                  <ClaimCard
                    key={c.claim_id}
                    claim={c}
                    onClick={setSelectedClaim}
                    onReceiveGrant={c.status === "granted" ? handleReceiveGrant : undefined}
                    quickLoading={receivingId === c.claim_id}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 청구 이력 */}
          {regularClaims.length > 0 && (
            <div>
              {grantClaims.length > 0 && (
                <h3 className="text-sm font-medium" style={{ marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>📋 청구 이력</h3>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {regularClaims.map((c, i) => (
                  <ClaimCard
                    key={c.claim_id}
                    claim={c}
                    onClick={setSelectedClaim}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
            </div>
          )}


        </div>
      </div>

      {selectedClaim && (
        <div onClick={(e) => e.stopPropagation()}>
          <ChildClaimDetailModal
            claimSummary={selectedClaim}
            onClose={handleDetailClose}
          />
        </div>
      )}
    </div>
  );
}
