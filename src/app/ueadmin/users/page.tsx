import React from 'react';
import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  const users = await (prisma as any).user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <table className="w-full border-collapse border border-black/10">
        <thead>
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Created</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="even:bg-gray-100">
              <td className="border p-2">{u.email}</td>
              <td className="border p-2">{u.name ?? ''}</td>
              <td className="border p-2">{u.role}</td>
              <td className="border p-2">{new Date(u.createdAt).toLocaleString()}</td>
              <td className="border p-2"><a href={`/ueadmin/users/${u.id}`} className="text-blue-600 hover:underline">Edit</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
