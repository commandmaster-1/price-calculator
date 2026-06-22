import { useEffect, useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { ColorPickerField } from "@/components/services/ColorPickerField";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPriceInput, parsePriceInput } from "@/lib/format-price";
import { DEFAULT_COLOR_PRESETS } from "@/lib/color-utils";
import { useColorPresets } from "@/hooks/useColorPresets";
import type { Service } from "@/types/service";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.tsx";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (values: {
    title: string;
    price_cents: number;
    category: string;
    color: string;
    goae: string;
  }) => Promise<void>;
}

export function ServiceDialog({
  open,
  onOpenChange,
  service,
  onSubmit,
}: ServiceDialogProps) {
  const { presets, loading: presetsLoading, updatePreset } = useColorPresets();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [color, setColor] = useState<string>(DEFAULT_COLOR_PRESETS[0]);
  const [goae, setGoae] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(service?.title ?? "");
      setPrice(service ? formatPriceInput(service.price_cents) : "");
      setCategory(service?.category ?? "");
      setColor(service?.color || DEFAULT_COLOR_PRESETS[0]);
      setGoae(service?.goae || "");
      setError(null);
    }
  }, [open, service]);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const priceCents = parsePriceInput(price);

    if (!title.trim()) {
      setError("Bitte einen Titel eingeben.");
      return;
    }

    if (priceCents === null) {
      setError("Bitte einen gültigen Preis eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        price_cents: priceCents,
        category: category.trim(),
        goae: goae.trim(),
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {service ? "Dienstleistung bearbeiten" : "Neue Dienstleistung"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <FieldLabel>Preis (€)</FieldLabel>
              <Input
                id="service-price"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="z. B. 1,30"
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
            <Field>
              <FieldLabel>GOÄ</FieldLabel>
              <Input id="service-goae"
                     value={goae}
                     onChange={(event) => setGoae(event.target.value)}
                     placeholder="GOÄ Code"
              />
            </Field>
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