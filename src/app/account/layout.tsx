import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AccountNav } from "./_components/AccountNav";
import { AccountDashboardHeader } from "./_components/AccountDashboardHeader";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return redirect("/auth/sign-in");
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 pt-32 min-height-screen">
      <AccountDashboardHeader />
      
      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <AccountNav />
        <main className="min-w-0">
          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-black/10" /></div>}>
              {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
