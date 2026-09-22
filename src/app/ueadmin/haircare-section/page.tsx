import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-session";
import {
  DEFAULT_HAIRCARE_SECTION,
  HairCareSectionConfig,
} from "@/lib/haircare-section";
import HairCareSectionClient from "./_components/HairCareSectionClient";

export const dynamic = "force-dynamic";

export default async function HairCareAdminPage() {
  await requireAdminSession();

  const [setting, products] = await Promise.all([
    (prisma as any).appSettings.findUnique({
      where: { type: "haircare_section" },
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
        productCategories: {
          include: { category: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const initialConfig: HairCareSectionConfig = setting?.data
    ? { ...DEFAULT_HAIRCARE_SECTION, ...(setting.data as any) }
    : DEFAULT_HAIRCARE_SECTION;

  return (
    <HairCareSectionClient
      initialConfig={initialConfig}
      availableProducts={products || []}
    />
  );
}