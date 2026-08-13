import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

export async function GET() {
  try {
    const names = await readdir(UPLOAD_DIR);
    const files = [];
    for (const name of names) {
      if (name.startsWith(".")) continue;
      const ext = path.extname(name).toLowerCase();
      if (!IMAGE_EXT.has(ext)) continue;
      const full = path.join(UPLOAD_DIR, name);
      const info = await stat(full);
      if (!info.isFile()) continue;
      files.push({
        name,
        url: `/uploads/${name}`,
        size: info.size,
        mtime: info.mtime.toISOString(),
      });
    }
    files.sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
