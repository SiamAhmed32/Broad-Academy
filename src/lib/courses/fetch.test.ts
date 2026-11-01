import assert from "node:assert/strict";
import { test } from "node:test";
import { buildGeneratedIncludes } from "./fetch";

test("buildGeneratedIncludes returns default bullet points when stats are all zero", () => {
  const stats = {
    lessonCount: 0,
    videoCount: 0,
    readingCount: 0,
    quizCount: 0,
    durationMinutes: 0,
    totalSeconds: 0,
  };
  const includes = buildGeneratedIncludes(stats);
  assert.deepEqual(includes, [
    "Teacher-guided academic support",
    "Mobile and desktop access",
    "Completion progress tracking",
  ]);
});

test("buildGeneratedIncludes singular counts when stats have 1 of each item", () => {
  const stats = {
    lessonCount: 1,
    videoCount: 1,
    readingCount: 1,
    quizCount: 1,
    durationMinutes: 45,
    totalSeconds: 2700,
  };
  const includes = buildGeneratedIncludes(stats);
  assert.ok(includes.includes("1 video lesson"));
  assert.ok(includes.includes("1 reading lesson"));
  assert.ok(includes.includes("1 quiz & assessments"));
  assert.ok(includes.includes("Downloadable practice resources"));
  assert.ok(includes.includes("Teacher-guided academic support"));
  assert.ok(includes.includes("Mobile and desktop access"));
  assert.ok(includes.includes("Completion progress tracking"));
  assert.equal(includes.length, 7);
});

test("buildGeneratedIncludes plural counts when stats have multiple items", () => {
  const stats = {
    lessonCount: 15,
    videoCount: 10,
    readingCount: 3,
    quizCount: 2,
    durationMinutes: 320,
    totalSeconds: 19200,
  };
  const includes = buildGeneratedIncludes(stats);
  assert.ok(includes.includes("10 video lessons"));
  assert.ok(includes.includes("3 reading lessons"));
  assert.ok(includes.includes("2 quizzes & assessments"));
  assert.ok(includes.includes("Downloadable practice resources"));
  assert.equal(includes.length, 7);
});
