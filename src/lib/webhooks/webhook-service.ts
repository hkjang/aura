import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// Webhook events
export type WebhookEvent = 
  | "CHAT_COMPLETE"
  | "CHAT_ERROR"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_PROCESSED"
  | "USER_REGISTERED"
  | "MODEL_SWITCHED"
  | "BUDGET_EXCEEDED";

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Find active webhooks subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: { isActive: true },
    });

    const eligibleWebhooks = webhooks.filter((wh) => {
      try {
        const events = JSON.parse(wh.events) as string[];
        return events.includes(event) || events.includes("*");
      } catch {
        return false;
      }
    });

    if (eligibleWebhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send webhooks in parallel
    const results = await Promise.allSettled(
      eligibleWebhooks.map((webhook) => sendWebhook(webhook, payload))
    );

    // Log results
    results.forEach((result, index) => {
      const webhook = eligibleWebhooks[index];
      if (result.status === "rejected") {
        console.error(`Webhook ${webhook.name} failed:`, result.reason);
      }
    });
  } catch (error) {
    console.error("Failed to trigger webhooks:", error);
  }
}

/**
 * Send a webhook request
 */
async function sendWebhook(
  webhook: { id: string; name: string; url: string; secret: string | null },
  payload: WebhookPayload
): Promise<void> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "Aura-Webhook/1.0",
    "X-Webhook-Event": payload.event,
  };

  // Add signature if secret is configured
  if (webhook.secret) {
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");
    headers["X-Webhook-Signature"] = `sha256=${signature}`;
  }

  const startTime = Date.now();
  let status = 0;
  let response = "";

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    status = res.status;
    response = await res.text().catch(() => "");

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${response}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Log failed webhook
    await logWebhook(webhook.id, payload.event, body, status || 0, errorMessage);
    throw error;
  }

  // Log successful webhook
  await logWebhook(webhook.id, payload.event, body, status, response);
}

/**
 * Log webhook execution
 */
async function logWebhook(
  webhookId: string,
  event: string,
  payload: string,
  status: number,
  response: string | null
): Promise<void> {
  try {
    await prisma.webhookLog.create({
      data: {
        webhookId,
        event,
        payload,
        status,
        response: response?.substring(0, 1000) || null, // Limit response size
      },
    });
  } catch (error) {
    console.error("Failed to log webhook:", error);
  }
}

// --- API Routes for Webhook Management ---

export async function getWebhooks(request: NextRequest) {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Parse events for each webhook
    const result = webhooks.map((wh) => ({
      ...wh,
      events: JSON.parse(wh.events || "[]"),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch webhooks:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function createWebhook(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, events, secret } = body;

    if (!name || !url || !events) {
      return NextResponse.json(
        { error: "Name, URL, and events are required" },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        events: JSON.stringify(events),
        secret: secret || null,
        isActive: true,
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Failed to create webhook:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function updateWebhook(id: string, body: Record<string, unknown>) {
  try {
    const { name, url, events, secret, isActive } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (url !== undefined) data.url = url;
    if (events !== undefined) data.events = JSON.stringify(events);
    if (secret !== undefined) data.secret = secret;
    if (isActive !== undefined) data.isActive = isActive;

    const webhook = await prisma.webhook.update({
      where: { id },
      data,
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Failed to update webhook:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function deleteWebhook(id: string) {
  try {
    await prisma.webhook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete webhook:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function getWebhookLogs(webhookId: string) {
  try {
    const logs = await prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch webhook logs:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
