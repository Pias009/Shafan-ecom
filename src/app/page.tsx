import HomeClient from "./HomeClient";
import { getHomePageData } from "@/lib/products";
import { Suspense } from "react";

export const dynamic = 'force-static';
export const revalidate = 300; // Revalidate every 5 minutes

export default async function HomePage() {
  const data = await getHomePageData();
  
  return (
    <Suspense fallback={null}>
      <HomeClient initialProducts={data.products} newArrivals={data.newArrivals} flashSales={data.flashSales} hot={data.trending} />
    </Suspense>
  );
}
