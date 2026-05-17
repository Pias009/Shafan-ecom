import { prisma } from '@/lib/prisma';
import { getAdminApiSession, getAccessibleStoreIds } from '@/lib/admin-session';

export async function DELETE(request: Request) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No orders selected' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const accessibleStoreIds = await getAccessibleStoreIds();
    
    if (accessibleStoreIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Unauthorized to delete orders' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    // Verify all orders to delete belong to accessible stores
    const orders = await (prisma as any).order.findMany({
      where: { id: { in: ids } },
      select: { id: true, storeId: true }
    });

    const validIds = orders
      .filter((o: any) => accessibleStoreIds.includes(o.storeId))
      .map((o: any) => o.id);

    if (validIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid orders found to delete' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Delete related records if needed, or if schema has cascading deletes, just delete the order
    // But since the schema might not have cascading deletes set up for all relations, we might just delete orders
    // Actually Prisma might have CASCADE defined, let's assume it does, or we can use deleteMany on order items first
    
    await (prisma as any).orderItem.deleteMany({
      where: { orderId: { in: validIds } }
    });

    await (prisma as any).order.deleteMany({
      where: { id: { in: validIds } }
    });

    return new Response(JSON.stringify({ success: true, count: validIds.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete orders' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
