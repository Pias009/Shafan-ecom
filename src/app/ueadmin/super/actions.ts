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
  revalidatePath("/ueadmin/super/admins");
}

export async function updateAdminRole(formData: FormData) {
  const session = await getServerAuthSession();
  
  if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;

  if (!userId || !role) throw new Error("Missing parameters");

  // Prevent modifying the super admin themselves
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (targetUser?.email === SUPER_ADMIN_EMAIL) {
    throw new Error("Cannot modify super admin role");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any }
  });

  revalidatePath("/ueadmin/super/admins");
}

export async function deleteAdmin(formData: FormData) {
  const session = await getServerAuthSession();
  
  if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("Missing user ID");

  // Prevent deleting the super admin
  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (targetUser?.email === SUPER_ADMIN_EMAIL) {
    throw new Error("Cannot delete super admin");
  }

  // Downgrade to USER role instead of deleting (safer)
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'USER' }
  });

  revalidatePath("/ueadmin/super/admins");
}

export async function resendInvite(formData: FormData) {
  const session = await getServerAuthSession();
  
  if (session?.user?.email !== SUPER_ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }

  const email = formData.get("email") as string;
  if (!email) throw new Error("Email is required");

  // In a real implementation, you would send an email here
  // For now, we'll just update the user to show they were re-invited
  await prisma.user.update({
    where: { email },
    data: { updatedAt: new Date() }
  });

  revalidatePath("/ueadmin/super/admins");
}
