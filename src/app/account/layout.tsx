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

  return (
    <div className="mx-auto max-w-7xl px-3 md:px-6 py-4 md:py-10 min-h-screen">
      <AccountDashboardHeader />
      
      <div className="flex flex-col md:grid md:grid-cols-[260px_1fr] gap-4 md:gap-8 mt-4 md:mt-8">
        <div className="w-full md:w-auto order-2 md:order-1">
          <AccountNav />
        </div>
        <main className="min-w-0 w-full order-1 md:order-2">
          <Suspense fallback={<div className="flex justify-center py-20"><Loader /></div>}>
              {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
