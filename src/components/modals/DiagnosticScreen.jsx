// src/components/modals/DiagnosticScreen.jsx — S-112 진단 화면 (관리자 모드)
import { useState, useCallback } from "react";
import { checkDataStatus, getSystemInfo, recoverFromBackup, discardBackup } from "../../utils/diagnostics";
import { getStorageUsage, listAllAppKeys } from "../../utils/storage";
import { getHolidays } from "../../utils/holidays";
import { showToast } from "../../utils/toastManager";

export default function DiagnosticScreen({ onBack, onExport, onImport, onCategoryManage, onCleanup, onReset }) {
  const [dataStatus, setDataStatus] = useState(() => checkDataStatus());
  const [systemInfo] = useState(() => getSystemInfo());
  const [storageUsage] = useState(() => getStorageUsage());

  const refreshDataStatus = useCallback(() => {
    setDataStatus(checkDataStatus());
  }, []);

  // BTN-A-007: 콘솔 로그 보기
  function handleConsoleLog() {
    const keys = listAllAppKeys();
    keys.forEach(k => {
      const raw = localStorage.getItem(k);
      try {
        console.log(`[${k}]`, JSON.parse(raw));
      } catch {
        console.log(`[${k}]`, raw);
      }
    });
    console.log("[systemInfo]", getSystemInfo());
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
    <div className="app-container diagnostic-screen">
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
                    {cal.valid && <span className="diag-detail"> ({cal.size.toLocaleString()} bytes{cal.itemCount !== undefined ? `, 임시항목 ${cal.itemCount}개` : ""})</span>}
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
                    try { console.log(`[${bk}]`, JSON.parse(raw)); } catch { console.log(`[${bk}]`, raw); }
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
          <button className="diag-btn" onClick={onExport}>📤 데이터 내보내기</button>
          <button className="diag-btn" onClick={onImport}>📥 데이터 가져오기</button>
          <button className="diag-btn" onClick={onCategoryManage}>🏷 카테고리 관리</button>
          <button className="diag-btn" onClick={onCleanup}>🧹 오래된 데이터 정리</button>
          <button className="diag-btn diag-btn--danger" onClick={onReset}>🗑 모든 데이터 초기화</button>
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
      {item.valid && <span className="diag-detail"> ({item.size.toLocaleString()} bytes{item.itemCount !== undefined ? `, ${item.itemCount}개` : ""})</span>}
    </div>
  );
}
