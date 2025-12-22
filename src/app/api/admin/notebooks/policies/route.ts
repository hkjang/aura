/**
 * Admin Policies API
 * GET: List all policies
 * POST: Create policy
 * PATCH: Update policy
 * DELETE: Delete policy
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PolicyAdminService } from "@/lib/notebook/policy-admin-service";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const filters = {
      policyType: searchParams.get("policyType") as "CREATION" | "MODIFICATION" | "DELETION" | "QA_CONTROL" | "UPLOAD" | undefined,
      scope: searchParams.get("scope") || undefined,
      isActive: searchParams.get("isActive") === "true" 
        ? true 
        : searchParams.get("isActive") === "false"
        ? false
        : undefined,
    };

    const policies = await PolicyAdminService.getAllPolicies(filters);

    return NextResponse.json({ policies });
  } catch (error) {
    console.error("Admin policies GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
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
    const { 
      name, 
      description, 
      policyType, 
      rules, 
      scope, 
      scopeId, 
      priority,
      blockExternalKnowledge,
      requireCitation,
      allowedQuestionTypes,
      maxContextTokens,
      systemPrompt
    } = body;

    if (!name || !policyType || !rules) {
      return NextResponse.json(
        { error: "name, policyType, and rules are required" },
        { status: 400 }
      );
    }

    const policy = await PolicyAdminService.createPolicy({
      name,
      description,
      policyType,
      rules,
      scope,
      scopeId,
      priority,
      blockExternalKnowledge,
      requireCitation,
      allowedQuestionTypes,
      maxContextTokens,
      systemPrompt,
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error("Admin policies POST error:", error);
    return NextResponse.json(
      { error: "Failed to create policy" },
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
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    let result;

    if (action === "toggle") {
      result = await PolicyAdminService.togglePolicyStatus(id);
    } else {
      result = await PolicyAdminService.updatePolicy(id, updateData);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin policies PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update policy" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await PolicyAdminService.deletePolicy(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin policies DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete policy" },
      { status: 500 }
    );
  }
}
