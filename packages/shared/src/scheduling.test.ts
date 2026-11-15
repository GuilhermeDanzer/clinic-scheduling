import { describe, expect, it } from "vitest";
import {
  clinicDayRange,
  clinicLocalToUtc,
  formatClinicDate,
  isAlignedSlot,
} from "./scheduling";
describe("clinic scheduling time", () => {
  it("interprets clinic time independently of browser timezone", () => {
    expect(clinicLocalToUtc("2030-01-01T09:30")).toBe(
      "2030-01-01T12:30:00.000Z",
    );
    expect(formatClinicDate("2030-01-01T12:30:00Z")).toBe("01/01/2030 09:30");
  });
  it("rejects unaligned minutes and fractional seconds", () => {
    expect(isAlignedSlot(new Date("2030-01-01T12:30:00Z"))).toBe(true);
    expect(isAlignedSlot(new Date("2030-01-01T12:15:00Z"))).toBe(false);
    expect(isAlignedSlot(new Date("2030-01-01T12:30:00.001Z"))).toBe(false);
  });
  it("handles month boundaries in clinic date filters", () => {
    expect(clinicDayRange("2030-01-31").lt.toISOString()).toBe(
      "2030-02-01T03:00:00.000Z",
    );
  });
});
