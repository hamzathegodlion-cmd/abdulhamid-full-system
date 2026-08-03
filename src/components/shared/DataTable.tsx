import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchField?: (row: T) => string;
  pageSize?: number;
  actions?: (row: T) => React.ReactNode;
  emptyText?: string;
  loading?: boolean;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchField,
  pageSize = 8,
  actions,
  emptyText = 'No records found',
  loading = false
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filteredData = data.filter(row => {
    if (!query) return true;
    if (searchField) {
      return searchField(row).toLowerCase().includes(query.toLowerCase());
    }
    return JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <div className="text-xs text-zinc-400">
          Showing <span className="font-semibold text-zinc-200">{filteredData.length}</span> entries
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-950/60 text-[10px] uppercase tracking-wider font-semibold text-zinc-400 border-b border-zinc-800">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-4 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="px-4 py-4">
                      <div className="h-4 bg-zinc-800 rounded-md w-3/4"></div>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4 text-right">
                      <div className="h-4 bg-zinc-800 rounded-md w-16 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <Inbox className="w-10 h-10 stroke-[1.5] mb-2 text-zinc-600" />
                    <p className="text-xs font-medium text-zinc-300">{emptyText}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Try searching for something else or reset filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/40 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-4 py-3.5 text-zinc-200 ${col.className || ''}`}>
                      {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as any)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3.5 text-right font-medium">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3.5 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 bg-zinc-950/30">
          <div>
            Page <span className="font-semibold text-zinc-200">{currentPage}</span> of{' '}
            <span className="font-semibold text-zinc-200">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-zinc-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
