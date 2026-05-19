import { useState } from "react";
import { loadQuestions, answerQuestion, deleteQuestion } from "../../utils/qna";
import { showToast } from "../../utils/toastManager";

export default function DiagQnaSection({ qnaList, setQnaList }) {
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState("");

  if (qnaList.length === 0) {
    return <div className="diag-section-body"><p className="diag-empty">등록된 질문이 없습니다</p></div>;
  }

  return (
    <div className="diag-section-body">
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
    </div>
  );
}
