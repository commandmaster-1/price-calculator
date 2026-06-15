import { useCallback, useState } from "react";

export function useSelection() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((current) => {
      const index = current.indexOf(id);
      if (index >= 0) {
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback(
    (id: number) => selectedIds.includes(id),
    [selectedIds],
  );

  return {
    selectedIds,
    toggleSelection,
    clearSelection,
    isSelected,
  };
}