import { describe, expect, it } from "vitest";
import type { Service } from "@/types/service";
import {
  calculateTotalCents,
  formatGoaeText,
  formatServicesHtml,
  formatServicesText,
} from "@/lib/generate-text";

const services: Service[] = [
  { id: 1, title: "Service1", price_cents: 1000, category: "Kategorie1", color: "", goae: "100", sort_order: 0 },
  { id: 2, title: "Service2", price_cents: 2000, category: "Kategorie1", color: "", goae: "200", sort_order: 1 },
  { id: 3, title: "Service3", price_cents: 3000, category: "Kategorie2", color: "", goae: "", sort_order: 2 },
  { id: 4, title: "Service4", price_cents: 4000, category: "Kategorie2", color: "", goae: "400", sort_order: 3 },
];

describe("formatServicesText", () => {
  it("groups by category in selection order", () => {
    expect(formatServicesText(services, [1, 2, 4, 3])).toBe(
      "Kategorie1: Service1, Service2, Kategorie2: Service4, Service3",
    );
  });

  it("orders categories by first selection", () => {
    expect(formatServicesText(services, [4, 1, 3])).toBe(
      "Kategorie2: Service4, Service3, Kategorie1: Service1",
    );
  });

  it("uses Sonstiges for empty categories", () => {
    const uncategorized: Service[] = [
      { id: 5, title: "Ohne Kat", price_cents: 500, category: "", color: "", goae: "", sort_order: 0 },
    ];
    expect(formatServicesText(uncategorized, [5])).toBe("Sonstiges: Ohne Kat");
  });
});

describe("formatGoaeText", () => {
  it("joins GOAE codes in selection order", () => {
    expect(formatGoaeText(services, [1, 2, 4])).toBe("100-200-400");
  });

  it("skips empty GOAE values", () => {
    expect(formatGoaeText(services, [1, 3, 4])).toBe("100-400");
  });

  it("ignores unknown ids", () => {
    expect(formatGoaeText(services, [1, 99, 4])).toBe("100-400");
  });

  it("returns empty string for empty selection", () => {
    expect(formatGoaeText(services, [])).toBe("");
  });
});

describe("formatServicesHtml", () => {
  it("wraps category labels in strong tags", () => {
    expect(formatServicesHtml(services, [1, 2, 4, 3])).toBe(
      "<strong>Kategorie1:</strong> Service1, Service2, <strong>Kategorie2:</strong> Service4, Service3",
    );
  });
});

describe("calculateTotalCents", () => {
  it("sums selected service prices", () => {
    expect(calculateTotalCents(services, [1, 4])).toBe(5000);
  });
});