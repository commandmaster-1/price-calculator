import { writeHtml, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { Copy } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { GoaeManagerDialog } from "@/components/goae/GoaeManagerDialog";
import { DatabaseSettings } from "@/components/settings/DatabaseSettings";
import { ServiceGrid } from "@/components/services/ServiceGrid";
import { GeneratedTextPreview } from "@/components/template/GeneratedTextPreview";
import { PlaceholderHint } from "@/components/template/PlaceholderHint";
import { TemplateEditor } from "@/components/template/TemplateEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDatabaseConfig } from "@/hooks/useDatabaseConfig";
import type { DatabaseFileMode } from "@/types/database";
import { useGoaeItems } from "@/hooks/useGoaeItems";
import { useSelection } from "@/hooks/useSelection";
import { useServices } from "@/hooks/useServices";
import { useTemplate } from "@/hooks/useTemplate";
import { calculateTotalCents, formatGoaeText, generateText } from "@/lib/generate-text";
import { formatPrice } from "@/lib/format-price";

function AppShellContent({
  editMode,
  onEditModeChange,
  databasePath,
  onPickFile,
  onChangePath,
  onDatabaseChanged,
}: {
  editMode: boolean;
  onEditModeChange: (value: boolean) => void;
  databasePath: string | null;
  onPickFile: (mode: DatabaseFileMode) => Promise<string | null>;
  onChangePath: (path: string) => Promise<void>;
  onDatabaseChanged: () => void;
}) {
  const { services, loading, addService, editService, removeService, reorder, refresh } =
    useServices();
  const {
    items: goaeItems,
    loading: goaeLoading,
    addItem,
    editItem,
    removeItem,
  } = useGoaeItems();
  const { templateHtml, loading: templateLoading, updateTemplate } =
    useTemplate();
  const { selectedIds, toggleSelection } = useSelection();

  const totalCents = useMemo(
    () => calculateTotalCents(services, selectedIds),
    [services, selectedIds],
  );

  const generatedPreview = useMemo(
    () => generateText(templateHtml, services, selectedIds),
    [templateHtml, services, selectedIds],
  );

  const goaeText = useMemo(
    () => formatGoaeText(services, selectedIds),
    [services, selectedIds],
  );

  async function handleTemplateCopy() {
    const { html, plainText } = generateText(
      templateHtml,
      services,
      selectedIds,
    );

    try {
      await writeHtml(html, plainText);
      toast.success("Text in Zwischenablage kopiert.");
    } catch (error) {
      toast.error("Text konnte nicht kopiert werden.", {
        description: String(error),
      });
    }
  }

  async function handleGoaeCopy() {
    try {
      await writeText(goaeText);
      toast.success("GOAE in Zwischenablage kopiert.");
    } catch (error) {
      toast.error("GOAE konnte nicht kopiert werden.", {
        description: String(error),
      });
    }
  }

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Preisrechner</h1>
          <p className="text-sm text-muted-foreground">
            Dienstleistungen auswählen und Text generieren
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={onEditModeChange}
            />
            <Label htmlFor="edit-mode">Bearbeitungsmodus</Label>
          </div>
          {editMode ? (
            <GoaeManagerDialog
              items={goaeItems}
              loading={goaeLoading}
              onCreate={async (values) => {
                await addItem(values);
              }}
              onUpdate={async (id, values) => {
                await editItem({ id, ...values });
                await refresh();
              }}
              onDelete={async (id) => {
                await removeItem(id);
                await refresh();
              }}
            />
          ) : null}
          <DatabaseSettings
            currentPath={databasePath}
            onPickFile={onPickFile}
            onChangePath={onChangePath}
            onDatabaseChanged={onDatabaseChanged}
          />
        </div>
      </header>

      <section className="min-h-0 flex-1 overflow-hidden px-4 py-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Lade Dienstleistungen…</p>
        ) : (
          <ServiceGrid
            services={services}
            goaeItems={goaeItems}
            editMode={editMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelection}
            onCreate={async (values) => {
              await addService(values);
            }}
            onUpdate={async (id, values) => {
              await editService({ id, ...values });
            }}
            onDelete={removeService}
            onReorder={reorder}
          />
        )}
      </section>

      <Separator />

      <section className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            {editMode ? "Vorlage" : "Generierter Text"}
          </h2>
          {editMode ? <PlaceholderHint /> : null}
        </div>
        {templateLoading ? (
          <p className="text-sm text-muted-foreground">Lade Vorlage…</p>
        ) : editMode ? (
          <TemplateEditor value={templateHtml} onChange={updateTemplate} />
        ) : (
          <div className="space-y-1">
            <GeneratedTextPreview html={generatedPreview.html} />
            {/* <p className="px-0.5 text-xs text-muted-foreground break-all">
              {goaeText ? `GOÄ: ${goaeText}` : "Keine GOÄ-Nummern ausgewählt"}
            </p> */}
          </div>
        )}
      </section>

      <footer className="flex items-center justify-between gap-4 border-t px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">
            {selectedIds.length} ausgewählt
          </Badge>
          <span>Gesamt: {formatPrice(totalCents)}</span>
        </div>

        <div className="flex gap-4">
          <Button
              className=""
              variant="secondary"
              onClick={handleGoaeCopy}
              disabled={!goaeText}
          >
            <Copy className="size-4" />
            GOÄ kopieren
          </Button>
          <Button onClick={handleTemplateCopy} disabled={selectedIds.length === 0}>
            <Copy className="size-4" />
            Text kopieren
          </Button>
        </div>
      </footer>
    </>
  );
}

export function AppShell() {
  const [editMode, setEditMode] = useState(false);
  const [dataKey, setDataKey] = useState(0);
  const { path, pickFile, changePath } = useDatabaseConfig();

  return (
    <TooltipProvider skipDelayDuration={0}>
      <div className="flex h-screen flex-col bg-background">
        <AppShellContent
          key={dataKey}
          editMode={editMode}
          onEditModeChange={setEditMode}
          databasePath={path}
          onPickFile={pickFile}
          onChangePath={changePath}
          onDatabaseChanged={() => setDataKey((current) => current + 1)}
        />
      </div>
    </TooltipProvider>
  );
}