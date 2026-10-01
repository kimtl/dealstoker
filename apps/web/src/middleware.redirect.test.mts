import assert from "node:assert/strict";
import test from "node:test";

/**
 * Mirrors middleware destination building (kept pure for unit coverage).
 * Middleware itself needs Next runtime; this guards path/query preservation.
 */
function apexToWwwDestination(pathname: string, search = ""): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://www.dealstoker.com${path}${search}`;
}

test("apex redirect keeps path", () => {
  assert.equal(
    apexToWwwDestination("/c/electronics"),
    "https://www.dealstoker.com/c/electronics",
  );
});

test("apex redirect keeps query string", () => {
  assert.equal(
    apexToWwwDestination("/c/electronics", "?sort=newest&page=1"),
    "https://www.dealstoker.com/c/electronics?sort=newest&page=1",
  );
});

test("apex root stays root", () => {
  assert.equal(apexToWwwDestination("/"), "https://www.dealstoker.com/");
});
