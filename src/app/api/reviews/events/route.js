import { NextResponse } from "next/server";
import { listReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const limit = searchParams.get("limit") || "20";
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload = "";

      try {
        while (!req.signal.aborted) {
          const payload = await listReviews({ search, limit });
          const serialized = JSON.stringify(payload);

          if (serialized !== lastPayload) {
            controller.enqueue(encoder.encode(sse("reviews", payload)));
            lastPayload = serialized;
          } else {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }

          await sleep(4000);
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(sse("error", { error: err.message || "Reviews stream failed." }))
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
