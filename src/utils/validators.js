// src/utils/validators.js

export function validateSettings(form) {
  const errors = {};

  if (form.child_name && form.child_name.length > 20) {
    errors.child_name = "20자 이내로 입력해주세요";
  }

  if (!Number.isInteger(form.base_allowance)) {
    errors.base_allowance = "정수로 입력해주세요";
  } else if (form.base_allowance < 0) {
    errors.base_allowance = "0원 이상 입력해주세요";
  } else if (form.base_allowance > 1000000) {
    errors.base_allowance = "1,000,000원 이하로 입력해주세요";
  }

  // 학교 단가 (조건부)
  if (form.school.days.length === 0) {
    if (form.school.fare !== 0 && !Number.isInteger(form.school.fare)) {
      errors["school.fare"] = "정수로 입력해주세요";
    }
  } else {
    if (!Number.isInteger(form.school.fare) || form.school.fare < 1) {
      errors["school.fare"] = "학교 단가를 1원 이상 입력해주세요";
    } else if (form.school.fare > 100000) {
      errors["school.fare"] = "100,000원 이하로 입력해주세요";
    }
  }

  // 학원 단가 (동일 조건부)
  if (form.academy.days.length === 0) {
    if (form.academy.fare !== 0 && !Number.isInteger(form.academy.fare)) {
      errors["academy.fare"] = "정수로 입력해주세요";
    }
  } else {
    if (!Number.isInteger(form.academy.fare) || form.academy.fare < 1) {
      errors["academy.fare"] = "학원 단가를 1원 이상 입력해주세요";
    } else if (form.academy.fare > 100000) {
      errors["academy.fare"] = "100,000원 이하로 입력해주세요";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateExtraItem(input) {
  const errors = {};

  if (!input.category || input.category.trim() === "") {
    errors.category = "카테고리를 선택해주세요";
  }

  if (!input.name || input.name.trim() === "") {
    errors.name = "이름을 입력해주세요";
  } else if (input.name.length > 50) {
    errors.name = "50자 이내로 입력해주세요";
  }

  if (!Number.isInteger(input.amount) || input.amount < 1) {
    errors.amount = "금액을 1원 이상 입력해주세요";
  } else if (input.amount > 10000000) {
    errors.amount = "10,000,000원 이하로 입력해주세요";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateMemo(memo) {
  const errors = {};
  if (memo.length > 200) {
    errors.memo = "200자 이내로 입력해주세요";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateCustomCategory(input, existingCategories = []) {
  const errors = {};

  if (!input.name || input.name.trim() === "") {
    errors.name = "카테고리 이름을 입력해주세요";
  } else if (input.name.length > 20) {
    errors.name = "20자 이내로 입력해주세요";
  } else if (existingCategories.some(c => c.name === input.name.trim())) {
    errors.name = "이미 존재하는 카테고리입니다";
  }

  if (!input.icon || input.icon.trim() === "") {
    errors.icon = "아이콘을 선택해주세요";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
