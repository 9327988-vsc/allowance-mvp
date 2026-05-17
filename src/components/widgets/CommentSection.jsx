// src/components/widgets/CommentSection.jsx — 댓글 목록 + 입력란
import { useState, useCallback, useRef, useMemo } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useToast } from "../../hooks/useToast";
import { getKVAdapter } from "../../utils/kvAdapter";
import { generateCommentId } from "../../utils/idGenerator";
import { loadFamilyContext } from "../../utils/familyContext";
import { isOnline } from "../../utils/onlineStatus";
import { getMessageForError } from "../../constants/errorMessages";
import ReactionBar from "./ReactionBar";


const MAX_COMMENT_LENGTH = 200;

/**
 * @param {{
 *   claimId: string,
 *   comments: Array,
 *   reactions: Array,
 *   claimUpdatedAt: string,
 *   onCommentAdded: () => void
 * }} props
 */
export default function CommentSection({ claimId, comments, reactions, claimUpdatedAt, onCommentAdded }) {
  const [text, setText] = useState("");
  const textRef = useRef(text);
  textRef.current = text;
  const { showToast } = useToast();
  const ctx = useMemo(() => loadFamilyContext(), []);

  const addAction = useAsyncAction(useCallback(async () => {
    if (!isOnline()) {
      showToast({ type: "error", message: "오프라인 상태에서는 댓글을 남길 수 없어요" });
      return;
    }

    const trimmed = textRef.current.trim();
    if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH) return;

    const adapter = getKVAdapter();
    await adapter.addComment(claimId, {
      comment_id: generateCommentId(),
      text: trimmed,
      expected_updated_at: claimUpdatedAt,
    });

    setText("");
    onCommentAdded();
  }, [claimId, claimUpdatedAt, showToast, onCommentAdded]));

  function handleSubmit(e) {
    e.preventDefault();
    addAction.run().catch((err) => {
      showToast({ type: "error", message: getMessageForError(err) });
    });
  }

  const trimmed = text.trim();
  const canSubmit = trimmed.length >= 1 && trimmed.length <= MAX_COMMENT_LENGTH && !addAction.loading;

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">
        💬 댓글 ({(comments || []).length})
      </h3>

      {/* 댓글 목록 */}
      {comments && comments.length > 0 && (
        <div className="comment-list">
          {comments.map((c) => {
            const isMine = c.author_member_id === ctx?.member_id;
            return (
              <div
                key={c.comment_id}
                className={`comment-bubble${isMine ? " comment-bubble--mine" : ""}`}
              >
                <div className="comment-bubble__header">
                  <span className="comment-bubble__author">
                    {c.author_display_name}
                  </span>
                  <span className="comment-bubble__date">
                    {new Date(c.created_at).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="comment-bubble__text">{c.text}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 반응 바 */}
      <ReactionBar
        claimId={claimId}
        reactions={reactions}
        claimUpdatedAt={claimUpdatedAt}
        onReactionChanged={onCommentAdded}
      />

      {/* 입력란 */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-form__input-wrap">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="댓글을 입력하세요"
            disabled={addAction.loading}
            rows={2}
            className="comment-form__textarea"
            aria-label="댓글 입력"
          />
          <div className={`comment-form__count${trimmed.length > MAX_COMMENT_LENGTH ? " comment-form__count--over" : ""}`}>
            {trimmed.length}/{MAX_COMMENT_LENGTH}
          </div>
        </div>
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn--primary"
          style={{ padding: "var(--space-2) var(--space-4)", fontSize: "var(--font-size-sm)", whiteSpace: "nowrap" }}
        >
          {addAction.loading ? "..." : "전송"}
        </button>
      </form>
    </div>
  );
}
