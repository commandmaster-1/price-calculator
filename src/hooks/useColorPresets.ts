import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getColorPresets, saveColorPresets } from "@/lib/api";
import { DEFAULT_COLOR_PRESETS } from "@/lib/color-utils";

export function useColorPresets() {
  const [presets, setPresets] = useState<string[]>([...DEFAULT_COLOR_PRESETS]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getColorPresets();
        setPresets(data);
      } catch (error) {
        toast.error("Farb-Presets konnten nicht geladen werden.", {
          description: String(error),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updatePreset = useCallback(async (index: number, color: string) => {
    const nextPresets = [...presets];
    nextPresets[index] = color;
    setPresets(nextPresets);

    try {
      await saveColorPresets(nextPresets);
      toast.success("Preset gespeichert.");
    } catch (error) {
      setPresets(presets);
      toast.error("Preset konnte nicht gespeichert werden.", {
        description: String(error),
      });
      throw error;
    }
  }, [presets]);

  return {
    presets,
    loading,
    updatePreset,
  };
}