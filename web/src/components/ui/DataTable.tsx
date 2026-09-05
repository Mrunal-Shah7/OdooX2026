import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { cn } from '../../lib/cn';

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  className?: string;
  meta?: Record<string, unknown>;
};

export function DataTable<T>({ columns, data, className, meta }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse text-body-sm">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    'whitespace-nowrap border-b border-border bg-surface-sunken px-4 py-3 text-left text-label font-medium text-text-muted',
                    header.column.columnDef.meta &&
                      (header.column.columnDef.meta as { align?: string }).align === 'right' &&
                      'text-right font-mono',
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-primary-subtle">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className={cn(
                    'border-b border-border px-4 py-3 leading-snug',
                    cell.column.columnDef.meta &&
                      (cell.column.columnDef.meta as { align?: string }).align === 'right' &&
                      'text-right font-mono',
                    cell.column.columnDef.meta &&
                      (cell.column.columnDef.meta as { code?: boolean }).code &&
                      'font-mono text-caption text-text-muted',
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
