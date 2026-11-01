import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBanglaTaka, toBanglaDigits } from "./content-format";

test("toBanglaDigits converts ASCII numbers to Bangla numerals", () => {
  assert.equal(toBanglaDigits("1234567890"), "১২৩৪৫৬৭৮৯০");
  assert.equal(toBanglaDigits("1,000"), "১,০০০");
});

test("formatBanglaTaka provides a readable gap between the Taka symbol and numbers", () => {
  const formatted = formatBanglaTaka(1000);
  assert.equal(formatted, "৳ ১,০০০");
  assert.ok(formatted.startsWith("৳ "));
});
