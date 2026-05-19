// src/utils/kvAdapter.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// 의존 모듈 모킹
vi.mock("./deviceId", () => ({
  getDeviceId: () => "dev_mock123",
}));

vi.mock("./familyContext", () => ({
  loadFamilyContext: vi.fn(() => null),
}));

import { KVAdapter, getKVAdapter, resetKVAdapter } from "./kvAdapter";
import { loadFamilyContext } from "./familyContext";

describe("kvAdapter.js", () => {
  let adapter;

  beforeEach(() => {
    adapter = new KVAdapter({ baseUrl: "https://api.example.com/" });
    vi.spyOn(global, "fetch").mockImplementation(vi.fn());
    resetKVAdapter();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("trailing slash 제거", () => {
      expect(adapter.baseUrl).toBe("https://api.example.com");
    });

    it("trailing slash 없는 URL 그대로 유지", () => {
      const a = new KVAdapter({ baseUrl: "https://api.example.com" });
      expect(a.baseUrl).toBe("https://api.example.com");
    });
  });

  describe("familyCode / memberId getter", () => {
    it("familyContext가 없으면 내부 값 사용", () => {
      loadFamilyContext.mockReturnValue(null);
      adapter.setFamilyCode("FC123");
      adapter.setMemberId("M456");
      expect(adapter.familyCode).toBe("FC123");
      expect(adapter.memberId).toBe("M456");
    });

    it("familyContext가 있으면 context 값 우선", () => {
      loadFamilyContext.mockReturnValue({
        family_code: "CTX_CODE",
        member_id: "CTX_MEM",
      });
      adapter.setFamilyCode("FC123");
      expect(adapter.familyCode).toBe("CTX_CODE");
      expect(adapter.memberId).toBe("CTX_MEM");
    });
  });

  describe("_request", () => {
    it("정상 응답 시 JSON 데이터 반환", async () => {
      const mockData = { ok: true, data: "test" };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await adapter._request("GET", "/api/test");
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/test",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Device-Id": "dev_mock123",
          }),
        })
      );
    });

    it("POST 요청 시 body 직렬화", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await adapter._request("POST", "/api/test", { key: "value" });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ key: "value" }),
        })
      );
    });

    it("body가 null이면 body undefined", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await adapter._request("GET", "/api/test", null);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: undefined })
      );
    });

    it("서버 오류 응답(res.ok=false) 시 KVError 발생", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "NOT_FOUND", message: "찾을 수 없음" }),
      });

      await expect(adapter._request("GET", "/api/test")).rejects.toThrow("찾을 수 없음");
    });

    it("JSON 파싱 실패 시 NETWORK_ERROR 발생", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new SyntaxError("bad json"); },
      });

      await expect(adapter._request("GET", "/api/test")).rejects.toThrow("응답 파싱 실패");
    });

    it("타임아웃 시 TIMEOUT KVError 발생", async () => {
      global.fetch.mockImplementation(
        (_url, opts) => new Promise((_resolve, reject) => {
          opts.signal.addEventListener("abort", () => {
            const err = new DOMException("aborted", "AbortError");
            reject(err);
          });
        })
      );

      await expect(
        adapter._request("GET", "/api/test", null, { timeout: 1 })
      ).rejects.toThrow("요청 시간 초과");
    }, 5000);

    it("네트워크 오류 시 NETWORK_ERROR 발생", async () => {
      global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(adapter._request("GET", "/api/test")).rejects.toThrow(
        /TypeError.*Failed to fetch/
      );
    });

    it("familyCode 설정 시 X-Family-Code 헤더 포함", async () => {
      adapter.setFamilyCode("FAM_CODE");
      loadFamilyContext.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await adapter._request("GET", "/api/test");
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Family-Code": "FAM_CODE",
          }),
        })
      );
    });
  });

  describe("API 메서드", () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it("createFamily: POST /api/families", async () => {
      await adapter.createFamily({ creator_display_name: "부모", creator_role: "parent" });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/families",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("getFamilyByCode: GET /api/families/by-code/{code}", async () => {
      await adapter.getFamilyByCode("ABC123");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/families/by-code/ABC123",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("submitClaim: POST /api/claims", async () => {
      await adapter.submitClaim({ amount: 5000 });
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/claims",
        expect.objectContaining({ method: "POST" })
      );
    });

    it("leaveFamily: DELETE 요청", async () => {
      await adapter.leaveFamily("fam1", "mem1");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/api/families/fam1/members/mem1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("싱글턴", () => {
    it("getKVAdapter: 동일 인스턴스 반환", () => {
      const a = getKVAdapter();
      const b = getKVAdapter();
      expect(a).toBe(b);
    });

    it("resetKVAdapter 후 새 인스턴스 생성", () => {
      const a = getKVAdapter();
      resetKVAdapter();
      const b = getKVAdapter();
      expect(a).not.toBe(b);
    });
  });
});
