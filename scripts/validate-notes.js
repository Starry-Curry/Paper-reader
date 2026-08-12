#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function validateNotes(inputPath) {
  const filePath = path.resolve(inputPath);
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(filePath)) {
    return {
      filePath,
      errors: [`File not found: ${filePath}`],
      warnings,
    };
  }

  const text = fs.readFileSync(filePath, "utf8");
  const trimmed = text.trim();

  if (!/^#\s+\S+/m.test(text)) {
    errors.push("Missing a level-1 paper title.");
  }

  if (trimmed.length < 500) {
    warnings.push("The note is very short; verify that method, evidence, and limitations are covered.");
  }

  const sectionCount = (text.match(/^##\s+\S+/gm) || []).length;
  if (sectionCount < 3) {
    warnings.push("Fewer than three main sections; verify that the note works independently.");
  }

  const placeholders = [
    { pattern: /\[图片\]/, label: "[图片]" },
    { pattern: /\b(?:TODO|TBD)\b/i, label: "TODO/TBD" },
    { pattern: /暂时无法(?:在[^。\n]*)?展示[^\n。]*/i, label: "暂时无法展示" },
  ];

  placeholders.forEach(({ pattern, label }) => {
    if (pattern.test(text)) {
      errors.push(`Unresolved placeholder found: ${label}`);
    }
  });

  const coverage = [
    { label: "research problem or contribution", pattern: /研究问题|核心贡献|主要贡献|解决.{0,12}问题|research problem|contribution/i },
    { label: "method or implementation", pattern: /方法|技术细节|具体实现|训练|推理|method|implementation/i },
    { label: "experimental evidence", pattern: /实验|结果|消融|指标|基线|experiment|result|ablation|metric/i },
    { label: "limitations or boundaries", pattern: /局限|限制|风险|边界|失效|limitation|risk|boundary/i },
  ];

  coverage.forEach(({ label, pattern }) => {
    if (!pattern.test(text)) {
      warnings.push(`No clear coverage of ${label}.`);
    }
  });

  const imagePattern = /!\[[^\]]*\]\(([^)]+)\)/g;
  let imageCount = 0;
  let match;

  while ((match = imagePattern.exec(text)) !== null) {
    imageCount += 1;
    let target = match[1].trim();
    if (target.startsWith("<") && target.endsWith(">")) {
      target = target.slice(1, -1);
    } else {
      target = target.split(/\s+["']/)[0];
    }

    if (/^(?:https?:|data:|#)/i.test(target)) continue;

    target = target.split("#")[0].split("?")[0];
    try {
      target = decodeURIComponent(target);
    } catch (_) {
      // Keep the literal path when it is not URI-encoded.
    }

    const resolvedImage = path.resolve(path.dirname(filePath), target);
    if (!fs.existsSync(resolvedImage)) {
      errors.push(`Broken local image reference: ${match[1].trim()}`);
    }
  }

  const hasTable = /^\|.+\|\s*$/m.test(text) && /^\|\s*:?-{3,}/m.test(text);
  if (imageCount === 0 && !hasTable) {
    warnings.push("No image or Markdown table found; verify that prose is the clearest representation.");
  }

  return { filePath, errors, warnings };
}

function printReport(report) {
  report.errors.forEach(message => console.error(`ERROR: ${message}`));
  report.warnings.forEach(message => console.warn(`WARN: ${message}`));

  if (report.errors.length === 0) {
    console.log(`OK: ${report.filePath}`);
  }
}

if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node validate-notes.js <paper-notes.md>");
    process.exit(2);
  }

  const report = validateNotes(inputPath);
  printReport(report);
  process.exit(report.errors.length > 0 ? 1 : 0);
}

module.exports = { validateNotes, printReport };
