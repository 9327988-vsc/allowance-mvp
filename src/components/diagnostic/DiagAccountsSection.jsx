import { collectFamilyMembers, collectAllFamilies, deleteFamily } from "../../utils/diagnosticHelpers";
import { loadUserAccounts, removeUser } from "../../utils/authStore";
import { showToast } from "../../utils/toastManager";

export default function DiagAccountsSection({ accounts, setAccounts, families, setFamilies, familyContext }) {
  return (
    <div className="diag-section-body">
      {/* 등록된 계정 */}
      <h3 className="diag-sub-title">등록된 계정 ({accounts.length})</h3>
      {accounts.length === 0 ? (
        <p className="diag-empty">등록된 계정이 없습니다</p>
      ) : (
        <div className="diag-table-wrap">
          <table className="diag-table">
            <thead>
              <tr><th>이름</th><th>역할</th><th>가입일</th><th>가족코드</th><th></th></tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.user_id}>
                  <td>{a.display_name}</td>
                  <td>{a.role === "parent" ? "부모" : a.role === "general" ? "일반" : "자녀"}</td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}</td>
                  <td>{a.family_context?.family_code || "-"}</td>
                  <td>
                    <button
                      className="diag-action-sm diag-action-danger"
                      onClick={() => {
                        if (!confirm(`"${a.display_name}" 계정을 삭제하시겠습니까?`)) return;
                        removeUser(a.user_id);
                        setAccounts(loadUserAccounts());
                        showToast({ type: "success", message: "계정 삭제 완료" });
                      }}
                    >삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 가족 정보 */}
      <h3 className="diag-sub-title" style={{ marginTop: 16 }}>가족 정보 ({families.length}개)</h3>
      {families.length === 0 ? (
        <p className="diag-empty">생성된 가족이 없습니다</p>
      ) : (
        families.map(f => {
          const members = collectFamilyMembers(f.family_id);
          return (
            <div key={f.family_id} className="diag-family-card">
              <div className="diag-family-header">
                <span className="diag-family-code">🏠 {f.family_code}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span className="diag-detail">생성: {new Date(f.created_at).toLocaleDateString()}</span>
                  <button
                    className="diag-action-sm diag-action-danger"
                    onClick={() => {
                      if (!confirm(`가족 "${f.family_code}" 의 모든 데이터를 삭제하시겠습니까?\n(멤버 ${members.length}명, 관련 청구 포함)`)) return;
                      deleteFamily(f.family_id);
                      setFamilies(collectAllFamilies());
                      showToast({ type: "success", message: `가족 "${f.family_code}" 삭제 완료` });
                    }}
                  >삭제</button>
                </div>
              </div>
              <div className="diag-member-list">
                {members.map(m => (
                  <span key={m.member_id} className={`diag-member-badge diag-member-badge--${m.role}`}>
                    {m.role === "parent" ? "👨‍👩‍👧" : "👶"} {m.display_name}
                  </span>
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* 현재 활성 가족 컨텍스트 */}
      {familyContext && (
        <div className="diag-info-box">
          <p className="diag-sub-label">현재 활성 가족 컨텍스트:</p>
          <p>코드: <strong>{familyContext.family_code}</strong> / 멤버: <strong>{familyContext.member_display_name}</strong> ({familyContext.member_role === "parent" ? "부모" : familyContext.member_role === "general" ? "일반" : "자녀"})</p>
        </div>
      )}
    </div>
  );
}
