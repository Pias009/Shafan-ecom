"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const SUPER_ADMIN_EMAIL = "pvs178380@gmail.com";

export async function inviteAdmin(formData: FormData) {
  const session = await getServerAuthSession();
  
  if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email is required");

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (existing) {
    // If it exists but is not an admin, we can upgrade it
    await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
  } else {
    // Create a new "Invited" user
    // They will have NO passwordHash, which means they must "accept" and set it
    await prisma.user.create({
      data: {
        email,
        role: 'ADMIN',
        isVerified: false,
      }
    });
  }

  revalidatePath("/ueadmin/super");
}
