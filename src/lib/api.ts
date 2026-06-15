import { invoke } from "@tauri-apps/api/core";
import type {
  CreateServiceInput,
  Service,
  UpdateServiceInput,
} from "@/types/service";

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