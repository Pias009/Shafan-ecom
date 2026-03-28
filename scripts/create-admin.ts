import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Use environment variables for admin credentials
  const email = process.env.DEMO_SUPERADMIN_EMAIL || "superadmin@example.com";
  const password = process.env.DEMO_SUPERADMIN_PASSWORD || "superadmin123";
  
  if (!email || !password) {
    console.error("❌ Error: DEMO_SUPERADMIN_EMAIL and DEMO_SUPERADMIN_PASSWORD environment variables are required");
    process.exit(1);
  }
  
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: "SUPERADMIN",
      name: "Super Admin",
      isVerified: true,
      emailVerified: new Date(),
      approvedBySuperAdmin: true, // Super admin is auto-approved
    },
    create: {
      email,
      name: "Super Admin",
      passwordHash: hash,
      role: "SUPERADMIN",
      isVerified: true,
      emailVerified: new Date(),
      approvedBySuperAdmin: true, // Super admin is auto-approved
    },
  });

  console.log("✅ Super admin user created/updated:");
  console.log("   Email   :", user.email);
  console.log("   Password:", password.replace(/./g, '•'), "(from environment)");
  console.log("   Role    :", user.role);
  console.log("   ID      :", user.id);
  console.log("   Verified:", user.isVerified);
  console.log("   Approved:", user.approvedBySuperAdmin);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
