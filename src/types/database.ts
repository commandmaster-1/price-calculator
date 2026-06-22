export interface DatabaseStatus {
  configured: boolean;
  path: string | null;
}

export type DatabaseFileMode = "open" | "create";