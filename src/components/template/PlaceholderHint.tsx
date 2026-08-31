export function PlaceholderHint() {
  return (
    <p className="text-xs text-muted-foreground">
      Verwenden Sie die Platzhalter <code>{"{services}"}</code> für die
      ausgewählten Leistungen, <code>{"{price}"}</code> für den Gesamtpreis,{" "}
      <code>{"{goa}"}</code> für GOÄ-Ziffern und <code>{"{parameter}"}</code>{" "}
      für Parameter.
    </p>
  );
}