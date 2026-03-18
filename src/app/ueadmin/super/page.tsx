"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

// Simple Super Admin Console skeleton
export default function SuperAdminPanel() {
  const [admins, setAdmins] = useState([]);

  useEffect(() => {
    async function fetchAdmins(){
      try {
        const res = await fetch('/api/admin/super/list');
        if (res.ok) setAdmins(await res.json());
      } catch {}
    }
    fetchAdmins();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Console</h1>
      <section className="glass-panel p-4 rounded-2xl border">
        <h2 className="text-xl font-semibold mb-2">Admins</h2>
        <ul className="list-disc pl-6 space-y-2 max-h-60 overflow-auto">
          {admins.map((a: any) => (
            <li key={a.id} className="flex items-center justify-between">
              <span>{a.email} — {a.name ?? ''} ({a.role})</span>
              <span className="text-xs text-black/60">Verified: {a.isVerified ? 'Yes' : 'No'}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel p-4 rounded-2xl border">
        <h2 className="text-xl font-semibold mb-2">Invite Admin</h2>
        <p className="text-sm text-black/60 mb-2">Use this to create a new admin and send a verification email (implementation to be added).</p>
        <Link href="/ueadmin/super/add" className="px-4 py-2 rounded bg-primary text-white">Add Admin (soon)</Link>
      </section>
    </div>
  );
}
