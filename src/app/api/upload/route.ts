// src/app/api/upload/route.ts
import { NextResponse } from "next/server";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export const config = { api: { bodyParser: false } };

const uploadDir = path.join(process.cwd(), "public/uploads/it_files");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const form = formidable({
  uploadDir,
  keepExtensions: true, // <-- keeps .pdf, .docx, …
  maxFileSize: 20 * 1024 * 1024, // 20 MB
  // no filter → any file type
});

export async function POST(req: Request) {
  const bodyStream = req.body;
  if (!bodyStream)
    return NextResponse.json({ error: "No body" }, { status: 400 });

  const nodeStream = Readable.from(
    (async function* () {
      const reader = bodyStream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield Buffer.from(value);
        }
      } finally {
        reader.releaseLock();
      }
    })(),
  );

  const streamWithHeaders: any = nodeStream;
  streamWithHeaders.headers = Object.fromEntries(req.headers.entries());
  streamWithHeaders.method = req.method;
  streamWithHeaders.url = req.url;

  return new Promise<NextResponse>((resolve) => {
    form.parse(streamWithHeaders, async (err, fields, files: any) => {
      if (err) {
        console.error("Formidable error:", err);
        const msg = err.message.includes("maxFileSize")
          ? "File too large (max 20 MB)."
          : "File parsing failed.";
        return resolve(
          NextResponse.json({ error: msg }, { status: err.httpCode || 500 }),
        );
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file)
        return resolve(
          NextResponse.json({ error: "No file" }, { status: 400 }),
        );

      const newFileName = `${Date.now()}-${file.originalFilename}`;
      const newPath = path.join(uploadDir, newFileName);

      try {
        await fs.promises.rename(file.filepath, newPath);
        const url = `/uploads/it_files/${newFileName}`;

        resolve(
          NextResponse.json({
            url,
            mimeType: file.mimetype ?? "application/octet-stream",
          }),
        );
      } catch (e: any) {
        console.error("Rename error:", e);
        resolve(NextResponse.json({ error: "Save failed" }, { status: 500 }));
      }
    });
  });
}
