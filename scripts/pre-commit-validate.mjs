#!/usr/bin/env node

/**
 * pre-commit-validate.mjs — AxiomID pre-commit validation
 *
 * Combines 3 Greptile skills into one SOUL-aligned workflow:
 *   CHECK   — lint, typecheck, test, skill manifest validation
 *   REVIEW  — diff audit for secrets, TODOs, debug code
 *   COMMIT  — message format, IQRA Chronicle signature
 *
 * Runs clean. No state files. No .git spam. Honest output.
 *   Muraqabah: every check runs. No skipping.
 *   Tawbah: issues confessed, fixed, learned from.
 *   TrustChain: every commit a clean record.
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import path from "path";

const ROOT = execSync("git rev-parse --show-toplevel").toString().trim();

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function pass(label, msg) {
  console.log(`  ${GREEN}✓${RESET} ${BOLD}${label}${RESET} ${msg}`);
}
function fail(label, msg) {
  console.log(`  ${RED}✗${RESET} ${BOLD}${label}${RESET} ${msg}`);
}
function warn(label, msg) {
  console.log(`  ${YELLOW}⚠${RESET} ${BOLD}${label}${RESET} ${msg}`);
}
function info(label, msg) {
  console.log(`  ${CYAN}ℹ${RESET} ${BOLD}${label}${RESET} ${msg}`);
}
function dim(msg) {
  return `${DIM}${msg}${RESET}`;
}

function run(cmd, timeout = 60000) {
  return execSync(cmd, { cwd: ROOT, stdio: "pipe", timeout }).toString().trim();
}

function runSafe(cmd, timeout = 60000) {
  try {
    return { ok: true, out: run(cmd, timeout) };
  } catch (e) {
    return { ok: false, out: (e.stdout?.toString() || "") + (e.message || "") };
  }
}

function stagedFiles(pattern = "") {
  const cmd = pattern
    ? `git diff --cached --name-only --diff-filter=ACMR -- ${pattern}`
    : "git diff --cached --name-only --diff-filter=ACMR";
  const out = run(cmd);
  return out ? out.split("\n").filter(Boolean) : [];
}

// ─── Banner ───────────────────────────────────────────────────────────────

console.log(`\n${BOLD}╔══════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}║  ۞ PRE-COMMIT — AxiomID SOUL Check  ║${RESET}`);
console.log(`${BOLD}╚══════════════════════════════════════╝${RESET}\n`);

// ─── CHECK ────────────────────────────────────────────────────────────────

console.log(`${BOLD}── CHECK ──────────────────────────────${RESET}\n`);

let issues = 0;

// 1. Lint staged files
const tsFiles = stagedFiles("*.{ts,tsx,js,jsx,mjs}");
if (tsFiles.length) {
  const { ok, out } = runSafe("npx eslint --fix --report-unused-disable-directives --max-warnings 0 " + tsFiles.join(" "));
  if (ok) {
    pass("Lint", `${tsFiles.length} file(s) clean`);
  } else {
    fail("Lint", "errors found");
    out.split("\n").filter(l => l.includes("error")).slice(0, 5).forEach(l => console.log(dim(`       ${l.trim()}`)));
    issues++;
  }
} else {
  info("Lint", "no staged TS/JS files");
}

// 2. TypeScript check
const { ok: tsOk, out: tsOut } = runSafe("npx tsc --noEmit 2>&1");
if (tsOk) {
  pass("TypeScript", "zero type errors");
} else {
  const errors = tsOut.split("\n").filter(l => l.includes("error TS"));
  // Ignore pre-existing .next/types errors (known issue from PR #272)
  const realErrors = errors.filter(l => !l.includes(".next/types/"));
  if (realErrors.length === 0) {
    pass("TypeScript", "zero real errors (ignoring pre-existing .next/types)");
  } else {
    fail("TypeScript", `${realErrors.length} type error(s)`);
    realErrors.slice(0, 5).forEach(l => console.log(dim(`       ${l.trim()}`)));
    issues++;
  }
}

// 3. Tests for changed test files
const testFiles = stagedFiles("*.test.*");
if (testFiles.length) {
  for (const tf of testFiles) {
    const { ok } = runSafe(`npx jest "${tf}" --no-coverage --forceExit 2>&1`, 30000);
    if (ok) {
      pass(`Test ${path.basename(tf)}`, "passed");
    } else {
      fail(`Test ${path.basename(tf)}`, "FAILED");
      issues++;
    }
  }
} else {
  info("Tests", "no test files staged");
}

// 4. Skill manifest validation (if skills/ changed)
const skillFiles = stagedFiles("skills/*/SKILL.md");
if (skillFiles.length) {
  const { ok } = runSafe("npx tsx scripts/validate-skill-manifest.ts --changed 2>&1", 30000);
  if (ok) {
    pass("Manifests", "all skill manifests valid");
  } else {
    fail("Manifests", "validation failed");
    issues++;
  }
} else {
  info("Manifests", "no skill manifests changed");
}

