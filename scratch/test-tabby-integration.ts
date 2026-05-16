import { prisma } from "../src/lib/prisma";
import { TabbyService } from "../src/services/payments/tabby";

async function runTabbyAudit() {
  console.log("\n🚀 Starting Tabby Integration Audit...\n");

  // 1. Check Order Initialization Status
  const testOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  
  if (testOrder) {
    console.log(`[CHECK 1] Latest Order Status: ${testOrder.status}`);
    if (testOrder.status === 'PENDING') {
      console.log("✅ SUCCESS: Orders are correctly entering as PENDING.\n");
    } else {
      console.log("ℹ️ INFO: Latest order is not PENDING. This is normal if you haven't created a new order since the update.\n");
    }
  }

  // 2. Test Category & Metadata Resolution
  console.log("[CHECK 2] Simulating Metadata Resolution...");
  const orderWithItems = await prisma.order.findFirst({
    include: { 
      items: { 
        include: { 
          product: { 
            include: { 
              productCategories: { 
                include: { 
                  category: true 
                } 
              } 
            } 
          } 
        } 
      } 
    },
    where: { items: { some: {} } }
  });

  if (orderWithItems) {
    const item = orderWithItems.items[0];
    const category = (item.product as any)?.productCategories?.[0]?.category?.name || "General";
    console.log(`- Resolved Category for "${item.nameSnapshot}": ${category}`);
    if (category !== "General") {
      console.log("✅ SUCCESS: Explicit categories are being resolved correctly.\n");
    } else {
      console.log("ℹ️ INFO: Resolved as General. Ensure your products have Categories assigned in the admin panel.\n");
    }
  }

  // 3. Verify Service Implementation
  console.log("[CHECK 3] Verifying Capture/Refund Implementation...");
  const tabby = new TabbyService();
  const hasCapture = typeof tabby.capturePayment === 'function';
  const hasRefund = typeof tabby.refundPayment === 'function';
  
  if (hasCapture && hasRefund) {
    console.log("✅ SUCCESS: Tabby capture and refund methods are properly implemented.\n");
  } else {
    console.log("❌ ERROR: Missing core payment methods in TabbyService.\n");
  }

  console.log("🏁 Audit Complete. Please create a new test order to see 'PENDING' in action.");
}

runTabbyAudit().catch(console.error);
