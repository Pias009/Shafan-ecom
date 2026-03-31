import { PrismaClient } from "@prisma/client";

async function testConnection() {
  console.log("Testing MongoDB connection...");
  
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || "mongodb+srv://Shanfa:Shanha90@cluster0.4utvsjg.mongodb.net/shafan-ecommerce?retryWrites=true&w=majority",
      },
    },
  });

  try {
    console.log("Connecting to:", process.env.DATABASE_URL ? "env DATABASE_URL" : "hardcoded URL");
    
    // Test connection with a simple query
    const count = await prisma.user.count();
    console.log("✅ Connection successful! User count:", count);
    
    // Test products
    const products = await prisma.product.findMany({ take: 3 });
    console.log("✅ Products found:", products.length);
    
  } catch (error: any) {
    console.error("❌ Connection failed!");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
