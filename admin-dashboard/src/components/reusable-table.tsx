import { Card } from "./ui/card";
import { AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "./design-system";

type Column<T> = { key: keyof T; label: string };

type Props<T extends Record<string, unknown>> = {
  title: string;
  columns: Array<Column<T>>;
  data: T[];
};


export function ReusableTable<T extends Record<string, unknown>>({ title, columns, data }: Props<T>) {
  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-(--app-text-primary)">{title}</h3>
      <AppTable className="border-none bg-transparent p-0 shadow-none" containerClassName="min-w-[620px]">
          <AppTableHead>
            <tr>
              {columns.map((column) => (
                <AppTableHeaderCell key={String(column.key)}>
                  {column.label}
                </AppTableHeaderCell>
              ))}
            </tr>
          </AppTableHead>
          <tbody>
            {data.length ? data.map((item, index) => (
              <AppTableRow
                key={index}
                className="rounded-2xl bg-(--app-surface-muted) text-(--app-text-primary) shadow-(--app-shadow-soft) transition hover:-translate-y-0.5 hover:bg-(--app-surface)"
              >
                {columns.map((column) => (
                  <AppTableCell key={String(column.key)} className="px-4 py-3">
                    {String(item[column.key] ?? "-")}
                  </AppTableCell>
                ))}
              </AppTableRow>
            )) : (
              <tr>
                <td className="px-4 py-12 text-center text-sm text-(--app-text-secondary)" colSpan={columns.length}>
                  No records available for this filter set.
                </td>
              </tr>
            )}
          </tbody>
      </AppTable>
    </Card>
  );
}
