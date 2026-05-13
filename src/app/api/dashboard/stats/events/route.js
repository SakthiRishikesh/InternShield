import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/authGuard";
import { getDashboardStats } from "@/lib/dashboardStats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req) {
  let user;

  try {
    user = await requireAuth(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload = "";

      try {
        while (!req.signal.aborted) {
          const payload = await getDashboardStats(user.id);
          const serialized = JSON.stringify(payload);

          if (serialized !== lastPayload) {
            controller.enqueue(encoder.encode(sse("dashboard", payload)));
            lastPayload = serialized;
          } else {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }

          await sleep(4000);
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(sse("error", { error: err.message || "Dashboard stream failed." }))
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
