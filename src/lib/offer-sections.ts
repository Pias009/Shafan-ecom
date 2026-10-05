const OBJECT_ID = /^[a-f0-9]{24}$/i;

// Validates the admin offer-section form body (shared by the POST and PUT routes).
export function parseOfferSectionBody(body: any) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "Title is required" } as const;

  const productIds: string[] = Array.isArray(body.productIds)
    ? Array.from(new Set(body.productIds.filter((id: unknown) => typeof id === "string" && OBJECT_ID.test(id))))
    : [];
  if (productIds.length === 0) return { error: "Select at least one product" } as const;

  return {
    data: {
      title,
      subtitle: typeof body.subtitle === "string" && body.subtitle.trim() ? body.subtitle.trim() : null,
      productIds,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
      active: body.active !== false,
    },
  } as const;
}
