// src/components/SignupScreen.jsx — 회원가입 화면
import { useState, useRef, useEffect } from "react";
import { createUser } from "../utils/authStore";
import PinInput from "./PinInput";
import ThemeToggle from "./widgets/ThemeToggle";

const TOTAL_STEPS = 4;

/**
 * @param {{
 *   onComplete: (userId: string) => void,
 *   onBack?: () => void
 * }} props
 */
export default function SignupScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1); // 1=계정유형, 2=개인정보, 3=PIN, 4=PIN확인
  const [role, setRole] = useState(""); // "child" | "parent" | "general"
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState(false);
  const [formError, setFormError] = useState("");
  const submittedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Step 1: 계정 유형 선택
  function handleStep1() {
    if (!role) {
      setFormError("계정 유형을 선택하세요");
      return;
    }
    setFormError("");
    setStep(2);
  }

  // Step 2: 개인정보 입력
  function handleStep2() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("이름을 입력하세요");
      return;
    }
    if (trimmed.length > 20) {
      setFormError("20자 이내로 입력하세요");
      return;
    }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setFormError("생년월일 형식이 올바르지 않습니다");
      return;
    }
    if (birthDate) {
      const d = new Date(birthDate);
      if (isNaN(d.getTime()) || d > new Date()) {
        setFormError("올바른 생년월일을 입력하세요");
        return;
      }
    }
    setFormError("");
    setStep(3);
  }

  // Step 3: PIN 설정
  function handlePinChange(val) {
    setPin(val);
    setPinError(false);
    if (val.length === 4) {
      setTimeout(() => { if (!mountedRef.current) return; setStep(4); }, 200);
    }
  }

  // Step 4: PIN 확인
  function handlePinConfirmChange(val) {
    setPinConfirm(val);
    setPinError(false);
    if (val.length === 4) {
      setTimeout(async () => {
        if (!mountedRef.current) return;
        if (val === pin) {
          if (submittedRef.current) return;
          submittedRef.current = true;
          try {
            const user = await createUser({
              displayName: name.trim(),
              role,
              pin: val,
              birthDate: birthDate || null,
            });
            onComplete(user.user_id);
          } catch {
            setFormError("계정 생성에 실패했습니다");
            submittedRef.current = false;
          }
        } else {
          setPinError(true);
          setPinConfirm("");
        }
      }, 200);
    }
  }

  const roleLabel = role === "child" ? "자녀" : role === "parent" ? "부모" : role === "general" ? "일반" : "";

  return (
    <div className="auth-screen">
      <div className="auth-screen__inner">
        {/* 테마 전환 */}
        <div className="auth-screen__theme">
          <ThemeToggle size="sm" />
        </div>

        {/* 로고 */}
        <div className="auth-screen__logo">💰</div>
        <h1 className="auth-screen__title">용돈 관리</h1>
        <p className="auth-screen__subtitle">계정을 만들어 시작하세요</p>

        {/* 진행률 */}
        <div className="auth-progress">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`auth-progress__dot${step >= s ? " auth-progress__dot--active" : ""}`} />
          ))}
        </div>

        {/* Step 1: 계정 유형 선택 */}
        {step === 1 && (
          <div className="auth-form fade-in">
            <div className="auth-form__field">
              <label className="auth-form__label">계정 유형을 선택하세요</label>
              <div className="auth-role-picker auth-role-picker--three">
                <button
                  className={`auth-role-btn${role === "child" ? " auth-role-btn--active" : ""}`}
                  onClick={() => { setRole("child"); setFormError(""); }}
                >
                  <span className="auth-role-btn__icon">🧒</span>
                  <span className="auth-role-btn__text">자녀</span>
                  <span className="auth-role-btn__desc">용돈 청구</span>
                </button>
                <button
                  className={`auth-role-btn${role === "parent" ? " auth-role-btn--active" : ""}`}
                  onClick={() => { setRole("parent"); setFormError(""); }}
                >
                  <span className="auth-role-btn__icon">👨‍👩‍👧</span>
                  <span className="auth-role-btn__text">부모</span>
                  <span className="auth-role-btn__desc">승인 관리</span>
                </button>
                <button
                  className={`auth-role-btn${role === "general" ? " auth-role-btn--active" : ""}`}
                  onClick={() => { setRole("general"); setFormError(""); }}
                >
                  <span className="auth-role-btn__icon">👤</span>
                  <span className="auth-role-btn__text">일반</span>
                  <span className="auth-role-btn__desc">수입/지출</span>
                </button>
              </div>
            </div>

            {formError && <p className="auth-form__error">{formError}</p>}

            <button onClick={handleStep1} className="btn btn--primary btn--full btn--lg">
              다음
            </button>
            {onBack && (
              <button onClick={onBack} className="btn btn--ghost" style={{ marginTop: "var(--space-2)" }}>
                ← 돌아가기
              </button>
            )}
          </div>
        )}

        {/* Step 2: 개인정보 입력 */}
        {step === 2 && (
          <div className="auth-form fade-in">
            <p className="auth-form__step-label">{roleLabel} 계정</p>

            <div className="auth-form__field">
              <label className="auth-form__label">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setFormError(""); }}
                placeholder="예: 민지"
                maxLength={20}
                className="auth-form__input"
                autoFocus
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label">
                생년월일 <span className="auth-form__optional">(선택)</span>
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => { setBirthDate(e.target.value); setFormError(""); }}
                className="auth-form__input"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {formError && <p className="auth-form__error">{formError}</p>}

            <button onClick={handleStep2} className="btn btn--primary btn--full btn--lg">
              다음
            </button>
            <button
              onClick={() => { setStep(1); setFormError(""); }}
              className="btn btn--ghost"
              style={{ marginTop: "var(--space-2)" }}
            >
              ← 이전
            </button>
          </div>
        )}

        {/* Step 3: PIN 설정 */}
        {step === 3 && (
          <div className="auth-form fade-in">
            <p className="auth-pin-label">4자리 PIN을 설정하세요</p>
            <PinInput value={pin} onChange={handlePinChange} error={false} />
            <button
              onClick={() => { setStep(2); setPin(""); setFormError(""); }}
              className="btn btn--ghost"
              style={{ marginTop: "var(--space-3)" }}
            >
              ← 이전
            </button>
          </div>
        )}

        {/* Step 4: PIN 확인 */}
        {step === 4 && (
          <div className="auth-form fade-in">
            <p className="auth-pin-label">PIN을 다시 입력하세요</p>
            <PinInput
              value={pinConfirm}
              onChange={handlePinConfirmChange}
              error={pinError}
              autoFocus
            />
            {pinError && <p className="auth-form__error">PIN이 일치하지 않습니다</p>}
            {formError && <p className="auth-form__error">{formError}</p>}
            <button
              onClick={() => { setStep(3); setPin(""); setPinConfirm(""); setPinError(false); setFormError(""); submittedRef.current = false; }}
              className="btn btn--ghost"
              style={{ marginTop: "var(--space-3)" }}
            >
              ← 다시 설정
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
