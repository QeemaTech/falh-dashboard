export { DataTable, type DataTableColumn } from "./layout/DataTable";
import { DataTable, type DataTableColumn } from "./layout/DataTable";

/** @deprecated Use DataTable from components/layout */
export function ReusableTable<T extends Record<string, unknown>>(
  props: {
    title: string;
    columns: Array<DataTableColumn<T>>;
    data: T[];
    loading?: boolean;
    emptyMessage?: string;
  },
) {
  return <DataTable {...props} />;
}
