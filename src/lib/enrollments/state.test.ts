import assert from "node:assert/strict";
import { test } from "node:test";
import { getCourseEnrollmentState } from "./state";
import type { AuthenticatedUser } from "@/lib/auth/session";

const dummyCourse = {
  id: "course-123",
  slug: "physics-101",
  title: "Physics 101",
  price: 2500,
};

test("getCourseEnrollmentState returns unauthenticated for null user", async () => {
  const result = await getCourseEnrollmentState({
    user: null,
    course: dummyCourse,
  });

  assert.deepEqual(result, {
    authenticated: false,
    state: null,
  });
});

test("getCourseEnrollmentState returns unauthenticated for non-student (ADMIN) user", async () => {
  const adminUser: AuthenticatedUser = {
    id: "admin-1",
    fullName: "Admin User",
    email: "admin@example.com",
    phone: "01700000000",
    role: "ADMIN",
    adminRole: "SUPER_ADMIN",
    permissions: ["all"],
    status: "ACTIVE",
    studentId: null,
    avatarUrl: null,
    classLevel: null,
  };

  const result = await getCourseEnrollmentState({
    user: adminUser,
    course: dummyCourse,
  });

  assert.deepEqual(result, {
    authenticated: false,
    state: null,
  });
});

test("getCourseEnrollmentState returns active access when student is enrolled", async () => {
  const studentUser: AuthenticatedUser = {
    id: "student-1",
    fullName: "Test Student",
    email: "student@example.com",
    phone: "01811111111",
    role: "STUDENT",
    adminRole: null,
    permissions: [],
    status: "ACTIVE",
    studentId: "STU-001",
    avatarUrl: null,
    classLevel: 10,
  };

  const result = await getCourseEnrollmentState({
    user: studentUser,
    course: dummyCourse,
    enrollment: { status: "ACTIVE" },
    enrollmentRequest: null,
  });

  assert.equal(result.authenticated, true);
  assert.ok(result.state);
  assert.equal(result.state.hasAccess, true);
  assert.equal(result.state.enrollmentStatus, "ACTIVE");
  assert.equal(result.state.request, null);
  assert.equal(result.state.profilePhone, "01811111111");
  assert.equal(result.state.profileClassLevel, 10);
});

test("getCourseEnrollmentState returns pending request when enrollment request is submitted", async () => {
  const studentUser: AuthenticatedUser = {
    id: "student-2",
    fullName: "Pending Student",
    email: "pending@example.com",
    phone: "01922222222",
    role: "STUDENT",
    adminRole: null,
    permissions: [],
    status: "ACTIVE",
    studentId: "STU-002",
    avatarUrl: null,
    classLevel: 11,
  };

  const submittedDate = new Date("2026-06-01T12:00:00.000Z");

  const result = await getCourseEnrollmentState({
    user: studentUser,
    course: dummyCourse,
    enrollment: null,
    enrollmentRequest: {
      id: "req-999",
      status: "PENDING",
      submittedAt: submittedDate,
      reviewNote: null,
    },
  });

  assert.equal(result.authenticated, true);
  assert.ok(result.state);
  assert.equal(result.state.hasAccess, false);
  assert.equal(result.state.enrollmentStatus, null);
  assert.equal(result.state.request?.id, "req-999");
  assert.equal(result.state.request?.status, "PENDING");
  assert.equal(result.state.request?.submittedAt, submittedDate.toISOString());
});

test("getCourseEnrollmentState returns unauthenticated for SUSPENDED student", async () => {
  const suspendedStudent: AuthenticatedUser = {
    id: "student-suspended",
    fullName: "Suspended Student",
    email: "suspended@example.com",
    phone: "01733333333",
    role: "STUDENT",
    adminRole: null,
    permissions: [],
    status: "SUSPENDED",
    studentId: "STU-003",
    avatarUrl: null,
    classLevel: 9,
  };

  const result = await getCourseEnrollmentState({
    user: suspendedStudent,
    course: dummyCourse,
    enrollment: { status: "ACTIVE" },
  });

  assert.deepEqual(result, {
    authenticated: false,
    state: null,
  });
});

test("getCourseEnrollmentState handles submittedAt passed as string without throwing", async () => {
  const studentUser: AuthenticatedUser = {
    id: "student-3",
    fullName: "String Date Student",
    email: "strdate@example.com",
    phone: "01944444444",
    role: "STUDENT",
    adminRole: null,
    permissions: [],
    status: "ACTIVE",
    studentId: "STU-004",
    avatarUrl: null,
    classLevel: 12,
  };

  const dateString = "2026-07-15T09:30:00.000Z";

  const result = await getCourseEnrollmentState({
    user: studentUser,
    course: dummyCourse,
    enrollment: null,
    enrollmentRequest: {
      id: "req-str",
      status: "REVIEWING",
      submittedAt: dateString,
      reviewNote: "Checking transaction",
    },
  });

  assert.equal(result.authenticated, true);
  assert.equal(result.state?.request?.submittedAt, dateString);
  assert.equal(result.state?.request?.status, "REVIEWING");
  assert.equal(result.state?.request?.reviewNote, "Checking transaction");
});

