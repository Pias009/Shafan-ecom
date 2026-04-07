import { prisma } from '@/lib/prisma';

async function cleanupDummyOrders() {
  console.log('Starting database cleanup...');
  
  try {
    // First delete all order items (due to foreign key constraints)
    const deletedItems = await prisma.orderItem.deleteMany({});
    console.log(`Deleted ${deletedItems.count} order items`);
    
    // Then delete all orders
    const deletedOrders = await prisma.order.deleteMany({});
    console.log(`Deleted ${deletedOrders.count} orders`);
    
    console.log('✅ Database cleanup completed successfully!');
    console.log('All dummy orders and test data have been removed from the Admin Panel.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
  
  await prisma.$disconnect();
}

cleanupDummyOrders();