#!/usr/bin/env node
// Render a city itinerary JSON file into one standalone HTML page (styles and script inlined, works offline).
// 把城市行程 JSON 渲染成一个独立的 HTML 文件（样式和脚本都内联，离线也能打开）。
// Usage / 用法: node render.mjs <plan.json> [output.html]
// No dependencies, Node 18+.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(here, "..", "template");

const [, , input, outputArg] = process.argv;
if (!input) {
  console.error("Usage: node render.mjs <plan.json> [output.html]");
  process.exit(1);
}

let data;
try {
  data = JSON.parse(await readFile(input, "utf8"));
} catch (e) {
  console.error(`Could not parse JSON: ${e.message}`);
  process.exit(1);
}

const problems = validate(data);
if (problems.length) {
  console.error("The JSON does not match the expected format:\n- " + problems.join("\n- "));
  process.exit(1);
}

const [shell, style, script] = await Promise.all(
  ["shell.html", "style.css", "render.js"].map((f) => readFile(path.join(templateDir, f), "utf8"))
);

// Escape "</" so text inside the JSON can never close the <script> tag early.
const json = JSON.stringify(data, null, 2).replace(/<\//g, "<\\/");
const parts = { TITLE: escapeHtml(text(data.title, data.lang) || text(data.city, data.lang)), STYLE: style, DATA: json, SCRIPT: script };
// One pass over the shell, so placeholder-like text inside the data is never replaced.
const html = shell.replace(/\{\{(TITLE|STYLE|DATA|SCRIPT)\}\}/g, (_, k) => parts[k]);

const output = outputArg || input.replace(/\.json$/i, "") + ".html";
await writeFile(output, html, "utf8");
console.log(`Wrote ${output} (${`${data.days.length} days, ${data.days.reduce((n, x) => n + (x.stops || []).length, 0)} stops`}, ${Buffer.byteLength(html)} bytes)`);

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}
// A text field is a non-empty string or a localized object such as {"zh": "…", "en": "…"}.
function isLoc(v) {
  return !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0 &&
    Object.keys(v).every((k) => k === "zh" || k === "en");
}
function isText(v) {
  return (typeof v === "string" && v !== "") || (isLoc(v) && Object.values(v).some((x) => typeof x === "string" && x !== ""));
}
function text(v, lang) {
  if (typeof v === "string") return v;
  if (isLoc(v)) return v[lang === "en" ? "en" : "zh"] || v.zh || v.en || "";
  return "";
}
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }

// Only checks what rendering needs; see schema/city.schema.json for the full format.
function validate(d) {
  const p = [];
  if (typeof d !== "object" || d === null || Array.isArray(d)) return ["the top level must be an object"];
  for (const k of ["title", "city", "queriedAt"]) {
    if (!isText(d[k])) p.push(`missing text field "${k}"`);
  }
  if (d.lang != null && !["zh", "en"].includes(d.lang)) p.push('"lang" must be "zh" or "en"');
  if (d.languages != null && (!Array.isArray(d.languages) || d.languages.some((l) => !["zh", "en"].includes(l)))) p.push('"languages" must be an array of "zh" / "en"');
  const CATS = ["market", "arch", "art", "artclassic", "alt", "view", "ride", "tour", "history", "nature", "event", "food", "other"];
  if (!Array.isArray(d.days)) {
    p.push('"days" must be an array');
    return p;
  }
  d.days.forEach((day, i) => {
    const id = `day ${i + 1}`;
    if (!day || typeof day !== "object") return p.push(`days[${i}] must be an object`);
    if (!Array.isArray(day.stops)) return p.push(`${id}: "stops" must be an array`);
    day.stops.forEach((s, j) => {
      if (!isText(s.name)) p.push(`${id}, stop ${j + 1}: missing name`);
      if (s.cat && !CATS.includes(s.cat)) p.push(`${id}, stop ${j + 1}: unknown cat "${s.cat}"`);
      if ((s.lat != null || s.lng != null) && !(isNum(s.lat) && isNum(s.lng))) p.push(`${id}, stop ${j + 1}: lat and lng must both be numbers`);
    });
  });
  (d.bookAhead || []).forEach((b, i) => {
    if (b.status && !["urgent", "soon", "ok", "done"].includes(b.status)) p.push(`bookAhead[${i}]: status must be urgent / soon / ok / done`);
  });
  (d.shows || []).forEach((x, i) => {
    if (x.kind && !["concert", "comedy", "theatre", "festival"].includes(x.kind)) p.push(`shows[${i}]: kind must be concert / comedy / theatre / festival`);
    if (x.status && !["onsale", "few", "soldout", "resale", "soon"].includes(x.status)) p.push(`shows[${i}]: status must be onsale / few / soldout / resale / soon`);
  });
  (d.media || []).forEach((x, i) => {
    if (!isText(x.title)) p.push(`media[${i}] is missing title`);
    if (x.kind && !["film", "doc", "series", "book", "podcast"].includes(x.kind)) p.push(`media[${i}]: kind must be film / doc / series / book / podcast`);
  });
  return p;
}
