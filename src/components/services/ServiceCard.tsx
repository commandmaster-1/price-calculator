import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import { getContrastTextClass, normalizeHexColor } from "@/lib/color-utils";
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

  const cardColor = normalizeHexColor(service.color);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: cardColor ?? undefined,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative py-2 transition-[filter,border-color,box-shadow]",
        !cardColor && "bg-card",
        !editMode && "cursor-pointer hover:brightness-95",
        selected && !editMode && "border-4 border-green-500 shadow-sm",
        !selected && "border",
        isDragging && "opacity-60",
      )}
      onClick={() => {
        if (!editMode) {
          onToggleSelect();
        }
      }}
    >
      <CardContent className="flex items-start gap-1.5 px-2.5 py-0.5">
        {editMode ? (
            <div className=" flex flex-col shrink-0 items-center">
              <button
                  type="button"
                  className="mt-0.5 cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-label="Verschieben"
                  {...attributes}
                  {...listeners}
              >
                <GripVertical className="size-3.5"/>
              </button>
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
                <Pencil className="size-3.5"/>
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
                <Trash2 className="size-3.5"/>
              </Button>
            </div>
        ) : null}
        <p
          className={cn(
            "min-w-0 flex-1 text-center text-xs font-medium leading-tight break-words whitespace-normal",
            cardColor ? getContrastTextClass(cardColor) : "text-foreground",
          )}
        >
          {service.title}
        </p>
      </CardContent>
    </Card>
  );
}