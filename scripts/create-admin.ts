import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default development admin user
  const email = "pvs178380@gmail.com";
  const password = "pias900";
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: "SUPERADMIN",
      name: "Development Admin",
      isVerified: true,
      emailVerified: new Date(),
    },
    create: {
      email,
      name: "Development Admin",
      passwordHash: hash,
      role: "SUPERADMIN",
      isVerified: true,
      emailVerified: new Date(),
    },
  });

  console.log("✅ Development admin user created/updated:");
  console.log("   Email   :", user.email);
  console.log("   Password: pias900 (development only)");
  console.log("   Role    :", user.role);
  console.log("   ID      :", user.id);
  console.log("   Verified:", user.isVerified);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
