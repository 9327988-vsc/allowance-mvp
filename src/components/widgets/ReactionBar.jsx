// src/components/widgets/ReactionBar.jsx — 이모지 반응 (댓글 영역 내 +버튼)
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { getKVAdapter } from "../../utils/kvAdapter";
import { loadFamilyContext } from "../../utils/familyContext";
import { isOnline } from "../../utils/onlineStatus";
import { showToast } from "../../utils/toastManager";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "💰", "👏"];

export default function ReactionBar({ claimId, reactions, claimUpdatedAt, onReactionChanged }) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  // Family context is read once on mount; parent re-mounts this component if ctx changes
  const ctx = useMemo(() => loadFamilyContext(), []);

  // 외부 클릭 시 피커 닫기
  useEffect(() => {
    if (!showPicker) return;
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);
  const myMemberId = ctx?.member_id;

  // 반응 집계: { emoji: { count, hasMine } }
  const grouped = useMemo(() => {
    const map = {};
    (reactions || []).forEach(r => {
      if (!map[r.emoji]) map[r.emoji] = { count: 0, hasMine: false, members: [] };
      map[r.emoji].count++;
      map[r.emoji].members.push(r.member_display_name || r.member_id);
      if (r.member_id === myMemberId) map[r.emoji].hasMine = true;
    });
    return map;
  }, [reactions, myMemberId]);

  const toggleAction = useAsyncAction(useCallback(async (emoji) => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 반응을 남길 수 없어요" });
      return;
    }
    const adapter = getKVAdapter();
    await adapter.toggleReaction(claimId, {
      emoji,
      expected_updated_at: claimUpdatedAt,
    });
    onReactionChanged();
  }, [claimId, claimUpdatedAt, onReactionChanged]));

  function handleEmojiClick(emoji) {
    setShowPicker(false);
    toggleAction.run(emoji).catch(() => {
      showToast({ type: "error", message: "반응 처리에 실패했어요" });
    });
  }

  const sortedEmojis = Object.entries(grouped).sort((a, b) => b[1].count - a[1].count);

  return (
    <div className="reaction-bar">
      {/* 기존 반응 표시 */}
      {sortedEmojis.map(([emoji, data]) => (
        <button
          key={emoji}
          className={`reaction-chip${data.hasMine ? " reaction-chip--mine" : ""}`}
          onClick={() => handleEmojiClick(emoji)}
          title={data.members.join(", ")}
          disabled={toggleAction.loading}
        >
          <span className="reaction-chip__emoji">{emoji}</span>
          <span className="reaction-chip__count">{data.count}</span>
        </button>
      ))}

      {/* + 버튼 */}
      <div className="reaction-add-wrap" ref={pickerRef}>
        <button
          className="reaction-add-btn"
          onClick={() => setShowPicker(p => !p)}
          aria-label="반응 추가"
          title="반응 추가"
        >
          +
        </button>

        {showPicker && (
          <div className="reaction-picker">
            {REACTION_EMOJIS.map(em => (
              <button
                key={em}
                className="reaction-picker__btn"
                onClick={() => handleEmojiClick(em)}
              >
                {em}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
