import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { AccountNav } from "./_components/AccountNav";
import { AccountDashboardHeader } from "./_components/AccountDashboardHeader";
import { Suspense } from "react";
import { Loader } from "@/components/Loader";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Providers } from "@/app/providers";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return redirect("/?login=true");
  }

  return (
    <Providers>
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10 pt-24 min-h-screen">
        <AccountDashboardHeader />
        
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <AccountNav />
          <main className="min-w-0">
            <Suspense fallback={<div className="flex justify-center py-20"><Loader /></div>}>
                {children}
            </Suspense>
          </main>
        </div>
      </div>
      <Footer />
    </Providers>
  );
}