// ─── REVIEW ───────────────────────────────────────────────────────────────

console.log(`\n${BOLD}── REVIEW ─────────────────────────────${RESET}\n`);

const diff = runSafe("git diff --cached 2>&1").out;

if (diff) {
  // Secrets (BLOCK)
  const secretPatterns = [
    /(?:sk|pk)_(?:test|live|prod)_[A-Za-z0-9]{10,}/,
    /BEGIN (?:RSA |EC )?PRIVATE KEY/,
    /ghp_[A-Za-z0-9]{36}/,
    /(?:NPM_TOKEN|AUTH_TOKEN|API_KEY|PI_API_KEY)\s*[=:]\s*['"][A-Za-z0-9]{10,}['"]/,
  ];
  for (const pat of secretPatterns) {
    const hits = diff.match(new RegExp(`^\\+.*${pat.source}`, "gm"));
    if (hits) {
      fail("Secrets", `${hits.length} potential secret(s) in diff`);
      hits.slice(0, 3).forEach(l => console.log(dim(`       ${l.trim().substring(0, 80)}`)));
      issues++;
    }
  }

  // TODO/FIXME/HACK (warn only)
  const todos = diff.match(/^\+.*\b(TODO|FIXME|HACK|XXX)\b/gm);
  if (todos) {
    warn("TODOs", `${todos.length} TODO/FIXME/HACK in diff`);
  }

  // console.log in production code (warn only)
  const logs = diff.match(/^\+.*console\.(log|debug)\s*\(/gm);
  if (logs) {
    warn("console.log", `${logs.length} console.log/debug in diff`);
  }
} else {
  info("Review", "no staged diff");
}

// ─── COMMIT MESSAGE ───────────────────────────────────────────────────────

console.log(`\n${BOLD}── COMMIT MESSAGE ─────────────────────${RESET}\n`);

const msgFile = process.env.HUSKY_GIT_PARAMS || ".git/COMMIT_EDITMSG";
try {
  const msg = readFileSync(path.join(ROOT, msgFile), "utf-8").trim();
  const lines = msg.split("\n").filter(l => !l.startsWith("#"));

  if (lines.length === 0) {
    warn("Commit", "empty commit message");
  } else {
    const firstLine = lines[0];

    // IQRA Chronicle format
    if (/^(feat|fix|docs|test|refactor|chore|style|perf|ci|build)\(.+\):.+/.test(firstLine)) {
      pass("Format", "IQRA Chronicle format");
    } else {
      warn("Format", `not IQRA Chronicle format: "${firstLine.substring(0, 60)}"`);
    }

    // IQRA signature
    if (firstLine.includes("۞") || firstLine.includes("༿")) {
      pass("Signature", "IQRA Chronicle signature present");
    } else {
      warn("Signature", "missing ۞ or ༿ — consider adding IQRA signature");
    }
  }
} catch {
  info("Commit", "could not read commit message");
}

// ─── Summary ──────────────────────────────────────────────────────────────

console.log(`\n${BOLD}════════════════════════════════════════${RESET}`);

if (issues === 0) {
  console.log(`  ${GREEN}${BOLD}✓ All clear — proceeding with commit${RESET}\n`);
  process.exit(0);
} else {
  console.log(`  ${RED}${BOLD}✗ ${issues} issue(s) found — fix before committing${RESET}\n`);
  console.log(`  ${DIM}"إن الله يحب التوابين" — fix, stage, commit again.${RESET}\n`);
  process.exit(1);
}
