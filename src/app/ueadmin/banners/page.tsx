import React from 'react';
import { prisma } from '@/lib/prisma';

export default async function BannersPage() {
  const banners = await (prisma as any).banner.findMany({
    select: { id: true, imageUrl: true, title: true, link: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Banners</h1>
      <table className="w-full border-collapse border border-black/10">
        <thead>
          <tr>
            <th className="border p-2">Image</th>
            <th className="border p-2">Title</th>
            <th className="border p-2">Link</th>
            <th className="border p-2">Active</th>
            <th className="border p-2">Created</th>
          </tr>
        </thead>
        <tbody>
          {banners.map((b: any) => (
            <tr key={b.id} className="even:bg-gray-100">
              <td className="border p-2"><img src={b.imageUrl} alt={b.title ?? 'banner'} style={{ height: 50, width: 'auto' }} /></td>
              <td className="border p-2">{b.title ?? ''}</td>
              <td className="border p-2">{b.link ?? ''}</td>
              <td className="border p-2">{b.active ? 'Yes' : 'No'}</td>
              <td className="border p-2">{new Date(b.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
