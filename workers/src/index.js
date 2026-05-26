// workers/src/index.js — Cloudflare Workers 라우터

import { handleCors, withCorsHeaders } from "./middleware/cors.js";
import { withAuth } from "./middleware/auth.js";
import { jsonError, jsonResponse } from "./lib/errors.js";
import {
  handleFamiliesPost,
  handleGetFamilyByCode,
  handleJoinFamily,
  handleGetFamily,
  handlePatchMember,
  handleLeaveFamily,
} from "./routes/families.js";
import {
  handleSubmitClaim,
  handleListClaims,
  handleGetClaim,
  handlePatchClaim,
  handleReceiveClaim,
  handleAddComment,
  handleSubmitGrant,
  handleReceiveGrant,
} from "./routes/claims.js";
import { handleMigrateFromLocal } from "./routes/migrations.js";
import {
  handleRegister,
  handleLogin,
  handleRefresh,
  handleLogout,
  handleMe,
} from "./routes/auth.js";

export default {
  async fetch(request, env) {
    // CORS preflight
    const corsResponse = handleCors(request, env);
    if (corsResponse) return corsResponse;

    // 요청 크기 제한 (500KB)
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 512000) {
      return withCorsHeaders(
        jsonError({ status: 413, code: "PAYLOAD_TOO_LARGE", message: "요청 크기가 500KB를 초과합니다" }),
        request,
        env
      );
    }

    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method;

      let response;

      // --- 헬스체크 ---

      if (method === "GET" && path === "/api/health") {
        return withCorsHeaders(jsonResponse({
          status: "ok",
          version: "1.0.0",
          timestamp: new Date().toISOString(),
        }), request, env);
      }

      // --- 인증 라우트 (JWT) ---

      // POST /api/auth/register
      if (method === "POST" && path === "/api/auth/register") {
        response = await handleRegister(request, env);
        return withCorsHeaders(response, request, env);
      }

      // POST /api/auth/login
      if (method === "POST" && path === "/api/auth/login") {
        response = await handleLogin(request, env);
        return withCorsHeaders(response, request, env);
      }

      // POST /api/auth/refresh
      if (method === "POST" && path === "/api/auth/refresh") {
        response = await handleRefresh(request, env);
        return withCorsHeaders(response, request, env);
      }

      // POST /api/auth/logout
      if (method === "POST" && path === "/api/auth/logout") {
        response = await handleLogout(request, env);
        return withCorsHeaders(response, request, env);
      }

      // GET /api/auth/me
      if (method === "GET" && path === "/api/auth/me") {
        response = await handleMe(request, env);
        return withCorsHeaders(response, request, env);
      }

      // --- 인증 불필요 라우트 ---

      // POST /api/families
      if (method === "POST" && path === "/api/families") {
        response = await handleFamiliesPost(request, env);
        return withCorsHeaders(response, request, env);
      }

      // GET /api/families/by-code/:code
      const byCodeMatch = path.match(/^\/api\/families\/by-code\/([A-Z2-9]{6})$/);
      if (method === "GET" && byCodeMatch) {
        response = await handleGetFamilyByCode(request, env, byCodeMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // POST /api/families/:code/join
      const joinMatch = path.match(/^\/api\/families\/([A-Z2-9]{6})\/join$/);
      if (method === "POST" && joinMatch) {
        response = await handleJoinFamily(request, env, joinMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // --- 인증 필요 라우트 ---

      // GET /api/families/:fid
      const getFamilyMatch = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)$/);
      if (method === "GET" && getFamilyMatch) {
        const ctx = await withAuth(request, env);
        response = await handleGetFamily(env, ctx);
        return withCorsHeaders(response, request, env);
      }

      // PATCH /api/families/:fid/members/:mid
      const patchMemberMatch = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)\/members\/(mem_[a-f0-9-]+)$/);
      if (method === "PATCH" && patchMemberMatch) {
        const ctx = await withAuth(request, env);
        response = await handlePatchMember(request, env, ctx, patchMemberMatch[2]);
        return withCorsHeaders(response, request, env);
      }

      // DELETE /api/families/:fid/members/:mid
      const deleteMemberMatch = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)\/members\/(mem_[a-f0-9-]+)$/);
      if (method === "DELETE" && deleteMemberMatch) {
        const ctx = await withAuth(request, env);
        response = await handleLeaveFamily(env, ctx, deleteMemberMatch[2]);
        return withCorsHeaders(response, request, env);
      }

      // --- 청구 라우트 (인증 필요) ---

      // POST /api/claims
      if (method === "POST" && path === "/api/claims") {
        const ctx = await withAuth(request, env);
        response = await handleSubmitClaim(request, env, ctx);
        return withCorsHeaders(response, request, env);
      }

      // GET /api/families/:fid/claims
      const listClaimsMatch = path.match(/^\/api\/families\/(fam_[a-f0-9-]+)\/claims$/);
      if (method === "GET" && listClaimsMatch) {
        const ctx = await withAuth(request, env);
        response = await handleListClaims(env, ctx);
        return withCorsHeaders(response, request, env);
      }

      // GET /api/claims/:cid
      const getClaimMatch = path.match(/^\/api\/claims\/([a-zA-Z0-9_-]+)$/);
      if (method === "GET" && getClaimMatch) {
        const ctx = await withAuth(request, env);
        response = await handleGetClaim(env, ctx, getClaimMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // PATCH /api/claims/:cid
      const patchClaimMatch = path.match(/^\/api\/claims\/([a-zA-Z0-9_-]+)$/);
      if (method === "PATCH" && patchClaimMatch) {
        const ctx = await withAuth(request, env);
        response = await handlePatchClaim(request, env, ctx, patchClaimMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // PATCH /api/claims/:cid/receive
      const receiveMatch = path.match(/^\/api\/claims\/([a-zA-Z0-9_-]+)\/receive$/);
      if (method === "PATCH" && receiveMatch) {
        const ctx = await withAuth(request, env);
        response = await handleReceiveClaim(request, env, ctx, receiveMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // POST /api/claims/:cid/comments
      const commentMatch = path.match(/^\/api\/claims\/([a-zA-Z0-9_-]+)\/comments$/);
      if (method === "POST" && commentMatch) {
        const ctx = await withAuth(request, env);
        response = await handleAddComment(request, env, ctx, commentMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // --- 추가 지급(Grant) 라우트 (인증 필요) ---

      // POST /api/grants
      if (method === "POST" && path === "/api/grants") {
        const ctx = await withAuth(request, env);
        response = await handleSubmitGrant(request, env, ctx);
        return withCorsHeaders(response, request, env);
      }

      // PATCH /api/grants/:gid/receive
      const receiveGrantMatch = path.match(/^\/api\/grants\/([a-zA-Z0-9_-]+)\/receive$/);
      if (method === "PATCH" && receiveGrantMatch) {
        const ctx = await withAuth(request, env);
        response = await handleReceiveGrant(request, env, ctx, receiveGrantMatch[1]);
        return withCorsHeaders(response, request, env);
      }

      // --- 마이그레이션 라우트 ---

      // POST /api/migrations/from-local
      if (method === "POST" && path === "/api/migrations/from-local") {
        const ctx = await withAuth(request, env);
        response = await handleMigrateFromLocal(request, env, ctx);
        return withCorsHeaders(response, request, env);
      }

      return withCorsHeaders(jsonError({ status: 404, code: "NOT_FOUND", message: "Route not found" }), request, env);

    } catch (err) {
      return withCorsHeaders(jsonError(err), request, env);
    }
  },
};
