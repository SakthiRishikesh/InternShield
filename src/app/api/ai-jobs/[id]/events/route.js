import { NextResponse } from "next/server";
import { canReadJob, serializeJob } from "@/lib/jobProcessor";
import AiJob from "@/models/AiJob";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sse(event, data) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const access = await canReadJob(req, id, token);

  if (!access.allowed) {
    return NextResponse.json(
      { error: access.status === 404 ? "Job not found." : "Not authorized." },
      { status: access.status }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastPayload = "";

      try {
        while (!req.signal.aborted) {
          const job = await AiJob.findById(id).lean();

          if (!job) {
            controller.enqueue(encoder.encode(sse("error", { error: "Job not found." })));
            break;
          }

          const payload = serializeJob(job);
          const serialized = JSON.stringify(payload);

          if (serialized !== lastPayload) {
            controller.enqueue(encoder.encode(sse("job", payload)));
            lastPayload = serialized;
          } else {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }

          if (["completed", "failed"].includes(job.status)) {
            break;
          }

          await sleep(900);
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(sse("error", { error: err.message || "Job stream failed." }))
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
