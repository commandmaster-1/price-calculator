import type { Service } from "@/types/service";
import { formatPrice } from "@/lib/format-price";

const UNCATEGORIZED_LABEL = "Sonstiges";

function categoryLabel(category: string): string {
  return category.trim() || UNCATEGORIZED_LABEL;
}

export function formatServicesText(
  services: Service[],
  selectedIds: number[],
): string {
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

  return categoryOrder
    .map((label) => {
      const titles = grouped.get(label)!.map((service) => service.title).join(", ");
      return `${label}: ${titles}`;
    })
    .join(", ");
}

export function calculateTotalCents(
  services: Service[],
  selectedIds: number[],
): number {
  const serviceMap = new Map(services.map((service) => [service.id, service]));
  return selectedIds.reduce((total, id) => {
    const service = serviceMap.get(id);
    return total + (service?.price_cents ?? 0);
  }, 0);
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
  const servicesText = formatServicesText(services, selectedIds);
  const priceText = formatPrice(calculateTotalCents(services, selectedIds));

  const html = templateHtml
    .replaceAll("{services}", escapeHtml(servicesText))
    .replaceAll("{price}", escapeHtml(priceText));

  const plainText = htmlToPlainText(html);

  return { html, plainText };
}