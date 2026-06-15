export function normalizeHexColor(color: string): string | null {
  const trimmed = color.trim();
  if (!trimmed) return null;

  const shortMatch = /^#?([0-9a-fA-F]{3})$/.exec(trimmed);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  const longMatch = /^#?([0-9a-fA-F]{6})$/.exec(trimmed);
  if (longMatch) {
    return `#${longMatch[1].toUpperCase()}`;
  }

  return null;
}

export function getContrastTextClass(color: string): string {
  const normalized = normalizeHexColor(color);
  if (!normalized) return "text-foreground";

  const hex = normalized.slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "text-foreground" : "text-white";
}

export const DEFAULT_COLOR_PRESETS = [
  "#E8F5E9",
  "#FFF3E0",
  "#E3F2FD",
  "#FCE4EC",
  "#F3E5F5",
  "#E0F7FA",
  "#FFFDE7",
  "#F1F8E9",
  "#ECEFF1",
  "#FFEBEE",
] as const;