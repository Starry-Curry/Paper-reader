#!/usr/bin/env node
/**
 * Validate the characteristic guided reader:
 * Chinese beginner-friendly mentor explanation on the left,
 * aligned English paper source on the right.
 */

const fs = require("fs");
const path = require("path");

function validateGuidedReader(filePath) {
  const report = { file: filePath, errors: [], warnings: [], stats: {} };

  if (!fs.existsSync(filePath)) {
    report.errors.push(`File not found: ${filePath}`);
    return report;
  }

  const html = fs.readFileSync(filePath, "utf-8");
  const rowCount = (html.match(/\bguided-row\b/g) || []).length;
  const mentorCount = (html.match(/data-role=["']mentor["']/g) || []).length;
  const sourceCount = (html.match(/data-role=["']source["']/g) || []).length;
  const anchorCount = (html.match(/data-source-anchor=["'][^"']+["']/g) || []).length;
  const unresolved = [
    "PAPER_TITLE",
    "PAPER_META",
    "GUIDED_COVERAGE",
    "GUIDED_TOC",
    "GUIDED_CONTENT",
    "GUIDED_COVERAGE_NOTE",
    "TODO",
    "TBD",
  ].filter(token => html.includes(token));

  report.stats = {
    rows: rowCount,
    mentorColumns: mentorCount,
    sourceColumns: sourceCount,
    sourceAnchors: anchorCount,
  };

  if (!/<!doctype html>/i.test(html)) report.errors.push("Missing HTML doctype");
  if (!/<html[^>]+lang=["']zh-CN["']/i.test(html)) {
    report.errors.push('Root <html> must declare lang="zh-CN"');
  }
  if (!/<h1\b/i.test(html)) report.errors.push("Missing paper title <h1>");
  if (!/导师详解/.test(html)) report.errors.push('Missing visible column label "导师详解"');
  if (!/英文原文/.test(html)) report.errors.push('Missing visible column label "英文原文"');
  if (rowCount < 3) report.errors.push("Guided reader must contain at least 3 aligned guided rows");
  if (mentorCount !== rowCount) {
    report.errors.push(`Each guided row needs one mentor column: rows=${rowCount}, mentor=${mentorCount}`);
  }
  if (sourceCount !== rowCount) {
    report.errors.push(`Each guided row needs one source column: rows=${rowCount}, source=${sourceCount}`);
  }
  if (anchorCount !== rowCount) {
    report.errors.push(`Each guided row needs one source anchor: rows=${rowCount}, anchors=${anchorCount}`);
  }
  if (unresolved.length > 0) {
    report.errors.push(`Unresolved placeholders: ${unresolved.join(", ")}`);
  }

  const sourceFragments = [...html.matchAll(
    /<(?:article|div)\b[^>]*data-role=["']source["'][^>]*>([\s\S]*?)<\/(?:article|div)>/gi
  )].map(match => match[1].replace(/<[^>]+>/g, " "));
  const englishWords = (sourceFragments.join(" ").match(/\b[A-Za-z]{3,}\b/g) || []).length;
  report.stats.englishWords = englishWords;
  if (englishWords < Math.max(100, rowCount * 20)) {
    report.errors.push("Right column does not contain enough English source text");
  }

  const resourceRegex = /(?:href|src)=["']([^"'#]+)["']/gi;
  for (const match of html.matchAll(resourceRegex)) {
    const resource = match[1];
    if (/^(?:https?:|mailto:|data:|javascript:)/i.test(resource)) {
      if (/^https?:/i.test(resource)) {
        report.warnings.push(`Remote resource found: ${resource}`);
      }
      continue;
    }
    const clean = resource.split(/[?#]/)[0];
    const target = path.resolve(path.dirname(filePath), clean);
    if (!fs.existsSync(target)) report.errors.push(`Broken local resource: ${resource}`);
  }

  const cssMatch = html.match(/href=["']([^"']*guided-reader\.css)["']/i);
  if (!cssMatch) {
    report.errors.push("guided-reader.css is not linked");
  } else {
    const cssPath = path.resolve(path.dirname(filePath), cssMatch[1]);
    if (fs.existsSync(cssPath)) {
      const css = fs.readFileSync(cssPath, "utf-8");
      if (!/@media\s*\(/i.test(css)) report.errors.push("guided-reader.css lacks responsive media rules");
      if (!/grid-template-columns\s*:\s*1fr/i.test(css)) {
        report.errors.push("guided-reader.css does not stack columns to one column on narrow screens");
      }
    }
  }

  if (!/覆盖说明/.test(html)) {
    report.warnings.push("Missing a visible guided-reader coverage statement");
  }
  if (!/公式/.test(html)) {
    report.warnings.push("No visible formula guidance found");
  }

  report.errors = [...new Set(report.errors)];
  report.warnings = [...new Set(report.warnings)];
  return report;
}

function printReport(report) {
  console.log(`   Rows: ${report.stats.rows || 0}`);
  console.log(`   English source words: ${report.stats.englishWords || 0}`);
  report.warnings.forEach(message => console.warn(`   ⚠ ${message}`));
  report.errors.forEach(message => console.error(`   ✗ ${message}`));
  if (report.errors.length === 0) console.log("   ✓ Guided reader validation passed");
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input) {
    console.error("Usage: node validate-guided-reader.js <guided-reader.html>");
    process.exit(1);
  }
  const report = validateGuidedReader(path.resolve(input));
  printReport(report);
  process.exit(report.errors.length > 0 ? 1 : 0);
}

module.exports = { validateGuidedReader, printReport };
