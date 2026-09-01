import type { GoaeItem } from "@/types/goae";

export interface Service {
  id: number;
  title: string;
  price_cents: number;
  category: string;
  color: string;
  goae_items: GoaeItem[];
  sort_order: number;
}

export interface CreateServiceInput {
  title: string;
  category: string;
  color: string;
  goae_ids: number[];
}

export interface UpdateServiceInput extends CreateServiceInput {
  id: number;
}
