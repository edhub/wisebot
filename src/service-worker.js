/// <reference types="@sveltejs/kit" />
import { build, files, version } from "$service-worker";

// 使用 version（构建哈希）命名缓存，避免用 Date.now() 导致每次都是新名字、旧缓存永不清理
const CACHE = `cache-${version}`;

const ASSETS = [
  ...build, // the app itself
  ...files, // everything in `static`
];

self.addEventListener("install", (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(
    Promise.all([
      deleteOldCaches(),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // API 请求始终走网络，不使用缓存
    if (url.pathname.startsWith('/api/')) {
      return fetch(event.request);
    }

    // 静态资源优先使用缓存，同时后台更新
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname);
      if (response) {
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(url.pathname, networkResponse);
            }
          })
          .catch(() => {/* 忽略更新错误 */});
        return response;
      }
    }

    try {
      const response = await fetch(event.request);

      if (!(response instanceof Response)) {
        throw new Error("无效的响应");
      }

      if (response.status === 200) {
        cache.put(event.request, response.clone());
      }

      return response;
    } catch (err) {
      const response = await cache.match(event.request);
      if (response) return response;
      throw err;
    }
  }

  event.respondWith(respond());
});
