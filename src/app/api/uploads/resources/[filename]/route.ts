import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
  json: "application/json",
  zip: "application/zip",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Path traversal defense
    const safeFilename = path.basename(filename);
    const targetPath = path.join(process.cwd(), "public", "uploads", "resources", safeFilename);

    if (!fs.existsSync(/*turbopackIgnore: true*/ targetPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    const ext = path.extname(safeFilename).replace(".", "").toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const fileBuffer = await fs.promises.readFile(/*turbopackIgnore: true*/ targetPath);

    const isInline = ["pdf", "png", "jpg", "jpeg", "webp", "svg", "gif", "txt"].includes(ext);
    const disposition = isInline
      ? "inline"
      : `attachment; filename="${encodeURIComponent(safeFilename)}"`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving uploaded resource:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
