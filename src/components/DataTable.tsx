"use client";
import React, { useMemo, useState } from 'react';

type Column<T> = { key: keyof T | string; header: string; render?: (row: T) => React.ReactNode };

export default function DataTable<T>({ columns, data, pageSize = 5 }: { columns: Column<T>[]; data: T[]; pageSize?: number; }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const pageData = useMemo(() => {
    const start = page * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  return (
    <div>
      <table className="w-full border-collapse border border-black/10">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={String(c.header)} className="border p-2 text-left text-sm">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.map((row, idx) => (
            <tr key={idx} className="even:bg-gray-100">
              {columns.map((c) => (
                <td key={String(c.header) + idx} className="border p-2">
                  {c.render ? c.render(row) : (row as any)[c.key as string]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded border">Prev</button>
        <span className="px-2 py-1 text-sm text-black/60">Page {page + 1} / {totalPages}</span>
        <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 rounded border">Next</button>
      </div>
    </div>
  );
}
