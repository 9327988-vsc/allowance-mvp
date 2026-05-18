// src/utils/qna.js — Q&A 질문/답변 관리 (localStorage 기반)

import { loadFamilyContext } from "./familyContext";
import { nanoid } from "./idGenerator";

function getQnaKey() {
  const familyId = loadFamilyContext()?.family_id;
  if (!familyId) return null;
  return "qna_v1_f_" + familyId;
}
const MAX_QUESTIONS = 100;

/** 기본 FAQ (항상 표시, 삭제 불가) */
const DEFAULT_FAQ = [
  {
    id: "faq_01",
    question: "용돈은 어떻게 청구하나요?",
    author: "관리자",
    author_role: "parent",
    answer: "마이탭 → 설정에서 기본 용돈, 편도 버스비, 버스 노선을 입력하면 캘린더에 자동 반영됩니다. 반영된 내용을 검토한 후 '청구하기' 버튼을 눌러 부모님께 제출하세요.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_02",
    question: "캘린더에 기록한 내용을 수정하거나 삭제할 수 있나요?",
    author: "관리자",
    author_role: "parent",
    answer: "네, 가능합니다. 캘린더에서 수정하고 싶은 날짜를 클릭하면 내용을 수정할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_03",
    question: "부모님이 청구를 거절하면 어떻게 되나요?",
    author: "관리자",
    author_role: "parent",
    answer: "부모님이 청구를 거절하면 자녀 계정 알림에 거절 알림이 표시됩니다. 부모님이 거절 사유를 입력한 경우 알림에서 함께 확인할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_04",
    question: "미션은 어떻게 완료하나요?",
    author: "관리자",
    author_role: "parent",
    answer: "부모님이 미션을 등록하면 자녀가 수행 후 미션 탭에서 '완료' 버튼을 누릅니다. 이후 부모님이 확인하면 보상이 지급됩니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_05",
    question: "자동 지급이 뭔가요?",
    author: "관리자",
    author_role: "parent",
    answer: "매주 정기적으로 지급되는 용돈입니다. 부모님이 금액과 주기를 설정할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_06",
    question: "알림은 어디서 확인하나요?",
    author: "관리자",
    author_role: "parent",
    answer: "자녀/부모 화면 공통으로 하단 탭바의 🔔 알림 버튼에서 확인할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_07",
    question: "가족 코드는 어디서 확인하나요?",
    author: "관리자",
    author_role: "parent",
    answer: "부모 계정 마이탭 상단 프로필 또는 '가족 정보' 메뉴에서 확인할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_08",
    question: "다른 기기에서도 사용할 수 있나요?",
    author: "관리자",
    author_role: "parent",
    answer: "같은 계정으로 로그인하면 다른 기기에서도 사용할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_09",
    question: "데이터가 갑자기 사라졌어요. 복구할 수 있나요?",
    author: "관리자",
    author_role: "parent",
    answer: "데이터는 실시간으로 저장되므로 정상적인 사용 중에는 사라지지 않습니다. 브라우저 데이터를 삭제한 경우 복구가 어려울 수 있으니 주의해주세요.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
  {
    id: "faq_10",
    question: "카테고리(등교, 학원 등)를 추가하거나 변경할 수 있나요?",
    author: "관리자",
    author_role: "parent",
    answer: "자녀 화면 마이탭 → 설정에서 카테고리를 추가하거나 변경할 수 있습니다.",
    answered_at: "2026-05-17T00:00:00.000Z",
    created_at: "2026-05-17T00:00:00.000Z",
  },
];

/**
 * 질문 데이터 구조:
 * {
 *   id: string,
 *   question: string,
 *   author: string,          // 질문자 이름
 *   author_role: "child"|"parent",
 *   answer: string|null,     // 관리자 답변
 *   answered_at: string|null,
 *   created_at: string (ISO8601),
 * }
 */

function loadAll() {
  const key = getQnaKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn("[QnA] load failed:", err);
    return [];
  }
}

function saveAll(items) {
  const key = getQnaKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_QUESTIONS)));
  } catch (err) {
    console.warn("[QnA] save failed:", err);
  }
}

/** 모든 Q&A 목록 (최신순) */
export function loadQuestions() {
  return loadAll();
}

/** 답변 완료된 것만 (사용자에게 보여줄 FAQ) — 기본 FAQ 포함 */
export function loadAnsweredQuestions() {
  const userAnswered = loadAll().filter(q => q.answer);
  return [...DEFAULT_FAQ, ...userAnswered];
}

/** 미답변 질문 수 */
export function getUnansweredCount() {
  return loadAll().filter(q => !q.answer).length;
}

/** XSS 방지용 텍스트 정제 */
function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<[^>]*>?/g, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/vbscript\s*:/gi, "")
    .trim();
}

/** 새 질문 등록 */
export function addQuestion({ question, author, author_role }) {
  if (!question || typeof question !== "string") return;
  const trimmed = question.trim();
  if (!trimmed) return;
  const sanitized = sanitizeText(trimmed);
  const items = loadAll();
  items.unshift({
    id: `qna_${nanoid(8)}`,
    question: sanitized,
    author: author || "익명",
    author_role: author_role || "child",
    answer: null,
    answered_at: null,
    created_at: new Date().toISOString(),
  });
  saveAll(items);
}

/** 관리자가 답변 달기 */
export function answerQuestion(questionId, answerText) {
  if (!answerText || typeof answerText !== "string") return false;
  const items = loadAll();
  const target = items.find(q => q.id === questionId);
  if (target) {
    target.answer = sanitizeText(answerText.trim());
    target.answered_at = new Date().toISOString();
    saveAll(items);
    return true;
  }
  return false;
}

/** 질문 삭제 */
export function deleteQuestion(questionId) {
  const items = loadAll().filter(q => q.id !== questionId);
  saveAll(items);
}
