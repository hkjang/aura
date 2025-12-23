/**
 * DSL Rules API - CRUD and execution endpoints
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compileDSL, registerRuleSet, getASTSummary, lintDSL, diffASTs, jsonToAST } from "@/lib/notebook/dsl-api";

export const dynamic = "force-dynamic";

// GET /api/dsl-rules - List or get specific rule set
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    // Get single rule set
    if (id) {
      const ruleSet = await prisma.systemConfig.findUnique({
        where: { key: `dsl_ruleset_${id}` },
      });

      if (!ruleSet) {
        return NextResponse.json({ error: "Rule set not found" }, { status: 404 });
      }

      const data = JSON.parse(ruleSet.value);

      // Compile and return with metadata
      if (action === "compile") {
        const result = compileDSL(data.dsl);
        return NextResponse.json({
          ...data,
          compiled: result.success,
          ast: result.ast,
          errors: result.errors,
          warnings: result.warnings,
          summary: result.ast ? getASTSummary(result.ast) : null,
          lint: result.ast ? lintDSL(result.ast) : null,
        });
      }

      return NextResponse.json(data);
    }

    // List all rule sets
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { startsWith: "dsl_ruleset_" },
      },
      orderBy: { key: "asc" },
    });

    const ruleSets = configs.map(c => {
      const data = JSON.parse(c.value);
      return {
        id: c.key.replace("dsl_ruleset_", ""),
        name: data.name,
        version: data.version,
        scope: data.scope,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        ruleCount: data.ruleCount || 0,
      };
    });

    return NextResponse.json({ ruleSets });
  } catch (error) {
    console.error("Failed to fetch DSL rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

// POST /api/dsl-rules - Create or compile rule set
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, dsl, name, id } = body;

    // Just compile without saving
    if (action === "compile") {
      const result = compileDSL(dsl);
      return NextResponse.json({
        success: result.success,
        ast: result.ast,
        errors: result.errors,
        warnings: result.warnings,
        summary: result.ast ? getASTSummary(result.ast) : null,
        lint: result.ast ? lintDSL(result.ast) : null,
      });
    }

    // Validate DSL
    if (!dsl) {
      return NextResponse.json({ error: "DSL content is required" }, { status: 400 });
    }

    const result = compileDSL(dsl);
    if (!result.success) {
      return NextResponse.json({
        error: "DSL compilation failed",
        errors: result.errors,
        warnings: result.warnings,
      }, { status: 400 });
    }

    // Generate ID if not provided
    const ruleSetId = id || result.ast!.name.toLowerCase().replace(/\s+/g, "_");
    const key = `dsl_ruleset_${ruleSetId}`;

    // Save to database
    const data = {
      name: result.ast!.name,
      version: result.ast!.version,
      scope: result.ast!.scope,
      dsl,
      ast: result.ast,
      isActive: true,
      ruleCount: result.ast!.rules.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: JSON.stringify(data) },
      update: { value: JSON.stringify(data) },
    });

    // Register for runtime use
    registerRuleSet(ruleSetId, dsl);

    return NextResponse.json({
      id: ruleSetId,
      success: true,
      ruleCount: result.ast!.rules.length,
      lint: lintDSL(result.ast!),
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to save DSL rules:", error);
    return NextResponse.json({ error: "Failed to save rules" }, { status: 500 });
  }
}

// PATCH /api/dsl-rules - Update rule set
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const body = await req.json();
    const key = `dsl_ruleset_${id}`;

    const existing = await prisma.systemConfig.findUnique({
      where: { key },
    });

    if (!existing) {
      return NextResponse.json({ error: "Rule set not found" }, { status: 404 });
    }

    const existingData = JSON.parse(existing.value);

    // If updating DSL, compile and validate
    if (body.dsl) {
      const result = compileDSL(body.dsl);
      if (!result.success) {
        return NextResponse.json({
          error: "DSL compilation failed",
          errors: result.errors,
        }, { status: 400 });
      }

      // Calculate diff
      const oldAST = jsonToAST(JSON.stringify(existingData.ast));
      const diff = oldAST ? diffASTs(oldAST, result.ast!) : [];

      const updatedData = {
        ...existingData,
        dsl: body.dsl,
        ast: result.ast,
        version: result.ast!.version,
        ruleCount: result.ast!.rules.length,
        updatedAt: new Date().toISOString(),
      };

      await prisma.systemConfig.update({
        where: { key },
        data: { value: JSON.stringify(updatedData) },
      });

      // Re-register for runtime
      registerRuleSet(id, body.dsl);

      return NextResponse.json({
        success: true,
        diff,
        lint: lintDSL(result.ast!),
      });
    }

    // Update other fields (isActive, etc.)
    const updatedData = {
      ...existingData,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await prisma.systemConfig.update({
      where: { key },
      data: { value: JSON.stringify(updatedData) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update DSL rules:", error);
    return NextResponse.json({ error: "Failed to update rules" }, { status: 500 });
  }
}

// DELETE /api/dsl-rules - Delete rule set
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const key = `dsl_ruleset_${id}`;

    await prisma.systemConfig.delete({
      where: { key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete DSL rules:", error);
    return NextResponse.json({ error: "Failed to delete rules" }, { status: 500 });
  }
}
