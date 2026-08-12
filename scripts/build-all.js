#!/usr/bin/env node
/**
 * paper-to-course — Unified Build Pipeline
 *
 * Builds the requested paper-reading artifacts from a course directory.
 *
 * Input:  course-dir/
 *           _base.html
 *           _footer.html
 *           modules/*.html
 *           translated-paper.html
 *           guided-reader.html
 *           paper-notes.md
 *           slides-config.json     (optional, only for --pptx)
 *
 * Output: course-dir/
 *           index.html            (assembled from _base + modules + _footer)
 *           translated-paper.html (independently authored Chinese translation)
 *           guided-reader.html    (left mentor explanation, right English source)
 *           paper-notes.md        (independently authored reading note)
 *           slides.pptx           (only when --pptx is requested)
 *
 * Usage:
 *   node build-all.js ./my-course          # HTML + translation + guided reader + notes
 *   node build-all.js ./my-course --html   # HTML only
 *   node build-all.js ./my-course --translation
 *   node build-all.js ./my-course --guided
 *   node build-all.js ./my-course --notes  # validate Markdown note only
 *   node build-all.js ./my-course --pptx   # PPTX only (explicit opt-in)
 */

const path = require("path");
const fs = require("fs");

const SCRIPT_DIR = __dirname;
const { validateNotes, printReport } = require("./validate-notes.js");
const {
  validateTranslation,
  printReport: printTranslationReport,
} = require("./validate-translation.js");
const {
  validateGuidedReader,
  printReport: printGuidedReaderReport,
} = require("./validate-guided-reader.js");

function resolve(...args) { return path.resolve(...args); }

// ─── Step 1: Build HTML index.html ───────────────────────────
function buildHtml(courseDir) {
  const basePath = resolve(courseDir, "_base.html");
  const footerPath = resolve(courseDir, "_footer.html");
  const modulesDir = resolve(courseDir, "modules");

  if (!fs.existsSync(basePath)) {
    throw new Error(`_base.html not found in ${courseDir}`);
  }
  if (!fs.existsSync(modulesDir)) {
    throw new Error(`modules/ directory not found in ${courseDir}`);
  }

  let base;
  try {
    base = fs.readFileSync(basePath, "utf-8");
  } catch (e) {
    throw new Error(`Failed to read _base.html: ${e.message}`);
  }
  const footer = fs.existsSync(footerPath)
    ? fs.readFileSync(footerPath, "utf-8")
    : "";

  // Collect module files
  const moduleFiles = fs.readdirSync(modulesDir)
    .filter(f => f.endsWith(".html") && fs.statSync(resolve(modulesDir, f)).isFile())
    .sort();

  const moduleContents = moduleFiles.map(f => {
    const fp = resolve(modulesDir, f);
    if (!fs.statSync(fp).isFile()) throw new Error(`Not a file: ${fp}`);
    return fs.readFileSync(fp, "utf-8");
  });

  // Extract a usable title from the base or the first module.
  const titleMatch = base.match(/<title>([\s\S]*?)<\/title>/i);
  const titleCandidate = titleMatch ? titleMatch[1].trim() : "";
  const firstHeading = moduleContents.join("\n").match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i);
  const headingText = firstHeading
    ? firstHeading[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";
  const title = !titleCandidate || titleCandidate.includes("COURSE_TITLE")
    ? (headingText || path.basename(courseDir).replace(/[-_]+/g, " "))
    : titleCandidate;

  // Replace shared template placeholders.
  base = base.replace(/COURSE_TITLE/g, title);
  base = base
    .replace(/ACCENT_COLOR/g, "#D94F30")
    .replace(/ACCENT_HOVER/g, "#C4432A")
    .replace(/ACCENT_LIGHT/g, "#FDEEE9")
    .replace(/ACCENT_MUTED/g, "#E8836C");

  const navDots = moduleContents.map((content, index) => {
    const idMatch = content.match(/<(?:section|article)\b[^>]*\bid=["']([^"']+)["']/i);
    const headingMatch = content.match(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/i);
    const target = idMatch ? idMatch[1] : `module-${index + 1}`;
    const label = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : `Module ${index + 1}`;
    const safeLabel = label.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return `<button class="nav-dot" data-target="${target}" data-tooltip="${safeLabel}" role="tab" aria-label="${safeLabel}"></button>`;
  }).join("\n        ");
  base = base.replace(/NAV_DOTS/g, navDots);
  base = base.replace("<!-- INLINE_CSS -->", "").replace("<!-- INLINE_JS -->", "");

  // Assemble
  const moduleHtml = moduleContents.join("\n");
  const indexHtml = base.includes("<!-- MODULE_CONTENT -->")
    ? base.replace("<!-- MODULE_CONTENT -->", moduleHtml) + "\n" + footer
    : base + "\n" + moduleHtml + "\n" + footer;

  const outPath = resolve(courseDir, "index.html");
  fs.writeFileSync(outPath, indexHtml, "utf-8");
  return outPath;
}

// ─── Step 2: Validate the Chinese paper translation ─────────
function buildTranslation(courseDir) {
  const translationPath = resolve(courseDir, "translated-paper.html");
  const report = validateTranslation(translationPath);
  printTranslationReport(report);

  if (report.errors.length > 0) {
    throw new Error("translated-paper.html failed validation");
  }

  return translationPath;
}

