import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { getContrastTextClass, normalizeHexColor } from "@/lib/color-utils";

interface ColorPickerFieldProps {
  color: string;
  presets: string[];
  onColorChange: (color: string) => void;
  onPresetSave: (index: number, color: string) => Promise<void>;
}

export function ColorPickerField({
  color,
  presets,
  onColorChange,
  onPresetSave,
}: ColorPickerFieldProps) {
  const activeColor = normalizeHexColor(color) ?? "#ECEFF1";

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Kartenfarbe</p>
      <div className="grid grid-cols-10 gap-1.5">
        {presets.map((preset, index) => {
          const presetColor = normalizeHexColor(preset) ?? "#ECEFF1";
          const isActive = presetColor === activeColor;

          return (
            <button
              key={`${preset}-${index}`}
              type="button"
              title="Linksklick zum Übernehmen, Rechtsklick zum Speichern"
              className={cn(
                "aspect-square rounded-sm border transition-transform hover:scale-105",
                isActive ? "border-foreground ring-2 ring-foreground/30" : "border-border",
              )}
              style={{ backgroundColor: presetColor }}
              onClick={() => onColorChange(presetColor)}
              onContextMenu={(event) => {
                event.preventDefault();
                void onPresetSave(index, activeColor);
              }}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Linksklick = Farbe übernehmen · Rechtsklick = aktuelle Farbe in Preset speichern
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <HexColorPicker
          color={activeColor}
          onChange={(nextColor) => onColorChange(nextColor.toUpperCase())}
          className="!w-full max-w-[220px]"
        />
        <div className="space-y-2">
          <div
            className={cn(
              "flex h-16 w-28 items-center justify-center rounded-md border text-xs font-medium",
              getContrastTextClass(activeColor),
            )}
            style={{ backgroundColor: activeColor }}
          >
            Vorschau
          </div>
          <p className="font-mono text-xs text-muted-foreground">{activeColor}</p>
        </div>
      </div>
    </div>
  );
}