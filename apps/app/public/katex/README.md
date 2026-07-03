Copy TỰ SINH từ `node_modules/katex/dist/` qua `npm run sync:katex` (script
`scripts/sync-katex-assets.mjs`) — phục vụ D53. **KHÔNG sửa tay** — CI chạy lại sync rồi `git diff`
chống lệch (gate "KaTeX assets in sync", giống pattern `sync:edge` cho code, D13).

Nạp qua thẻ `<link>` tĩnh trong `KatexSpan.web.tsx` — KHÔNG qua `import` cấp JS (Metro dev server rò
rỉ bộ nhớ khi bundle lại CSS này qua nhiều request, gây OOM crash khi chạy e2e dài) và KHÔNG qua
`@import` CSS (Metro không resolve, im lặng bỏ qua).

Cập nhật khi nâng cấp `katex` trong `package.json`:

```bash
npm run sync:katex
```