// ─── Step 3: Validate the guided double-column reader ───────
function buildGuided(courseDir) {
  const guidedPath = resolve(courseDir, "guided-reader.html");
  const report = validateGuidedReader(guidedPath);
  printGuidedReaderReport(report);

  if (report.errors.length > 0) {
    throw new Error("guided-reader.html failed validation");
  }

  return guidedPath;
}

// ─── Step 4: Validate independently authored notes ──────────
function buildNotes(courseDir) {
  const notesPath = resolve(courseDir, "paper-notes.md");
  const report = validateNotes(notesPath);
  printReport(report);

  if (report.errors.length > 0) {
    throw new Error("paper-notes.md failed validation");
  }

  return notesPath;
}

// ─── Legacy opt-in: Generate PPTX ────────────────────────────
async function buildPptx(courseDir) {
  // Check if pptxgenjs is available
  let pptxgenAvailable = false;
  try {
    require("pptxgenjs");
    pptxgenAvailable = true;
  } catch (e) {
    pptxgenAvailable = false;
  }

  if (!pptxgenAvailable) {
    console.warn("⚠️  pptxgenjs not installed — skipping PPTX generation");
    console.warn("   Install with: npm install -g pptxgenjs");
    return null;
  }

  const configPath = resolve(courseDir, "slides-config.json");
  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️  slides-config.json not found in ${courseDir} — skipping PPTX`);
    console.warn("   (The LLM should have generated it alongside HTML modules)");
    return null;
  }

  const outputPath = resolve(courseDir, "slides.pptx");
  const { build } = require(resolve(SCRIPT_DIR, "slides-builder.js"));

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const result = await build(config, outputPath);
  return result.fileName;
}

// ─── Prepare shared explanation assets (if needed) ──────────
function ensureReferences(courseDir) {
  const refsDir = resolve(SCRIPT_DIR, "..", "references");

  const files = ["styles.css", "main.js", "_base.html", "_footer.html"];
  files.forEach(f => {
    const src = resolve(refsDir, f);
    const dst = resolve(courseDir, f);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  });
  fs.mkdirSync(resolve(courseDir, "modules"), { recursive: true });
  fs.mkdirSync(resolve(courseDir, "assets", "figures"), { recursive: true });
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  const hasSelection = ["--html", "--translation", "--guided", "--notes", "--md", "--pptx"].some(flag => args.includes(flag));
  const flags = {
    html: !hasSelection || args.includes("--html"),
    translation: !hasSelection || args.includes("--translation"),
    guided: !hasSelection || args.includes("--guided"),
    notes: !hasSelection || args.includes("--notes") || args.includes("--md"),
    pptx: args.includes("--pptx"),
  };

  // Get course dir (last non-flag argument)
  const nonFlags = args.filter(a => !a.startsWith("--"));
  const courseDir = nonFlags.length > 0 ? resolve(nonFlags[0]) : resolve(".");

  if (!fs.existsSync(courseDir)) {
    console.error(`❌ Directory not found: ${courseDir}`);
    process.exit(1);
  }

  const courseName = path.basename(courseDir);
  console.log(`\n📦 paper-to-course build pipeline`);
  console.log(`   Course: ${courseName}`);
  console.log(`   Output: ${courseDir}`);
  console.log(`   Steps:  HTML=${flags.html ? '✓' : '-'} TRANSLATION=${flags.translation ? '✓' : '-'} GUIDED=${flags.guided ? '✓' : '-'} NOTES=${flags.notes ? '✓' : '-'} PPTX=${flags.pptx ? '✓' : '-'}\n`);

  const results = {};

  try {
    if (flags.html) {
      ensureReferences(courseDir);
      process.stdout.write("   🏗️  Building index.html... ");
      results.html = buildHtml(courseDir);
      console.log(`✓`);
    }

    if (flags.translation) {
      process.stdout.write("   🌐 Validating translated-paper.html... \n");
      results.translation = buildTranslation(courseDir);
    }

    if (flags.guided) {
      process.stdout.write("   📖 Validating guided-reader.html... \n");
      results.guided = buildGuided(courseDir);
    }

    if (flags.notes) {
      process.stdout.write("   📝 Validating paper-notes.md... \n");
      results.notes = buildNotes(courseDir);
    }

    if (flags.pptx) {
      process.stdout.write("   📊 Building slides.pptx... ");
      results.pptx = await buildPptx(courseDir);
      if (results.pptx) console.log(`✓`); else console.log(`⚠ (skipped)`);
    }

    console.log(`\n✅ Build complete!\n`);
    if (results.html) console.log(`   HTML:   ${results.html}`);
    if (results.translation) console.log(`   Translation: ${results.translation}`);
    if (results.guided) console.log(`   Guided reader: ${results.guided}`);
    if (results.notes) console.log(`   Notes:  ${results.notes}`);
    if (results.pptx) console.log(`   PPTX:   ${results.pptx}`);
    console.log();
  } catch (err) {
    console.error(`\n❌ Build failed: ${err.message}`);
    process.exit(1);
  }
}

main();
