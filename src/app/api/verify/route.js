import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { analyzeVerificationWithAI } from "@/lib/aiScans";
import { extractTextFromUpload } from "@/lib/fileExtraction";
import { getAuthUser } from "@/lib/authGuard";
import { validateVerificationFile } from "@/lib/verification";
import Verification from "@/models/Verification";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let fileName = "";
    let extractedText = "";
    let fileSummary = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      text = String(formData.get("text") || "");
      const file = formData.get("file");
      const fileError = validateVerificationFile(file);

      if (fileError) {
        return NextResponse.json({ error: fileError }, { status: 400 });
      }

      if (file && file.name) {
        const extracted = await extractTextFromUpload(file, {
          label: "offer document",
          maxChars: 5000,
        });
        fileName = extracted.fileName;
        extractedText = extracted.extractedText;
        fileSummary = extracted.summary;
      }
    } else {
      const body = await req.json();
      text = String(body.text || "");
      fileName = String(body.fileName || "");
    }

    const inputText = [text.trim(), fileSummary, extractedText && `Extracted file content:\n${extractedText}`]
      .filter(Boolean)
      .join("\n\n");

    if (!inputText.trim()) {
      return NextResponse.json(
        { error: "Provide details or upload a readable PDF before running the scan." },
        { status: 400 }
      );
    }

    const safeResult = await analyzeVerificationWithAI(inputText);

    let saved = null;

    try {
      await connectDB();
      const user = await getAuthUser(req);
      saved = await Verification.create({
        userId: user?.id || null,
        inputText: inputText.slice(0, 5000),
        fileName,
        ...safeResult,
      });
    } catch (err) {
      console.warn("[VERIFY SAVE WARNING]", err.message);
    }

    return NextResponse.json({
      ...safeResult,
      id: saved?._id?.toString() || null,
      createdAt: saved?.createdAt || new Date().toISOString(),
      persisted: Boolean(saved),
    });
  } catch (err) {
    console.error("[VERIFY ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Verification failed." },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const history = await Verification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      history: history.map((verification) => ({
        id: verification._id.toString(),
        score: verification.score,
        status: verification.status,
        tone: verification.tone,
        reason: verification.reason,
        fileName: verification.fileName,
        inputText: verification.inputText?.slice(0, 100),
        createdAt: verification.createdAt,
      })),
    });
  } catch (err) {
    console.error("[VERIFY HISTORY ERROR]", err);
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 });
  }
}
