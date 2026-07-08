import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { extractActivityPage } from "@/lib/ingest/extract";
import { buildActivityMonth, type RawDay } from "@/lib/ingest/postprocess";

function fail(msg: string): never {
  console.error(`\nError: ${msg}`);
  console.error("\nUsage: npm run ingest -- --type activities --month YYYY-MM photo1.jpg [photo2.jpg ...]");
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const opt = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const type = opt("type");
  const month = opt("month");
  const files = args.filter((a, i) => !a.startsWith("--") && args[i - 1]?.startsWith("--") !== true);

  if (type === "menu") {
    fail("menu ingest is not built yet — it lands once the real printed menu is photographed (see spec open item)");
  }
  if (type !== "activities") fail(`unknown --type "${type}"`);
  if (!month || !/^\d{4}-\d{2}$/.test(month)) fail("--month must look like 2026-07");
  if (files.length === 0) fail("no photo files given");
  for (const f of files) if (!fs.existsSync(f)) fail(`file not found: ${f}`);
  if (!process.env.ANTHROPIC_API_KEY) fail("ANTHROPIC_API_KEY missing — put it in .env");

  const client = new Anthropic();

  // Copy photos to canonical public/scans/ names.
  const scanRels: string[] = [];
  fs.mkdirSync(path.join("public", "scans"), { recursive: true });
  files.forEach((f, i) => {
    const ext = path.extname(f).toLowerCase() || ".jpg";
    const rel = `scans/${month}-activities-p${i + 1}${ext}`;
    fs.copyFileSync(f, path.join("public", rel));
    scanRels.push(rel);
  });

  const pages: RawDay[][] = [];
  const warnings: string[] = [];
  for (const [i, f] of files.entries()) {
    console.log(`Reading page ${i + 1}/${files.length}: ${f} ...`);
    const page = await extractActivityPage(client, f, month);
    pages.push(page.days);
    warnings.push(...page.warnings);
  }

  const result = buildActivityMonth(month, scanRels, pages);
  warnings.push(...result.warnings);

  const outPath = path.join("content", "activities", `${month}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(result.data, null, 2)}\n`);

  const eventCount = result.data.days.reduce((n, d) => n + d.events.length, 0);
  console.log(`\nWrote ${outPath}: ${result.data.days.length} days, ${eventCount} events.`);
  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s) — check these against the paper:`);
    for (const w of warnings) console.log(`  • ${w}`);
  }
  console.log("\nNext: npm run dev — compare the site against the printed pages, fix any misreads in the JSON, then commit and push.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
