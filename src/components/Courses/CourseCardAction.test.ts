import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getCachedSlugs,
  invalidateEnrolledCoursesCache,
  loadEnrolledSlugs,
} from "./CourseCardAction";

test("loadEnrolledSlugs deduplicates concurrent calls and caches results", async () => {
  invalidateEnrolledCoursesCache();
  assert.equal(getCachedSlugs(), null);

  let fetchCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request) => {
    fetchCount++;
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: { slugs: ["physics-101", "math-201"] },
      }),
    } as unknown as Response;
  }) as typeof fetch;

  try {
    // Fire two concurrent calls
    const [p1, p2] = await Promise.all([
      loadEnrolledSlugs(),
      loadEnrolledSlugs(),
    ]);

    assert.equal(fetchCount, 1, "Expected exactly 1 network fetch for concurrent calls");
    assert.ok(p1.has("physics-101"));
    assert.ok(p1.has("math-201"));
    assert.ok(!p1.has("biology-301"));
    assert.equal(p1, p2, "Both promises should resolve to identical Set reference");
    assert.ok(getCachedSlugs()?.has("physics-101"));

    // Fire a third call immediately after resolution
    const p3 = await loadEnrolledSlugs();
    assert.equal(fetchCount, 1, "Cached slugs should avoid secondary fetch");
    assert.ok(p3.has("math-201"));

    // Invalidate cache
    invalidateEnrolledCoursesCache();
    assert.equal(getCachedSlugs(), null);

    // Call after invalidation should trigger a new fetch
    const p4 = await loadEnrolledSlugs();
    assert.equal(fetchCount, 2, "Call after cache invalidation must trigger fresh fetch");
    assert.ok(p4.has("physics-101"));
  } finally {
    globalThis.fetch = originalFetch;
    invalidateEnrolledCoursesCache();
  }
});

test("loadEnrolledSlugs handles fetch rejection gracefully without poisoning cache", async () => {
  invalidateEnrolledCoursesCache();
  const originalFetch = globalThis.fetch;

  let attempt = 0;
  globalThis.fetch = (async () => {
    attempt++;
    if (attempt === 1) {
      throw new Error("Network down");
    }
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: { slugs: ["chemistry-101"] },
      }),
    } as unknown as Response;
  }) as typeof fetch;

  try {
    const fallback = await loadEnrolledSlugs();
    assert.equal(fallback.size, 0, "Failed request should return empty Set");

    // Next request should be able to retry because failed promise was cleared
    const recovered = await loadEnrolledSlugs();
    assert.ok(recovered.has("chemistry-101"), "Subsequent request should succeed on retry");
  } finally {
    globalThis.fetch = originalFetch;
    invalidateEnrolledCoursesCache();
  }
});

test("loadEnrolledSlugs handles non-200 HTTP responses without poisoning cached slugs", async () => {
  invalidateEnrolledCoursesCache();
  const originalFetch = globalThis.fetch;

  let attempt = 0;
  globalThis.fetch = (async () => {
    attempt++;
    if (attempt === 1) {
      return {
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      } as unknown as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { slugs: ["biology-101"] },
      }),
    } as unknown as Response;
  }) as typeof fetch;

  try {
    const fallback = await loadEnrolledSlugs();
    assert.equal(fallback.size, 0, "500 error should return empty fallback Set without caching");
    assert.equal(getCachedSlugs(), null, "Cached slugs must remain null after 500 error");

    // Next request should retry immediately and succeed
    const recovered = await loadEnrolledSlugs();
    assert.ok(recovered.has("biology-101"), "Subsequent request should fetch and populate cache");
    assert.ok(getCachedSlugs()?.has("biology-101"), "Cache should now hold recovered slugs");
  } finally {
    globalThis.fetch = originalFetch;
    invalidateEnrolledCoursesCache();
  }
});

