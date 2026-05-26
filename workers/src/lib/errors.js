// workers/src/lib/errors.js — 에러 클래스 + JSON 응답 헬퍼

export class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 400;
  }
}

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 401;
  }
}

export class ConflictError extends Error {
  constructor(code = "CONFLICT", message = "Resource conflict") {
    super(message);
    this.code = code;
    this.status = 409;
  }
}

export class ForbiddenError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 403;
  }
}

export class NotFoundError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.status = 404;
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(err) {
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = status >= 500 ? "서버 내부 오류" : err.message;
  if (status >= 500) console.error("[ERROR]", err.code, err.message, err.stack);
  return new Response(
    JSON.stringify({ error: code, message }),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
