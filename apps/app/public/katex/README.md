Copy nguyên văn từ `node_modules/katex/dist/` (KaTeX v0.17.0), phục vụ D53.

Nạp qua thẻ `<link>` tĩnh trong `KatexSpan.web.tsx` — KHÔNG qua `import` cấp JS (Metro dev server rò
rỉ bộ nhớ khi bundle lại CSS này qua nhiều request, gây OOM crash khi chạy e2e dài) và KHÔNG qua
`@import` CSS (Metro không resolve, im lặng bỏ qua).

Cập nhật khi nâng cấp `katex` trong `package.json`:

```bash
cp node_modules/katex/dist/katex.min.css apps/app/public/katex/katex.min.css
cp -r node_modules/katex/dist/fonts apps/app/public/katex/fonts
```
