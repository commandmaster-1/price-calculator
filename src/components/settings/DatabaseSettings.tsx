import { Settings2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DatabaseFileMode } from "@/types/database";

interface DatabaseSettingsProps {
  currentPath: string | null;
  onPickFile: (mode: DatabaseFileMode) => Promise<string | null>;
  onChangePath: (path: string) => Promise<void>;
  onDatabaseChanged: () => void;
}

export function DatabaseSettings({
  currentPath,
  onPickFile,
  onChangePath,
  onDatabaseChanged,
}: DatabaseSettingsProps) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState("");
  const [changing, setChanging] = useState(false);

  async function handlePick(mode: DatabaseFileMode) {
    try {
      const path = await onPickFile(mode);
      if (!path) {
        return;
      }

      if (path === currentPath) {
        toast.message("Dies ist bereits die aktuelle Datenbank.");
        return;
      }

      setPendingPath(path);
      setConfirmOpen(true);
    } catch (error) {
      toast.error("Dateiauswahl fehlgeschlagen.", {
        description: String(error),
      });
    }
  }

  async function handleConfirmChange() {
    setChanging(true);
    try {
      await onChangePath(pendingPath);
      onDatabaseChanged();
      setConfirmOpen(false);
      setOpen(false);
      toast.success("Datenbankpfad geändert.");
    } catch (error) {
      toast.error("Datenbankpfad konnte nicht geändert werden.", {
        description: String(error),
      });
    } finally {
      setChanging(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Einstellungen">
            <Settings2 className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datenbank</DialogTitle>
            <DialogDescription>
              Aktueller Speicherort der SQLite-Datenbankdatei.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="current-database-path">Aktueller Pfad</Label>
            <Input
              id="current-database-path"
              value={currentPath ?? ""}
              readOnly
              title={currentPath ?? undefined}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => void handlePick("open")}
            >
              Bestehende öffnen
            </Button>
            <Button type="button" onClick={() => void handlePick("create")}>
              Neue erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Datenbank wechseln?</DialogTitle>
            <DialogDescription>
              Die App lädt anschließend alle Daten aus der neuen Datei. Nicht
              gespeicherte Änderungen in der aktuellen Sitzung gehen verloren.
            </DialogDescription>
          </DialogHeader>

          <Input value={pendingPath} readOnly title={pendingPath} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={changing}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirmChange()}
              disabled={changing}
            >
              {changing ? "Wird gewechselt…" : "Wechseln"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}