/**
 * Admin Sources API
 * GET: List all sources with filters
 * POST: Bulk operations (delete, tag, quality check)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SourceAdminService } from "@/lib/notebook/source-admin-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      notebookId: searchParams.get("notebookId") || undefined,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

    const result = await SourceAdminService.getAllSources(filters, page, pageSize);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin sources GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
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
    const { action, ids, sourceId, tags, notebookId } = body;

    let result;

    switch (action) {
      case "delete":
        if (!ids || !Array.isArray(ids)) {
          return NextResponse.json(
            { error: "ids array is required" },
            { status: 400 }
          );
        }
        result = await SourceAdminService.bulkDelete(ids, session.user.id);
        break;

      case "tag":
        if (!ids || !Array.isArray(ids) || !tags) {
          return NextResponse.json(
            { error: "ids and tags are required" },
            { status: 400 }
          );
        }
        result = await SourceAdminService.bulkTag(ids, tags, session.user.id);
        break;

      case "quality_check":
        if (!sourceId) {
          return NextResponse.json(
            { error: "sourceId is required" },
            { status: 400 }
          );
        }
        result = await SourceAdminService.checkQuality(sourceId);
        break;

      case "check_duplicates":
        if (!notebookId) {
          return NextResponse.json(
            { error: "notebookId is required" },
            { status: 400 }
          );
        }
        result = await SourceAdminService.checkDuplicates(notebookId);
        break;

      case "reprocess":
        if (!sourceId) {
          return NextResponse.json(
            { error: "sourceId is required" },
            { status: 400 }
          );
        }
        result = await SourceAdminService.forceReprocess(sourceId, session.user.id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin sources POST error:", error);
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}
