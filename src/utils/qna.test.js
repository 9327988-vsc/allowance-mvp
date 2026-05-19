// src/utils/qna.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(() => ({ family_id: "fam_test1" })),
}));

vi.mock("./idGenerator", () => ({
  nanoid: vi.fn(() => "qna12345"),
}));

import {
  loadQuestions,
  loadAnsweredQuestions,
  getUnansweredCount,
  addQuestion,
  answerQuestion,
  deleteQuestion,
} from "./qna";
import { loadFamilyContext } from "./familyContext";

describe("qna.js", () => {
  const STORAGE_KEY = "qna_v1_f_fam_test1";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadQuestions", () => {
    it("저장된 질문이 없으면 빈 배열 반환", () => {
      expect(loadQuestions()).toEqual([]);
    });

    it("저장된 질문 정상 로드", () => {
      const data = [{ id: "q1", question: "테스트?" }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(loadQuestions()).toEqual(data);
    });

    it("손상된 JSON 시 빈 배열 반환", () => {
      localStorage.setItem(STORAGE_KEY, "broken{json}");
      expect(loadQuestions()).toEqual([]);
    });

    it("가족 컨텍스트 없으면 빈 배열 반환", () => {
      loadFamilyContext.mockReturnValueOnce(null);
      expect(loadQuestions()).toEqual([]);
    });
  });

  describe("loadAnsweredQuestions", () => {
    it("기본 FAQ 10개 포함", () => {
      const result = loadAnsweredQuestions();
      expect(result.length).toBeGreaterThanOrEqual(10);
      expect(result[0].id).toBe("faq_01");
    });

    it("사용자 답변 완료된 질문도 포함", () => {
      const answered = { id: "q1", question: "?", answer: "답변", answered_at: "2026-01-01" };
      const unanswered = { id: "q2", question: "?", answer: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([answered, unanswered]));

      const result = loadAnsweredQuestions();
      // 기본 FAQ + 사용자 답변 1개
      const userAnswered = result.filter(q => q.id === "q1");
      expect(userAnswered).toHaveLength(1);
      // 미답변은 포함되지 않음
      expect(result.find(q => q.id === "q2")).toBeUndefined();
    });
  });

  describe("getUnansweredCount", () => {
    it("미답변 질문 수 반환", () => {
      const data = [
        { id: "q1", answer: null },
        { id: "q2", answer: "답변" },
        { id: "q3", answer: null },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(getUnansweredCount()).toBe(2);
    });

    it("질문 없으면 0 반환", () => {
      expect(getUnansweredCount()).toBe(0);
    });
  });

  describe("addQuestion", () => {
    it("질문 정상 추가", () => {
      addQuestion({ question: "용돈은 언제?", author: "꼬마", author_role: "child" });
      const questions = loadQuestions();
      expect(questions).toHaveLength(1);
      expect(questions[0].question).toBe("용돈은 언제?");
      expect(questions[0].author).toBe("꼬마");
      expect(questions[0].author_role).toBe("child");
      expect(questions[0].answer).toBeNull();
      expect(questions[0].id).toMatch(/^qna_/);
    });

    it("null/undefined 질문은 무시", () => {
      addQuestion({ question: null });
      addQuestion({ question: undefined });
      expect(loadQuestions()).toEqual([]);
    });

    it("빈 문자열 질문은 무시", () => {
      addQuestion({ question: "" });
      addQuestion({ question: "   " });
      expect(loadQuestions()).toEqual([]);
    });

    it("숫자 등 비문자열 질문은 무시", () => {
      addQuestion({ question: 123 });
      expect(loadQuestions()).toEqual([]);
    });

    it("author 없으면 '익명' 기본값", () => {
      addQuestion({ question: "질문?" });
      const q = loadQuestions()[0];
      expect(q.author).toBe("익명");
      expect(q.author_role).toBe("child");
    });

    it("XSS 태그 제거", () => {
      addQuestion({
        question: '<script>alert("xss")</script>질문입니다',
        author: "테스터",
      });
      const q = loadQuestions()[0];
      expect(q.question).not.toContain("<script>");
      expect(q.question).toContain("질문입니다");
    });

    it("javascript: 프로토콜 제거", () => {
      addQuestion({ question: "javascript:alert(1) 내용" });
      const q = loadQuestions()[0];
      expect(q.question).not.toMatch(/javascript\s*:/i);
    });

    it("최대 100개 제한", () => {
      for (let i = 0; i < 105; i++) {
        addQuestion({ question: `질문 ${i}`, author: "t" });
      }
      const questions = loadQuestions();
      expect(questions.length).toBeLessThanOrEqual(100);
    });
  });

  describe("answerQuestion", () => {
    it("정상 답변 등록", () => {
      addQuestion({ question: "질문?", author: "자녀" });
      const qId = loadQuestions()[0].id;

      const result = answerQuestion(qId, "답변입니다");
      expect(result).toBe(true);

      const q = loadQuestions()[0];
      expect(q.answer).toBe("답변입니다");
      expect(q.answered_at).toBeTruthy();
    });

    it("존재하지 않는 ID → false 반환", () => {
      expect(answerQuestion("nonexistent", "답변")).toBe(false);
    });

    it("null/undefined 답변 → false 반환", () => {
      addQuestion({ question: "질문?" });
      const qId = loadQuestions()[0].id;
      expect(answerQuestion(qId, null)).toBe(false);
      expect(answerQuestion(qId, undefined)).toBe(false);
    });

    it("비문자열 답변 → false 반환", () => {
      addQuestion({ question: "질문?" });
      const qId = loadQuestions()[0].id;
      expect(answerQuestion(qId, 123)).toBe(false);
    });

    it("답변에서도 XSS 태그 제거", () => {
      addQuestion({ question: "질문?" });
      const qId = loadQuestions()[0].id;
      answerQuestion(qId, '<img onerror=alert(1)>답변');
      const q = loadQuestions()[0];
      expect(q.answer).not.toContain("<img");
      expect(q.answer).not.toMatch(/onerror/i);
    });
  });

  describe("deleteQuestion", () => {
    it("질문 삭제", () => {
      // 서로 다른 ID 생성을 위해 직접 localStorage에 데이터 세팅
      const data = [
        { id: "qna_aaa", question: "질문1", answer: null },
        { id: "qna_bbb", question: "질문2", answer: null },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(loadQuestions()).toHaveLength(2);

      deleteQuestion("qna_aaa");
      const remaining = loadQuestions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("qna_bbb");
    });

    it("존재하지 않는 ID 삭제 시 에러 없이 동작", () => {
      addQuestion({ question: "질문1" });
      deleteQuestion("nonexistent");
      expect(loadQuestions()).toHaveLength(1);
    });
  });
});
