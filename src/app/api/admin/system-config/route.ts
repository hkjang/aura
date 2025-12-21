import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET all system configs (key-value pairs)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // Allow access if user is logged in (for now, for easier testing)
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' }
    });

    // Mask sensitive values (show only last 4 chars for API keys)
    const maskedConfigs = configs.map(c => ({
      ...c,
      value: c.key.toLowerCase().includes('key') || c.key.toLowerCase().includes('secret')
        ? (c.value ? `***${c.value.slice(-4)}` : '')
        : c.value
    }));

    return NextResponse.json({ configs: maskedConfigs });
  } catch (error) {
    console.error("System config fetch error:", error);
    return NextResponse.json({ error: "설정을 불러올 수 없습니다." }, { status: 500 });
  }
}

// POST - Create or Update a system config
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Allow access if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { key, value, description } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "키가 필요합니다." }, { status: 400 });
    }

    // Upsert the config
    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { 
        value: value || null,
        description: description || null,
        updatedAt: new Date()
      },
      create: {
        key,
        value: value || null,
        description: description || null
      }
    });

    // Log the change (without the actual value for security)
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any).id || "system",
        action: "SYSTEM_CONFIG_UPDATE",
        resource: key,
        details: JSON.stringify({ description })
      }
    });

    return NextResponse.json({ 
      success: true, 
      config: {
        ...config,
        value: config.key.toLowerCase().includes('key') 
          ? `***${(config.value || '').slice(-4)}`
          : config.value
      }
    });
  } catch (error) {
    console.error("System config update error:", error);
    return NextResponse.json({ error: "설정 저장에 실패했습니다." }, { status: 500 });
  }
}

// DELETE - Remove a system config
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // Allow access if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "키가 필요합니다." }, { status: 400 });
    }

    await prisma.systemConfig.delete({
      where: { key }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("System config delete error:", error);
    return NextResponse.json({ error: "설정 삭제에 실패했습니다." }, { status: 500 });
  }
}
