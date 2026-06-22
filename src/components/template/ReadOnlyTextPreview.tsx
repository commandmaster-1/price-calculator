import { cn } from "@/lib/utils";

interface ReadOnlyTextPreviewProps {
  text: string;
  emptyPlaceholder?: string;
  className?: string;
}

// Was used for GOÄ text. Currently not used
export function ReadOnlyTextPreview({
  text,
  emptyPlaceholder = "Keine GOÄ-Codes ausgewählt",
  className,
}: ReadOnlyTextPreviewProps) {
  return (
    <div
      className={cn(
        "min-h-12 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm",
        className,
      )}
    >
      {text ? (
        <span className="break-all">{text}</span>
      ) : (
        <span className="text-muted-foreground">{emptyPlaceholder}</span>
      )}
    </div>
  );
}