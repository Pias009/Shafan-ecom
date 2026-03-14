import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

type User = { id: string; email: string; name?: string; role?: string };

export default async function UserEditPage({ params }: { params: { id: string } }) {
  // Fetch user on the server side using Prisma
  const user: User | null = await (prisma as any).user.findUnique({
    where: { id: params.id },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    return (
      <div>
        <p>User not found</p>
        <Link href="/ueadmin/users">Back to Users</Link>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <form action={`/api/admin/users/${user.id}`} method="post" className="grid gap-3 max-w-md">
        <label className="text-sm">Email</label>
        <input type="email" name="email" defaultValue={user.email} className="border p-2 rounded" />
        <label className="text-sm">Name</label>
        <input type="text" name="name" defaultValue={user.name ?? ''} className="border p-2 rounded" />
        <label className="text-sm">Role</label>
        <select name="role" defaultValue={user.role ?? 'USER'} className="border p-2 rounded">
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPERADMIN">SUPERADMIN</option>
        </select>
        <label className="text-sm">Password</label>
        <input type="password" name="password" placeholder="New password (optional)" className="border p-2 rounded" />
        <button type="submit" className="py-2 px-4 rounded bg-primary text-white">Save</button>
      </form>
      <div className="mt-4"><Link href="/ueadmin/users">Back to Users</Link></div>
    </div>
  );
}
