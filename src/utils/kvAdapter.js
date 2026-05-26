// src/utils/kvAdapter.js — KV API 어댑터 (4.5)

import { getDeviceId } from "./deviceId";
import { loadFamilyContext } from "./familyContext";
import { isOnline, subscribeOnlineStatus } from "./onlineStatus";
import { cacheGet, cacheGetStale, cacheSet, enqueueOffline, replayQueue } from "./offlineStore";
import { showToast } from "./toastManager";
import { getAccessToken } from "./tokenManager";

class KVError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "KVError";
    this.code = code;
  }
}

const DEFAULT_TIMEOUT = 10000;

const ENDPOINT_TIMEOUTS = {
  getFamilyByCode: 5000,
  submitClaim: 15000,
  migrateFromLocal: 30000,
};

export class KVAdapter {
  /**
   * @param {{ baseUrl: string, familyCode?: string }} config
   */
  constructor(config) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this._familyCode = null;
    this._memberId = null;
  }

  get familyCode() {
    const ctx = loadFamilyContext();
    return ctx?.family_code || this._familyCode;
  }

  get memberId() {
    const ctx = loadFamilyContext();
    return ctx?.member_id || this._memberId;
  }

  setFamilyCode(code) {
    this._familyCode = code;
  }

  setMemberId(id) {
    this._memberId = id;
  }

  async _fetch(method, path, body, options) {
    const timeout = options.timeout ?? DEFAULT_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers = {
      "Content-Type": "application/json",
      "X-Device-Id": getDeviceId(),
    };

    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (this.familyCode) {
      headers["X-Family-Code"] = this.familyCode;
    }
    if (this.memberId) {
      headers["X-Member-Id"] = this.memberId;
    }

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data;
      try {
        data = await res.json();
      } catch {
        throw new KVError("NETWORK_ERROR", "응답 파싱 실패");
      }

      if (!res.ok) {
        throw new KVError(data.error || "INTERNAL_ERROR", data.message || "서버 오류");
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof KVError) throw err;
      if (err.name === "AbortError") {
        throw new KVError("TIMEOUT", "요청 시간 초과");
      }
      throw new KVError("NETWORK_ERROR", (err.name && err.message) ? `${err.name}: ${err.message}` : "네트워크 오류");
    }
  }

  _throwQueued(message) {
    const err = new KVError("QUEUED_OFFLINE", message);
    err.queued = true;
    return err;
  }

  async _request(method, path, body = null, options = {}) {
    // GET: 네트워크 우선, 실패 시 캐시 폴백
    if (method === "GET") {
      try {
        const data = await this._fetch(method, path, body, options);
        cacheSet(path, data).catch(() => {});
        return data;
      } catch (err) {
        const cached = await cacheGetStale(path);
        if (cached) return cached;
        throw err;
      }
    }

    // 쓰기: 오프라인이면 즉시 큐
    if (!isOnline()) {
      await enqueueOffline({ method, path, body });
      throw this._throwQueued("오프라인 — 연결 시 자동 전송됩니다");
    }

    // 온라인이지만 네트워크 실패 시에도 큐
    try {
      return await this._fetch(method, path, body, options);
    } catch (err) {
      if (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT") {
        try {
          await enqueueOffline({ method, path, body });
          throw this._throwQueued("네트워크 오류 — 연결 시 자동 전송됩니다");
        } catch (qErr) {
          if (qErr.code === "QUEUED_OFFLINE") throw qErr;
        }
      }
      throw err;
    }
  }

  // --- Family ---

  async createFamily({ creator_display_name, creator_role }) {
    return this._request("POST", "/api/families", {
      creator_display_name,
      creator_role,
    });
  }

  async getFamilyByCode(code) {
    return this._request("GET", `/api/families/by-code/${code}`, null, {
      timeout: ENDPOINT_TIMEOUTS.getFamilyByCode,
    });
  }

  async joinFamily({ family_code, display_name, role }) {
    return this._request("POST", `/api/families/${family_code}/join`, {
      display_name,
      role,
    });
  }

  async getFamily(familyId) {
    return this._request("GET", `/api/families/${familyId}`);
  }

  async patchMember(familyId, memberId, { display_name }) {
    return this._request("PATCH", `/api/families/${familyId}/members/${memberId}`, {
      display_name,
    });
  }

  async leaveFamily(familyId, memberId) {
    return this._request("DELETE", `/api/families/${familyId}/members/${memberId}`);
  }

  // --- Claims ---

  async submitClaim(claim) {
    return this._request("POST", "/api/claims", claim, {
      timeout: ENDPOINT_TIMEOUTS.submitClaim,
    });
  }

  async listClaims(familyId) {
    return this._request("GET", `/api/families/${familyId}/claims`);
  }

  async getClaim(claimId) {
    return this._request("GET", `/api/claims/${claimId}`);
  }

  async patchClaim(claimId, patch) {
    return this._request("PATCH", `/api/claims/${claimId}`, patch);
  }

  async receiveClaim(claimId, { expected_updated_at }) {
    return this._request("PATCH", `/api/claims/${claimId}/receive`, { expected_updated_at });
  }

  async addComment(claimId, comment) {
    return this._request("POST", `/api/claims/${claimId}/comments`, comment);
  }

  async toggleReaction(claimId, { emoji, expected_updated_at }) {
    return this._request("POST", `/api/claims/${claimId}/reactions`, { emoji, expected_updated_at });
  }

  // --- Grants (추가 지급) ---

  async submitGrant(grant) {
    return this._request("POST", "/api/grants", grant, {
      timeout: ENDPOINT_TIMEOUTS.submitClaim,
    });
  }

  async receiveGrant(grantId, { expected_updated_at }) {
    return this._request("PATCH", `/api/grants/${grantId}/receive`, { expected_updated_at });
  }

  // --- Migration ---

  async migrateFromLocal(data) {
    return this._request("POST", "/api/migrations/from-local", data, {
      timeout: ENDPOINT_TIMEOUTS.migrateFromLocal,
    });
  }
}

/**
 * KVAdapter 싱글턴 (앱 전역에서 사용)
 */
let _instance = null;

export function getKVAdapter() {
  if (!_instance) {
    const baseUrl = import.meta.env.VITE_API_BASE || "http://localhost:8787";
    _instance = new KVAdapter({ baseUrl });
  }
  return _instance;
}

export function resetKVAdapter() {
  _instance = null;
}

// 재접속 시 큐 replay
subscribeOnlineStatus((online) => {
  if (!online) return;
  const adapter = _instance;
  if (!adapter) return;
  replayQueue((method, path, body) =>
    adapter._fetch(method, path, body, {})
  ).then(({ success, failed }) => {
    if (success > 0) {
      showToast({ type: "success", message: `📤 대기 작업 ${success}건 전송 완료${failed > 0 ? ` (충돌 ${failed}건 건너뜀)` : ""}` });
    } else if (failed > 0) {
      showToast({ type: "warning", message: `⚠ 대기 작업 ${failed}건 충돌로 건너뜀` });
    }
  }).catch(() => {});
});
