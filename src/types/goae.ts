export interface GoaeItem {
  id: number;
  number: string;
  parameter: string;
  sort_order: number;
}

export interface CreateGoaeItemInput {
  number: string;
  parameter: string;
}

export interface UpdateGoaeItemInput extends CreateGoaeItemInput {
  id: number;
}
