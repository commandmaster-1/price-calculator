import { Check } from "lucide-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { GoaeItem } from "@/types/goae";

interface GoaePickerFieldProps {
  items: GoaeItem[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function GoaePickerField({
  items,
  selectedIds,
  onChange,
}: GoaePickerFieldProps) {
  const selected = new Set(selectedIds);

  function toggle(id: number) {
    if (selected.has(id)) {
      onChange(selectedIds.filter((current) => current !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  return (
    <Field>
      <FieldLabel>GOÄ</FieldLabel>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine GOÄ-Ziffern vorhanden. Bitte zuerst im Menü
          „GOÄ-Ziffern“ anlegen.
        </p>
      ) : (
        <ScrollArea className="max-h-44 rounded-md border">
          <div className="flex flex-col gap-1 p-1">
            {items.map((item) => {
              const isSelected = selected.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                    aria-hidden
                  >
                    {isSelected ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="font-medium">{item.number}</span>
                    {item.parameter ? (
                      <span className="text-muted-foreground">
                        {" "}
                        — {item.parameter}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Field>
  );
}
