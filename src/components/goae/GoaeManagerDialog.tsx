import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatPrice, formatPriceInput, parsePriceInput } from "@/lib/format-price";
import type { GoaeItem } from "@/types/goae";

interface GoaeManagerDialogProps {
  items: GoaeItem[];
  loading: boolean;
  onCreate: (values: {
    number: string;
    parameter: string;
    price_cents: number;
  }) => Promise<void>;
  onUpdate: (
    id: number,
    values: { number: string; parameter: string; price_cents: number },
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function GoaeManagerDialog({
  items,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}: GoaeManagerDialogProps) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [parameter, setParameter] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editParameter, setEditParameter] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GoaeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  function parseRequiredPrice(value: string): number | null {
    const parsed = parsePriceInput(value);
    if (parsed === null) return null;
    return parsed;
  }

  async function handleCreate(event: SubmitEvent) {
    event.preventDefault();
    const priceCents = parseRequiredPrice(price);
    if (!number.trim() || !parameter.trim()) {
      setError("Bitte Ziffer und Parameter eingeben.");
      return;
    }
    if (priceCents === null) {
      setError("Bitte einen gültigen Preis eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        number: number.trim(),
        parameter: parameter.trim(),
        price_cents: priceCents,
      });
      setNumber("");
      setParameter("");
      setPrice("");
    } catch (submitError) {
      setError(String(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(item: GoaeItem) {
    setEditingId(item.id);
    setEditNumber(item.number);
    setEditParameter(item.parameter);
    setEditPrice(formatPriceInput(item.price_cents));
    setError(null);
  }

  async function handleUpdate(itemId: number) {
    const priceCents = parseRequiredPrice(editPrice);
    if (!editNumber.trim() || !editParameter.trim()) {
      setError("Bitte Ziffer und Parameter eingeben.");
      return;
    }
    if (priceCents === null) {
      setError("Bitte einen gültigen Preis eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(itemId, {
        number: editNumber.trim(),
        parameter: editParameter.trim(),
        price_cents: priceCents,
      });
      setEditingId(null);
    } catch (submitError) {
      setError(String(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      if (editingId === deleteTarget.id) {
        setEditingId(null);
      }
      setDeleteTarget(null);
    } catch (submitError) {
      setError(String(submitError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            GOÄ-Ziffern
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>GOÄ-Ziffern verwalten</DialogTitle>
            <DialogDescription>
              Legen Sie GOÄ-Ziffern mit Parameter und Preis an. Der Preis einer
              Dienstleistung ergibt sich aus den dort ausgewählten Ziffern.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            <FieldGroup className="gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7rem_auto] sm:items-end">
                <Field>
                  <FieldLabel htmlFor="goae-number">Ziffer</FieldLabel>
                  <Input
                    id="goae-number"
                    value={number}
                    onChange={(event) => setNumber(event.target.value)}
                    placeholder="z. B. 250"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="goae-parameter">Parameter</FieldLabel>
                  <Input
                    id="goae-parameter"
                    value={parameter}
                    onChange={(event) => setParameter(event.target.value)}
                    placeholder="z. B. Blutbild"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="goae-price">Preis (€)</FieldLabel>
                  <Input
                    id="goae-price"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="1,30"
                  />
                </Field>
                <Button type="submit" disabled={submitting}>
                  <Plus className="size-4" />
                  Hinzufügen
                </Button>
              </div>
            </FieldGroup>
          </form>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {loading ? (
            <p className="text-sm text-muted-foreground">Lade GOÄ-Ziffern…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Noch keine GOÄ-Ziffern vorhanden.
            </p>
          ) : (
            <div className="min-h-0 max-h-72 flex-1 overflow-y-auto">
              <ul className="space-y-2 pr-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-md border px-3 py-2"
                  >
                    {editingId === item.id ? (
                      <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_7rem]">
                        <Input
                          value={editNumber}
                          onChange={(event) => setEditNumber(event.target.value)}
                          aria-label="GOÄ-Ziffer"
                        />
                        <Input
                          value={editParameter}
                          onChange={(event) =>
                            setEditParameter(event.target.value)
                          }
                          aria-label="Parameter"
                        />
                        <Input
                          value={editPrice}
                          onChange={(event) => setEditPrice(event.target.value)}
                          aria-label="Preis"
                        />
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.parameter || "Kein Parameter"}
                          {" · "}
                          {formatPrice(item.price_cents)}
                        </p>
                      </div>
                    )}
                    <div className="flex shrink-0 gap-1">
                      {editingId === item.id ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void handleUpdate(item.id)}
                            disabled={submitting}
                          >
                            Speichern
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(null)}
                          >
                            Abbrechen
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => startEdit(item)}
                            aria-label="Bearbeiten"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(item)}
                            aria-label="Löschen"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>GOÄ-Ziffer löschen?</DialogTitle>
            <DialogDescription>
              „{deleteTarget?.number}“
              {deleteTarget?.parameter ? ` (${deleteTarget.parameter})` : ""}{" "}
              wird entfernt und von allen Dienstleistungen gelöst.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={deleting}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
