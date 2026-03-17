import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@shafan.com";
  const password = "Admin@Shafan2024";
  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      role: "SUPERADMIN",
      name: "Shafan Admin",
    },
    create: {
      email,
      name: "Shafan Admin",
      passwordHash: hash,
      role: "SUPERADMIN",
    },
  });

  console.log("✅ Admin user created/updated:");
  console.log("   Email   :", user.email);
  console.log("   Password: Admin@Shafan2024");
  console.log("   Role    :", user.role);
  console.log("   ID      :", user.id);
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
