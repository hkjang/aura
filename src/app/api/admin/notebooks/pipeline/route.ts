/**
 * Admin Pipeline API
 * GET: Get pipeline configs and status
 * POST: Trigger operations (reindex, embedding update)
 * PATCH: Update config
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PipelineAdminService } from "@/lib/notebook/pipeline-admin-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notebookId = searchParams.get("notebookId");
    const type = searchParams.get("type"); // "configs" | "status" | "jobs"

    if (type === "configs") {
      const configs = await PipelineAdminService.getAllConfigs();
      return NextResponse.json({ configs });
    }

    if (type === "status" && notebookId) {
      const status = await PipelineAdminService.getNotebookPipelineStatus(notebookId);
      return NextResponse.json(status);
    }

    if (type === "jobs") {
      const filters = {
        status: searchParams.get("status") || undefined,
        jobType: searchParams.get("jobType") || undefined,
        notebookId: searchParams.get("notebookId") || undefined,
      };
      const page = parseInt(searchParams.get("page") || "1");
      const jobs = await PipelineAdminService.getProcessingJobs(filters, page);
      return NextResponse.json(jobs);
    }

    // Default: return all configs
    const configs = await PipelineAdminService.getAllConfigs();
    const defaultConfig = await PipelineAdminService.getDefaultConfig();
    
    return NextResponse.json({
      configs,
      defaultConfig,
    });
  } catch (error) {
    console.error("Admin pipeline GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline data" },
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
    const { action, notebookId, configData, jobId, newModel } = body;

    let result;

    switch (action) {
      case "create_config":
        if (!configData || !configData.name) {
          return NextResponse.json(
            { error: "configData with name is required" },
            { status: 400 }
          );
        }
        result = await PipelineAdminService.upsertConfig(configData, session.user.id);
        break;

      case "reindex":
        if (!notebookId) {
          return NextResponse.json(
            { error: "notebookId is required" },
            { status: 400 }
          );
        }
        result = await PipelineAdminService.triggerReindex(notebookId, session.user.id);
        break;

      case "update_embedding":
        if (!notebookId || !newModel) {
          return NextResponse.json(
            { error: "notebookId and newModel are required" },
            { status: 400 }
          );
        }
        result = await PipelineAdminService.triggerEmbeddingUpdate(
          notebookId,
          newModel,
          session.user.id
        );
        break;

      case "retry_job":
        if (!jobId) {
          return NextResponse.json(
            { error: "jobId is required" },
            { status: 400 }
          );
        }
        result = await PipelineAdminService.retryJob(jobId, session.user.id);
        break;

      case "cancel_job":
        if (!jobId) {
          return NextResponse.json(
            { error: "jobId is required" },
            { status: 400 }
          );
        }
        result = await PipelineAdminService.cancelJob(jobId);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin pipeline POST error:", error);
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { configId, ...updateData } = body;

    if (!configId) {
      return NextResponse.json(
        { error: "configId is required" },
        { status: 400 }
      );
    }

    const result = await PipelineAdminService.updateConfig(configId, updateData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin pipeline PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
