import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format-price";
import { goaeItemsPriceCents } from "@/lib/generate-text";
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
  const [query, setQuery] = useState("");
  const selected = new Set(selectedIds);
  const selectedItems = items.filter((item) => selected.has(item.id));

  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => {
      return (
        item.number.toLowerCase().includes(needle) ||
        item.parameter.toLowerCase().includes(needle)
      );
    });
  }, [items, query]);

  function toggle(id: number) {
    if (selected.has(id)) {
      onChange(selectedIds.filter((current) => current !== id));
      return;
    }
    onChange([...selectedIds, id]);
  }

  return (
    <Field>
      <FieldLabel>GOÄ-Ziffern</FieldLabel>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Noch keine GOÄ-Ziffern vorhanden. Bitte zuerst im Menü
          „GOÄ-Ziffern“ anlegen.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedItems.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedItems.map((item) => (
                <Badge key={item.id} variant="secondary" className="gap-1 pr-1">
                  <span className="max-w-40 truncate">
                    {item.number}
                    {item.parameter ? ` — ${item.parameter}` : ""}
                  </span>
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted"
                    onClick={() => toggle(item.id)}
                    aria-label={`${item.number} entfernen`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                }
              }}
              placeholder="Ziffer oder Parameter suchen"
              className="pl-8"
              aria-label="GOÄ-Ziffern durchsuchen"
            />
          </div>
          <div className="h-52 overflow-y-auto rounded-md border">
            {filteredItems.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Keine Treffer.
              </p>
            ) : (
              <div className="flex flex-col gap-1 p-1">
                {filteredItems.map((item) => {
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
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{item.number}</span>
                        {item.parameter ? (
                          <span className="text-muted-foreground">
                            {" "}
                            — {item.parameter}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatPrice(item.price_cents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Preis: {formatPrice(goaeItemsPriceCents(selectedItems))}
          </p>
        </div>
      )}
    </Field>
  );
}
