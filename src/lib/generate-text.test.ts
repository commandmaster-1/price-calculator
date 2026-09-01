import { describe, expect, it } from "vitest";
import type { Service } from "@/types/service";
import {
  calculateTotalCents,
  formatGoaeText,
  formatParameterText,
  formatServicesHtml,
  formatServicesText,
} from "@/lib/generate-text";

const services: Service[] = [
  {
    id: 1,
    title: "Service1",
    price_cents: 1000,
    category: "Kategorie1",
    color: "",
    goae_items: [{ id: 10, number: "100", parameter: "Param1", price_cents: 1000, sort_order: 0 }],
    sort_order: 0,
  },
  {
    id: 2,
    title: "Service2",
    price_cents: 2000,
    category: "Kategorie1",
    color: "",
    goae_items: [{ id: 20, number: "200", parameter: "Param2", price_cents: 2000, sort_order: 0 }],
    sort_order: 1,
  },
  {
    id: 3,
    title: "Service3",
    price_cents: 3000,
    category: "Kategorie2",
    color: "",
    goae_items: [],
    sort_order: 2,
  },
  {
    id: 4,
    title: "Service4",
    price_cents: 4000,
    category: "Kategorie2",
    color: "",
    goae_items: [
      { id: 40, number: "400", parameter: "Param4a", price_cents: 2500, sort_order: 0 },
      { id: 41, number: "401", parameter: "Param4b", price_cents: 1500, sort_order: 1 },
    ],
    sort_order: 3,
  },
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
      {
        id: 5,
        title: "Ohne Kat",
        price_cents: 500,
        category: "",
        color: "",
        goae_items: [],
        sort_order: 0,
      },
    ];
    expect(formatServicesText(uncategorized, [5])).toBe("Sonstiges: Ohne Kat");
  });
});

describe("formatGoaeText", () => {
  it("joins GOAE codes in selection order", () => {
    expect(formatGoaeText(services, [1, 2, 4])).toBe("100-200-400-401");
  });

  it("skips services without GOAE items", () => {
    expect(formatGoaeText(services, [1, 3, 4])).toBe("100-400-401");
  });

  it("ignores unknown ids", () => {
    expect(formatGoaeText(services, [1, 99, 4])).toBe("100-400-401");
  });

  it("returns empty string for empty selection", () => {
    expect(formatGoaeText(services, [])).toBe("");
  });

  it("deduplicates GOAE numbers across services", () => {
    const overlapping: Service[] = [
      ...services,
      {
        id: 6,
        title: "Service6",
        price_cents: 600,
        category: "Kategorie1",
        color: "",
        goae_items: [
          { id: 10, number: "100", parameter: "Param1", price_cents: 1000, sort_order: 0 },
          { id: 60, number: "600", parameter: "Param6", price_cents: 600, sort_order: 1 },
        ],
        sort_order: 5,
      },
    ];
    expect(formatGoaeText(overlapping, [1, 6])).toBe("100-600");
  });
});

describe("formatParameterText", () => {
  it("joins parameters in selection order", () => {
    expect(formatParameterText(services, [1, 2, 4])).toBe(
      "Param1-Param2-Param4a-Param4b",
    );
  });

  it("skips empty parameters", () => {
    const withEmpty: Service[] = [
      {
        ...services[0],
        goae_items: [
          { id: 10, number: "100", parameter: "Param1", price_cents: 1000, sort_order: 0 },
          { id: 11, number: "101", parameter: "  ", price_cents: 0, sort_order: 1 },
        ],
      },
    ];
    expect(formatParameterText(withEmpty, [1])).toBe("Param1");
  });

  it("returns empty string for empty selection", () => {
    expect(formatParameterText(services, [])).toBe("");
  });

  it("deduplicates parameters across services", () => {
    const overlapping: Service[] = [
      ...services,
      {
        id: 6,
        title: "Service6",
        price_cents: 600,
        category: "Kategorie1",
        color: "",
        goae_items: [
          { id: 10, number: "100", parameter: "Param1", price_cents: 1000, sort_order: 0 },
          { id: 60, number: "600", parameter: "Param6", price_cents: 600, sort_order: 1 },
        ],
        sort_order: 5,
      },
    ];
    expect(formatParameterText(overlapping, [1, 6])).toBe("Param1-Param6");
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
  it("sums selected service prices from GOÄ items", () => {
    expect(calculateTotalCents(services, [1, 4])).toBe(5000);
  });

  it("ignores stored service prices when GOÄ items differ", () => {
    const stale: Service[] = [{ ...services[0], price_cents: 9999 }];
    expect(calculateTotalCents(stale, [1])).toBe(1000);
  });
});
