// src/components/modals/DiagnosticScreen.jsx — S-112 진단 화면 (관리자 모드)
import { useState, useCallback, useMemo, useEffect } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { checkDataStatus, getSystemInfo, recoverFromBackup, discardBackup } from "../../utils/diagnostics";
import { getStorageUsage, listAllAppKeys, loadSettings, saveSettings } from "../../utils/storage";
import { getHolidays } from "../../utils/holidays";
import { showToast } from "../../utils/toastManager";
import { loadUserAccounts, removeUser } from "../../utils/authStore";
import { loadFamilyContext } from "../../utils/familyContext";
import { formatAmount } from "../../utils/formatAmount";
import { loadQuestions, answerQuestion, deleteQuestion, getUnansweredCount } from "../../utils/qna";

// mock_kv 직접 읽기 헬퍼
function kvRead(key) {
  try {
    const raw = localStorage.getItem("mock_kv:" + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function kvDelete(key) {
  localStorage.removeItem("mock_kv:" + key);
}

/** 가족 데이터 전체 삭제 (localStorage mock_kv 기반) */
function deleteFamily(familyId) {
  // 멤버 목록 삭제
  const memberList = kvRead(`families/${familyId}/members/list`) || [];
  for (const mid of memberList) {
    kvDelete(`families/${familyId}/members/${mid}`);
  }
  kvDelete(`families/${familyId}/members/list`);

  // 청구 목록 삭제
  const claimList = kvRead(`families/${familyId}/claims/list`) || [];
  for (const cid of claimList) {
    kvDelete(`families/${familyId}/claims/${cid}`);
  }
  kvDelete(`families/${familyId}/claims/list`);

  // 가족 코드 별 인덱스 삭제
  const family = kvRead(`families/${familyId}`);
  if (family?.family_code) {
    kvDelete(`families/by_code/${family.family_code}`);
  }

  // 마이그레이션 키 삭제
  kvDelete(`families/${familyId}/migrations/idempotency`);

  // 가족 본체 삭제
  kvDelete(`families/${familyId}`);
}

// 모든 가족/청구 데이터 수집
function collectAllFamilies() {
  const families = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith("mock_kv:families/") || k.includes("/members/") || k.includes("/claims/") || k.includes("/migrations/") || k.includes("/by_code/")) continue;
    const match = k.match(/^mock_kv:families\/(fam_[a-f0-9-]+)$/);
    if (!match) continue;
    const family = kvRead(`families/${match[1]}`);
    if (family) families.push(family);
  }
  return families;
}

function collectFamilyMembers(familyId) {
  const list = kvRead(`families/${familyId}/members/list`) || [];
  return list.map(mid => kvRead(`families/${familyId}/members/${mid}`)).filter(Boolean);
}

function collectFamilyClaims(familyId) {
  const list = kvRead(`families/${familyId}/claims/list`) || [];
  return list.map(cid => {
    const c = kvRead(`families/${familyId}/claims/${cid}`);
    return c || null;
  }).filter(Boolean);
}

const STATUS_LABELS = {
  pending: "⏳ 대기",
  approved: "✅ 승인",
  rejected: "❌ 거절",
  paid: "💰 지급",
  received: "🎉 수령",
};

export default function DiagnosticScreen({ onBack, onExport, onImport, onCategoryManage, onCleanup, onReset, onPinManage }) {
  // useModalBase: ESC handler + focus trap (전체 화면이므로 scroll lock 비활성화)
  const modalRef = useModalBase(onBack, { noScrollLock: true });

  // 전체 화면이므로 body 스크롤 허용 (body에 overflow:hidden이 기본 적용됨)
  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, []);

  const [dataStatus, setDataStatus] = useState(() => checkDataStatus());
  const [systemInfo] = useState(() => getSystemInfo());
  const [storageUsage] = useState(() => getStorageUsage());

  // 관리 섹션 접기/펼치기
  const [openSection, setOpenSection] = useState(null);
  const toggleSection = (name) => setOpenSection(prev => prev === name ? null : name);

  // 1. 계정/가족 관리
  const [accounts, setAccounts] = useState(() => loadUserAccounts());
  const [families, setFamilies] = useState(() => collectAllFamilies());
  const familyContext = useMemo(() => loadFamilyContext(), []);

  // 2. 청구 내역
  const [allClaims] = useState(() => {
    const claims = [];
    for (const f of collectAllFamilies()) {
      const fc = collectFamilyClaims(f.family_id);
      fc.forEach(c => claims.push({ ...c, _family_code: f.family_code }));
    }
    claims.sort((a, b) => (b.submitted_at || "").localeCompare(a.submitted_at || ""));
    return claims;
  });
  const [claimFilter, setClaimFilter] = useState("all");

  // Q&A 관리
  const [qnaList, setQnaList] = useState(() => loadQuestions());
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState("");

  // 5. 설정 편집
  const [editSettings, setEditSettings] = useState(null);
  const [settingsDirty, setSettingsDirty] = useState(false);

  const refreshDataStatus = useCallback(() => {
    setDataStatus(checkDataStatus());
  }, []);

  // BTN-A-007: 콘솔 로그 보기 (민감 키 필터)
  function handleConsoleLog() {
    const SENSITIVE_KEYS = ["user_accounts_v1", "active_user_v1"];
    const keys = listAllAppKeys();
    keys.forEach(k => {
      if (SENSITIVE_KEYS.some(sk => k.includes(sk))) {
        console.debug(`[${k}]`, "(민감 정보 — 콘솔 출력 생략)");
        return;
      }
      const raw = localStorage.getItem(k);
      try {
        console.debug(`[${k}]`, JSON.parse(raw));
      } catch {
        console.debug(`[${k}]`, raw);
      }
    });
    console.debug("[systemInfo]", getSystemInfo());
    alert("F12 → 콘솔 탭에서 로그를 확인하세요");
  }

  // BTN-A-008: 무결성 검사
  function handleIntegrityCheck() {
    refreshDataStatus();
    showToast({ type: "success", message: "무결성 검사 완료" });
  }

  // BTN-A-009: 공휴일 검증
  function handleHolidayCheck() {
    try {
      const holidays = getHolidays();
      const keys = Object.keys(holidays);
      const total = keys.length;
      const byYear = {};
      keys.forEach(dateStr => {
        const year = dateStr.slice(0, 4);
        byYear[year] = (byYear[year] || 0) + 1;
      });
      const yearSummary = ["2026", "2027", "2028", "2029", "2030"]
        .map(y => `${y}=${byYear[y] || 0}건`)
        .join(", ");
      alert(`총 ${total}개 공휴일 로드됨\n연도별: ${yearSummary}`);
    } catch {
      alert("공휴일 데이터 없음");
    }
  }

  // 복구
  function handleRecover(originalKey) {
    const result = recoverFromBackup(originalKey);
    if (result.success) {
      showToast({ type: "success", message: `✅ ${originalKey} 복구 완료` });
    } else {
      const messages = {
        NO_BACKUP: "백업 파일이 없습니다. 수동 복구가 필요합니다",
        BACKUP_EMPTY: "백업 파일이 비어있습니다",
        PARSE_FAILED: "백업 파일도 손상되었습니다. 데이터 가져오기를 이용하세요",
        RESTORE_FAILED: "복원 중 저장 오류. 스토리지 용량을 확인하세요",
      };
      showToast({ type: "error", message: messages[result.error] || "복구 실패" });
    }
    refreshDataStatus();
  }

  // 백업 삭제
  function handleDiscardBackup(backupKey) {
    discardBackup(backupKey);
    showToast({ type: "success", message: "백업 삭제 완료" });
    refreshDataStatus();
  }

  // 데이터 분류
  const settingsStatus = dataStatus.find(d => d.key === "settings_v1");
  const metaStatus = dataStatus.find(d => d.key === "meta_v1");
  const categoriesStatus = dataStatus.find(d => d.key === "custom_categories_v1");
  const calendarStatuses = dataStatus.filter(d => d.key.startsWith("calendar_v1_") && !d.key.includes("_corrupted_"));
  const backupKeys = Object.keys(localStorage).filter(k => k.includes("_corrupted_"));

  // 스토리지 표시
  const usedKB = (storageUsage.used / 1024).toFixed(1);
  const totalMB = (storageUsage.total / (1024 * 1024)).toFixed(0);
  const pct = storageUsage.percent.toFixed(2);

  return (
    <div ref={modalRef} tabIndex={-1} className="app-container diagnostic-screen" role="dialog" aria-modal="true" aria-label="진단 화면">
      {/* 헤더 */}
      <header className="diag-header">
        <h1 className="diag-title">🛠 관리자 / 진단 모드</h1>
        <button onClick={onBack} className="diag-back-btn">
          일반 모드로 돌아가기
        </button>
      </header>

      {/* 시스템 정보 */}
      <section className="diag-section">
        <h2 className="diag-section-title">시스템 정보</h2>
        <div className="diag-info-grid">
          <span className="diag-label">앱 버전</span>
          <span>{systemInfo.appVersion}</span>
          <span className="diag-label">스키마 버전</span>
          <span>{systemInfo.schemaVersion}</span>
          <span className="diag-label">첫 사용일</span>
          <span>{systemInfo.firstUsedAt || "-"}</span>
          <span className="diag-label">마지막 사용일</span>
          <span>{systemInfo.lastUsedAt || "-"}</span>
          <span className="diag-label">사용 일수</span>
          <span>{systemInfo.daysSinceFirstUse}일</span>
        </div>
      </section>

      {/* 데이터 상태 */}
      <section className="diag-section">
        <h2 className="diag-section-title">데이터 상태</h2>
        <div className="diag-data-list">
          <StatusRow item={settingsStatus} label="settings_v1" />
          <StatusRow item={metaStatus} label="meta_v1" />
          <StatusRow item={categoriesStatus} label="custom_categories_v1" />

          {calendarStatuses.length > 0 && (
            <div className="diag-calendar-group">
              <p className="diag-sub-label">캘린더 데이터 (월별 목록):</p>
              {calendarStatuses.map(cal => {
                const match = cal.key.match(/calendar_v1_(\d{4})_(\d{2})/);
                const ym = match ? `${match[1]}-${match[2]}` : cal.key;
                return (
                  <div key={cal.key} className="diag-data-row">
                    {cal.valid ? "✅" : "⚠️"} {ym}: {cal.valid ? "정상" : "손상"}
                    {cal.valid && <span className="diag-detail"> ({cal.size.toLocaleString("ko-KR")} bytes{cal.itemCount !== undefined ? `, 임시항목 ${cal.itemCount}개` : ""})</span>}
                    {!cal.valid && (
                      <>
                        <button className="diag-action-sm" onClick={() => handleRecover(cal.key)}>복구</button>
                        <button className="diag-action-sm diag-action-danger" onClick={() => handleDiscardBackup(cal.key)}>삭제</button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {backupKeys.length > 0 && (
            <div className="diag-calendar-group">
              <p className="diag-sub-label">백업 파일:</p>
              {backupKeys.map(bk => (
                <div key={bk} className="diag-data-row">
                  📦 {bk}
                  <button className="diag-action-sm" onClick={() => {
                    const raw = localStorage.getItem(bk);
                    try { console.debug(`[${bk}]`, JSON.parse(raw)); } catch { console.debug(`[${bk}]`, raw); }
                    alert("F12 콘솔에서 확인하세요");
                  }}>보기</button>
                  <button className="diag-action-sm diag-action-danger" onClick={() => handleDiscardBackup(bk)}>삭제</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 스토리지 사용량 */}
      <section className="diag-section">
        <h2 className="diag-section-title">스토리지 사용량</h2>
        <p>{usedKB} KB / {totalMB} MB ({pct}%)</p>
        <div className="diag-storage-bar">
          <div className="diag-storage-fill" style={{ width: `${Math.min(storageUsage.percent, 100)}%` }} />
        </div>
      </section>

      {/* 작업 */}
      <section className="diag-section">
        <h2 className="diag-section-title">작업</h2>
        <div className="diag-actions">
          {onExport && <button className="diag-btn" onClick={onExport}>📤 데이터 내보내기</button>}
          {onImport && <button className="diag-btn" onClick={onImport}>📥 데이터 가져오기</button>}
          {onCategoryManage && <button className="diag-btn" onClick={onCategoryManage}>🏷 카테고리 관리</button>}
          {onCleanup && <button className="diag-btn" onClick={onCleanup}>🧹 오래된 데이터 정리</button>}
          {onPinManage && <button className="diag-btn" onClick={onPinManage}>🔑 비밀번호 관리</button>}
          {onReset && <button className="diag-btn diag-btn--danger" onClick={onReset}>🗑 모든 데이터 초기화</button>}
        </div>
      </section>

      {/* 디버그 */}
      <section className="diag-section">
        <h2 className="diag-section-title">디버그</h2>
        <div className="diag-debug-actions">
          <button className="diag-btn diag-btn--sm" onClick={handleConsoleLog}>콘솔 로그 보기</button>
          <button className="diag-btn diag-btn--sm" onClick={handleIntegrityCheck}>무결성 검사</button>
          <button className="diag-btn diag-btn--sm" onClick={handleHolidayCheck}>공휴일 검증</button>
        </div>
      </section>

      <hr className="diag-divider" />
      <h2 className="diag-section-title" style={{ marginBottom: 12 }}>📊 관리 도구</h2>

      {/* ── 1. 계정/가족 관리 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("accounts")} aria-expanded={openSection === "accounts"}>
          <span>👥 계정 / 가족 관리</span>
          <span>{openSection === "accounts" ? "▲" : "▼"}</span>
        </button>
        {openSection === "accounts" && (
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
        )}
      </section>

      {/* ── 2. 청구 내역 전체 조회 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("claims")} aria-expanded={openSection === "claims"}>
          <span>📋 청구 내역 전체 조회</span>
          <span>{openSection === "claims" ? "▲" : "▼"}</span>
        </button>
        {openSection === "claims" && (
          <div className="diag-section-body">
            {/* 필터 */}
            <div className="diag-filter-bar">
              {["all", "pending", "approved", "rejected", "paid", "received"].map(f => (
                <button
                  key={f}
                  className={`diag-filter-btn${claimFilter === f ? " diag-filter-btn--active" : ""}`}
                  onClick={() => setClaimFilter(f)}
                >
                  {f === "all" ? "전체" : STATUS_LABELS[f]}
                </button>
              ))}
            </div>

            {(() => {
              const filtered = claimFilter === "all" ? allClaims : allClaims.filter(c => c.status === claimFilter);
              if (filtered.length === 0) return <p className="diag-empty">해당 조건의 청구가 없습니다</p>;
              return (
                <div className="diag-table-wrap">
                  <table className="diag-table">
                    <thead>
                      <tr><th>날짜</th><th>기간</th><th>상태</th><th>금액</th><th>가족</th></tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 50).map(c => (
                        <tr key={c.claim_id}>
                          <td>{c.submitted_at ? new Date(c.submitted_at).toLocaleDateString() : "-"}</td>
                          <td>{c.year}-{String(c.month).padStart(2, "0")}{c.is_extra ? " (추가)" : ""}</td>
                          <td>{STATUS_LABELS[c.status] || c.status}</td>
                          <td className="diag-amount">{formatAmount(c.snapshot?.calculation?.total ?? 0)}</td>
                          <td>{c._family_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 50 && <p className="diag-detail" style={{ marginTop: 8 }}>...외 {filtered.length - 50}건</p>}
                </div>
              );
            })()}
            <p className="diag-detail" style={{ marginTop: 8 }}>총 {allClaims.length}건</p>
          </div>
        )}
      </section>

      {/* ── 3. 통계 대시보드 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("stats")} aria-expanded={openSection === "stats"}>
          <span>📈 통계 대시보드</span>
          <span>{openSection === "stats" ? "▲" : "▼"}</span>
        </button>
        {openSection === "stats" && (
          <div className="diag-section-body">
            {/* 상태별 요약 */}
            <h3 className="diag-sub-title">상태별 요약</h3>
            <div className="diag-stats-grid">
              {["pending", "approved", "rejected", "paid", "received"].map(s => {
                const count = allClaims.filter(c => c.status === s).length;
                const total = allClaims.filter(c => c.status === s).reduce((sum, c) => sum + (c.snapshot?.calculation?.total ?? 0), 0);
                return (
                  <div key={s} className={`diag-stat-card diag-stat-card--${s}`}>
                    <div className="diag-stat-label">{STATUS_LABELS[s]}</div>
                    <div className="diag-stat-count">{count}건</div>
                    <div className="diag-stat-total">{formatAmount(total)}</div>
                  </div>
                );
              })}
            </div>

            {/* 월별 추이 */}
            <h3 className="diag-sub-title" style={{ marginTop: 20 }}>월별 청구 추이</h3>
            {(() => {
              const monthly = {};
              allClaims.forEach(c => {
                const key = `${c.year}-${String(c.month).padStart(2, "0")}`;
                if (!monthly[key]) monthly[key] = { count: 0, total: 0, approved: 0 };
                monthly[key].count++;
                monthly[key].total += c.snapshot?.calculation?.total ?? 0;
                if (c.status === "approved" || c.status === "paid" || c.status === "received") {
                  monthly[key].approved += c.snapshot?.calculation?.total ?? 0;
                }
              });
              const sorted = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]));
              if (sorted.length === 0) return <p className="diag-empty">데이터 없음</p>;
              const maxTotal = Math.max(...sorted.map(([, v]) => v.total), 1);
              return (
                <div className="diag-monthly-chart">
                  {sorted.map(([month, data]) => (
                    <div key={month} className="diag-monthly-row">
                      <span className="diag-monthly-label">{month}</span>
                      <div className="diag-monthly-bar-wrap">
                        <div className="diag-monthly-bar" style={{ width: `${(data.total / maxTotal) * 100}%` }} />
                        <div className="diag-monthly-bar diag-monthly-bar--approved" style={{ width: `${(data.approved / maxTotal) * 100}%` }} />
                      </div>
                      <span className="diag-monthly-value">{formatAmount(data.total)} ({data.count}건)</span>
                    </div>
                  ))}
                  <div className="diag-chart-legend">
                    <span><span className="diag-legend-dot diag-legend-dot--total" /> 청구</span>
                    <span><span className="diag-legend-dot diag-legend-dot--approved" /> 승인</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* ── 4. 활동 로그 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("logs")} aria-expanded={openSection === "logs"}>
          <span>📝 활동 로그</span>
          <span>{openSection === "logs" ? "▲" : "▼"}</span>
        </button>
        {openSection === "logs" && (
          <div className="diag-section-body">
            {(() => {
              // 청구 이벤트 기반 활동 로그 생성
              const logs = [];
              allClaims.forEach(c => {
                if (c.submitted_at) logs.push({ time: c.submitted_at, type: "submit", desc: `${c.year}-${String(c.month).padStart(2, "0")} 청구 제출 (${formatAmount(c.snapshot?.calculation?.total ?? 0)})` });
                if (c.decided_at && c.status === "approved") logs.push({ time: c.decided_at, type: "approve", desc: `${c.year}-${String(c.month).padStart(2, "0")} 청구 승인` });
                if (c.decided_at && c.status === "rejected") logs.push({ time: c.decided_at, type: "reject", desc: `${c.year}-${String(c.month).padStart(2, "0")} 청구 거절: ${c.rejection_reason || ""}` });
                if (c.paid_at) logs.push({ time: c.paid_at, type: "pay", desc: `${c.year}-${String(c.month).padStart(2, "0")} 용돈 지급` });
                if (c.received_at) logs.push({ time: c.received_at, type: "receive", desc: `${c.year}-${String(c.month).padStart(2, "0")} 수령 확인` });
                (c.comments || []).forEach(cm => {
                  logs.push({ time: cm.created_at, type: "comment", desc: `댓글: "${cm.text.slice(0, 30)}${cm.text.length > 30 ? "..." : ""}" — ${cm.author_display_name}` });
                });
              });
              // 계정 생성 이벤트
              accounts.forEach(a => {
                if (a.created_at) logs.push({ time: a.created_at, type: "account", desc: `계정 생성: ${a.display_name} (${a.role === "parent" ? "부모" : a.role === "general" ? "일반" : "자녀"})` });
              });
              logs.sort((a, b) => b.time.localeCompare(a.time));

              const TYPE_ICONS = { submit: "📤", approve: "✅", reject: "❌", pay: "💰", receive: "🎉", comment: "💬", account: "👤" };

              if (logs.length === 0) return <p className="diag-empty">활동 기록이 없습니다</p>;
              return (
                <div className="diag-log-list">
                  {logs.slice(0, 30).map((log, i) => (
                    <div key={i} className="diag-log-item">
                      <span className="diag-log-icon">{TYPE_ICONS[log.type] || "📌"}</span>
                      <span className="diag-log-time">{new Date(log.time).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="diag-log-desc">{log.desc}</span>
                    </div>
                  ))}
                  {logs.length > 30 && <p className="diag-detail">...외 {logs.length - 30}건</p>}
                </div>
              );
            })()}
          </div>
        )}
      </section>

      {/* ── 5. 설정 편집 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" aria-expanded={openSection === "settings"} onClick={() => {
          toggleSection("settings");
          if (openSection !== "settings") {
            const s = loadSettings();
            setEditSettings(s ? { ...s } : null);
            setSettingsDirty(false);
          }
        }}>
          <span>⚙️ 설정 편집</span>
          <span>{openSection === "settings" ? "▲" : "▼"}</span>
        </button>
        {openSection === "settings" && (
          <div className="diag-section-body">
            {!editSettings ? (
              <p className="diag-empty">설정 데이터가 없습니다</p>
            ) : (
              <>
                <div className="diag-settings-form">
                  <label className="diag-settings-row">
                    <span className="diag-settings-label">자녀 이름</span>
                    <input
                      type="text"
                      className="diag-settings-input"
                      value={editSettings.child_name || ""}
                      onChange={e => { setEditSettings({ ...editSettings, child_name: e.target.value }); setSettingsDirty(true); }}
                    />
                  </label>
                  <label className="diag-settings-row">
                    <span className="diag-settings-label">기본 용돈 (원)</span>
                    <input
                      type="number"
                      className="diag-settings-input"
                      value={editSettings.base_allowance ?? ""}
                      onChange={e => { setEditSettings({ ...editSettings, base_allowance: Number(e.target.value) || 0 }); setSettingsDirty(true); }}
                    />
                  </label>
                  <label className="diag-settings-row">
                    <span className="diag-settings-label">용돈 지급일</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="diag-settings-input"
                      value={editSettings.allowance_day ?? ""}
                      onChange={e => { setEditSettings({ ...editSettings, allowance_day: Number(e.target.value) || 1 }); setSettingsDirty(true); }}
                    />
                  </label>
                  <label className="diag-settings-row">
                    <span className="diag-settings-label">보너스 단가 (원)</span>
                    <input
                      type="number"
                      className="diag-settings-input"
                      value={editSettings.bonus_per_day ?? ""}
                      onChange={e => { setEditSettings({ ...editSettings, bonus_per_day: Number(e.target.value) || 0 }); setSettingsDirty(true); }}
                    />
                  </label>
                  <label className="diag-settings-row">
                    <span className="diag-settings-label">감점 단가 (원)</span>
                    <input
                      type="number"
                      className="diag-settings-input"
                      value={editSettings.penalty_per_day ?? ""}
                      onChange={e => { setEditSettings({ ...editSettings, penalty_per_day: Number(e.target.value) || 0 }); setSettingsDirty(true); }}
                    />
                  </label>
                </div>
                <div className="diag-settings-actions">
                  <button
                    className="diag-btn"
                    disabled={!settingsDirty}
                    onClick={() => {
                      const result = saveSettings(editSettings);
                      if (result.success) {
                        showToast({ type: "success", message: "설정 저장 완료" });
                        setSettingsDirty(false);
                      } else {
                        showToast({ type: "error", message: "저장 실패" });
                      }
                    }}
                  >💾 저장</button>
                  <button
                    className="diag-btn diag-btn--sm"
                    onClick={() => {
                      setEditSettings(loadSettings() ? { ...loadSettings() } : null);
                      setSettingsDirty(false);
                    }}
                  >↩ 되돌리기</button>
                </div>

                {/* raw JSON 보기 */}
                <details style={{ marginTop: 12 }}>
                  <summary className="diag-detail" style={{ cursor: "pointer" }}>Raw JSON 보기</summary>
                  <pre className="diag-raw-json">{JSON.stringify(editSettings, null, 2)}</pre>
                </details>
              </>
            )}
          </div>
        )}
      </section>

      {/* Q&A 관리 */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" aria-expanded={openSection === "qna"} onClick={() => { toggleSection("qna"); setQnaList(loadQuestions()); }}>
          <span>❓ Q&A 관리 {(() => { const c = getUnansweredCount(); return c > 0 ? `(미답변 ${c})` : ""; })()}</span>
          <span>{openSection === "qna" ? "▲" : "▼"}</span>
        </button>
        {openSection === "qna" && (
          <div className="diag-section-body">
            {qnaList.length === 0 ? (
              <p className="diag-empty">등록된 질문이 없습니다</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {qnaList.map(q => (
                  <div key={q.id} style={{ padding: 12, background: "var(--color-bg-secondary)", borderRadius: 8, border: q.answer ? "1px solid var(--color-border)" : "2px solid var(--color-warning, #f59e0b)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)" }}>
                        {q.author} ({q.author_role === "parent" ? "부모" : "자녀"}) · {new Date(q.created_at).toLocaleDateString("ko-KR")}
                      </span>
                      <button
                        className="diag-btn diag-btn--sm"
                        style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                        onClick={() => { if (!confirm("이 질문을 삭제할까요?")) return; deleteQuestion(q.id); setQnaList(loadQuestions()); showToast({ type: "info", message: "질문 삭제됨" }); }}
                        aria-label="질문 삭제"
                      >🗑</button>
                    </div>
                    <div style={{ fontWeight: 600, marginBottom: 6, fontSize: "0.88rem" }}>Q. {q.question}</div>
                    {q.answer ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--color-success, #059669)", padding: "8px", background: "var(--color-success-bg, #d1fae5)", borderRadius: 6 }}>
                        A. {q.answer}
                      </div>
                    ) : (
                      <>
                        {answeringId === q.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <textarea
                              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid var(--color-border)", fontSize: "0.85rem", fontFamily: "var(--font-family)", minHeight: 60, resize: "vertical" }}
                              placeholder="답변을 입력하세요..."
                              value={answerText}
                              onChange={e => setAnswerText(e.target.value)}
                            />
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button className="diag-btn diag-btn--sm" onClick={() => { setAnsweringId(null); setAnswerText(""); }}>취소</button>
                              <button
                                className="diag-btn"
                                disabled={!answerText.trim()}
                                onClick={() => {
                                  const ok = answerQuestion(q.id, answerText);
                                  setAnsweringId(null);
                                  setAnswerText("");
                                  setQnaList(loadQuestions());
                                  showToast({ type: ok ? "success" : "error", message: ok ? "답변 등록 완료" : "답변 등록 실패" });
                                }}
                              >답변 등록</button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="diag-btn"
                            style={{ fontSize: "0.8rem" }}
                            onClick={() => { setAnsweringId(q.id); setAnswerText(""); }}
                          >✍️ 답변 달기</button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusRow({ item, label }) {
  if (!item) {
    return (
      <div className="diag-data-row">
        ❌ {label}: 없음
      </div>
    );
  }
  return (
    <div className="diag-data-row">
      {item.valid ? "✅" : "⚠️"} {label}: {item.valid ? "정상" : `손상 (${item.error})`}
      {item.valid && <span className="diag-detail"> ({item.size.toLocaleString("ko-KR")} bytes{item.itemCount !== undefined ? `, ${item.itemCount}개` : ""})</span>}
    </div>
  );
}
