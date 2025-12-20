import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const password = await hash('admin123', 12);
    const user = await prisma.user.upsert({
      where: { email: 'admin@aura.com' },
      update: {},
      create: {
        email: 'admin@aura.com',
        name: 'Admin User',
        password,
        role: 'ADMIN',
      },
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
