// src/components/LoginScreen.jsx — 로그인 화면 (아이디+비밀번호)
import { useState, useRef, useEffect } from "react";
import {
  verifyPassword, removeUser, loadUserAccounts,
  getSecurityQuestion, resetPasswordWithAnswer,
  validatePassword,
} from "../utils/authStore";
import ThemeToggle from "./widgets/ThemeToggle";

// ── 잠금 상태 무결성 보호 (sessionStorage 변조 방어) ──
const _LOCKOUT_KEY = "_pl_state";
const _LOCKOUT_PEPPER = "lk-integrity-v1";

function _simpleHash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function _encodeLockout(attempts, lockoutUntil) {
  const payload = JSON.stringify({ a: attempts, l: lockoutUntil || 0 });
  const sig = _simpleHash(payload + _LOCKOUT_PEPPER);
  try { sessionStorage.setItem(_LOCKOUT_KEY, btoa(payload) + "." + sig); } catch { /* ignored */ }
}

function _decodeLockout() {
  try {
    const raw = sessionStorage.getItem(_LOCKOUT_KEY);
    if (!raw || !raw.includes(".")) return null;
    const [encoded, sig] = raw.split(".");
    const payload = atob(encoded);
    if (_simpleHash(payload + _LOCKOUT_PEPPER) !== sig) {
      return { a: 5, l: Date.now() + 30000 };
    }
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function _clearLockout() {
  try { sessionStorage.removeItem(_LOCKOUT_KEY); } catch { /* ignored */ }
}

/**
 * @param {{
 *   onComplete: (userId: string) => void,
 *   onNewAccount: () => void,
 *   onAdmin?: () => void,
 *   onTutorial?: () => void
 * }} props
 */
export default function LoginScreen({ onComplete, onNewAccount, onAdmin, onTutorial }) {
  const [view, setView] = useState("login"); // "login" | "forgot" | "reset"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // 잠금 상태
  const [attempts, setAttempts] = useState(() => {
    const state = _decodeLockout();
    return state ? state.a : 0;
  });
  const attemptsRef = useRef(0);
  const lockoutTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    const state = _decodeLockout();
    return state && state.l > Date.now() ? state.l : null;
  });

  // 비밀번호 찾기
  const [forgotUsername, setForgotUsername] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const state = _decodeLockout();
    if (state && state.l > Date.now()) {
      attemptsRef.current = state.a || 0;
      lockoutTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        setLockoutUntil(null);
        setAttempts(0);
        attemptsRef.current = 0;
        _clearLockout();
      }, state.l - Date.now());
    }
    return () => {
      mountedRef.current = false;
      if (lockoutTimerRef.current) clearTimeout(lockoutTimerRef.current);
    };
  }, []);

  const isLocked = lockoutUntil && Date.now() < lockoutUntil;

  async function handleLogin(e) {
    e.preventDefault();
    if (isLocked || loading) return;
    if (!username.trim()) { setFormError("아이디를 입력하세요"); return; }
    if (!password) { setFormError("비밀번호를 입력하세요"); return; }

    setLoading(true);
    setFormError("");
    try {
      const result = await verifyPassword(username.trim(), password);
      if (!mountedRef.current) return;
      if (result.success) {
        _clearLockout();
        onComplete(result.userId);
      } else {
        attemptsRef.current += 1;
        const next = attemptsRef.current;
        setAttempts(next);
        setFormError(result.error || "로그인에 실패했습니다");
        if (next >= 5) {
          const lockUntil = Date.now() + 30000;
          setLockoutUntil(lockUntil);
          _encodeLockout(next, lockUntil);
          lockoutTimerRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            setLockoutUntil(null);
            setAttempts(0);
            attemptsRef.current = 0;
            _clearLockout();
          }, 30000);
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      if (mountedRef.current) setFormError("로그인 중 오류가 발생했습니다");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function handleForgotStart() {
    setView("forgot");
    setForgotUsername("");
    setSecurityQuestion("");
    setSecurityAnswer("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setFormError("");
    setResetSuccess(false);
  }

  function handleForgotLookup(e) {
    e.preventDefault();
    if (!forgotUsername.trim()) { setFormError("아이디를 입력하세요"); return; }
    const q = getSecurityQuestion(forgotUsername.trim());
    if (!q) { setFormError("존재하지 않는 아이디이거나 보안 질문이 설정되지 않았습니다"); return; }
    setSecurityQuestion(q);
    setFormError("");
    setView("reset");
  }

  async function handleReset(e) {
    e.preventDefault();
    if (loading) return;
    if (!securityAnswer.trim()) { setFormError("보안 답변을 입력하세요"); return; }
    if (!newPassword) { setFormError("새 비밀번호를 입력하세요"); return; }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.valid) { setFormError(pwCheck.error); return; }
    if (newPassword !== newPasswordConfirm) { setFormError("비밀번호가 일치하지 않습니다"); return; }

    setLoading(true);
    setFormError("");
    try {
      const result = await resetPasswordWithAnswer(forgotUsername.trim(), securityAnswer, newPassword);
      if (!mountedRef.current) return;
      if (result.success) {
        setResetSuccess(true);
      } else {
        setFormError(result.error || "비밀번호 초기화에 실패했습니다");
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      if (mountedRef.current) setFormError("비밀번호 초기화 중 오류가 발생했습니다");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function backToLogin() {
    setView("login");
    setFormError("");
    setUsername("");
    setPassword("");
  }

  // ── 비밀번호 찾기: 보안 질문 답변 + 새 비밀번호 ──
  if (view === "reset") {
    if (resetSuccess) {
      return (
        <div className="auth-screen">
          <div className="auth-screen__inner">
            <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
            <div className="auth-screen__logo">✅</div>
            <h1 className="auth-screen__title">비밀번호 변경 완료</h1>
            <p className="auth-screen__subtitle">새 비밀번호로 로그인하세요</p>
            <button onClick={backToLogin} className="btn btn--primary btn--full btn--lg" style={{ marginTop: "var(--space-4)" }}>
              로그인으로 돌아가기
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="auth-screen">
        <div className="auth-screen__inner">
          <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
          <div className="auth-screen__logo">🔐</div>
          <h1 className="auth-screen__title">비밀번호 초기화</h1>
          <p className="auth-screen__subtitle">{securityQuestion}</p>

          <form onSubmit={handleReset} className="auth-form fade-in">
            <div className="auth-form__field">
              <label className="auth-form__label">보안 답변</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => { setSecurityAnswer(e.target.value); setFormError(""); }}
                className="auth-form__input"
                placeholder="답변 입력"
                autoFocus
              />
            </div>
            <div className="auth-form__field">
              <label className="auth-form__label">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setFormError(""); }}
                className="auth-form__input"
                placeholder="영문+숫자 필수, 8자 이상"
              />
            </div>
            <div className="auth-form__field">
              <label className="auth-form__label">새 비밀번호 확인</label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => { setNewPasswordConfirm(e.target.value); setFormError(""); }}
                className="auth-form__input"
                placeholder="비밀번호 재입력"
              />
            </div>

            {formError && <p className="auth-form__error">{formError}</p>}

            <button type="submit" disabled={loading} className="btn btn--primary btn--full btn--lg">
              {loading ? "처리 중..." : "비밀번호 변경"}
            </button>
            <button type="button" onClick={() => { setView("forgot"); setFormError(""); }} className="btn btn--ghost" style={{ marginTop: "var(--space-2)" }}>
              ← 이전
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 비밀번호 찾기: 아이디 입력 ──
  if (view === "forgot") {
    return (
      <div className="auth-screen">
        <div className="auth-screen__inner">
          <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
          <div className="auth-screen__logo">🔑</div>
          <h1 className="auth-screen__title">비밀번호 찾기</h1>
          <p className="auth-screen__subtitle">가입 시 등록한 아이디를 입력하세요</p>

          <form onSubmit={handleForgotLookup} className="auth-form fade-in">
            <div className="auth-form__field">
              <label className="auth-form__label">아이디</label>
              <input
                type="text"
                value={forgotUsername}
                onChange={(e) => { setForgotUsername(e.target.value); setFormError(""); }}
                className="auth-form__input"
                placeholder="아이디 입력"
                autoFocus
                autoComplete="username"
              />
            </div>

            {formError && <p className="auth-form__error">{formError}</p>}

            <button type="submit" className="btn btn--primary btn--full btn--lg">
              다음
            </button>
            <button type="button" onClick={backToLogin} className="btn btn--ghost" style={{ marginTop: "var(--space-2)" }}>
              ← 로그인으로 돌아가기
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 로그인 화면 (메인) ──
  return (
    <div className="auth-screen">
      <div className="auth-screen__inner">
        <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
        <div className="auth-screen__logo">💰</div>
        <h1 className="auth-screen__title">용돈 관리</h1>
        <p className="auth-screen__subtitle">로그인</p>

        <form onSubmit={handleLogin} className="auth-form fade-in">
          <div className="auth-form__field">
            <label className="auth-form__label">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setFormError(""); }}
              className="auth-form__input"
              placeholder="아이디 입력"
              autoFocus
              autoComplete="username"
              disabled={isLocked}
            />
          </div>

          <div className="auth-form__field">
            <label className="auth-form__label">비밀번호</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFormError(""); }}
                className="auth-form__input"
                placeholder="비밀번호 입력"
                autoComplete="current-password"
                disabled={isLocked}
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
          </div>

          {formError && !isLocked && <p className="auth-form__error">{formError}</p>}
          {isLocked && (
            <p className="auth-form__error">
              5회 실패. 30초 후 다시 시도하세요
            </p>
          )}

          <button type="submit" disabled={isLocked || loading} className="btn btn--primary btn--full btn--lg">
            {loading ? "로그인 중..." : "로그인"}
          </button>

          <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
            <button type="button" onClick={handleForgotStart} className="btn btn--ghost" style={{ fontSize: "var(--font-size-sm)" }}>
              비밀번호 찾기
            </button>
            <button type="button" onClick={onNewAccount} className="btn btn--ghost" style={{ fontSize: "var(--font-size-sm)" }}>
              회원가입
            </button>
          </div>

          {(onAdmin || onTutorial) && (
            <div style={{ display: "flex", justifyContent: "center", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              {onAdmin && (
                <button type="button" onClick={onAdmin} className="account-admin-btn">
                  🔧 관리자
                </button>
              )}
              {onTutorial && (
                <button type="button" onClick={onTutorial} className="account-admin-btn">
                  📖 튜토리얼
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
