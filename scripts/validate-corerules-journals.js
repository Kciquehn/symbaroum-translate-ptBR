const fs = require("fs");
const path = require("path");

const WORK_DIR = path.join(".translation-work", "corerules");
const manifest = JSON.parse(fs.readFileSync(path.join(WORK_DIR, "manifest.json"), "utf8"));

function countTags(html) {
  const tags = ["div", "p", "h2", "h3", "h4", "h5", "blockquote", "table", "tr", "td", "ul", "ol", "li", "span", "a", "img", "br", "hr"];
  return Object.fromEntries(tags.map((tag) => [tag, (html.match(new RegExp(`<${tag}\\b`, "gi")) || []).length]));
}

function hasBrokenText(html) {
  return /\uFFFD|Ã.|Â.|Comp\?|regi\?|civiliza\?\?|d\?cadas|m\?gic|tradi\?\?|rela\?\?/.test(html);
}

let translated = 0;
const problems = [];
for (const page of manifest) {
  if (!fs.existsSync(page.translatedPath)) continue;
  const html = fs.readFileSync(page.translatedPath, "utf8");
  if (!html.trim()) continue;
  translated += 1;
  const counts = countTags(html);
  for (const [tag, expected] of Object.entries(page.counts)) {
    if (counts[tag] !== expected) {
      problems.push(`${page.id}: <${tag}> count ${counts[tag]} != ${expected}`);
    }
  }
  if (hasBrokenText(html)) problems.push(`${page.id}: possible mojibake`);
}

console.log(`Translated pages: ${translated}/${manifest.length}`);
if (problems.length) {
  console.error(problems.slice(0, 200).join("\n"));
  process.exit(1);
}
console.log("Validation OK");
