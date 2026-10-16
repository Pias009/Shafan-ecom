import { prisma } from '@/lib/prisma';

// Resolve a brand name to its id. Matching is case-insensitive (the admin dropdown
// lists OFFICIAL_BRANDS like "CeraVe" while the DB has "Cerave"), and a brand that
// only exists in OFFICIAL_BRANDS is created, so a selection is never silently dropped.
export async function resolveBrandId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const existing = await prisma.brand.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.brand.upsert({
    where: { name: trimmed },
    update: {},
    create: { name: trimmed },
    select: { id: true },
  });
  return created.id;
}
