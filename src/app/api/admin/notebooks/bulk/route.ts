/**
 * Admin Bulk Operations API
 * POST: Bulk update status, delete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotebookAdminService } from "@/lib/notebook/notebook-admin-service";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids array is required" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "update_status":
        if (!status) {
          return NextResponse.json(
            { error: "status is required for update_status action" },
            { status: 400 }
          );
        }
        result = await NotebookAdminService.bulkUpdateStatus(
          ids,
          status,
          session.user.id
        );
        break;

      case "delete":
        result = await NotebookAdminService.bulkDelete(ids, session.user.id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: update_status, delete" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin bulk operation error:", error);
    return NextResponse.json(
      { error: "Bulk operation failed" },
      { status: 500 }
    );
  }
}
