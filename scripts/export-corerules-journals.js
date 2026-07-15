const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const SOURCE_COMMIT = "2abe3e1";
const MODULE_FILE = "compendium/pt-BR/symbaroum-corerules.symbaroum-core-rules.json";
const OUT_DIR = path.join(".translation-work", "corerules");

function slug(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function countTags(html) {
  const tags = ["div", "p", "h2", "h3", "h4", "h5", "blockquote", "table", "tr", "td", "ul", "ol", "li", "span", "a", "img", "br", "hr"];
  return Object.fromEntries(tags.map((tag) => [tag, (html.match(new RegExp(`<${tag}\\b`, "gi")) || []).length]));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const raw = execFileSync("git", ["show", `${SOURCE_COMMIT}:${MODULE_FILE}`], {
  encoding: "utf8",
  maxBuffer: 80 * 1024 * 1024,
});
const data = JSON.parse(raw);
const journals = data.entries["Symbaroum Core Rules"].journals;

const sourceDir = path.join(OUT_DIR, "source");
const translatedDir = path.join(OUT_DIR, "translated");
ensureDir(sourceDir);
ensureDir(translatedDir);

const manifest = [];
let index = 0;
for (const [journalKey, journal] of Object.entries(journals)) {
  for (const [pageKey, page] of Object.entries(journal.pages || {})) {
    const id = String(index).padStart(3, "0") + "-" + slug(`${journalKey}-${pageKey}`);
    const sourcePath = path.join(sourceDir, `${id}.html`);
    const translatedPath = path.join(translatedDir, `${id}.html`);
    fs.writeFileSync(sourcePath, page.text || "", "utf8");
    manifest.push({
      id,
      index,
      journalKey,
      pageKey,
      sourceName: page.name || pageKey,
      translatedName: page.name || pageKey,
      sourcePath,
      translatedPath,
      chars: (page.text || "").length,
      counts: countTags(page.text || ""),
    });
    index += 1;
  }
}

fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Exported ${manifest.length} journal pages to ${OUT_DIR}`);
