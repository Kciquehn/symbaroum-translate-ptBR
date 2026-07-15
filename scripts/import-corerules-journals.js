const fs = require("fs");
const path = require("path");

const MODULE_FILE = "compendium/pt-BR/symbaroum-corerules.symbaroum-core-rules.json";
const WORK_DIR = path.join(".translation-work", "corerules");
const manifest = JSON.parse(fs.readFileSync(path.join(WORK_DIR, "manifest.json"), "utf8"));
const data = JSON.parse(fs.readFileSync(MODULE_FILE, "utf8"));
const journals = data.entries["Symbaroum Core Rules"].journals;

let applied = 0;
for (const page of manifest) {
  if (!fs.existsSync(page.translatedPath)) continue;
  const translated = fs.readFileSync(page.translatedPath, "utf8");
  if (!translated.trim()) continue;
  journals[page.journalKey].pages[page.pageKey].text = translated;
  if (page.translatedName && page.translatedName !== page.sourceName) {
    journals[page.journalKey].pages[page.pageKey].name = page.translatedName;
  }
  applied += 1;
}

fs.writeFileSync(MODULE_FILE, JSON.stringify(data, null, 2), "utf8");
JSON.parse(fs.readFileSync(MODULE_FILE, "utf8"));
console.log(`Applied ${applied} translated pages`);
