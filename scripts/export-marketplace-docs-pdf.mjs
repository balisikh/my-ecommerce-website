import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function firstExisting(paths) {
  for (const p of paths) {
    if (p && existsSync(p)) return p;
  }
  return null;
}

const root = process.cwd();
const inputHtml = path.resolve(root, "MARKETPLACE_DEVELOPER_DOCUMENTATION.html");
const outputPdf = path.resolve(root, "MARKETPLACE_DEVELOPER_DOCUMENTATION.pdf");

if (!existsSync(inputHtml)) {
  console.error(`Missing input HTML: ${inputHtml}`);
  process.exit(1);
}

const candidates = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browserExe = firstExisting(candidates);
if (!browserExe) {
  console.error(
    "Could not find Chrome/Edge. Set CHROME_PATH env var to your browser exe.",
  );
  process.exit(1);
}

const fileUrl = pathToFileURL(inputHtml).toString();

const args = [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--run-all-compositor-stages-before-draw",
  "--virtual-time-budget=10000",
  `--print-to-pdf=${outputPdf}`,
  "--print-to-pdf-no-header",
  fileUrl,
];

try {
  execFileSync(browserExe, args, { stdio: "inherit" });
} catch (e) {
  console.error("PDF export failed.");
  throw e;
}

if (!existsSync(outputPdf)) {
  console.error(`Expected PDF not created: ${outputPdf}`);
  process.exit(1);
}

console.log(`PDF created: ${outputPdf}`);

