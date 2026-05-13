import { NextResponse } from "next/server";
import {
  createAiJob,
  processVerificationJob,
  serializeJob,
} from "@/lib/jobProcessor";
import { validateVerificationFile } from "@/lib/verification";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let file = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = String(formData.get("text") || "");
      file = formData.get("file");
    } else {
      const body = await req.json();
      text = String(body.text || "");
    }

    const fileError = validateVerificationFile(file);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    if (!text.trim() && !file?.name) {
      return NextResponse.json(
        { error: "Provide details or upload a readable PDF before running the scan." },
        { status: 400 }
      );
    }

    const { job, clientToken } = await createAiJob({
      req,
      type: "verification",
      fileName: file?.name || "",
      inputText: text,
    });

    processVerificationJob(job._id.toString(), { text, file });

    return NextResponse.json(
      {
        job: serializeJob(job),
        streamToken: clientToken,
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("[VERIFY JOB CREATE ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Failed to start verification job." },
      { status: 500 }
    );
  }
}
