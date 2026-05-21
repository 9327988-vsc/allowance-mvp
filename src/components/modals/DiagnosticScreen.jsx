// src/components/modals/DiagnosticScreen.jsx — S-112 진단 화면 (관리자 모드)
import { useState, useCallback, useMemo, useEffect } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { checkDataStatus, getSystemInfo, recoverFromBackup, discardBackup } from "../../utils/diagnostics";
import { getStorageUsage, listAllAppKeys, loadSettings } from "../../utils/storage";
import { getHolidays } from "../../utils/holidays";
import { showToast } from "../../utils/toastManager";
import { loadUserAccounts } from "../../utils/authStore";
import { loadFamilyContext } from "../../utils/familyContext";
import { loadQuestions, getUnansweredCount } from "../../utils/qna";
import { collectAllFamilies, collectFamilyClaims } from "../../utils/diagnosticHelpers";
import DiagAccountsSection from "../diagnostic/DiagAccountsSection";
import DiagClaimsSection from "../diagnostic/DiagClaimsSection";
import DiagStatsSection from "../diagnostic/DiagStatsSection";
import DiagSettingsSection from "../diagnostic/DiagSettingsSection";
import DiagLogsSection from "../diagnostic/DiagLogsSection";
import DiagQnaSection from "../diagnostic/DiagQnaSection";

export default function DiagnosticScreen({ onBack, onExport, onImport, onCategoryManage, onCleanup, onReset }) {
  // useModalBase: ESC handler + focus trap (전체 화면이므로 scroll lock 비활성화)
  const modalRef = useModalBase(onBack, { noScrollLock: true });

  // 전체 화면이므로 body 스크롤 허용 — CSS 클래스 토글 방식 (inline style 방식은 우선순위 문제로 3회 재발)
  useEffect(() => {
    document.body.classList.add("diagnostic-open");
    return () => {
      document.body.classList.remove("diagnostic-open");
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
          <DiagAccountsSection accounts={accounts} setAccounts={setAccounts} families={families} setFamilies={setFamilies} familyContext={familyContext} />
        )}
      </section>

      {/* ── 2. 청구 내역 전체 조회 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("claims")} aria-expanded={openSection === "claims"}>
          <span>📋 청구 내역 전체 조회</span>
          <span>{openSection === "claims" ? "▲" : "▼"}</span>
        </button>
        {openSection === "claims" && (
          <DiagClaimsSection allClaims={allClaims} claimFilter={claimFilter} setClaimFilter={setClaimFilter} />
        )}
      </section>

      {/* ── 3. 통계 대시보드 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("stats")} aria-expanded={openSection === "stats"}>
          <span>📈 통계 대시보드</span>
          <span>{openSection === "stats" ? "▲" : "▼"}</span>
        </button>
        {openSection === "stats" && (
          <DiagStatsSection allClaims={allClaims} />
        )}
      </section>

      {/* ── 4. 활동 로그 ── */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" onClick={() => toggleSection("logs")} aria-expanded={openSection === "logs"}>
          <span>📝 활동 로그</span>
          <span>{openSection === "logs" ? "▲" : "▼"}</span>
        </button>
        {openSection === "logs" && (
          <DiagLogsSection allClaims={allClaims} accounts={accounts} />
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
          <DiagSettingsSection editSettings={editSettings} setEditSettings={setEditSettings} settingsDirty={settingsDirty} setSettingsDirty={setSettingsDirty} />
        )}
      </section>

      {/* Q&A 관리 */}
      <section className="diag-section diag-section--collapsible">
        <button className="diag-section-toggle" aria-expanded={openSection === "qna"} onClick={() => { toggleSection("qna"); setQnaList(loadQuestions()); }}>
          <span>❓ Q&A 관리 {(() => { const c = getUnansweredCount(); return c > 0 ? `(미답변 ${c})` : ""; })()}</span>
          <span>{openSection === "qna" ? "▲" : "▼"}</span>
        </button>
        {openSection === "qna" && (
          <DiagQnaSection qnaList={qnaList} setQnaList={setQnaList} />
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
