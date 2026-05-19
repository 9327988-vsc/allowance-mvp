// src/utils/notifications.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("./authStore", () => ({
  getActiveUser: vi.fn(() => "user_test1"),
}));

vi.mock("./idGenerator", () => ({
  nanoid: vi.fn(() => "abcd1234"),
}));

import {
  loadNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  clearNotifications,
  addNotificationForUser,
} from "./notifications";
import { getActiveUser } from "./authStore";

describe("notifications.js", () => {
  const STORAGE_KEY = "notifications_v1_u_user_test1";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("loadNotifications", () => {
    it("저장된 알림이 없으면 빈 배열 반환", () => {
      expect(loadNotifications()).toEqual([]);
    });

    it("저장된 알림 정상 로드", () => {
      const data = [{ id: "n1", read: false }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(loadNotifications()).toEqual(data);
    });

    it("손상된 JSON 시 빈 배열 반환", () => {
      localStorage.setItem(STORAGE_KEY, "{invalid json}");
      expect(loadNotifications()).toEqual([]);
    });

    it("활성 유저가 없으면 빈 배열 반환", () => {
      getActiveUser.mockReturnValueOnce(null);
      expect(loadNotifications()).toEqual([]);
    });
  });

  describe("addNotification", () => {
    it("알림 추가 시 unshift로 최신이 먼저", () => {
      addNotification({ type: "info", title: "알림1", message: "내용1" });
      addNotification({ type: "info", title: "알림2", message: "내용2" });
      const notifs = loadNotifications();
      expect(notifs).toHaveLength(2);
      expect(notifs[0].title).toBe("알림2");
      expect(notifs[1].title).toBe("알림1");
    });

    it("기본 아이콘 매핑: claim_approved -> 체크마크", () => {
      addNotification({ type: "claim_approved", title: "승인", message: "승인됨" });
      const notifs = loadNotifications();
      expect(notifs[0].icon).toBe("✅");
    });

    it("type 없으면 기본 info 타입 + 벨 아이콘", () => {
      addNotification({ title: "일반", message: "일반 알림" });
      const notifs = loadNotifications();
      expect(notifs[0].type).toBe("info");
      expect(notifs[0].icon).toBe("🔔");
    });

    it("활성 유저가 없으면 저장하지 않음", () => {
      getActiveUser.mockReturnValue(null);
      addNotification({ type: "info", title: "테스트", message: "내용" });
      getActiveUser.mockReturnValue("user_test1");
      expect(loadNotifications()).toEqual([]);
    });

    it("최대 50개 제한", () => {
      for (let i = 0; i < 55; i++) {
        addNotification({ type: "info", title: `알림${i}`, message: "내용" });
      }
      const notifs = loadNotifications();
      expect(notifs.length).toBeLessThanOrEqual(50);
    });
  });

  describe("markAsRead", () => {
    it("특정 알림 읽음 처리", () => {
      addNotification({ type: "info", title: "알림", message: "내용" });
      const notifs = loadNotifications();
      const id = notifs[0].id;
      expect(notifs[0].read).toBe(false);

      markAsRead(id);
      const updated = loadNotifications();
      expect(updated[0].read).toBe(true);
    });

    it("존재하지 않는 ID는 무시", () => {
      addNotification({ type: "info", title: "알림", message: "내용" });
      markAsRead("nonexistent_id");
      const notifs = loadNotifications();
      expect(notifs[0].read).toBe(false);
    });

    it("활성 유저 없으면 아무 동작 없음", () => {
      getActiveUser.mockReturnValue(null);
      markAsRead("any_id"); // 에러 없이 종료
    });
  });

  describe("markAllAsRead", () => {
    it("모든 알림 읽음 처리", () => {
      addNotification({ type: "info", title: "알림1", message: "내용" });
      addNotification({ type: "info", title: "알림2", message: "내용" });
      expect(getUnreadCount()).toBe(2);

      markAllAsRead();
      expect(getUnreadCount()).toBe(0);
    });
  });

  describe("getUnreadCount", () => {
    it("읽지 않은 알림 개수 반환", () => {
      addNotification({ type: "info", title: "알림1", message: "내용" });
      addNotification({ type: "info", title: "알림2", message: "내용" });
      expect(getUnreadCount()).toBe(2);

      markAsRead(loadNotifications()[0].id);
      expect(getUnreadCount()).toBe(1);
    });

    it("활성 유저 없으면 0 반환", () => {
      getActiveUser.mockReturnValue(null);
      expect(getUnreadCount()).toBe(0);
    });
  });

  describe("clearNotifications", () => {
    it("모든 알림 삭제", () => {
      addNotification({ type: "info", title: "알림", message: "내용" });
      expect(loadNotifications()).toHaveLength(1);

      clearNotifications();
      expect(loadNotifications()).toEqual([]);
    });
  });

  describe("addNotificationForUser", () => {
    it("특정 유저에게 알림 추가", () => {
      const userId = "user_other";
      addNotificationForUser(userId, {
        type: "grant_received",
        title: "추가 지급",
        message: "5000원",
      });

      const raw = localStorage.getItem("notifications_v1_u_user_other");
      const notifs = JSON.parse(raw);
      expect(notifs).toHaveLength(1);
      expect(notifs[0].type).toBe("grant_received");
      expect(notifs[0].icon).toBe("💝");
      expect(notifs[0].read).toBe(false);
    });

    it("userId가 없으면 무시", () => {
      addNotificationForUser(null, { type: "info", title: "t", message: "m" });
      addNotificationForUser(undefined, { type: "info", title: "t", message: "m" });
      // 에러 없이 종료 확인
    });

    it("기존 데이터가 손상된 경우 빈 배열로 시작", () => {
      localStorage.setItem("notifications_v1_u_user_x", "not-valid-json");
      addNotificationForUser("user_x", {
        type: "info",
        title: "t",
        message: "m",
      });
      const raw = localStorage.getItem("notifications_v1_u_user_x");
      const notifs = JSON.parse(raw);
      expect(notifs).toHaveLength(1);
    });

    it("최대 50개 제한", () => {
      const key = "notifications_v1_u_user_limit";
      const existing = Array.from({ length: 55 }, (_, i) => ({
        id: `n${i}`,
        type: "info",
        read: false,
      }));
      localStorage.setItem(key, JSON.stringify(existing));

      addNotificationForUser("user_limit", {
        type: "info",
        title: "new",
        message: "new",
      });
      const result = JSON.parse(localStorage.getItem(key));
      expect(result.length).toBeLessThanOrEqual(50);
    });
  });
});
