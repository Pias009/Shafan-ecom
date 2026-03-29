"use server";

import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveLoginRequest(formData: FormData) {
  try {
    const session = await getServerAuthSession();
    
    if (!session || !session.user || session.user.role !== "SUPERADMIN") {
      throw new Error("Unauthorized");
    }

    const approvalId = formData.get("approvalId") as string;
    if (!approvalId) throw new Error("Approval ID is required");

    // Find the approval
    const approval = await prisma.loginApproval.findUnique({
      where: { id: approvalId },
      include: { user: true },
    });

    if (!approval) {
      throw new Error("Approval request not found");
    }

    if (approval.status !== "PENDING") {
      throw new Error("Approval request already processed");
    }

    // Update approval status
    await prisma.loginApproval.update({
      where: { id: approvalId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    // Update user to mark as approved
    await prisma.user.update({
      where: { id: approval.userId },
      data: {
        approvedBySuperAdmin: true,
        requiresApproval: false,
      },
    });

    // TODO: Send notification email to admin

    revalidatePath("/ueadmin/super/approvals");
    revalidatePath("/ueadmin/super");

    return { success: true, message: "Login request approved successfully" };
  } catch (error) {
    console.error("APPROVE_LOGIN_REQUEST_ERROR:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function rejectLoginRequest(formData: FormData) {
  try {
    const session = await getServerAuthSession();
    
    if (!session || !session.user || session.user.role !== "SUPERADMIN") {
      throw new Error("Unauthorized");
    }

    const approvalId = formData.get("approvalId") as string;
    const rejectionReason = formData.get("rejectionReason") as string;
    
    if (!approvalId) throw new Error("Approval ID is required");
    if (!rejectionReason) throw new Error("Rejection reason is required");

    // Find the approval
    const approval = await prisma.loginApproval.findUnique({
      where: { id: approvalId },
    });

    if (!approval) {
      throw new Error("Approval request not found");
    }

    if (approval.status !== "PENDING") {
      throw new Error("Approval request already processed");
    }

    // Update approval status
    await prisma.loginApproval.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        rejectionReason,
      },
    });

    // TODO: Send rejection email to admin

    revalidatePath("/ueadmin/super/approvals");
    revalidatePath("/ueadmin/super");

    return { success: true, message: "Login request rejected" };
  } catch (error) {
    console.error("REJECT_LOGIN_REQUEST_ERROR:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}