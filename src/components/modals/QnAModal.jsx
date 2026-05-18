// src/components/modals/QnAModal.jsx — Q&A 질문/답변 모달

import { useState, useEffect, useMemo, useRef } from "react";
import { useModalBase } from "../../hooks/useModalBase";
import { loadQuestions, loadAnsweredQuestions, addQuestion } from "../../utils/qna";

export default function QnAModal({ onClose, userName, userRole }) {
  const contentRef = useModalBase(onClose);
  const [questions, setQuestions] = useState(() => loadQuestions());
  const [tab, setTab] = useState("faq"); // "faq" | "ask" | "my"
  const [newQuestion, setNewQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submitTimerRef = useRef(null);


  // cleanup setTimeout on unmount (M-6)
  useEffect(() => {
    return () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); };
  }, []);

  // 데이터 갱신 함수 (M-4: 외부 변경 시에도 refresh 가능)
  function refreshQuestions() {
    setQuestions(loadQuestions());
  }

  // 모달 열릴 때 + 탭 전환 시 최신 데이터 로드 (M-4)
  useEffect(() => { refreshQuestions(); }, [tab]);

  function handleSubmit() {
    const trimmed = newQuestion.trim();
    if (!trimmed) return;
    if (trimmed.length > 500) return;
    const authorName = userName || "익명";
    addQuestion({ question: trimmed, author: authorName, author_role: userRole || "child" });
    setNewQuestion("");
    setSubmitted(true);
    refreshQuestions();
    // M-8: 이전 타이머 취소 후 새 타이머
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current);
    submitTimerRef.current = setTimeout(() => setSubmitted(false), 3000);
  }

  // FAQ 목록: DEFAULT_FAQ + 사용자 답변완료 질문
  // questions 상태가 변경될 때 재계산 (loadAnsweredQuestions도 localStorage 의존)
  const answeredList = useMemo(() => {
    void questions; // questions 변경 시 재계산 트리거
    return loadAnsweredQuestions();
  }, [questions]);

  // M-3: "내 질문" 필터 — userName과 "익명" fallback 모두 고려
  const effectiveAuthor = userName || "익명";
  const myQuestions = useMemo(
    () => questions.filter(q => q.author === effectiveAuthor),
    [questions, effectiveAuthor]
  );

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  }

  const tabs = ["faq", "ask", "my"];
  function handleTabKeyDown(e) {
    const idx = tabs.indexOf(tab);
    if (e.key === "ArrowRight") { e.preventDefault(); setTab(tabs[(idx + 1) % tabs.length]); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setTab(tabs[(idx - 1 + tabs.length) % tabs.length]); }
    else if (e.key === "Home") { e.preventDefault(); setTab(tabs[0]); }
    else if (e.key === "End") { e.preventDefault(); setTab(tabs[tabs.length - 1]); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={contentRef}
        className="modal-content"
        style={{ maxWidth: 440, width: "92%", padding: 0 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Q&A"
      >
        <div className="modal-header">
          <h2 className="modal-title">❓ Q&A</h2>
          <button onClick={onClose} className="modal-close" aria-label="닫기">×</button>
        </div>

        {/* 탭 */}
        <div className="qna-tabs" role="tablist">
          <button
            id="qna-tab-faq"
            role="tab"
            aria-selected={tab === "faq"}
            aria-controls="qna-panel-faq"
            tabIndex={tab === "faq" ? 0 : -1}
            className={`qna-tab${tab === "faq" ? " qna-tab--active" : ""}`}
            onClick={() => setTab("faq")}
            onKeyDown={handleTabKeyDown}
          >
            자주 묻는 질문
          </button>
          <button
            id="qna-tab-ask"
            role="tab"
            aria-selected={tab === "ask"}
            aria-controls="qna-panel-ask"
            tabIndex={tab === "ask" ? 0 : -1}
            className={`qna-tab${tab === "ask" ? " qna-tab--active" : ""}`}
            onClick={() => setTab("ask")}
            onKeyDown={handleTabKeyDown}
          >
            질문하기
          </button>
          <button
            id="qna-tab-my"
            role="tab"
            aria-selected={tab === "my"}
            aria-controls="qna-panel-my"
            tabIndex={tab === "my" ? 0 : -1}
            className={`qna-tab${tab === "my" ? " qna-tab--active" : ""}`}
            onClick={() => setTab("my")}
            onKeyDown={handleTabKeyDown}
          >
            내 질문
          </button>
        </div>

        <div className="modal-body" role="tabpanel" id={`qna-panel-${tab}`} aria-labelledby={`qna-tab-${tab}`} tabIndex={0} style={{ maxHeight: 400, overflowY: "auto", padding: "var(--space-4)" }}>
          {/* FAQ 탭 */}
          {tab === "faq" && (
            <>
              {answeredList.length === 0 ? (
                <div className="qna-empty">
                  <div className="qna-empty__icon">📭</div>
                  <p>아직 등록된 Q&A가 없어요</p>
                </div>
              ) : (
                <div className="qna-list">
                  {answeredList.map(q => (
                    <div key={q.id} className="qna-item">
                      <div className="qna-item__q">
                        <span className="qna-item__badge">Q</span>
                        <span>{q.question}</span>
                      </div>
                      <div className="qna-item__a">
                        <span className="qna-item__badge qna-item__badge--a">A</span>
                        <span>{q.answer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 질문하기 탭 */}
          {tab === "ask" && (
            <div className="qna-ask">
              <p className="qna-ask__desc">궁금한 점을 남겨주세요. 관리자가 확인 후 답변해드려요.</p>
              <textarea
                className="qna-ask__input"
                placeholder="질문을 입력하세요..."
                aria-label="질문 입력"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="qna-ask__footer">
                <span className="qna-ask__count">{newQuestion.length}/500</span>
                <button
                  className="btn btn--primary"
                  onClick={handleSubmit}
                  disabled={!newQuestion.trim()}
                >
                  질문 등록
                </button>
              </div>
              {submitted && (
                <div className="qna-ask__success">
                  ✅ 질문이 등록되었어요! 답변이 달리면 여기서 확인할 수 있어요.
                </div>
              )}
            </div>
          )}

          {/* 내 질문 탭 */}
          {tab === "my" && (
            <>
              {myQuestions.length === 0 ? (
                <div className="qna-empty">
                  <div className="qna-empty__icon">💬</div>
                  <p>아직 남긴 질문이 없어요</p>
                </div>
              ) : (
                <div className="qna-list">
                  {myQuestions.map(q => (
                    <div key={q.id} className="qna-item">
                      <div className="qna-item__q">
                        <span className="qna-item__badge">Q</span>
                        <span>{q.question}</span>
                      </div>
                      {q.answer ? (
                        <div className="qna-item__a">
                          <span className="qna-item__badge qna-item__badge--a">A</span>
                          <span>{q.answer}</span>
                        </div>
                      ) : (
                        <div className="qna-item__pending">
                          ⏳ 답변 대기 중 · {formatDate(q.created_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
