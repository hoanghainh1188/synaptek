// Server tĩnh tối giản (zero-dep) phục vụ bản export `dist/` cho E2E — MIRROR Vercel production:
// mọi route không map tới file thật → trả `index.html` (SPA fallback, giống rewrite "/(.*)"→"/index.html"
// trong vercel.json). Dùng cho CI thay dev server `expo start --web` (bundle JIT chậm + từng rò rỉ bộ
// nhớ → OOM, D53). Chạy: `node scripts/serve-dist.mjs [port]` (mặc định 8081, hoặc env PORT).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const DIST = join(process.cwd(), "dist");
const PORT = Number(process.argv[2] ?? process.env.PORT ?? 8081);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
};

const send = (res, status, body, type) => {
  res.writeHead(status, { "content-type": type });
  res.end(body);
};

// Chặn path traversal: chuẩn hoá rồi kiểm vẫn nằm trong DIST.
function safeJoin(urlPath) {
  const p = normalize(join(DIST, decodeURIComponent(urlPath)));
  return p.startsWith(DIST) ? p : null;
}

const server = createServer(async (req, res) => {
  const urlPath = (req.url ?? "/").split("?")[0];
  const filePath = urlPath === "/" ? null : safeJoin(urlPath);

  if (filePath) {
    try {
      const s = await stat(filePath);
      if (s.isFile()) {
        return send(
          res,
          200,
          await readFile(filePath),
          TYPES[extname(filePath)] ?? "application/octet-stream",
        );
      }
    } catch {
      // không có file → rơi xuống SPA fallback
    }
  }
  // SPA fallback (mirror Vercel): mọi route còn lại → index.html, client router tự dựng.
  try {
    return send(res, 200, await readFile(join(DIST, "index.html")), TYPES[".html"]);
  } catch {
    return send(
      res,
      500,
      "dist/index.html không tồn tại — chạy `npm run build:web` trước.",
      TYPES[".txt"],
    );
  }
});

server.listen(PORT, () => console.log(`serve-dist: http://localhost:${PORT} (dist=${DIST})`));
