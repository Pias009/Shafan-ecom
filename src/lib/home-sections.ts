const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Validates the admin homepage-section form body (shared by the POST and PUT routes).
export function parseHomeSectionBody(body: any) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "Section heading is required" } as const;

  const productIds: string[] = Array.isArray(body.productIds)
    ? Array.from(new Set(body.productIds.filter((id: unknown) => typeof id === "string" && OBJECT_ID.test(id))))
    : [];
  if (productIds.length === 0) return { error: "Select at least one product" } as const;

  const categoryId = typeof body.categoryId === "string" && OBJECT_ID.test(body.categoryId) ? body.categoryId : null;

  return {
    data: {
      title,
      badge: typeof body.badge === "string" && body.badge.trim() ? body.badge.trim().slice(0, 12) : null,
      categoryId,
      productIds,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
      active: body.active !== false,
    },
  } as const;
}
