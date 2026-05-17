// src/components/modals/JoinFamilyModal.jsx — S-2-202 가족 참여

import { useState, useCallback } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { saveFamilyContext } from "../../utils/familyContext";
import { isValidFamilyCode, normalizeFamilyCode } from "../../utils/familyCodeValidator";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";

/**
 * @param {{ onBack: () => void, onComplete: (role: string) => void }} props
 */
export default function JoinFamilyModal({ onBack, onComplete }) {
  const [codeInput, setCodeInput] = useState("");
  const [familyInfo, setFamilyInfo] = useState(null); // getFamilyByCode 결과
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [codeError, setCodeError] = useState("");
  const { showToast } = useToast();

  // Step 1: 코드 확인
  const checkFn = useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "온라인 상태에서 다시 시도해 주세요." });
      return;
    }

    const code = normalizeFamilyCode(codeInput);
    const adapter = getKVAdapter();
    const result = await adapter.getFamilyByCode(code);

    if (result.is_full) {
      showToast({ type: "error", message: "가족 인원이 가득 찼어요 (2단계는 4명까지)." });
      return;
    }

    setFamilyInfo(result);
    setCodeError("");
  }, [codeInput, showToast]);

  const checkAction = useAsyncAction(checkFn);

  // Step 2: 참여
  const joinFn = useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 가입할 수 없어요." });
      return;
    }

    const code = normalizeFamilyCode(codeInput);
    const adapter = getKVAdapter();
    const result = await adapter.joinFamily({
      family_code: code,
      display_name: displayName.trim(),
      role,
    });

    saveFamilyContext({
      family_id: result.family_id,
      family_code: code,
      member_id: result.member.member_id,
      member_role: result.member.role,
      member_display_name: result.member.display_name,
      joined_at: result.member.joined_at,
    });

    adapter.setFamilyCode(code);
    adapter.setMemberId(result.member.member_id);
    showToast({ type: "success", message: "가족에 참여했어요!" });
    onComplete(role);
  }, [codeInput, displayName, role, showToast, onComplete]);

  const joinAction = useAsyncAction(joinFn);

  const handleCheck = useCallback(async () => {
    const code = normalizeFamilyCode(codeInput);
    if (!isValidFamilyCode(code)) {
      setCodeError("가족 코드는 6자 (I/O/0/1 제외) 영숫자입니다.");
      return;
    }
    try {
      await checkAction.run();
    } catch (err) {
      setCodeError(getMessageForError(err));
    }
  }, [codeInput, checkAction]);

  const handleJoin = useCallback(async () => {
    try {
      await joinAction.run();
    } catch (err) {
      showToast({ type: "error", message: getMessageForError(err) });
    }
  }, [joinAction, showToast]);

  const handleCodeChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, "");
    setCodeInput(val);
    setCodeError("");
    setFamilyInfo(null);
  };

  const isJoinValid = displayName.trim().length >= 1 &&
    displayName.trim().length <= 20 &&
    (role === "child" || role === "parent");

  const hasChild = familyInfo?.has_child;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="가족 참여">
      <div className="modal-content" style={{ maxWidth: 420, width: "90%", padding: 0 }}>
        <div className="modal-header">
          <h2 className="modal-title">가족 참여</h2>
          <button onClick={onBack} className="modal-close" aria-label="뒤로">←</button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* 진행률 */}
          <div className="onboarding-progress">
            <span className="onboarding-progress__step onboarding-progress__step--done">✔</span>
            <span className="onboarding-progress__line onboarding-progress__line--done" />
            <span className={`onboarding-progress__step${!familyInfo ? " onboarding-progress__step--active" : " onboarding-progress__step--done"}`}>
              {familyInfo ? "✔" : "2"}
            </span>
            <span className={`onboarding-progress__line${familyInfo ? " onboarding-progress__line--done" : ""}`} />
            <span className={`onboarding-progress__step${familyInfo ? " onboarding-progress__step--active" : ""}`}>3</span>
          </div>
          {/* 코드 입력 */}
          <div className="auth-form__field">
            <label htmlFor="family-code" className="auth-form__label">
              가족 코드 (6자)
            </label>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <input
                id="family-code"
                type="text"
                value={codeInput}
                onChange={handleCodeChange}
                maxLength={6}
                placeholder="예: K3M9P2"
                className="auth-form__input"
                style={{
                  textAlign: "center",
                  letterSpacing: "0.2em",
                  fontFamily: "var(--font-family-number)",
                  borderColor: codeError ? "var(--color-error)" : undefined,
                }}
                autoComplete="off"
              />
              <button
                onClick={handleCheck}
                disabled={codeInput.length !== 6 || checkAction.loading}
                className="btn btn--primary"
                style={{ whiteSpace: "nowrap" }}
              >
                {checkAction.loading ? "..." : "확인"}
              </button>
            </div>
            {codeError && (
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-error)", marginTop: "var(--space-1)" }} role="alert">{codeError}</p>
            )}
          </div>

          {/* 가족 정보 표시 + 역할/이름 입력 */}
          {familyInfo && (
            <>
              <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-lg)", backgroundColor: "var(--color-bg-secondary)" }}>
                <p style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-text-primary)" }}>
                  가족 멤버 ({familyInfo.member_count}명)
                </p>
                {familyInfo.members.map((m) => (
                  <p key={m.member_id} style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                    {m.role === "child" ? "👶" : "👨‍👩‍👧"} {m.display_name}
                  </p>
                ))}
              </div>

              <div>
                <label className="auth-form__label" style={{ display: "block", marginBottom: "var(--space-2)" }}>본인 역할</label>
                <div style={{ display: "flex", gap: "var(--space-3)" }}>
                  <button
                    onClick={() => setRole("child")}
                    disabled={hasChild}
                    className={`auth-role-btn${role === "child" ? " auth-role-btn--active" : ""}`}
                    style={{ flex: 1 }}
                  >
                    👶 자녀
                  </button>
                  <button
                    onClick={() => setRole("parent")}
                    className={`auth-role-btn${role === "parent" ? " auth-role-btn--active" : ""}`}
                    style={{ flex: 1 }}
                  >
                    👨‍👩‍👧 부모
                  </button>
                </div>
                {hasChild && (
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)" }}>이미 자녀가 등록되어 있어요.</p>
                )}
              </div>

              <div className="auth-form__field">
                <label htmlFor="join-name" className="auth-form__label">
                  표시 이름
                </label>
                <input
                  id="join-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                  placeholder={role === "child" ? "예: 자녀A" : "예: 엄마"}
                  className="auth-form__input"
                />
                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)", display: "block" }}>{displayName.length}/20</span>
              </div>

              <button
                onClick={handleJoin}
                disabled={!isJoinValid || joinAction.loading}
                className="btn btn--primary btn--full"
              >
                {joinAction.loading ? <><span className="spinner spinner--sm" style={{ marginRight: 8, verticalAlign: "middle" }} /> 참여 중...</> : "🔗 가족 참여"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
