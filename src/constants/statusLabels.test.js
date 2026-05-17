// src/constants/statusLabels.test.js
import { describe, it, expect } from "vitest";
import { STATUS_CONFIG, getStatusLabel, getStatusEmoji } from "./statusLabels";

describe("STATUS_CONFIG", () => {
  it("6개 상태 모두 정의되어 있다", () => {
    expect(STATUS_CONFIG.pending).toBeDefined();
    expect(STATUS_CONFIG.approved).toBeDefined();
    expect(STATUS_CONFIG.rejected).toBeDefined();
    expect(STATUS_CONFIG.paid).toBeDefined();
    expect(STATUS_CONFIG.granted).toBeDefined();
    expect(STATUS_CONFIG.received).toBeDefined();
  });

  it("각 상태에 label, emoji, color, bgColor가 있다", () => {
    for (const config of Object.values(STATUS_CONFIG)) {
      expect(config.label).toBeDefined();
      expect(config.emoji).toBeDefined();
      expect(config.color).toBeDefined();
      expect(config.bgColor).toBeDefined();
    }
  });
});

describe("getStatusLabel", () => {
  it("알려진 상태의 라벨을 반환한다", () => {
    expect(getStatusLabel("pending")).toBe("검토 대기 중");
    expect(getStatusLabel("paid")).toBe("지급 완료");
  });

  it("알 수 없는 상태는 원본을 반환한다", () => {
    expect(getStatusLabel("unknown")).toBe("unknown");
  });
});

describe("getStatusEmoji", () => {
  it("알려진 상태의 이모지를 반환한다", () => {
    expect(getStatusEmoji("pending")).toBe("🟡");
    expect(getStatusEmoji("rejected")).toBe("🔴");
  });

  it("알 수 없는 상태는 ⚪를 반환한다", () => {
    expect(getStatusEmoji("unknown")).toBe("⚪");
  });
});
