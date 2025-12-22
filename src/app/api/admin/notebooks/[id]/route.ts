/**
 * Admin Notebook Detail API
 * GET: Get notebook details
 * PATCH: Update status, settings
 * DELETE: Soft delete
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotebookAdminService } from "@/lib/notebook/notebook-admin-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const notebook = await NotebookAdminService.getNotebookById(id);

    if (!notebook) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    return NextResponse.json(notebook);
  } catch (error) {
    console.error("Admin notebook GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebook" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, action } = body;

    let result;

    if (action === "restore") {
      result = await NotebookAdminService.restoreNotebook(id, session.user.id);
    } else if (action === "duplicate_template") {
      const { templateName } = body;
      if (!templateName) {
        return NextResponse.json(
          { error: "templateName is required" },
          { status: 400 }
        );
      }
      result = await NotebookAdminService.duplicateAsTemplate(
        id,
        templateName,
        session.user.id
      );
    } else if (status) {
      result = await NotebookAdminService.updateNotebookStatus(
        id,
        status,
        session.user.id
      );
    } else {
      return NextResponse.json(
        { error: "No valid action specified" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin notebook PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update notebook" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    let result;
    if (permanent) {
      result = await NotebookAdminService.permanentlyDelete(id, session.user.id);
    } else {
      result = await NotebookAdminService.softDeleteNotebook(id, session.user.id);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin notebook DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete notebook" },
      { status: 500 }
    );
  }
}
