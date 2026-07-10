import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { buildMenuWeek, extractActivityPage, extractMenuWeek } from "@/lib/ingest/extract";
import { menuWeekSchema } from "@/lib/schema";
import { buildActivityMonth, type RawDay } from "@/lib/ingest/postprocess";

function fail(msg: string): never {
  console.error(`\nError: ${msg}`);
  console.error("\nUsage:");
  console.error("  npm run ingest -- --type activities --month YYYY-MM photo1.jpg [photo2.jpg ...]");
  console.error("  npm run ingest -- --type menu photo.jpg");
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

  if (type !== "activities" && type !== "menu") fail(`unknown --type "${type}"`);
  if (type === "activities" && (!month || !/^\d{4}-\d{2}$/.test(month))) fail("--month must look like 2026-07");
  if (type === "menu" && month) fail("--month is only used for activities");
  if (files.length === 0) fail("no photo files given");
  if (type === "menu" && files.length !== 1) fail("menu ingest expects exactly one photo");
  for (const f of files) if (!fs.existsSync(f)) fail(`file not found: ${f}`);
  if (!process.env.ANTHROPIC_API_KEY) fail("ANTHROPIC_API_KEY missing — put it in .env");

  const client = new Anthropic();

  if (type === "menu") {
    const file = files[0];
    console.log(`Reading menu: ${file} ...`);
    const raw = await extractMenuWeek(client, file);
    const ext = path.extname(file).toLowerCase() || ".jpg";
    const rel = `scans/${raw.weekOf}-menu${ext}`;
    fs.mkdirSync(path.join("public", "scans"), { recursive: true });
    fs.copyFileSync(file, path.join("public", rel));

    const data = menuWeekSchema.parse(buildMenuWeek(raw, rel));
    const outPath = path.join("content", "menus", `${data.weekOf}.json`);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);

    const itemCount = data.days.reduce((total, day) => {
      return total + day.breakfast.items.length + day.lunch.items.length + day.dinner.items.length;
    }, 0);
    console.log(`\nWrote ${outPath}: ${data.days.length} days, ${itemCount} menu items.`);
    if (raw.warnings.length > 0) {
      console.log(`\n${raw.warnings.length} warning(s) — check these against the paper:`);
      for (const w of raw.warnings) console.log(`  • ${w}`);
    }
    console.log("\nNext: npm run dev — compare the site against the printed menu, fix any misreads in the JSON, then commit and push.");
    return;
  }

  const activityMonth = month as string;

  // Copy photos to canonical public/scans/ names.
  const scanRels: string[] = [];
  fs.mkdirSync(path.join("public", "scans"), { recursive: true });
  files.forEach((f, i) => {
    const ext = path.extname(f).toLowerCase() || ".jpg";
    const rel = `scans/${activityMonth}-activities-p${i + 1}${ext}`;
    fs.copyFileSync(f, path.join("public", rel));
    scanRels.push(rel);
  });

  const pages: RawDay[][] = [];
  const warnings: string[] = [];
  for (const [i, f] of files.entries()) {
    console.log(`Reading page ${i + 1}/${files.length}: ${f} ...`);
    const page = await extractActivityPage(client, f, activityMonth);
    pages.push(page.days);
    warnings.push(...page.warnings);
  }

  const result = buildActivityMonth(activityMonth, scanRels, pages);
  warnings.push(...result.warnings);

  const outPath = path.join("content", "activities", `${activityMonth}.json`);
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
