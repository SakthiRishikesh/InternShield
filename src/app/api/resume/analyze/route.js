import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { analyzeResumeWithAI } from "@/lib/aiScans";
import { extractTextFromUpload } from "@/lib/fileExtraction";
import { getAuthUser } from "@/lib/authGuard";
import { validateResumeFile } from "@/lib/resume";
import ResumeScan from "@/models/ResumeScan";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileName = "";
    let jdText = "";
    let resumeInfo = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      jdText = String(formData.get("jdText") || "");
      const file = formData.get("file");
      const validationError = validateResumeFile(file);

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      const extracted = await extractTextFromUpload(file, {
        label: "resume",
        maxChars: 7000,
      });
      fileName = extracted.fileName;
      resumeInfo = `${extracted.summary}\n\nExtracted resume content:\n${extracted.extractedText}`;
    } else {
      const body = await req.json();
      fileName = String(body.fileName || "");
      jdText = String(body.jdText || "");
      resumeInfo = String(body.resumeText || "");
    }

    if (!fileName || !resumeInfo.trim()) {
      return NextResponse.json(
        { error: "Upload a readable text-based PDF resume before starting the scan." },
        { status: 400 }
      );
    }

    const safeResult = await analyzeResumeWithAI({ resumeInfo, jdText });

    await connectDB();
    const user = await getAuthUser(req);
    const saved = await ResumeScan.create({
      userId: user?.id || null,
      fileName,
      jdText: jdText.slice(0, 3000),
      ...safeResult,
    });

    return NextResponse.json({
      ...safeResult,
      id: saved._id.toString(),
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error("[RESUME ANALYZE ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Resume analysis failed." },
      { status: 500 }
    );
  }
}
