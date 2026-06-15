import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createService,
  deleteService,
  listServices,
  reorderServices,
  updateService,
} from "@/lib/api";
import type { CreateServiceInput, Service, UpdateServiceInput } from "@/types/service";

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listServices();
      setServices(data);
    } catch (error) {
      toast.error("Dienstleistungen konnten nicht geladen werden.", {
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addService = useCallback(
    async (input: CreateServiceInput) => {
      const created = await createService(input);
      setServices((current) => [...current, created]);
      toast.success("Dienstleistung erstellt.", {duration: 1200});
      return created;
    },
    [],
  );

  const editService = useCallback(async (input: UpdateServiceInput) => {
    const updated = await updateService(input);
    setServices((current) =>
      current.map((service) => (service.id === updated.id ? updated : service)),
    );
    toast.success("Dienstleistung aktualisiert.", {duration: 1200});
    return updated;
  }, []);

  const removeService = useCallback(async (id: number) => {
    await deleteService(id);
    await refresh();
  }, [refresh]);

  const reorder = useCallback(async (orderedIds: number[]) => {
    const updated = await reorderServices(orderedIds);
    setServices(updated);
  }, []);

  return {
    services,
    loading,
    refresh,
    addService,
    editService,
    removeService,
    reorder,
  };
}