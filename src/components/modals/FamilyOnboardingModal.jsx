// src/components/modals/FamilyOnboardingModal.jsx
// S-2-201 가족 그룹 시작하기 + S-2-201A 가족 만들기

import { useState, useCallback, useEffect } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { saveFamilyContext } from "../../utils/familyContext";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import JoinFamilyModal from "./JoinFamilyModal";
import CodeShareModal from "./CodeShareModal";
import MigrationPreviewModal from "./MigrationPreviewModal";
import MigrationResultModal from "./MigrationResultModal";

function OnboardingProgress({ current, total }) {
  const items = [];
  for (let i = 1; i <= total; i++) {
    if (i > 1) {
      items.push(
        <span key={`line-${i}`} className={`onboarding-progress__line${i <= current ? " onboarding-progress__line--done" : ""}`} />
      );
    }
    const isDone = i < current;
    const isActive = i === current;
    items.push(
      <span key={`step-${i}`} className={`onboarding-progress__step${isActive ? " onboarding-progress__step--active" : ""}${isDone ? " onboarding-progress__step--done" : ""}`}>
        {isDone ? "✔" : i}
      </span>
    );
  }
  return <div className="onboarding-progress">{items}</div>;
}

/**
 * @param {{ onComplete: () => void }} props
 */
export default function FamilyOnboardingModal({ onComplete }) {
  const [step, setStep] = useState("choose"); // "choose" | "create" | "join"
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(""); // "child" | "parent"
  const [createdCode, setCreatedCode] = useState(null);
  const [showCodeShare, setShowCodeShare] = useState(false);
  const [showMigration, setShowMigration] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const { showToast } = useToast();

  // ESC 키로 모달 닫기 ("나중에 하기"와 동일)
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onComplete();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onComplete]);

  const createFn = useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 가족을 만들 수 없어요." });
      return;
    }

    const adapter = getKVAdapter();
    const result = await adapter.createFamily({
      creator_display_name: displayName.trim(),
      creator_role: role,
    });

    // familyContext 저장
    saveFamilyContext({
      family_id: result.family.family_id,
      family_code: result.family.family_code,
      member_id: result.member.member_id,
      member_role: result.member.role,
      member_display_name: result.member.display_name,
      joined_at: result.member.joined_at,
    });

    // KVAdapter에 코드+멤버 세팅
    adapter.setFamilyCode(result.family.family_code);
    adapter.setMemberId(result.member.member_id);

    setCreatedCode(result.family.family_code);
    setShowCodeShare(true);
  }, [displayName, role, showToast]);

  const createAction = useAsyncAction(createFn);

  const handleCreate = useCallback(async () => {
    try {
      await createAction.run();
    } catch (err) {
      showToast({ type: "error", message: getMessageForError(err) });
    }
  }, [createAction, showToast]);

  const isCreateValid = displayName.trim().length >= 1 &&
    displayName.trim().length <= 20 &&
    (role === "child" || role === "parent");

  // S-2-206 마이그레이션 결과
  if (migrationResult) {
    return (
      <MigrationResultModal
        result={migrationResult}
        onConfirm={onComplete}
        onRetry={() => {
          setMigrationResult(null);
          setShowMigration(true);
        }}
      />
    );
  }

  // S-2-205 마이그레이션 미리보기 (자녀만)
  if (showMigration) {
    return (
      <MigrationPreviewModal
        onComplete={(result) => {
          setShowMigration(false);
          setMigrationResult(result);
        }}
        onSkip={onComplete}
      />
    );
  }

  // S-2-204 코드 공유 후 → 자녀면 마이그레이션, 부모면 완료
  if (showCodeShare && createdCode) {
    return (
      <CodeShareModal
        code={createdCode}
        onClose={() => {
          if (role === "child") {
            setShowCodeShare(false);
            setShowMigration(true);
          } else {
            onComplete();
          }
        }}
      />
    );
  }

  // S-2-202 가족 참여 → 자녀면 마이그레이션
  if (step === "join") {
    return (
      <JoinFamilyModal
        onBack={() => setStep("choose")}
        onComplete={(joinedRole) => {
          if (joinedRole === "child") {
            setShowMigration(true);
          } else {
            onComplete();
          }
        }}
      />
    );
  }

  // S-2-201A 가족 만들기
  if (step === "create") {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="가족 만들기">
        <div className="modal-content" style={{ maxWidth: 420, width: "90%", padding: 0 }}>
          <div className="modal-header">
            <h2 className="modal-title">가족 만들기</h2>
            <button onClick={() => setStep("choose")} className="modal-close" aria-label="뒤로">
              ←
            </button>
          </div>

          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <OnboardingProgress current={2} total={3} />
            {/* 역할 선택 */}
            <div>
              <label className="auth-form__label" style={{ display: "block", marginBottom: "var(--space-2)" }}>
                본인 역할
              </label>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <button
                  onClick={() => setRole("child")}
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
            </div>

            {/* 이름 입력 */}
            <div className="auth-form__field">
              <label htmlFor="display-name" className="auth-form__label">
                표시 이름
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={20}
                placeholder={role === "child" ? "예: 자녀A" : "예: 엄마, 아빠"}
                className="auth-form__input"
              />
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "var(--space-1)", display: "block" }}>
                {displayName.length}/20
              </span>
            </div>

            {/* 만들기 버튼 */}
            <button
              onClick={handleCreate}
              disabled={!isCreateValid || createAction.loading}
              className="btn btn--primary btn--full"
            >
              {createAction.loading ? <><span className="spinner spinner--sm" style={{ marginRight: 8, verticalAlign: "middle" }} /> 만드는 중...</> : "🏠 가족 만들기"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // S-2-201 선택 화면
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="가족 그룹 시작하기">
      <div className="modal-content" style={{ maxWidth: 420, width: "90%", padding: 0 }}>
        <div className="modal-body" style={{ textAlign: "center", padding: "var(--space-6) var(--space-5)" }}>
          <OnboardingProgress current={1} total={3} />
          <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-3)" }}>👨‍👩‍👧</div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text-primary)", marginBottom: "var(--space-2)" }}>
            가족 그룹 시작하기
          </h2>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-6)" }}>
            가족 코드로 연결하면 용돈 청구를 앱에서 바로 주고받을 수 있어요.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <button
              onClick={() => setStep("create")}
              className="btn btn--primary btn--lg btn--full"
            >
              🆕 가족 만들기
            </button>
            <button
              onClick={() => setStep("join")}
              className="btn btn--secondary btn--lg btn--full"
              style={{ borderWidth: 2, borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              🔗 가족 참여
            </button>
          </div>

          <button
            onClick={onComplete}
            className="btn btn--ghost"
            style={{ marginTop: "var(--space-4)" }}
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}
