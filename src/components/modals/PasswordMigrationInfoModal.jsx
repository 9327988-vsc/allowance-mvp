// src/components/modals/PasswordMigrationInfoModal.jsx — PIN→비밀번호 마이그레이션 안내
import { useModalBase } from "../../hooks/useModalBase";

const ROLE_LABELS = { parent: "부모", child: "자녀", general: "일반" };

export default function PasswordMigrationInfoModal({ accounts, onConfirm }) {
  const modalRef = useModalBase(onConfirm, { active: true });

  return (
    <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }}>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="modal-content"
        style={{ maxWidth: 440, width: "90%" }}
        role="alertdialog"
        aria-modal="true"
        aria-label="인증 방식 변경 안내"
      >
        <h2 className="modal-title mb-3">🔐 인증 방식이 변경되었습니다</h2>

        <p className="mb-3" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          보안 강화를 위해 PIN 인증이 <strong>아이디 + 비밀번호</strong> 방식으로 변경되었습니다.
          아래 임시 계정 정보를 확인하고, 로그인 후 반드시 비밀번호를 변경해 주세요.
        </p>

        <div style={{
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid var(--color-border, #e2e8f0)",
          marginBottom: "var(--space-4)",
          fontSize: "var(--font-size-sm)",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-bg-secondary, #f1f5f9)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>역할</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>아이디</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600 }}>임시 비밀번호</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acct, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--color-border, #e2e8f0)" }}>
                  <td style={{ padding: "8px 12px" }}>{ROLE_LABELS[acct.role] || acct.role}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600 }}>{acct.username}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 600 }}>{acct.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mb-3" style={{ fontSize: "var(--font-size-xs)", color: "var(--color-warning, #d97706)", lineHeight: 1.5 }}>
          이 정보는 이 화면에서만 확인 가능합니다. 메모해 두세요.
        </p>

        <button
          onClick={onConfirm}
          className="btn btn--primary btn--full btn--lg"
        >
          확인했습니다
        </button>
      </div>
    </div>
  );
}
