import { writeHtml } from "@tauri-apps/plugin-clipboard-manager";
import { Copy, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { useSelection } from "@/hooks/useSelection";
import { useServices } from "@/hooks/useServices";
import { useTemplate } from "@/hooks/useTemplate";
import { calculateTotalCents, generateText } from "@/lib/generate-text";
import { formatPrice } from "@/lib/format-price";

export function AppShell() {
  const [editMode, setEditMode] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { services, loading, addService, editService, removeService, reorder } =
    useServices();
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

  async function handleCopy() {
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

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col bg-background">
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
                onCheckedChange={setEditMode}
              />
              <Label htmlFor="edit-mode">Bearbeitungsmodus</Label>
            </div>
            {editMode ? (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="size-4" />
                Neu
              </Button>
            ) : null}
          </div>
        </header>

        <section className="min-h-0 flex-1 overflow-hidden px-4 py-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Lade Dienstleistungen…</p>
          ) : (
            <ServiceGrid
              services={services}
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
              createDialogOpen={createDialogOpen}
              onCreateDialogOpenChange={setCreateDialogOpen}
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
            <GeneratedTextPreview html={generatedPreview.html} />
          )}
        </section>

        <footer className="flex items-center justify-between gap-4 border-t px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {selectedIds.length} ausgewählt
            </Badge>
            <span>Gesamt: {formatPrice(totalCents)}</span>
          </div>
          <Button onClick={handleCopy} disabled={selectedIds.length === 0}>
            <Copy className="size-4" />
            Text kopieren
          </Button>
        </footer>
      </div>
    </TooltipProvider>
  );
}