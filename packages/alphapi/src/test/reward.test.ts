/**
 * AlphaPi v0.1 — Reward Function Tests
 *
 * Tests the core math: scoring, clamping, drift detection, plateau.
 * Uses Node.js built-in test runner (node:test).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeScore,
  computeLintScore,
  computeTypeCheckScore,
  clamp01,
  detectDrift,
  isPlateau,
  computeReward,
  DEFAULT_WEIGHTS,
} from "../src/reward.js";
import type { EvaluationResult, StateSnapshot } from "../src/types.js";

// ─── clamp01 ─────────────────────────────────────────────────────────

test("clamp01: clamps values to [0, 1]", () => {
  assert.equal(clamp01(0.5), 0.5);
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(clamp01(0), 0);
  assert.equal(clamp01(1), 1);
});

test("clamp01: normalizes negative zero to positive zero", () => {
  const result = clamp01(-0);
  assert.equal(Object.is(result, -0), false);
  assert.equal(Object.is(result, 0), true);
});

// ─── computeLintScore ────────────────────────────────────────────────

test("computeLintScore: returns 1 for zero errors", () => {
  assert.equal(computeLintScore(0), 1.0);
});

test("computeLintScore: decays with error count", () => {
  assert.equal(computeLintScore(1), 0.5);
  assert.equal(computeLintScore(9), 0.1);
  assert.ok(computeLintScore(5) < computeLintScore(2));
});

// ─── computeTypeCheckScore ───────────────────────────────────────────

test("computeTypeCheckScore: returns 1 for zero errors", () => {
  assert.equal(computeTypeCheckScore(0), 1.0);
});

test("computeTypeCheckScore: decays with error count", () => {
  assert.equal(computeTypeCheckScore(1), 0.5);
  assert.ok(computeTypeCheckScore(5) < computeTypeCheckScore(1));
});

// ─── computeScore ────────────────────────────────────────────────────

test("computeScore: perfect state = 1.0", () => {
  const score = computeScore(1.0, 0, 0, 0.1, DEFAULT_WEIGHTS);
  // 1*0.5 + 1*0.2 + 1*0.15 + 0.1*0.15 = 0.865
  assert.ok(score > 0.86 && score < 0.87);
});

test("computeScore: worst state = 0", () => {
  const score = computeScore(0, 100, 100, -1, DEFAULT_WEIGHTS);
  // 0*0.5 + ~0*0.2 + ~0*0.15 + -1*0.15 = ~-0.15 → clamped to 0
  assert.equal(score, 0);
});

test("computeScore: is clamped to [0, 1]", () => {
  const tooHigh = computeScore(1, 0, 0, 10, DEFAULT_WEIGHTS);
  assert.equal(tooHigh, 1); // clamped
  const tooLow = computeScore(0, 100, 100, -10, DEFAULT_WEIGHTS);
  assert.equal(tooLow, 0); // clamped
});

test("computeScore: test pass rate dominates (50% weight)", () => {
  const highTestLowLint = computeScore(1.0, 50, 50, 0, DEFAULT_WEIGHTS);
  const lowTestHighLint = computeScore(0.1, 0, 0, 0, DEFAULT_WEIGHTS);
  assert.ok(highTestLowLint > lowTestHighLint,
    "High test pass rate should beat high lint cleanliness");
});

// ─── detectDrift ─────────────────────────────────────────────────────

const mockEval = (overrides: Partial<EvaluationResult> = {}): EvaluationResult => ({
  candidateId: "test",
  passesOriginalTests: true,
  testPassRate: 0.9,
  lintErrors: 0,
  typeErrors: 0,
  trustDelta: 0,
  score: 0.9,
  driftDetected: false,
  driftDetails: null,
  ...overrides,
});

test("detectDrift: no drift when tests improve", () => {
  const result = detectDrift(mockEval({ testPassRate: 0.95 }), 0.9);
  assert.equal(result.detected, false);
});

test("detectDrift: detects test regression", () => {
  const result = detectDrift(mockEval({ testPassRate: 0.7 }), 0.9);
  assert.equal(result.detected, true);
  assert.ok(result.details?.includes("regressed"));
});

test("detectDrift: detects excessive type errors", () => {
  const result = detectDrift(mockEval({ typeErrors: 15 }), 0.9);
  assert.equal(result.detected, true);
  assert.ok(result.details?.includes("Type errors"));
});

test("detectDrift: no drift within tolerance", () => {
  const result = detectDrift(mockEval({ testPassRate: 0.87 }), 0.9, 0.05);
  assert.equal(result.detected, false); // 0.87 > 0.9 - 0.05 = 0.85
});

// ─── isPlateau ───────────────────────────────────────────────────────

test("isPlateau: returns false for insufficient history", () => {
  assert.equal(isPlateau([0.01, 0.005], 0.02, 3), false);
});

test("isPlateau: returns true when rewards below threshold for N iterations", () => {
  assert.equal(isPlateau([0.5, 0.01, 0.005, 0.008], 0.02, 3), true);
});

test("isPlateau: returns false when a recent reward exceeds threshold", () => {
  assert.equal(isPlateau([0.01, 0.005, 0.08, 0.008], 0.02, 3), false);
});

// ─── computeReward ───────────────────────────────────────────────────

const mockState = (overrides: Partial<StateSnapshot> = {}): StateSnapshot => ({
  timestamp: "2026-07-20T00:00:00Z",
  target: "test-package",
  testPassRate: 0.8,
  lintErrors: 5,
  typeErrors: 2,
  trustScore: 0.6,
  ciStatus: "passing",
  reviewSignals: [],
  gitSha: "abc123",
  ...overrides,
});

test("computeReward: positive when evaluation is better than state", () => {
  const state = mockState({ testPassRate: 0.8, lintErrors: 5 });
  const evalResult = mockEval({ testPassRate: 0.95, lintErrors: 0, score: 0.9 });
  const reward = computeReward(state, evalResult);
  assert.ok(reward > 0, "Reward should be positive when improvement occurs");
});

test("computeReward: negative when evaluation is worse than state", () => {
  const state = mockState({ testPassRate: 0.9, lintErrors: 0 });
  const evalResult = mockEval({ testPassRate: 0.5, lintErrors: 20, score: 0.3 });
  const reward = computeReward(state, evalResult);
  assert.ok(reward < 0, "Reward should be negative when regression occurs");
});

test("computeReward: zero when no change", () => {
  const state = mockState({ testPassRate: 0.9, lintErrors: 0, typeErrors: 0 });
  const evalResult = mockEval({ testPassRate: 0.9, lintErrors: 0, typeErrors: 0, score: computeScore(0.9, 0, 0, 0) });
  const reward = computeReward(state, evalResult);
  assert.ok(Math.abs(reward) < 0.01, "Reward should be ~0 when no change");
});
