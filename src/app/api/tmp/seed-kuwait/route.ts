import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const kuwaitStore = await prisma.store.upsert({
      where: { code: 'KUW' },
      update: {},
      create: {
        code: 'KUW',
        name: 'Shafan Kuwait',
        country: 'Kuwait',
        region: 'Middle East',
        currency: 'KWD',
      }
    });

    return Response.json({ success: true, store: kuwaitStore });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
