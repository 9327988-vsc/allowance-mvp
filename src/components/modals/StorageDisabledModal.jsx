// src/components/modals/StorageDisabledModal.jsx — S-110 스토리지 비활성 안내
import { isStorageAvailable } from "../../utils/storage";
import { initApp } from "../../utils/initApp";
import { showToast } from "../../utils/toastManager";

export default function StorageDisabledModal({ onRecovered }) {
  // 닫기 정책: ❌ X / ❌ ESC / ❌ 외부 클릭 — 강제 표시

  function handleRetry() {
    if (isStorageAvailable()) {
      initApp().then(onRecovered).catch(() => {
        showToast({ type: "error", message: "초기화에 실패했습니다. 다시 시도해주세요.", duration: 4000 });
      });
    } else {
      showToast({ type: "warning", message: "여전히 사용 불가", duration: 4000 });
    }
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: "var(--z-modal-1)" }}>
      <div
        className="modal-content"
        style={{ maxWidth: 440, width: "90%" }}
        role="alertdialog"
        aria-modal="true"
        aria-describedby="storage-disabled-desc"
      >
        <h2 className="modal-title mb-3">⚠ 사용할 수 없는 환경입니다</h2>

        <div id="storage-disabled-desc">
          <p className="mb-3">
            이 앱은 데이터를 기기에 저장합니다.
            시크릿/프라이빗 브라우징 모드 또는 브라우저 설정으로
            저장 기능이 비활성화되어 사용할 수 없어요.
          </p>

          <div className="mb-4">
            <p className="font-medium mb-1">▸ 해결 방법</p>
            <ul className="text-sm" style={{ paddingLeft: "1.2em", listStyle: "disc" }}>
              <li>시크릿 모드 종료 후 일반 창으로 열기</li>
              <li>또는 브라우저 설정에서 &quot;사이트 데이터 허용&quot; 켜기</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleRetry}
            className="px-6 py-2 rounded-md text-white"
            style={{ background: "var(--color-primary)" }}
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>
  );
}
