import { invoke } from "@tauri-apps/api/core";
import type {
  DatabaseFileMode,
  DatabaseStatus,
} from "@/types/database";
import type {
  CreateServiceInput,
  Service,
  UpdateServiceInput,
} from "@/types/service";

export function getDatabaseStatus(): Promise<DatabaseStatus> {
  return invoke<DatabaseStatus>("get_database_status");
}

export function pickDatabaseFile(
  mode: DatabaseFileMode,
): Promise<string | null> {
  return invoke<string | null>("pick_database_file", { mode });
}

export function setDatabasePath(path: string): Promise<void> {
  return invoke<void>("set_database_path", { path });
}

export function changeDatabasePath(path: string): Promise<void> {
  return invoke<void>("change_database_path", { path });
}

export function listServices(): Promise<Service[]> {
  return invoke<Service[]>("list_services");
}

export function createService(input: CreateServiceInput): Promise<Service> {
  return invoke<Service>("create_service", { input });
}

export function updateService(input: UpdateServiceInput): Promise<Service> {
  return invoke<Service>("update_service", { input });
}

export function deleteService(id: number): Promise<void> {
  return invoke<void>("delete_service", { id });
}

export function reorderServices(orderedIds: number[]): Promise<Service[]> {
  return invoke<Service[]>("reorder_services", { orderedIds });
}

export function getTemplate(): Promise<string> {
  return invoke<string>("get_template");
}

export function saveTemplate(html: string): Promise<void> {
  return invoke<void>("save_template", { html });
}

export function getColorPresets(): Promise<string[]> {
  return invoke<string[]>("get_color_presets");
}

export function saveColorPresets(presets: string[]): Promise<void> {
  return invoke<void>("save_color_presets", { presets });
}