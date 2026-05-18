const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function fileExists(urlPath) {
  const normalized = urlPath.replace(/^\//, "");
  return fs.existsSync(path.join(rootDir, normalized));
}

function validateTextFile(relativePath) {
  const content = read(relativePath);

  assert(content.charCodeAt(0) !== 0xfeff, `${relativePath}: remove UTF-8 BOM`);
  assert(!/\r\r\n/.test(content), `${relativePath}: remove duplicated CR line endings`);
  assert(!/\r(?!\n)/.test(content), `${relativePath}: remove bare CR line endings`);
  assert(!/[ÃÂÄÆÐÑ�]|[\u0080-\u009f]/.test(content), `${relativePath}: possible mojibake remains`);
}

function validateJson(relativePath) {
  try {
    JSON.parse(read(relativePath));
  } catch (error) {
    failures.push(`${relativePath}: invalid JSON (${error.message})`);
  }
}

function validateJs(relativePath) {
  const result = childProcess.spawnSync(process.execPath, ["--check", relativePath], {
    cwd: rootDir,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    failures.push(`${relativePath}: invalid JavaScript\n${result.stderr || result.stdout}`);
  }
}

function validateCss(relativePath) {
  const content = read(relativePath);
  const trimmed = content.trimStart();
  const firstStatement = trimmed.split("\n", 1)[0].trim();

  assert(firstStatement === '@charset "UTF-8";', `${relativePath}: @charset must be the first CSS statement`);

  const withoutStrings = content.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, "\"\"");
  let balance = 0;

  for (const char of withoutStrings) {
    if (char === "{") balance += 1;
    if (char === "}") balance -= 1;
    assert(balance >= 0, `${relativePath}: closing brace before matching opening brace`);
  }

  assert(balance === 0, `${relativePath}: unmatched CSS braces`);
}

function validateHtml() {
  const html = read("index.html");

  assert(/<meta\s+charset=["']utf-8["']\s*>/i.test(html), "index.html: missing UTF-8 meta charset");
  assert(html.search(/<meta\s+charset=["']utf-8["']/i) < html.search(/<title>/i), "index.html: charset meta should appear before title");

  for (const match of html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)) {
    const href = match[1];

    if (!/^https?:\/\//i.test(href)) {
      assert(fileExists(href), `index.html: missing linked file ${href}`);
    }
  }

  for (const match of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) {
    const src = match[1];

    if (!/^https?:\/\//i.test(src)) {
      assert(fileExists(src), `index.html: missing script file ${src}`);
    }
  }
}

const textFiles = [
  "index.html",
  "README.md",
  "server.js",
  "Input/tracking.js",
  "assets/css/styles.css",
  "assets/js/app.js",
  "data/products.json",
  "data/suppliers.json",
  "data/categories.json"
];

textFiles.forEach(validateTextFile);
["data/products.json", "data/suppliers.json", "data/categories.json"].forEach(validateJson);
["server.js", "Input/tracking.js", "assets/js/app.js"].forEach(validateJs);
validateCss("assets/css/styles.css");
validateHtml();

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Project validation passed.");
