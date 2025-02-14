/// <reference types="@sveltejs/kit" />
import { build, files, version } from "$service-worker";

// 创建一个唯一的缓存名称，使用时间戳确保每次部署都是唯一的
const CACHE = `cache-${version}-${Date.now()}`;

const ASSETS = [
  ...build, // the app itself
  ...files, // everything in `static`
];

self.addEventListener("install", (event) => {
  // 创建新缓存并添加所有文件
  async function addFilesToCache() {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
  // 立即激活新的 Service Worker
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // 删除旧缓存
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(
    Promise.all([
      deleteOldCaches(),
      // 立即接管所有页面
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", (event) => {
  // 忽略非 GET 请求
  if (event.request.method !== "GET") return;

  async function respond() {
    const url = new URL(event.request.url);
    const cache = await caches.open(CACHE);

    // 检查是否是 API 请求
    if (url.pathname.startsWith('/api/')) {
      // API 请求始终走网络，不使用缓存
      return fetch(event.request);
    }

    // 静态资源优先使用缓存
    if (ASSETS.includes(url.pathname)) {
      const response = await cache.match(url.pathname);
      if (response) {
        // 在后台更新缓存
        fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(url.pathname, networkResponse);
            }
          })
          .catch(() => {/* 忽略错误 */});
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

      if (response) {
        return response;
      }

      throw err;
    }
  }

  event.respondWith(respond());
});
