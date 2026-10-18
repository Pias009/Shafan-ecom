import { requireAdminSession, getAccessibleStoreIds } from "@/lib/admin-session";
import { getDashboardData } from "./data";
import { DashboardClient } from "./DashboardClient";

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard' };

export default async function Dashboard() {
  const session = await requireAdminSession();
  const data = await getDashboardData(await getAccessibleStoreIds());

  return <DashboardClient data={data} adminName={session.name || session.email || 'there'} />;
}
