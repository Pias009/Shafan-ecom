import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import { DEFAULT_REJUVENATE_SECTION, RejuvenateSectionConfig } from "@/lib/rejuvenate-section";
import RejuvenateSectionClient from "./_components/RejuvenateSectionClient";

export const dynamic = "force-dynamic";

export default async function RejuvenateAdminPage() {
  await requireAdminSession();

  const [setting, products] = await Promise.all([
    (prisma as any).appSettings.findUnique({
      where: { type: "rejuvenate_section" },
    }),
    (prisma as any).product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        mainImage: true,
        price: true,
        discountPrice: true,
        brand: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const initialConfig: RejuvenateSectionConfig = setting?.data
    ? { ...DEFAULT_REJUVENATE_SECTION, ...(setting.data as any) }
    : DEFAULT_REJUVENATE_SECTION;

  return (
    <RejuvenateSectionClient
      initialConfig={initialConfig}
      availableProducts={products || []}
    />
  );
}
