import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createGoaeItem,
  deleteGoaeItem,
  listGoaeItems,
  updateGoaeItem,
} from "@/lib/api";
import type {
  CreateGoaeItemInput,
  GoaeItem,
  UpdateGoaeItemInput,
} from "@/types/goae";

export function useGoaeItems() {
  const [items, setItems] = useState<GoaeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listGoaeItems();
      setItems(data);
    } catch (error) {
      toast.error("GOÄ-Ziffern konnten nicht geladen werden.", {
        description: String(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addItem = useCallback(async (input: CreateGoaeItemInput) => {
    const created = await createGoaeItem(input);
    setItems((current) => [...current, created]);
    toast.success("GOÄ-Ziffer erstellt.", { duration: 1200 });
    return created;
  }, []);

  const editItem = useCallback(async (input: UpdateGoaeItemInput) => {
    const updated = await updateGoaeItem(input);
    setItems((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    toast.success("GOÄ-Ziffer aktualisiert.", { duration: 1200 });
    return updated;
  }, []);

  const removeItem = useCallback(async (id: number) => {
    await deleteGoaeItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
    toast.success("GOÄ-Ziffer gelöscht.", { duration: 1200 });
  }, []);

  return {
    items,
    loading,
    refresh,
    addItem,
    editItem,
    removeItem,
  };
}
