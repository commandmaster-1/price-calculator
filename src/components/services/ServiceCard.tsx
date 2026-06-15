import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/service";

interface ServiceCardProps {
  service: Service;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ServiceCard({
  service,
  editMode,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
}: ServiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: service.id,
    disabled: !editMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative transition-colors",
        !editMode && "cursor-pointer hover:bg-accent/40",
        selected &&
          !editMode &&
          "border-green-500 bg-green-50 ring-2 ring-green-500/40 dark:bg-green-950/40",
        isDragging && "opacity-60",
      )}
      onClick={() => {
        if (!editMode) {
          onToggleSelect();
        }
      }}
    >
      <CardContent className="flex items-center gap-1.5 px-2.5 py-1.5">
        {editMode ? (
          <button
            type="button"
            className="cursor-grab text-muted-foreground active:cursor-grabbing"
            aria-label="Verschieben"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-3.5" />
          </button>
        ) : null}
        <p className="min-w-0 flex-1 text-xs font-medium leading-tight">
          {service.title}
        </p>
        {editMode ? (
          <div className="flex items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              aria-label="Bearbeiten"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              aria-label="Löschen"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}