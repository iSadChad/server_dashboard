import { readdirSync, statSync } from "fs";
import path from "path";

function getFiles(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(base, fullPath);

    if (entry.isDirectory()) {
      files.push({
        name: entry.name,
        path: relativePath,
        type: "Folder",
        size: 0,
      });
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const typeMap = {
        ".pdf": "PDF",
        ".doc": "Word",
        ".docx": "Word",
        ".sql": "SQL",
        ".png": "Image",
        ".jpg": "Image",
        ".jpeg": "Image",
        ".gif": "Image",
        ".svg": "Image",
        ".mp4": "Video",
        ".mkv": "Video",
        ".avi": "Video",
      };
      let size = 0;
      try {
        size = statSync(fullPath).size;
      } catch {}
      files.push({
        name: entry.name,
        path: relativePath,
        type: typeMap[ext] || ext.replace(".", "").toUpperCase() || "File",
        size,
      });
    }
  }

  return files.sort((a, b) => {
    if (a.type === "Folder" && b.type !== "Folder") return -1;
    if (a.type !== "Folder" && b.type === "Folder") return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET() {
  const filesDir = path.join(process.cwd(), "files");

  try {
    statSync(filesDir);
  } catch {
    return Response.json([]);
  }

  try {
    const files = getFiles(filesDir);
    return Response.json(files);
  } catch {
    return Response.json([]);
  }
}