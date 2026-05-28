// sw.js — 서비스워커 (오프라인 캐시 + 앱 셸)
const CACHE_NAME = "allowance-v9.8";
const APP_SHELL = [
  "/allowance-mvp/",
  "/allowance-mvp/index.html",
  "/allowance-mvp/manifest.json",
  "/allowance-mvp/icons/icon-192.svg",
  "/allowance-mvp/icons/icon-512.svg",
];

// 설치: 앱 셸 캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// 활성화: 이전 캐시 제거
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 요청 처리: 네트워크 우선, 실패 시 캐시
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // API 호출은 캐시하지 않음
  if (request.url.includes("/api/")) return;

  // GET 요청만 캐시
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 유효한 응답만 캐시에 저장 (opaque/redirect/error 응답 제외)
        if (response.ok && response.type === "basic" && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // 오프라인: 캐시에서 제공
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // HTML 요청이면 앱 셸 반환
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/allowance-mvp/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
