// src/components/LoginScreen.jsx — 로그인 화면
import { useState, useRef, useEffect } from "react";
import { loadUserAccounts, verifyPin, removeUser, setUserPin, requestPinReset } from "../utils/authStore";
import PinInput from "./PinInput";
import ThemeToggle from "./widgets/ThemeToggle";

// ── 잠금 상태 무결성 보호 (C3: sessionStorage 변조 방어) ──
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
      // 무결성 실패 → 변조 감지 → 최대 잠금 적용
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
 *   onAdmin?: () => void
 * }} props
 */
export default function LoginScreen({ onComplete, onNewAccount, onAdmin, onTutorial }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetRequested, setResetRequested] = useState(false);

  // PIN 미설정 유저 (레거시 마이그레이션)
  const [settingPin, setSettingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [newPinError, setNewPinError] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    // 영속화된 잠금 상태 복원: 남은 시간만큼 타이머 재설정
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

  const selectedUserRef = useRef(selectedUser);
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

  const [accounts, setAccounts] = useState(() => loadUserAccounts());
  const isLocked = lockoutUntil && Date.now() < lockoutUntil;

  function handleSelectUser(user) {
    if (user.pin_hash === null) {
      // PIN 미설정 → 설정 화면
      setSelectedUser(user);
      setSettingPin(true);
      setNewPin("");
      setNewPinConfirm("");
      setLockoutUntil(null);
      setAttempts(0);
      attemptsRef.current = 0;
      return;
    }
    setSelectedUser(user);
    setPin("");
    setPinError(false);
    setAttempts(0);
    attemptsRef.current = 0;
    setLockoutUntil(null);
    setResetRequested(false);
  }

  function handlePinChange(val) {
    setPin(val);
    setPinError(false);

    if (val.length === 4) {
      const userId = selectedUserRef.current?.user_id;
      if (!userId) return;
      setTimeout(async () => {
        if (!mountedRef.current) return;
        try {
          if (await verifyPin(userId, val)) {
            onComplete(userId);
          } else {
            attemptsRef.current += 1;
            const next = attemptsRef.current;
            setAttempts(next);
            setPinError(true);
            setPin("");
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
          console.error("PIN verify failed:", err);
          setPinError(true);
          setPin("");
        }
      }, 200);
    }
  }

  // PIN 설정 (레거시 유저)
  function handleNewPinChange(val) {
    setNewPin(val);
  }

  function handleNewPinConfirmChange(val) {
    setNewPinConfirm(val);
    setNewPinError(false);
    if (val.length === 4) {
      const userId = selectedUser?.user_id;
      if (!userId) return;
      const expectedPin = newPin;
      setTimeout(async () => {
        if (!mountedRef.current) return;
        try {
          if (val === expectedPin) {
            await setUserPin(userId, val);
            onComplete(userId);
          } else {
            setNewPinError(true);
            setNewPinConfirm("");
          }
        } catch (err) {
          console.error("PIN set failed:", err);
          setNewPinError(true);
          setNewPinConfirm("");
        }
      }, 200);
    }
  }

  function handleDelete(userId) {
    removeUser(userId);
    setDeleteConfirm(null);
    setSelectedUser(null);
    const remaining = loadUserAccounts();
    if (remaining.length === 0) {
      onNewAccount();
    } else {
      setAccounts(remaining);
    }
  }

  function handleBack() {
    setSelectedUser(null);
    setSettingPin(false);
    setPin("");
    setPinError(false);
    setNewPin("");
    setNewPinConfirm("");
  }

  // PIN 설정 화면 (레거시 유저)
  if (settingPin && selectedUser) {
    return (
      <div className="auth-screen">
        <div className="auth-screen__inner">
          <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
          <div className="auth-screen__logo">{selectedUser.avatar_emoji || (selectedUser.role === "parent" ? "👨‍👩‍👧" : selectedUser.role === "general" ? "👤" : "🧒")}</div>
          <h1 className="auth-screen__title">{selectedUser.display_name}</h1>

          {newPin.length < 4 ? (
            <div className="auth-form fade-in">
              <p className="auth-pin-label">PIN을 설정해주세요 (4자리)</p>
              <PinInput key="new-pin" value={newPin} onChange={handleNewPinChange} error={false} />
            </div>
          ) : (
            <div className="auth-form fade-in">
              <p className="auth-pin-label">PIN을 다시 입력하세요</p>
              <PinInput key="new-pin-confirm" value={newPinConfirm} onChange={handleNewPinConfirmChange} error={newPinError} autoFocus />
              {newPinError && <p className="auth-form__error">PIN이 일치하지 않습니다</p>}
            </div>
          )}

          <button onClick={handleBack} className="btn btn--ghost" style={{ marginTop: "var(--space-3)" }}>
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // PIN 입력 화면
  if (selectedUser) {
    return (
      <div className="auth-screen">
        <div className="auth-screen__inner">
          <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
          <div className="auth-screen__logo">{selectedUser.avatar_emoji || (selectedUser.role === "parent" ? "👨‍👩‍👧" : selectedUser.role === "general" ? "👤" : "🧒")}</div>
          <h1 className="auth-screen__title">{selectedUser.display_name}</h1>
          <p className="auth-screen__subtitle">PIN을 입력하세요</p>

          <div className="auth-form fade-in">
            <PinInput value={pin} onChange={handlePinChange} error={pinError} disabled={isLocked} />
            {pinError && !isLocked && (
              <p className="auth-form__error">
                PIN이 틀렸습니다 ({attempts}/5)
              </p>
            )}
            {isLocked && !resetRequested && (
              <p className="auth-form__error">
                5회 실패. 30초 후 다시 시도하세요
              </p>
            )}
            {isLocked && !resetRequested && (
              <button
                className="btn btn--ghost"
                style={{ marginTop: "var(--space-2)", fontSize: "var(--font-size-sm)" }}
                onClick={() => {
                  requestPinReset(selectedUser.user_id);
                  setResetRequested(true);
                }}
              >
                🔑 관리자에게 비밀번호 초기화 요청
              </button>
            )}
            {resetRequested && (
              <p className="auth-form__info" style={{ color: "var(--color-success)", fontSize: "var(--font-size-sm)", marginTop: "var(--space-2)", textAlign: "center" }}>
                초기화 요청이 전송되었습니다.<br/>관리자(부모)가 승인하면 새 PIN을 설정할 수 있습니다.
              </p>
            )}
          </div>

          <button onClick={handleBack} className="btn btn--ghost" style={{ marginTop: "var(--space-3)" }}>
            ← 다른 계정
          </button>
        </div>
      </div>
    );
  }

  // 계정 목록 화면
  return (
    <div className="auth-screen">
      <div className="auth-screen__inner">
        <div className="auth-screen__theme"><ThemeToggle size="sm" /></div>
        <div className="auth-screen__logo">💰</div>
        <h1 className="auth-screen__title">용돈 관리</h1>
        <p className="auth-screen__subtitle">로그인할 계정을 선택하세요</p>

        <div className="auth-account-list">
          {accounts.map((a, i) => (
            <div
              key={a.user_id}
              role="button"
              tabIndex={0}
              className="account-card fade-in"
              style={{ "--anim-delay": `${i * 80}ms` }}
              onClick={() => handleSelectUser(a)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelectUser(a); } }}
            >
              <div className="account-card__info">
                <div className={`account-card__avatar account-card__avatar--${a.role}`}>
                  {a.avatar_emoji || (a.role === "parent" ? "👨‍👩‍👧" : a.role === "general" ? "👤" : "🧒")}
                </div>
                <div>
                  <div className="account-card__name">{a.display_name}</div>
                  <div className="account-card__meta">
                    {a.role === "parent" ? "부모" : a.role === "general" ? "일반" : "자녀"}
                    {a.role !== "general" && (a.family_context ? ` · ${a.family_context.family_code}` : " · 가족 미가입")}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(a.user_id); }}
                className="account-card__remove"
                aria-label="계정 삭제"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button onClick={onNewAccount} className="account-add-btn">
          + 새 계정 만들기
        </button>

        {onAdmin && (
          <button onClick={onAdmin} className="account-admin-btn">
            🔧 관리자
          </button>
        )}

        {onTutorial && (
          <button onClick={onTutorial} className="account-admin-btn" style={{ marginTop: "var(--space-2)" }}>
            📖 튜토리얼
          </button>
        )}

        {/* 삭제 확인 */}
        {deleteConfirm && (
          <div className="modal-backdrop">
            <div className="modal-content" style={{ maxWidth: 340, padding: 0 }} onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-label="계정 삭제 확인">
              <div className="modal-header modal-header--danger">
                <h2 className="modal-title">계정 삭제</h2>
                <button onClick={() => setDeleteConfirm(null)} className="modal-close" aria-label="닫기">×</button>
              </div>
              <div className="modal-body" style={{ textAlign: "center" }}>
                <p>{(() => {
                  const target = accounts.find(a => a.user_id === deleteConfirm);
                  return target ? `"${target.display_name}" 계정을 삭제할까요?` : "이 계정을 삭제할까요?";
                })()}</p>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)", marginTop: "var(--space-2)" }}>
                  계정 데이터는 복구할 수 없습니다
                </p>
              </div>
              <div className="modal-footer modal-footer--stretch">
                <button onClick={() => setDeleteConfirm(null)} className="btn btn--secondary">취소</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="btn btn--danger">삭제</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
