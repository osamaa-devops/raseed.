import type { ReactNode } from "react";

type DataTableProps<T> = {
  columns: string[];
  rows: T[];
  renderRow: (row: T) => ReactNode;
};

export function DataTable<T>({ columns, rows, renderRow }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 text-right font-semibold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  );
}
