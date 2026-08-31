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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { GoaeItem } from "@/types/goae";

interface GoaeManagerDialogProps {
  items: GoaeItem[];
  loading: boolean;
  onCreate: (values: { number: string; parameter: string }) => Promise<void>;
  onUpdate: (id: number, values: { number: string; parameter: string }) => Promise<void>;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editParameter, setEditParameter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GoaeItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate(event: SubmitEvent) {
    event.preventDefault();
    if (!number.trim() || !parameter.trim()) {
      setError("Bitte Ziffer und Parameter eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onCreate({ number: number.trim(), parameter: parameter.trim() });
      setNumber("");
      setParameter("");
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
    setError(null);
  }

  async function handleUpdate(itemId: number) {
    if (!editNumber.trim() || !editParameter.trim()) {
      setError("Bitte Ziffer und Parameter eingeben.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(itemId, {
        number: editNumber.trim(),
        parameter: editParameter.trim(),
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
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>GOÄ-Ziffern verwalten</DialogTitle>
            <DialogDescription>
              Legen Sie GOÄ-Ziffern zusammen mit einem Parameter an. Diese
              Paare können anschließend bei den Dienstleistungen ausgewählt
              werden.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3">
            <FieldGroup className="gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
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
            <ScrollArea className="max-h-72">
              <ul className="space-y-2 pr-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2 rounded-md border px-3 py-2"
                  >
                    {editingId === item.id ? (
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
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
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.parameter || "Kein Parameter"}
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
            </ScrollArea>
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
