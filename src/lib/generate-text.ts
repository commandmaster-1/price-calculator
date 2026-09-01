import type { GoaeItem } from "@/types/goae";
import type { Service } from "@/types/service";
import { formatPrice } from "@/lib/format-price";

const UNCATEGORIZED_LABEL = "Sonstiges";

function categoryLabel(category: string): string {
  return category.trim() || UNCATEGORIZED_LABEL;
}

function buildServiceGroups(services: Service[], selectedIds: number[]) {
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const categoryOrder: string[] = [];
  const grouped = new Map<string, Service[]>();

  for (const id of selectedIds) {
    const service = serviceMap.get(id);
    if (!service) continue;

    const label = categoryLabel(service.category);
    if (!grouped.has(label)) {
      grouped.set(label, []);
      categoryOrder.push(label);
    }
    grouped.get(label)!.push(service);
  }

  return { categoryOrder, grouped };
}

export function formatServicesText(
  services: Service[],
  selectedIds: number[],
): string {
  const { categoryOrder, grouped } = buildServiceGroups(services, selectedIds);

  return categoryOrder
    .map((label) => {
      const titles = grouped.get(label)!.map((service) => service.title).join(", ");
      return `${label}: ${titles}`;
    })
    .join(", ");
}

export function formatServicesHtml(
  services: Service[],
  selectedIds: number[],
): string {
  const { categoryOrder, grouped } = buildServiceGroups(services, selectedIds);

  return categoryOrder
    .map((label) => {
      const titles = grouped
        .get(label)!
        .map((service) => escapeHtml(service.title))
        .join(", ");
      return `<strong>${escapeHtml(label)}:</strong> ${titles}`;
    })
    .join(", ");
}

export function goaeItemsPriceCents(items: GoaeItem[]): number {
  return items.reduce((total, item) => total + item.price_cents, 0);
}

export function calculateTotalCents(
  services: Service[],
  selectedIds: number[],
): number {
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  return selectedIds.reduce((total, id) => {
    const service = serviceMap.get(id);
    if (!service) return total;
    return total + goaeItemsPriceCents(service.goae_items);
  }, 0);
}

export function collectGoaeItems(
  services: Service[],
  selectedIds: number[],
): GoaeItem[] {
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const items: GoaeItem[] = [];

  for (const id of selectedIds) {
    const service = serviceMap.get(id);
    if (!service) continue;
    items.push(...service.goae_items);
  }

  return items;
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }

  return unique;
}

export function formatGoaeText(
  services: Service[],
  selectedIds: number[],
): string {
  return uniqueNonEmpty(
    collectGoaeItems(services, selectedIds).map((item) => item.number.trim()),
  ).join("-");
}

export function formatParameterText(
  services: Service[],
  selectedIds: number[],
): string {
  return uniqueNonEmpty(
    collectGoaeItems(services, selectedIds).map((item) => item.parameter.trim()),
  ).join("-");
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlToPlainText(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent ?? "";
}

export function generateText(
  templateHtml: string,
  services: Service[],
  selectedIds: number[],
): { html: string; plainText: string } {
  const servicesHtml = formatServicesHtml(services, selectedIds);
  const priceText = formatPrice(calculateTotalCents(services, selectedIds));
  const goaText = formatGoaeText(services, selectedIds);
  const parameterText = formatParameterText(services, selectedIds);

  const html = templateHtml
    .replaceAll("{services}", servicesHtml)
    .replaceAll("{price}", escapeHtml(priceText))
    .replaceAll("{goa}", escapeHtml(goaText))
    .replaceAll("{parameter}", escapeHtml(parameterText));

  const plainText = htmlToPlainText(html);

  return { html, plainText };
}
