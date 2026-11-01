import assert from "node:assert/strict";
import { test } from "node:test";
import { sessionNextStep } from "./sessionPresentation";

test("confirmed requests without dates never claim to be scheduled", () => {
  assert.equal(sessionNextStep({ status: "CONFIRMED", paymentStatus: "PAID", scheduledAt: null, meetingLink: null }), "Confirmed. Our team will share your session time.");
});

test("a paid pending request is still awaiting confirmation", () => {
  assert.match(sessionNextStep({ status: "PENDING", paymentStatus: "PAID", scheduledAt: null, meetingLink: null }), /Awaiting session confirmation/);
});

test("completed or cancelled statuses take precedence over old payment states", () => {
  assert.match(sessionNextStep({ status: "COMPLETED", paymentStatus: "AWAITING_PAYMENT", scheduledAt: null, meetingLink: null }), /Session complete/);
  assert.equal(sessionNextStep({ status: "CANCELLED", paymentStatus: "AWAITING_PAYMENT", scheduledAt: null, meetingLink: null }), "This request was cancelled.");
});

test("the action prompt reflects whether payment is due or under review", () => {
  assert.match(sessionNextStep({ status: "PENDING", paymentStatus: "AWAITING_PAYMENT", scheduledAt: null, meetingLink: null }), /submit your payment proof/);
  assert.match(sessionNextStep({ status: "PENDING", paymentStatus: "PROOF_SUBMITTED", scheduledAt: null, meetingLink: null }), /Awaiting verification/);
});
