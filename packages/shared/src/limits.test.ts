import { BOTTLE_LIMITS, getMaxVintage } from "./index";

describe("BOTTLE_LIMITS", () => {
  it("limits text fields to 1-100 chars", () => {
    expect(BOTTLE_LIMITS.text).toEqual({ min: 1, max: 100 });
  });

  it("limits photoUrl to 2048 chars", () => {
    expect(BOTTLE_LIMITS.photoUrl.max).toBe(2048);
  });

  it("starts vintages at 1900", () => {
    expect(BOTTLE_LIMITS.vintage.min).toBe(1900);
  });
});

describe("getMaxVintage", () => {
  it("returns the UTC year of the given date", () => {
    expect(getMaxVintage(new Date("2026-06-15T12:00:00Z"))).toBe(2026);
  });

  it("uses UTC at the year boundary", () => {
    // 23:30 on Dec 31 at UTC-2 is already Jan 1 in UTC.
    expect(getMaxVintage(new Date("2026-12-31T23:30:00-02:00"))).toBe(2027);
  });

  it("defaults to the current UTC year", () => {
    expect(getMaxVintage()).toBe(new Date().getUTCFullYear());
  });
});
