import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, "http://127.0.0.1");
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(root, safePath);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!existsSync(filePath) && !path.extname(filePath)) {
    filePath = path.join(filePath, "index.html");
  }

  if (!filePath.startsWith(root)) {
    return null;
  }

  return filePath;
}

export function createStaticServer() {
  return createServer((request, response) => {
    const filePath = resolveRequestPath(request.url ?? "/");

    if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "content-type": mimeTypes[extension] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(filePath).pipe(response);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const portArgIndex = process.argv.indexOf("--port");
  const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : 4187;
  const server = createStaticServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`Renove Atlas site serving at http://127.0.0.1:${port}/`);
  });
}
