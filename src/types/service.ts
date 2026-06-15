export interface Service {
  id: number;
  title: string;
  price_cents: number;
  category: string;
  sort_order: number;
}

export interface CreateServiceInput {
  title: string;
  price_cents: number;
  category: string;
}

export interface UpdateServiceInput extends CreateServiceInput {
  id: number;
}