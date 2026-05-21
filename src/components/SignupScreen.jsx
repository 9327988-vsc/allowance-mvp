// src/components/SignupScreen.jsx — 회원가입 화면 (아이디+비밀번호)
import { useState, useRef, useEffect } from "react";
import {
  createUser, validateUsername, validatePassword, getPasswordStrength,
  findUserByUsername, SECURITY_QUESTIONS,
} from "../utils/authStore";
import ThemeToggle from "./widgets/ThemeToggle";

const TOTAL_STEPS = 4;

/**
 * @param {{
 *   onComplete: (userId: string) => void,
 *   onBack?: () => void
 * }} props
 */
export default function SignupScreen({ onComplete, onBack }) {
  const [step, setStep] = useState(1); // 1=계정유형, 2=개인정보, 3=아이디+비밀번호, 4=보안질문
  const [role, setRole] = useState(""); // "child" | "parent" | "general"
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const submittedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Step 1: 계정 유형 선택
  function handleStep1() {
    if (!role) { setFormError("계정 유형을 선택하세요"); return; }
    setFormError("");
    setStep(2);
  }

  // Step 2: 개인정보 입력
  function handleStep2() {
    const trimmed = name.trim();
    if (!trimmed) { setFormError("이름을 입력하세요"); return; }
    if (trimmed.length > 20) { setFormError("20자 이내로 입력하세요"); return; }
    if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setFormError("생년월일 형식이 올바르지 않습니다"); return;
    }
    if (birthDate) {
      const d = new Date(birthDate);
      const [y, m, day] = birthDate.split("-").map(Number);
      if (isNaN(d.getTime()) || d.getMonth() + 1 !== m || d.getDate() !== day || d > new Date()) {
        setFormError("올바른 생년월일을 입력하세요"); return;
      }
    }
    setFormError("");
    setStep(3);
  }

  // Step 3: 아이디+비밀번호 설정
  function handleStep3(e) {
    e.preventDefault();
    const trimmedId = username.trim();
    const idCheck = validateUsername(trimmedId);
    if (!idCheck.valid) { setFormError(idCheck.error); return; }
    const existing = findUserByUsername(trimmedId);
    if (existing) { setFormError("이미 사용 중인 아이디입니다"); return; }
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) { setFormError(pwCheck.error); return; }
    if (password !== passwordConfirm) { setFormError("비밀번호가 일치하지 않습니다"); return; }
    setFormError("");
    setStep(4);
  }

  // Step 4: 보안 질문 설정 + 계정 생성
  async function handleStep4(e) {
    e.preventDefault();
    if (!securityAnswer.trim()) { setFormError("보안 답변을 입력하세요"); return; }
    if (securityAnswer.trim().length > 50) { setFormError("답변은 50자 이내로 입력하세요"); return; }
    if (submittedRef.current || loading) return;
    submittedRef.current = true;
    setLoading(true);
    setFormError("");

    try {
      const user = await createUser({
        displayName: name.trim(),
        role,
        username: username.trim(),
        password,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
        birthDate: birthDate || null,
      });
      if (mountedRef.current) onComplete(user.user_id);
    } catch (err) {
      console.error("createUser failed:", err);
      if (mountedRef.current) {
        setFormError(err.message || "계정 생성에 실패했습니다");
        submittedRef.current = false;
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  const roleLabel = role === "child" ? "자녀" : role === "parent" ? "부모" : role === "general" ? "일반" : "";
  const pwStrength = getPasswordStrength(password);

  return (
    <div className="auth-screen">
      <div className="auth-screen__inner">
        <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
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

        {/* Step 3: 아이디 + 비밀번호 설정 */}
        {step === 3 && (
          <form onSubmit={handleStep3} className="auth-form fade-in">
            <p className="auth-form__step-label">아이디 & 비밀번호 설정</p>

            <div className="auth-form__field">
              <label className="auth-form__label">아이디</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFormError(""); }}
                placeholder="영문 또는 영문+숫자 (3~20자)"
                maxLength={20}
                className="auth-form__input"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label">비밀번호</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
                  placeholder="영문+숫자 필수, 8자 이상"
                  className="auth-form__input"
                  autoComplete="new-password"
                  style={{ paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: "0.25rem",
                    fontSize: "var(--font-size-sm)", color: "var(--color-text-tertiary)"
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? "숨김" : "보기"}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: "var(--space-1)", display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--color-border)" }}>
                    <div style={{
                      width: `${(pwStrength.level / 3) * 100}%`, height: "100%", borderRadius: 2,
                      background: pwStrength.level === 1 ? "var(--color-danger)" : pwStrength.level === 2 ? "var(--color-warning)" : "var(--color-success)",
                      transition: "width 0.2s"
                    }} />
                  </div>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
                    {pwStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => { setPasswordConfirm(e.target.value); setFormError(""); }}
                placeholder="비밀번호 재입력"
                className="auth-form__input"
                autoComplete="new-password"
              />
            </div>

            {formError && <p className="auth-form__error">{formError}</p>}

            <button type="submit" className="btn btn--primary btn--full btn--lg">
              다음
            </button>
            <button
              type="button"
              onClick={() => { setStep(2); setFormError(""); }}
              className="btn btn--ghost"
              style={{ marginTop: "var(--space-2)" }}
            >
              ← 이전
            </button>
          </form>
        )}

        {/* Step 4: 보안 질문 설정 */}
        {step === 4 && (
          <form onSubmit={handleStep4} className="auth-form fade-in">
            <p className="auth-form__step-label">보안 질문 설정</p>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)" }}>
              비밀번호 분실 시 초기화에 사용됩니다
            </p>

            <div className="auth-form__field">
              <label className="auth-form__label">보안 질문</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="auth-form__input"
              >
                {SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div className="auth-form__field">
              <label className="auth-form__label">답변</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => { setSecurityAnswer(e.target.value); setFormError(""); }}
                placeholder="답변 입력"
                maxLength={50}
                className="auth-form__input"
                autoFocus
              />
            </div>

            {formError && <p className="auth-form__error">{formError}</p>}

            <button type="submit" disabled={loading} className="btn btn--primary btn--full btn--lg">
              {loading ? "생성 중..." : "계정 만들기"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(3); setFormError(""); submittedRef.current = false; }}
              className="btn btn--ghost"
              style={{ marginTop: "var(--space-2)" }}
            >
              ← 이전
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
