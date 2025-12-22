/**
 * Admin Stats API
 * GET: Get admin dashboard statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotebookAdminService } from "@/lib/notebook/notebook-admin-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await NotebookAdminService.getAdminStats();
    const topOwners = await NotebookAdminService.getNotebooksByOwner(10);

    return NextResponse.json({
      ...stats,
      topOwners,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
