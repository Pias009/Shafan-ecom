import type { Metadata } from 'next';
import { AdminSessionUnavailableError, getAdminSession } from '@/lib/admin-session';
import { UeAdminLayoutContent } from './_components/UeAdminLayoutContent';
import { AdminUnavailable } from './_components/AdminUnavailable';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'Admin · SHANFA', template: '%s · SHANFA Admin' },
  robots: { index: false, follow: false },
};

export default async function UeAdminLayout({ children }: { children: React.ReactNode }) {
  // Resolved once per hard load; client navigations keep this layout mounted.
  let session;
  try {
    session = await getAdminSession();
  } catch (error) {
    // Valid login but the database didn't answer: show a retry screen, never "logged out".
    if (error instanceof AdminSessionUnavailableError) {
      return (
        <div className="admin-scope min-h-dvh bg-[#F6F7F9]" data-admin-panel="true">
          <AdminUnavailable />
        </div>
      );
    }
    throw error;
  }

  const user = session
    ? { id: session.id, email: session.email ?? null, name: session.name ?? null, role: session.role }
    : null;

  return <UeAdminLayoutContent user={user}>{children}</UeAdminLayoutContent>;
}
