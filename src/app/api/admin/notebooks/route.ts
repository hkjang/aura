/**
 * Admin Notebooks API
 * GET: List all notebooks with filters
 * POST: Create notebook (admin)
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

    const { searchParams } = new URL(request.url);
    
    const filters = {
      status: searchParams.get("status") as "ACTIVE" | "INACTIVE" | "DELETED" | undefined,
      scope: searchParams.get("scope") as "PERSONAL" | "TEAM" | "ORGANIZATION" | undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      search: searchParams.get("search") || undefined,
      hasTemplate: searchParams.get("hasTemplate") === "true" 
        ? true 
        : searchParams.get("hasTemplate") === "false" 
        ? false 
        : undefined,
    };

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const result = await NotebookAdminService.getAllNotebooks(
      filters,
      page,
      pageSize
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin notebooks GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, name, ownerId } = body;

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "name and ownerId are required" },
        { status: 400 }
      );
    }

    let notebook;
    if (templateId) {
      notebook = await NotebookAdminService.createFromTemplate(
        templateId,
        name,
        ownerId
      );
    } else {
      // Direct creation would use regular NotebookService
      return NextResponse.json(
        { error: "Use templateId for admin creation" },
        { status: 400 }
      );
    }

    return NextResponse.json(notebook, { status: 201 });
  } catch (error) {
    console.error("Admin notebooks POST error:", error);
    return NextResponse.json(
      { error: "Failed to create notebook" },
      { status: 500 }
    );
  }
}
