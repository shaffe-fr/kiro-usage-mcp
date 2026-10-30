import assert from "node:assert/strict";
import { test } from "node:test";
import { parseUsage } from "./parse.js";

const SAMPLE = `Estimated Usage | resets on 2026-11-01 | KIRO POWER
Credits (7472.63 of 10000 covered in plan), 74.7%
Additional credits:
  Add-on credits available for purchase
Manage your plan or purchase add-on credits at https://app.kiro.dev/account/usage
`;

test("parses plan, reset date and credits", () => {
  assert.deepEqual(parseUsage(SAMPLE), {
    plan: "KIRO POWER",
    resetsOn: "2026-11-01",
    creditsUsed: 7472.63,
    creditsTotal: 10000,
    creditsRemaining: 2527.37,
    percentUsed: 74.7,
    addOnCreditsAvailableForPurchase: true,
  });
});

test("ignores ANSI escape sequences", () => {
  const colored = SAMPLE.replace("KIRO POWER", "\u001B[1mKIRO POWER\u001B[0m");
  assert.equal(parseUsage(colored).plan, "KIRO POWER");
});

test("rejects unexpected output", () => {
  assert.throws(() => parseUsage("Please log in"), /Unrecognised/);
});
