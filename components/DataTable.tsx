"use client";

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Inbox } from "lucide-react";

export interface ServerPagination {
  page: number; // 1-based index
  pageSize: number;
  total: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumn?: string;
  isLoading?: boolean;
  serverPagination?: ServerPagination;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export default function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search records...",
  isLoading = false,
  serverPagination,
  searchValue,
  onSearchChange
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [localSearch, setLocalSearch] = useState(searchValue ?? "");

  const isServer = Boolean(serverPagination);

  // Sync local search when parent searchValue changes
  useEffect(() => {
    if (searchValue !== undefined) {
      setLocalSearch(searchValue);
    }
  }, [searchValue]);

  // Handle search typing with debounce when onSearchChange is supplied
  useEffect(() => {
    if (onSearchChange && isServer) {
      const timer = setTimeout(() => {
        if (localSearch !== searchValue) {
          onSearchChange(localSearch);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [localSearch, onSearchChange, isServer, searchValue]);

  const [clientPagination, setClientPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  const totalPages = isServer
    ? (serverPagination?.totalPages ?? Math.max(1, Math.ceil((serverPagination?.total || 0) / (serverPagination?.pageSize || 10))))
    : 1;

  const currentPage = isServer ? (serverPagination?.page || 1) : 1;
  const pageSize = isServer ? (serverPagination?.pageSize || 10) : 10;
  const totalItems = isServer ? (serverPagination?.total || 0) : data.length;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: isServer ? undefined : localSearch,
      pagination: isServer
        ? {
            pageIndex: Math.max(0, currentPage - 1),
            pageSize
          }
        : clientPagination
    },
    onPaginationChange: isServer ? undefined : setClientPagination,
    manualPagination: isServer,
    pageCount: isServer ? totalPages : undefined,
    onSortingChange: setSorting,
    onGlobalFilterChange: isServer ? undefined : setLocalSearch,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  // Calculate display range safely
  const paginationState = table.getState().pagination || {
    pageIndex: 0,
    pageSize: 10
  };

  const activePageIndex = isServer ? Math.max(0, currentPage - 1) : paginationState.pageIndex;
  const activePageSize = isServer ? pageSize : paginationState.pageSize;
  const activeTotalPages = isServer ? Math.max(1, totalPages) : Math.max(1, table.getPageCount());
  const activeCurrentPage = isServer ? currentPage : activePageIndex + 1;

  const showingStart = totalItems === 0
    ? 0
    : isServer
    ? (currentPage - 1) * pageSize + 1
    : activePageIndex * activePageSize + 1;

  const showingEnd = isServer
    ? Math.min(currentPage * pageSize, totalItems)
    : Math.min((activePageIndex + 1) * activePageSize, totalItems);

  const canPrevious = isServer ? currentPage > 1 : table.getCanPreviousPage();
  const canNext = isServer ? currentPage < activeTotalPages : table.getCanNextPage();

  return (
    <div className="space-y-4 font-sans">
      {/* Search Input Filter */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (!isServer) {
                table.setGlobalFilter(e.target.value);
              }
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-white sm:bg-slate-50 border border-slate-200/80 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th
                        key={header.id}
                        className="px-3 sm:px-4 lg:px-6 py-3 select-none font-bold whitespace-nowrap text-[11px] sm:text-xs"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: header.column.getCanSort()
                                ? "cursor-pointer flex items-center gap-1.5 hover:text-slate-900 group"
                                : "",
                              onClick: header.column.getToggleSortingHandler()
                            }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-700 transition-colors" />
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-slate-400 text-xs font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading records...</span>
                    </div>
                  </td>
                </tr>
              ) : (isServer ? data.length : table.getRowModel().rows?.length) ? (
                (isServer ? table.getRowModel().rows : table.getRowModel().rows).map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-orange-50/20 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3.5 text-xs whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-16 text-slate-400 text-xs font-medium"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Inbox className="w-8 h-8 text-slate-300" />
                      <span>No records found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-3 sm:px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40 font-sans">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-center sm:text-left">
            <div>
              Showing{" "}
              <span className="font-bold text-slate-700">
                {showingStart}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-700">
                {showingEnd}
              </span>{" "}
              of <span className="font-bold text-slate-700">{totalItems}</span> entries
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 pl-2 sm:border-l border-slate-200">
              <span className="text-[11px] text-slate-500">Rows:</span>
              <select
                value={activePageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  if (isServer) {
                    serverPagination?.onPageSizeChange?.(newSize);
                  } else {
                    table.setPageSize(newSize);
                  }
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                {[10, 20, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 flex-wrap justify-center">
            <button
              onClick={() => {
                if (isServer) {
                  serverPagination?.onPageChange(1);
                } else {
                  table.setPageIndex(0);
                }
              }}
              disabled={!canPrevious}
              className="hidden sm:inline-flex px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold transition-colors cursor-pointer"
              title="First Page"
            >
              First
            </button>
            <button
              onClick={() => {
                if (isServer) {
                  serverPagination?.onPageChange(Math.max(1, currentPage - 1));
                } else {
                  table.previousPage();
                }
              }}
              disabled={!canPrevious}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2">
              Page {activeCurrentPage} of {activeTotalPages}
            </span>
            <button
              onClick={() => {
                if (isServer) {
                  serverPagination?.onPageChange(Math.min(totalPages, currentPage + 1));
                } else {
                  table.nextPage();
                }
              }}
              disabled={!canNext}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (isServer) {
                  serverPagination?.onPageChange(totalPages);
                } else {
                  table.setPageIndex(table.getPageCount() - 1);
                }
              }}
              disabled={!canNext}
              className="hidden sm:inline-flex px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-xs font-semibold transition-colors cursor-pointer"
              title="Last Page"
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
