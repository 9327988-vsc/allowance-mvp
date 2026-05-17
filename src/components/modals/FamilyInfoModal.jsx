// src/components/modals/FamilyInfoModal.jsx — S-2-004 가족 정보

import { useState, useEffect, useCallback } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { loadFamilyContext, saveFamilyContext, clearFamilyContext } from "../../utils/familyContext";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import { getActiveUser, updateUserDisplayName } from "../../utils/authStore";

import { copyToClipboard } from "../../utils/clipboard";

/**
 * @param {{
 *   onClose: () => void,
 *   onLeft: () => void
 * }} props
 */
export default function FamilyInfoModal({ onClose, onLeft }) {
  const [members, setMembers] = useState([]);
  const [familyCode, setFamilyCode] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaveConfirmText, setLeaveConfirmText] = useState("");
  const { showToast } = useToast();

  const [ctx, setCtx] = useState(() => loadFamilyContext());

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    if (!ctx) return;
    let cancelled = false;
    setFamilyCode(ctx.family_code);
    setNewName(ctx.member_display_name);

    async function loadFamily() {
      try {
        const adapter = getKVAdapter();
        adapter.setFamilyCode(ctx.family_code);
        const result = await adapter.getFamily(ctx.family_id);
        if (!cancelled) {
          setMembers(result.members || []);
        }
      } catch {
        if (!cancelled) setMembers([]);
      }
    }
    loadFamily();
    return () => { cancelled = true; };
  }, [ctx]);

  // 이름 변경
  const renameAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 변경할 수 없어요" });
      return;
    }
    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 20) {
      showToast({ type: "error", message: "이름은 1~20자로 입력하세요" });
      return;
    }

    if (!ctx?.family_id || !ctx?.member_id) {
      showToast({ type: "error", message: "가족 정보를 찾을 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.patchMember(ctx.family_id, ctx.member_id, { display_name: trimmed });

    // familyContext 업데이트
    const updatedCtx = { ...ctx, member_display_name: trimmed };
    saveFamilyContext(updatedCtx);
    setCtx(updatedCtx);

    // 로그인 화면 계정 이름도 동기화
    const activeUserId = getActiveUser();
    if (activeUserId) {
      updateUserDisplayName(activeUserId, trimmed);
    }

    showToast({ type: "success", message: "이름이 변경되었어요" });
    setEditingName(false);
  }, [ctx, newName, showToast]));

  // 가족 탈퇴
  const leaveAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 탈퇴할 수 없어요" });
      return;
    }

    const adapter = getKVAdapter();
    await adapter.leaveFamily(ctx.family_id, ctx.member_id);
    clearFamilyContext();
    showToast({ type: "success", message: "가족에서 탈퇴했어요" });
    onLeft();
  }, [ctx, showToast, onLeft]));

  function handleRename() {
    renameAction.run().catch((err) => {
      showToast({ type: "error", message: getMessageForError(err) });
    });
  }

  function handleLeave() {
    leaveAction.run().catch((err) => {
      showToast({ type: "error", message: getMessageForError(err) });
    });
  }

  async function handleCopyCode() {
    const result = await copyToClipboard(familyCode);
    if (result.success) {
      showToast({ type: "success", message: "가족 코드가 복사되었어요" });
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="family-info-title"
    >
      <div
        className="modal-content"
        style={{ maxWidth: 440, width: "90%", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="family-info-title" className="modal-title">가족 정보</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        <div className="modal-body">
          {/* 가족 코드 */}
          <div style={{
            textAlign: "center",
            padding: 16,
            marginBottom: 16,
            borderRadius: 8,
            backgroundColor: "var(--color-bg-secondary, #f9fafb)",
          }}>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-tertiary)" }}>가족 코드</div>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              fontFamily: "monospace",
              letterSpacing: "0.2em",
              color: "var(--color-primary)",
              margin: "8px 0",
            }}>
              {familyCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="btn btn--secondary"
              style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            >
              📋 복사
            </button>
          </div>

          {/* 멤버 목록 */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: 8 }}>
              멤버 ({members.length})
            </h3>
            {members.map((m) => (
              <div
                key={m.member_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--color-border, #e5e7eb)",
                }}
              >
                <span style={{ color: "var(--color-text-primary)" }}>
                  {m.member_id === ctx?.member_id ? "👤 " : ""}
                  {m.display_name}
                </span>
                <span style={{
                  fontSize: "0.75rem",
                  padding: "2px 8px",
                  borderRadius: 12,
                  backgroundColor: m.role === "parent" ? "var(--color-primary-bg, #e0e7ff)" : "var(--color-success-bg, #d1fae5)",
                  color: m.role === "parent" ? "var(--color-primary)" : "var(--color-success, #10b981)",
                }}>
                  {m.role === "parent" ? "부모" : "자녀"}
                </span>
              </div>
            ))}
          </div>

          {/* 내 이름 변경 */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: 8 }}>
              내 표시 이름
            </h3>
            {editingName ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={20}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    fontSize: "0.9rem",
                  }}
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  disabled={renameAction.loading || !newName.trim()}
                  className="btn btn--primary"
                  style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                >
                  {renameAction.loading ? "..." : "저장"}
                </button>
                <button
                  onClick={() => { setEditingName(false); setNewName(ctx?.member_display_name || ""); }}
                  className="btn btn--secondary"
                  style={{ fontSize: "0.85rem", padding: "8px 12px" }}
                >
                  취소
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "var(--color-text-primary)" }}>{ctx?.member_display_name}</span>
                <button
                  onClick={() => setEditingName(true)}
                  className="btn btn--secondary"
                  style={{ fontSize: "0.8rem", padding: "4px 12px" }}
                >
                  변경
                </button>
              </div>
            )}
          </div>

          {/* 가족 탈퇴 */}
          <div style={{ borderTop: "1px solid var(--color-border, #e5e7eb)", paddingTop: 16 }}>
            {confirmLeave ? (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--color-error, #ef4444)", marginBottom: 12 }}>
                  정말 가족에서 탈퇴할까요?<br />
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                    탈퇴 후에는 청구 이력을 볼 수 없어요.
                  </span>
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: 8 }}>
                  확인하려면 <strong style={{ color: "var(--color-error)" }}>탈퇴 확정</strong>을 입력하세요
                </p>
                <input
                  type="text"
                  value={leaveConfirmText}
                  onChange={(e) => setLeaveConfirmText(e.target.value)}
                  placeholder="탈퇴 확정"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid var(--color-border, #e5e7eb)",
                    fontSize: "0.9rem",
                    marginBottom: 12,
                    textAlign: "center",
                  }}
                  autoFocus
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button
                    onClick={() => { setConfirmLeave(false); setLeaveConfirmText(""); }}
                    className="btn btn--secondary"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={leaveAction.loading || leaveConfirmText.trim() !== "탈퇴 확정"}
                    className="btn btn--primary"
                    style={{ backgroundColor: "var(--color-error, #ef4444)", borderColor: "var(--color-error)" }}
                  >
                    {leaveAction.loading ? "처리 중..." : "탈퇴 확인"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="btn btn--secondary"
                style={{
                  width: "100%",
                  color: "var(--color-error, #ef4444)",
                  borderColor: "var(--color-error, #ef4444)",
                }}
              >
                가족 탈퇴
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
