#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function stripQueryAndHash(target) {
  return target.split("#")[0].split("?")[0];
}

function validateTranslation(inputPath) {
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

  const html = fs.readFileSync(filePath, "utf8");

  if (!/<!doctype\s+html>/i.test(html)) {
    errors.push("Missing HTML5 doctype.");
  }
  if (!/<html\b[^>]*\blang=["']zh-CN["']/i.test(html)) {
    warnings.push('Expected <html lang="zh-CN"> for the Chinese translation.');
  }
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(html)) {
    errors.push("Missing a non-empty page title.");
  }
  if (!/<h1\b[^>]*>\s*\S[\s\S]*?<\/h1>/i.test(html)) {
    errors.push("Missing a non-empty translated paper title.");
  }
  if (!/<(?:main|article)\b/i.test(html)) {
    errors.push("Missing a main or article container.");
  }

  const unresolved = [
    "PAPER_TITLE_ZH",
    "PAPER_TITLE",
    "PAPER_META",
    "TRANSLATED_TOC",
    "TRANSLATED_CONTENT",
    "REFERENCES_POLICY",
  ];
  unresolved.forEach((placeholder) => {
    if (html.includes(placeholder)) {
      errors.push(`Unresolved template placeholder: ${placeholder}`);
    }
  });
  if (/\b(?:TODO|TBD)\b/i.test(html)) {
    errors.push("Unresolved TODO/TBD marker found.");
  }

  const textOnly = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ");
  const chineseChars = (textOnly.match(/[\u3400-\u9fff]/g) || []).length;
  if (chineseChars < 100) {
    errors.push("Too little Chinese text to be a translated paper.");
  } else if (chineseChars < 800) {
    warnings.push("The Chinese text is short; verify that this is a complete translation rather than an abstract.");
  }

  const sectionCount = (html.match(/<h2\b/gi) || []).length;
  if (sectionCount === 0) {
    warnings.push("No level-2 sections found; verify that the paper structure was preserved.");
  }

  const localRefPattern = /\b(?:src|href)=["']([^"']+)["']/gi;
  let match;
  while ((match = localRefPattern.exec(html)) !== null) {
    const target = match[1].trim();
    if (/^(?:https?:|data:|mailto:|#|javascript:)/i.test(target)) {
      if (/^https?:/i.test(target) && /<(?:script|link)\b/i.test(html.slice(Math.max(0, match.index - 100), match.index))) {
        errors.push(`Remote script or stylesheet dependency: ${target}`);
      }
      continue;
    }

    const cleanTarget = stripQueryAndHash(target);
    if (!cleanTarget) continue;

    let decodedTarget = cleanTarget;
    try {
      decodedTarget = decodeURIComponent(cleanTarget);
    } catch (_) {
      // Keep the literal path when it is not URI-encoded.
    }

    const resolvedTarget = path.resolve(path.dirname(filePath), decodedTarget);
    if (!fs.existsSync(resolvedTarget)) {
      errors.push(`Broken local asset reference: ${target}`);
    }
  }

  if (!/参考文献|references/i.test(textOnly)) {
    warnings.push("No reference-section marker found; state whether bibliography entries retain their original form.");
  }

  return { filePath, errors, warnings, chineseChars, sectionCount };
}

function printReport(report) {
  report.errors.forEach((message) => console.error(`ERROR: ${message}`));
  report.warnings.forEach((message) => console.warn(`WARN: ${message}`));

  if (report.errors.length === 0) {
    console.log(`OK: ${report.filePath}`);
  }
}

if (require.main === module) {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node validate-translation.js <translated-paper.html>");
    process.exit(2);
  }

  const report = validateTranslation(inputPath);
  printReport(report);
  process.exit(report.errors.length > 0 ? 1 : 0);
}

module.exports = { validateTranslation, printReport };
