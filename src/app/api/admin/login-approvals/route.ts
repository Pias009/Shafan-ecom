import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET all pending login approvals
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const approvals = await prisma.loginApproval.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("GET_LOGIN_APPROVALS_ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST to approve/reject a login request
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { approvalId, action, rejectionReason } = await req.json();

    if (!approvalId || !action) {
      return NextResponse.json({ error: "Missing approvalId or action" }, { status: 400 });
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json({ error: "Invalid action. Must be APPROVE or REJECT" }, { status: 400 });
    }

    // Find the approval
    const approval = await prisma.loginApproval.findUnique({
      where: { id: approvalId },
      include: { user: true },
    });

    if (!approval) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }

    if (approval.status !== "PENDING") {
      return NextResponse.json({ error: "Approval request already processed" }, { status: 400 });
    }

    if (action === "APPROVE") {
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

      // Send notification email to admin
      // TODO: Implement email notification

      return NextResponse.json({ 
        success: true, 
        message: "Login request approved successfully",
        approvalId 
      });
    } else {
      // REJECT action
      if (!rejectionReason) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      await prisma.loginApproval.update({
        where: { id: approvalId },
        data: {
          status: "REJECTED",
          rejectionReason,
        },
      });

      // Send rejection email to admin
      // TODO: Implement email notification

      return NextResponse.json({ 
        success: true, 
        message: "Login request rejected",
        approvalId 
      });
    }
  } catch (error) {
    console.error("PROCESS_LOGIN_APPROVAL_ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}