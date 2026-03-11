import { getServerAuthSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getServerAuthSession();
  const role = session?.user?.role;

  if (!session?.user) redirect("/auth/sign-in");
  if (role !== "ADMIN" && role !== "SUPERADMIN") redirect("/");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="glass glass-3d ring-icy rounded-3xl p-6">
        <div className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">
          Admin panel
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
          Dashboard (RBAC protected)
        </div>
        <div className="mt-3 text-sm text-white/70">
          Next: products / orders / coupons CRUD + super-admin management.
        </div>

        <div className="mt-6 grid gap-3 text-sm text-white/75">
          <div className="glass ring-icy rounded-2xl bg-white/5 px-4 py-3">
            Signed in as <span className="font-semibold text-white">{session.user.email}</span>
          </div>
          <div className="glass ring-icy rounded-2xl bg-white/5 px-4 py-3">
            Role: <span className="font-semibold text-white">{role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

