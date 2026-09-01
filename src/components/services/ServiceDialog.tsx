import { useEffect, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { ColorPickerField } from "@/components/services/ColorPickerField";
import { GoaePickerField } from "@/components/services/GoaePickerField";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DEFAULT_COLOR_PRESETS } from "@/lib/color-utils";
import { useColorPresets } from "@/hooks/useColorPresets";
import type { GoaeItem } from "@/types/goae";
import type { CreateServiceInput, Service } from "@/types/service";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  goaeItems: GoaeItem[];
  onSubmit: (values: CreateServiceInput) => Promise<void>;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  goaeItems,
  onSubmit,
}: ServiceDialogProps) {
  const { presets, loading: presetsLoading, updatePreset } = useColorPresets();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR_PRESETS[0]);
  const [goaeIds, setGoaeIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(service?.title ?? "");
      setCategory(service?.category ?? "");
      setColor(service?.color || DEFAULT_COLOR_PRESETS[0]);
      setGoaeIds(service?.goae_items.map((item) => item.id) ?? []);
      setError(null);
    }
  }, [open, service]);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        category: category.trim(),
        goae_ids: goaeItems
          .filter((item) => goaeIds.includes(item.id))
          .map((item) => item.id),
        color,
      });
      onOpenChange(false);
    } catch (submitError) {
      setError(String(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {service ? "Dienstleistung bearbeiten" : "Neue Dienstleistung"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto">
          <FieldGroup>
            <Field>
              <FieldLabel>Titel</FieldLabel>
              <Input
                id="service-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="z. B. Beratung"
              />
            </Field>
            <Field>
              <FieldLabel>Kategorie</FieldLabel>
              <Input
                id="service-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Optional, z. B. Planung"
              />
            </Field>
            <GoaePickerField
              key={open ? "open" : "closed"}
              items={goaeItems}
              selectedIds={goaeIds}
              onChange={setGoaeIds}
            />
          </FieldGroup>
          {presetsLoading ? (
            <p className="text-sm text-muted-foreground">Lade Farb-Presets…</p>
          ) : (
            <ColorPickerField
              color={color}
              presets={presets}
              onColorChange={setColor}
              onPresetSave={updatePreset}
            />
          )}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting}>
              {service ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
