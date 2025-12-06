export function exportToCSV(
  data: Record<string, unknown>[],
  headers: { key: string; label: string }[],
  filename: string
) {
  if (data.length === 0) return;

  const headerRow = headers.map(h => h.label).join(",");
  const rows = data.map(row =>
    headers.map(h => {
      const value = row[h.key];
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(",")
  );

  const csv = [headerRow, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatCurrency(value: string | number | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num)) return "0";
  return num.toLocaleString("id-ID");
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("id-ID");
}
