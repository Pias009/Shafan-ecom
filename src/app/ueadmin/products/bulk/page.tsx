"use client";
import React, { useState } from 'react';

export default function BulkEdit() {
  const [ids, setIds] = useState("");
  const [updates, setUpdates] = useState({ price: '', stockQuantity: '', categoryName: '', brandName: '', active: true as any, name: '', images: '', variants: '' });
  const [status, setStatus] = useState(null as string | null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ids: ids.split(',').map(s => s.trim()).filter(Boolean),
      updates: {
        name: updates['name'] || undefined,
        price: updates['price'] ? Number(updates['price']) : undefined,
        discountPrice: undefined,
        active: updates['active'] !== undefined ? updates['active'] : undefined,
        stockQuantity: updates['stockQuantity'] ? Number(updates['stockQuantity']) : undefined,
        images: updates['images'] ? updates['images'] : undefined,
        brandName: updates['brandName'] || undefined,
        categoryName: updates['categoryName'] || undefined,
        variants: updates['variants'] || undefined,
      }
    };

    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    setStatus(`Updated: ${data.updated}, Failed: ${data.failed}`);
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-3">Bulk Edit Products (admin)</h2>
      <form onSubmit={onSubmit} className="grid gap-3 max-w-xl">
        <label>Product IDs (comma-separated)</label>
        <input className="border p-2 rounded" value={ids} onChange={(e)=>setIds(e.target.value)} onInput={(e)=>setIds((e.target as HTMLInputElement).value)} />
        <label>Price - optional</label>
        <input className="border p-2 rounded" placeholder="e.g. 1999" onChange={(e)=>setUpdates({...updates, price: e.target.value})} />
        <label>Stock Quantity - optional</label>
        <input className="border p-2 rounded" placeholder="e.g. 25" onChange={(e)=>setUpdates({...updates, stockQuantity: e.target.value})} />
        <label>Brand Name - optional</label>
        <input className="border p-2 rounded" onChange={(e)=>setUpdates({...updates, brandName: e.target.value})} />
        <label>Category Name - optional</label>
        <input className="border p-2 rounded" onChange={(e)=>setUpdates({...updates, categoryName: e.target.value})} />
        <button type="submit" className="py-2 px-4 rounded bg-blue-600 text-white">Apply Bulk</button>
      </form>
      {status && <div className="mt-2 text-sm text-green-700">{status}</div>}
    </div>
  );
}
