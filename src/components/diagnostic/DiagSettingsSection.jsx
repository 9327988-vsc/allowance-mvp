import { loadSettings, saveSettings } from "../../utils/storage";
import { showToast } from "../../utils/toastManager";

export default function DiagSettingsSection({ editSettings, setEditSettings, settingsDirty, setSettingsDirty }) {
  return (
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
  );
}
