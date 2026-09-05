import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../lib/cn';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { Select } from './Select';

export type ColumnMeta = {
  align?: "left" | "right" | "center";
  code?: boolean;
  filtejrVariant?: "text" | "date" | "select";
  filterOptions?: { label: string; value: string }[];
  filterPlaceholder?: string;
};

type DataTableProps<T> = {
  columns: ColumnDef<T, any>[];
  data: T[];
  className?: string;
  meta?: Record<string, unknown>;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enablePagination?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  totalCount?: number;
  searchPlaceholder?: string;
  // Controlled filtering/sorting state for server-side or custom handling
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
  manualPagination?: boolean;
  manualFiltering?: boolean;
  manualSorting?: boolean;
};

export function DataTable<T>({
  columns,
  data,
  className,
  meta,
  enableFiltering = true,
  enableSorting = true,
  enablePagination = true,
  isLoading = false,
  emptyMessage = "No records found.",
  totalCount,
  searchPlaceholder,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange,
  sorting: externalSorting,
  onSortingChange,
  pagination: externalPagination,
  onPaginationChange,
  pageCount,
  manualPagination = false,
  manualFiltering = false,
  manualSorting = false,
}: DataTableProps<T>) {
  const [searchValue, setSearchValue] = useState<string>(externalGlobalFilter ?? '');
  const debouncedSearchValue = useDebounce(searchValue, 300);

  useEffect(() => {
    if (externalGlobalFilter !== undefined && externalGlobalFilter !== searchValue) {
      setSearchValue(externalGlobalFilter);
    }
  }, [externalGlobalFilter]);

  const isServerFiltered = manualFiltering || onGlobalFilterChange !== undefined;
  const globalFilter = externalGlobalFilter !== undefined ? externalGlobalFilter : debouncedSearchValue;

  const prevDebouncedRef = useRef<string>(debouncedSearchValue);
  useEffect(() => {
    if (prevDebouncedRef.current !== debouncedSearchValue) {
      prevDebouncedRef.current = debouncedSearchValue;
      if (onGlobalFilterChange) {
        onGlobalFilterChange(debouncedSearchValue);
      }
    }
  }, [debouncedSearchValue, onGlobalFilterChange]);

  const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalPagination, setInternalPagination] = useState<PaginationState>(
    {
      pageIndex: 0,
      pageSize: 10,
    },
  );

  const isControlledFilters = externalColumnFilters !== undefined;
  const columnFilters = isControlledFilters
    ? externalColumnFilters
    : internalColumnFilters;
  const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters;

  const isControlledSorting = externalSorting !== undefined;
  const sorting = isControlledSorting ? externalSorting : internalSorting;
  const setSorting = onSortingChange ?? setInternalSorting;

  const isControlledPagination = externalPagination !== undefined;
  const pagination = isControlledPagination
    ? externalPagination
    : internalPagination;
  const setPagination = onPaginationChange ?? setInternalPagination;

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
      sorting,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: isServerFiltered ? undefined : getFilteredRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    manualPagination,
    manualFiltering: isServerFiltered,
    manualSorting,
    pageCount,
    meta,
  });


  const totalItems =
    totalCount !== undefined
      ? totalCount
      : manualPagination
        ? (pageCount ?? 1) * pagination.pageSize
        : table.getFilteredRowModel().rows.length;

  const currentPage = pagination.pageIndex + 1;

  return (
    <div className={cn('overflow-x-auto', className)}>
      {enableFiltering && (
        <div className="flex items-center justify-between gap-4 border-b border-border bg-surface p-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder ?? 'Search all records...'}
              className="w-full rounded border border-border bg-surface-sunken py-1.5 pl-9 pr-3 text-body-sm text-text placeholder:text-text-muted outline-none focus:border-focus-ring"
            />
          </div>
        </div>
      )}
      <table className="w-full border-collapse text-body-sm">
        <thead>
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const colMeta =
                  (header.column.columnDef.meta as ColumnMeta) ?? {};
                const isRightAligned = colMeta.align === "right";
                const canSort = enableSorting && header.column.getCanSort();
                const isSorted = header.column.getIsSorted();

                return (
                  <th
                    key={header.id}
                    className={cn(
                      "whitespace-nowrap border-b border-border bg-surface-sunken px-4 py-3 text-left text-label font-medium text-text-muted select-none",
                      isRightAligned && "text-right font-mono",
                      canSort && "cursor-pointer hover:bg-surface-raised",
                    )}
                    onClick={
                      canSort
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5",
                        isRightAligned && "justify-end",
                      )}
                    >
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </span>
                      {canSort && (
                        <span className="text-text-muted">
                          {isSorted === "asc" ? (
                            <ArrowUp className="size-3.5 text-accent" />
                          ) : isSorted === "desc" ? (
                            <ArrowDown className="size-3.5 text-accent" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
          {enableFiltering &&
            table.getHeaderGroups().map((group) => (
              <tr
                key={`filter-row-${group.id}`}
                className="border-b border-border bg-surface-sunken/60"
              >
                {group.headers.map((header) => {
                  const colMeta =
                    (header.column.columnDef.meta as ColumnMeta) ?? {};
                  const canFilter =
                    header.column.getCanFilter() &&
                    header.column.columnDef.enableColumnFilter !== false;
                  const filterValue =
                    (header.column.getFilterValue() as string) ?? "";

                  return (
                    <th
                      key={`filter-cell-${header.id}`}
                      className="px-3 py-2 font-normal"
                    >
                      {canFilter ? (
                        colMeta.filterVariant === "select" &&
                        colMeta.filterOptions ? (
                          <Select
                            options={[
                              { label: "All", value: "" },
                              ...colMeta.filterOptions,
                            ]}
                            value={filterValue}
                            onValueChange={(val) =>
                              header.column.setFilterValue(val || undefined)
                            }
                            placeholder="All"
                          />
                        ) : colMeta.filterVariant === "date" ? (
                          <DatePicker
                            mode="single"
                            value={filterValue}
                            onChange={(value) =>
                              header.column.setFilterValue(value || undefined)
                            }
                            ariaLabel={colMeta.filterPlaceholder ?? "Filter by date"}
                          />
                        ) : (
                          <input
                            type="text"
                            value={filterValue}
                            onChange={(e) =>
                              header.column.setFilterValue(
                                e.target.value || undefined,
                              )
                            }
                            placeholder={
                              colMeta.filterPlaceholder ?? "Filter..."
                            }
                            className="w-full rounded border border-border bg-surface px-2.5 py-1 text-caption text-text outline-none focus:border-focus-ring"
                          />
                        )
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border">
                {columns.map((_, columnIndex) => (
                  <td key={columnIndex} className="px-4 py-4">
                    <Skeleton className="h-4" />
                  </td>
                ))}
              </tr>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4">
                <EmptyState message={emptyMessage} />
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border hover:bg-primary-subtle"
              >
                {row.getVisibleCells().map((cell) => {
                  const colMeta =
                    (cell.column.columnDef.meta as ColumnMeta) ?? {};
                  const isRightAligned = colMeta.align === "right";
                  const isCode = colMeta.code;

                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "border-b border-border px-4 py-3 leading-snug",
                        isRightAligned && "text-right font-mono",
                        isCode && "font-mono text-caption text-text-muted",
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!isLoading && enablePagination && totalItems > 0 && (
        <div className="border-t border-border px-4">
          <Pagination
            page={currentPage}
            pageSize={pagination.pageSize}
            total={totalItems}
            onPageChange={(nextPage) => {
              if (onPaginationChange) {
                onPaginationChange({
                  pageIndex: nextPage - 1,
                  pageSize: pagination.pageSize,
                });
              } else {
                setInternalPagination((prev) => ({
                  ...prev,
                  pageIndex: nextPage - 1,
                }));
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
