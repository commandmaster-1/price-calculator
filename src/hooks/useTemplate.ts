import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getTemplate, saveTemplate } from "@/lib/api";

export function useTemplate() {
  const [templateHtml, setTemplateHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const html = await getTemplate();
        setTemplateHtml(html);
      } catch (error) {
        toast.error("Vorlage konnte nicht geladen werden.", {
          description: String(error),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateTemplate = useCallback((html: string) => {
    setTemplateHtml(html);

    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      void saveTemplate(html).catch((error) => {
        toast.error("Vorlage konnte nicht gespeichert werden.", {
          description: String(error),
        });
      });
    }, 500);
  }, []);

  return {
    templateHtml,
    loading,
    updateTemplate,
  };
}