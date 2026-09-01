export interface GoaeItem {
  id: number;
  number: string;
  parameter: string;
  price_cents: number;
  sort_order: number;
}

export interface CreateGoaeItemInput {
  number: string;
  parameter: string;
  price_cents: number;
}

export interface UpdateGoaeItemInput extends CreateGoaeItemInput {
  id: number;
}
