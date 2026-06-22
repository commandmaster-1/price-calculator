import { Database, FilePlus2, FolderOpen } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DatabaseFileMode } from "@/types/database";

interface DatabaseSetupScreenProps {
  onComplete: (path: string) => Promise<void>;
  onPickFile: (mode: DatabaseFileMode) => Promise<string | null>;
}

export function DatabaseSetupScreen({
  onComplete,
  onPickFile,
}: DatabaseSetupScreenProps) {
  const [selectedPath, setSelectedPath] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePick(mode: DatabaseFileMode) {
    try {
      const path = await onPickFile(mode);
      if (path) {
        setSelectedPath(path);
      }
    } catch (error) {
      toast.error("Dateiauswahl fehlgeschlagen.", {
        description: String(error),
      });
    }
  }

  async function handleContinue() {
    if (!selectedPath.trim()) {
      toast.error("Bitte wählen Sie eine Datenbankdatei aus.");
      return;
    }

    setSubmitting(true);
    try {
      await onComplete(selectedPath);
    } catch (error) {
      toast.error("Datenbank konnte nicht initialisiert werden.", {
        description: String(error),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Database className="size-6" />
          </div>
          <h1 className="text-xl font-semibold">Datenbank einrichten</h1>
          <p className="text-sm text-muted-foreground">
            Wählen Sie, wo Ihre Datenbankdatei gespeichert werden soll. Sie
            können eine bestehende Datei öffnen oder eine neue erstellen.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="database-path">Datenbankpfad</Label>
          <Input
            id="database-path"
            value={selectedPath}
            readOnly
            placeholder="Noch keine Datei ausgewählt"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => void handlePick("open")}
          >
            <FolderOpen className="size-4" />
            Bestehende öffnen
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => void handlePick("create")}
          >
            <FilePlus2 className="size-4" />
            Neue erstellen
          </Button>
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={!selectedPath || submitting}
          onClick={() => void handleContinue()}
        >
          {submitting ? "Wird eingerichtet…" : "Weiter"}
        </Button>
      </div>
    </div>
  );
}