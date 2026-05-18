// src/components/widgets/EmptyState.jsx — 빈 상태 안내
export default function EmptyState({ onOpenSettings }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">📅</div>
      <h3 className="empty-state__title">아직 데이터가 없어요</h3>
      <p className="empty-state__desc">
        설정에서 기본 용돈, 학교/학원 일정을 입력하면<br />
        캘린더에 자동으로 금액이 표시됩니다
      </p>
      {onOpenSettings && (
        <button className="btn btn--primary empty-state__btn" onClick={onOpenSettings}>
          ⚙️ 설정하러 가기
        </button>
      )}
      <p className="empty-state__hint">
        💡 캘린더 날짜를 눌러 임시 항목을 추가할 수도 있어요
      </p>
    </div>
  );
}
