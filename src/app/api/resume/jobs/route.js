import { NextResponse } from "next/server";
import { createAiJob, processResumeJob, serializeJob } from "@/lib/jobProcessor";
import { validateResumeFile } from "@/lib/resume";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Upload a resume PDF before starting the scan." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const jdText = String(formData.get("jdText") || "");
    const validationError = validateResumeFile(file);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { job, clientToken } = await createAiJob({
      req,
      type: "resume_scan",
      fileName: file?.name || "",
      jdText,
    });

    processResumeJob(job._id.toString(), { file, jdText });

    return NextResponse.json(
      {
        job: serializeJob(job),
        streamToken: clientToken,
      },
      { status: 202 }
    );
  } catch (err) {
    console.error("[RESUME JOB CREATE ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Failed to start resume analysis." },
      { status: 500 }
    );
  }
}
