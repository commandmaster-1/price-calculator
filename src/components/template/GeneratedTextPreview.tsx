import { cn } from "@/lib/utils";

interface GeneratedTextPreviewProps {
  html: string;
  className?: string;
}

export function GeneratedTextPreview({ html, className }: GeneratedTextPreviewProps) {
  return (
    <div
      className={cn(
        "min-h-[160px] rounded-md border border-input bg-muted/30 px-3 py-2 text-sm",
        "prose prose-sm max-w-none [&_p]:my-1",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}