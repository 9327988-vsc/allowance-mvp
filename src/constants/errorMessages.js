// src/constants/errorMessages.js — 에러 메시지 SSoT (4.17, v2.1 HI-23)

export const ERROR_MESSAGES = {
  // 네트워크 / 시스템
  NETWORK_ERROR: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
  TIMEOUT: "응답 시간 초과. 잠시 후 다시 시도해 주세요.",
  RATE_LIMITED: "잠시 후 다시 시도해 주세요.",
  STORAGE_DISABLED: "저장소를 사용할 수 없어요. 브라우저 설정을 확인해 주세요.",
  INTERNAL_ERROR: "오류가 발생했어요. 관리자에게 문의해 주세요.",

  // 인증
  MISSING_DEVICE_ID: "기기 정보를 찾을 수 없습니다. 브라우저 데이터가 초기화되었을 수 있습니다.",
  MISSING_FAMILY_CODE: "가족 코드 인증 오류. 가족에 다시 가입해 주세요.",
  MEMBER_NOT_FOUND: "이 가족에 가입되어 있지 않아요. 가족에 다시 가입해 주세요.",
  FAMILY_DATA_CORRUPTED: "가족 정보를 불러올 수 없어요. 관리자에게 문의해 주세요.",
  FAMILY_MISMATCH: "권한이 없어요.",

  // 입력 검증
  VALIDATION_REQUIRED: "필수 입력 항목이에요.",
  FAMILY_CODE_INVALID: "가족 코드는 6자 (I/O/0/1 제외) 영숫자입니다.",
  INVALID_DISPLAY_NAME: "이름은 1~20자로 입력해 주세요.",
  INVALID_ROLE: "역할을 선택해 주세요.",
  INVALID_REJECTION_REASON: "거절 사유는 1~200자로 입력해 주세요.",
  INVALID_COMMENT_TEXT: "댓글은 1~200자로 입력해 주세요.",
  MISSING_FIELD: "필수 입력 항목이 누락되었어요.",
  VALIDATION_ERROR: "입력값이 올바르지 않아요.",
  EMPTY_CLAIM: "청구할 항목이 없어요.",

  // 가족
  FAMILY_NOT_FOUND: "가족 코드를 찾을 수 없어요.",
  FAMILY_FULL: "가족 인원이 가득 찼어요 (2단계는 4명까지).",
  CHILD_ALREADY_EXISTS: "이 가족에는 이미 자녀가 등록되어 있어요.",
  FAMILY_CODE_GENERATION_FAILED: "가족 코드 발급 실패. 잠시 후 다시 시도해 주세요.",
  CAN_ONLY_EDIT_SELF: "본인 정보만 수정할 수 있어요.",
  CAN_ONLY_LEAVE_SELF: "본인만 가족을 탈퇴할 수 있어요.",

  // 청구
  DUPLICATE_CLAIM: "이미 검토 중인 청구가 있어요.",
  DUPLICATE_CLAIM_ID: "이미 존재하는 청구 ID입니다.",
  INVALID_IS_EXTRA: "추가 청구 여부가 올바르지 않아요.",
  CONFLICT: "이미 처리된 청구입니다.",
  INVALID_STATUS: "청구 상태가 변경되었어요.",
  INVALID_TRANSITION: "현재 상태에서 불가능한 작업이에요.",
  CLAIM_NOT_FOUND: "청구를 찾을 수 없어요.",
  PARENT_ONLY: "부모만 가능한 작업이에요.",
  PARENT_CANNOT_SUBMIT: "부모는 청구를 제출할 수 없어요.",
  CHILD_ONLY: "자녀만 가능한 작업이에요.",
  ALREADY_RECEIVED: "이미 수령 확인된 청구예요.",
  NOT_OWNER: "본인의 청구만 수령 확인할 수 있어요.",

  // 마이그레이션
  MIGRATION_REQUIRED: "자녀 정보를 먼저 설정해 주세요.",
  MISSING_MIGRATION_ID: "마이그레이션 식별자 누락. 새로고침 후 다시 시도해 주세요.",
  ALREADY_MIGRATED: "이미 마이그레이션이 완료된 멤버예요.",
  MIGRATION_FAILED: "데이터 가져오기 실패. 다시 시도하거나 건너뛸 수 있어요.",
};

/**
 * 에러 코드 → 한국어 메시지
 */
export function getErrorMessage(code, fallback) {
  return ERROR_MESSAGES[code] || fallback || `오류 (${code})`;
}

/**
 * Error 객체 → 한국어 메시지
 */
export function getMessageForError(err) {
  if (err && err.code) {
    return getErrorMessage(err.code, err.message);
  }
  return ERROR_MESSAGES.INTERNAL_ERROR;
}
