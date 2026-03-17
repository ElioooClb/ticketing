export function formatDate(dateValue: string | Date | null): string {
  if (!dateValue) {
    return "-";
  }

  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
