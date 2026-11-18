import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { createServer } from "vite";

let vite;
let LessonContent;

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  ({ default: LessonContent } = await vite.ssrLoadModule(
    "/src/components/LessonContent.tsx",
  ));
});

after(async () => {
  await vite?.close();
});

function render(content) {
  return renderToStaticMarkup(React.createElement(LessonContent, { content }));
}

test("renders headings, emphasis, lists, and fenced code", () => {
  const html = render(
    "# Título\n\nTexto **importante** e *ênfase*.\n\n- Primeiro\n- Segundo\n\n```js\nconst answer = 42;\n```",
  );

  assert.match(html, /<h1>Título<\/h1>/);
  assert.match(html, /<strong>importante<\/strong>/);
  assert.match(html, /<em>ênfase<\/em>/);
  assert.match(html, /<ul>[\s\S]*<li>Primeiro<\/li>[\s\S]*<li>Segundo<\/li>[\s\S]*<\/ul>/);
  assert.match(html, /<pre><code class="language-js">const answer = 42;\n<\/code><\/pre>/);
});

test("renders GFM tables and task lists", () => {
  const html = render(
    "| Conceito | Valor |\n| --- | --- |\n| Resposta | 42 |\n\n- [x] Concluída",
  );

  assert.match(html, /<div class="lesson-markdown-table"><table>/);
  assert.match(html, /<th>Conceito<\/th>/);
  assert.match(html, /<td>42<\/td>/);
  assert.match(html, /type="checkbox" disabled="" checked=""/);
});

test("renders plain text", () => {
  assert.equal(
    render("Uma explicação sem formatação."),
    '<div class="lesson-markdown"><p>Uma explicação sem formatação.</p></div>',
  );
});

test("does not render raw HTML or unsafe link protocols", () => {
  const html = render(
    '<script>alert("x")</script>\n\n<img src=x onerror="alert(1)">\n\n[link](javascript:alert%281%29)',
  );

  assert.doesNotMatch(html, /<script(?:\s|>)/i);
  assert.doesNotMatch(html, /<img(?:\s|>)/i);
  assert.doesNotMatch(html, /href=["']javascript:/i);
  assert.match(html, /&lt;script&gt;/);
});