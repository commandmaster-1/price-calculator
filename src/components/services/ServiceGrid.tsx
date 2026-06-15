import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceCard } from "@/components/services/ServiceCard";
import { ServiceDialog } from "@/components/services/ServiceDialog";
import type { Service } from "@/types/service";

interface ServiceGridProps {
  services: Service[];
  editMode: boolean;
  selectedIds: number[];
  createDialogOpen?: boolean;
  onCreateDialogOpenChange?: (open: boolean) => void;
  onToggleSelect: (id: number) => void;
  onCreate: (values: {
    title: string;
    price_cents: number;
    category: string;
  }) => Promise<void>;
  onUpdate: (
    id: number,
    values: { title: string; price_cents: number; category: string },
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onReorder: (orderedIds: number[]) => Promise<void>;
}

export function ServiceGrid({
  services,
  editMode,
  selectedIds,
  createDialogOpen,
  onCreateDialogOpenChange,
  onToggleSelect,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: ServiceGridProps) {
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  const dialogOpen = createDialogOpen ?? internalDialogOpen;
  const setDialogOpen = onCreateDialogOpenChange ?? setInternalDialogOpen;
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  useEffect(() => {
    if (createDialogOpen) {
      setEditingService(null);
    }
  }, [createDialogOpen]);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = services.findIndex((service) => service.id === active.id);
    const newIndex = services.findIndex((service) => service.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = [...services];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    try {
      await onReorder(reordered.map((service) => service.id));
    } catch (error) {
      toast.error("Reihenfolge konnte nicht gespeichert werden.", {
        description: String(error),
      });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      toast.success("Dienstleistung gelöscht.");
      setDeleteTarget(null);
    } catch (error) {
      toast.error("Dienstleistung konnte nicht gelöscht werden.", {
        description: String(error),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ScrollArea className="h-full min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={services.map((service) => service.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 p-1">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  editMode={editMode}
                  selected={selectedIds.includes(service.id)}
                  onToggleSelect={() => onToggleSelect(service.id)}
                  onEdit={() => {
                    setEditingService(service);
                    setDialogOpen(true);
                  }}
                  onDelete={() => setDeleteTarget(service)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {services.length === 0 ? (
          <p className="px-1 py-8 text-center text-sm text-muted-foreground">
            Noch keine Dienstleistungen vorhanden.
          </p>
        ) : null}
      </ScrollArea>

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingService(null);
        }}
        service={editingService}
        onSubmit={async (values) => {
          if (editingService) {
            await onUpdate(editingService.id, values);
          } else {
            await onCreate(values);
          }
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dienstleistung löschen?</DialogTitle>
            <DialogDescription>
              „{deleteTarget?.title}“ wird dauerhaft entfernt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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