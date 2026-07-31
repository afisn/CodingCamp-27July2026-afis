/**
 * Tests for StorageModule
 *
 * Because Vitest runs in Node (no real browser), we replace the global
 * `localStorage` with a simple in-memory fake before each test and restore
 * it (or clear it) afterwards.
 *
 * The StorageModule source is loaded by reading js/app.js through a
 * CommonJS-compatible shim so the module's IIFE executes in the test
 * environment and we can access StorageModule directly.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import vm from "vm";

// ---------------------------------------------------------------------------
// Load StorageModule from js/app.js by executing it inside a vm context so
// we can inject our own `localStorage` substitute.
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const appJsSrc  = readFileSync(join(__dirname, "../js/app.js"), "utf8");

/**
 * Creates a fresh in-memory localStorage mock and a fresh vm context, then
 * executes app.js inside it.  Returns { StorageModule, mockStorage }.
 */
function createFreshEnv() {
  const store = {};
  let shouldThrow = false;
  let throwOnSet  = false;

  // Minimal in-memory localStorage mock
  const mockStorage = {
    _store: store,
    get length() { return Object.keys(store).length; },
    getItem(k)      { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v)   {
      if (shouldThrow || throwOnSet) {
        const err = new DOMException("QuotaExceededError", "QuotaExceededError");
        throw err;
      }
      store[k] = String(v);
    },
    removeItem(k)   { delete store[k]; },
    clear()         { Object.keys(store).forEach(k => delete store[k]); },
    // Test helpers
    simulateUnavailable() { shouldThrow = true; },
    simulateQuotaExceeded() { throwOnSet = true; },
    restore() { shouldThrow = false; throwOnSet = false; },
  };

  // Provide DOMException in the vm context (Node has it globally since v17)
  const context = vm.createContext({
    localStorage: mockStorage,
    DOMException,
    console,
  });

  vm.runInContext(appJsSrc, context);

  return { StorageModule: context.StorageModule, mockStorage };
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe("StorageModule.isAvailable()", () => {
  it("returns true when localStorage works normally", () => {
    const { StorageModule } = createFreshEnv();
    expect(StorageModule.isAvailable()).toBe(true);
  });

  it("returns false when localStorage throws on setItem", () => {
    const { StorageModule, mockStorage } = createFreshEnv();
    mockStorage.simulateUnavailable();
    expect(StorageModule.isAvailable()).toBe(false);
  });
});

describe("StorageModule.get()", () => {
  it("returns defaultValue when key is missing", () => {
    const { StorageModule } = createFreshEnv();
    expect(StorageModule.get("nonexistent", "fallback")).toBe("fallback");
  });

  it("returns defaultValue when stored value is malformed JSON", () => {
    const { StorageModule, mockStorage } = createFreshEnv();
    mockStorage._store["bad_json"] = "{not: valid json}";
    expect(StorageModule.get("bad_json", 42)).toBe(42);
  });

  it("returns the parsed value for a valid stored entry", () => {
    const { StorageModule } = createFreshEnv();
    StorageModule.set("mykey", { a: 1 });
    expect(StorageModule.get("mykey", null)).toEqual({ a: 1 });
  });

  it("returns null defaultValue (not undefined) when key is missing and default is null", () => {
    const { StorageModule } = createFreshEnv();
    expect(StorageModule.get("missing_key", null)).toBeNull();
  });
});

describe("StorageModule.set()", () => {
  it("silently catches QuotaExceededError and logs a warning", () => {
    const { StorageModule, mockStorage } = createFreshEnv();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    mockStorage.simulateQuotaExceeded();

    // Must not throw
    expect(() => StorageModule.set("key", "value")).not.toThrow();

    // Must have logged a warning
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("stores a value that is then retrievable with get()", () => {
    const { StorageModule } = createFreshEnv();
    StorageModule.set("name", "Alice");
    expect(StorageModule.get("name", null)).toBe("Alice");
  });
});

describe("StorageModule.remove()", () => {
  it("deletes the key so subsequent get() returns the default", () => {
    const { StorageModule } = createFreshEnv();
    StorageModule.set("temp", [1, 2, 3]);
    StorageModule.remove("temp");
    expect(StorageModule.get("temp", "default")).toBe("default");
  });

  it("is a no-op when the key does not exist (no throw)", () => {
    const { StorageModule } = createFreshEnv();
    expect(() => StorageModule.remove("nonexistent_key")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

/**
 * Feature: todo-life-dashboard, Property 12: Storage round-trip preserves data
 *
 * For any serializable value written with StorageModule.set(key, value),
 * a subsequent StorageModule.get(key, null) SHALL return a value deeply equal
 * to the original.
 *
 * Generator : fc.jsonValue()
 * Minimum iterations: 100
 *
 * Validates: Requirements 12.1, 12.2
 */
describe("Property 12: Storage round-trip preserves data", () => {
  it("get(key) deeply equals the value passed to set(key)", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),  // key
        fc.jsonValue(),                               // any JSON-serializable value
        (key, value) => {
          const { StorageModule } = createFreshEnv();
          StorageModule.set(key, value);
          const retrieved = StorageModule.get(key, null);
          expect(retrieved).toEqual(value);
        }
      ),
      { numRuns: 100 }
    );
  });
});
