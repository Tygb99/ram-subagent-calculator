import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateRecommendation,
  parseRamInput,
  PRESETS,
} from '../calculator.mjs';

test('parses RAM in the supported 4 GB steps', () => {
  assert.equal(parseRamInput('32'), 32);
  assert.equal(parseRamInput(256), 256);
});

test('rejects empty, out-of-range, and off-step RAM values', () => {
  for (const value of ['', '3', '5', '260', 'hello', Number.NaN]) {
    assert.throws(() => parseRamInput(value), RangeError);
  }
});

test('uses auditable workload budgets', () => {
  assert.deepEqual(PRESETS, {
    light: { label: '가벼움', perAgentGb: 1 },
    balanced: { label: '균형', perAgentGb: 2 },
    heavy: { label: '무거움', perAgentGb: 4 },
  });
});

test('reports no safe subagent capacity on a 4 GB balanced machine', () => {
  assert.deepEqual(calculateRecommendation(4, 'balanced'), {
    totalRamGb: 4,
    preset: 'balanced',
    perAgentGb: 2,
    reserveGb: 3,
    mainAgentGb: 2,
    poolGb: 0,
    safe: 0,
    balanced: 0,
    maximum: 0,
  });
});

test('calculates 16 GB balanced recommendations', () => {
  const result = calculateRecommendation(16, 'balanced');
  assert.deepEqual(
    { reserve: result.reserveGb, pool: result.poolGb, safe: result.safe, balanced: result.balanced, maximum: result.maximum },
    { reserve: 4, pool: 10, safe: 3, balanced: 4, maximum: 5 },
  );
});

test('calculates 32 GB balanced recommendations', () => {
  const result = calculateRecommendation(32, 'balanced');
  assert.deepEqual(
    { reserve: result.reserveGb, pool: result.poolGb, safe: result.safe, balanced: result.balanced, maximum: result.maximum },
    { reserve: 8, pool: 22, safe: 7, balanced: 9, maximum: 11 },
  );
});

test('caps the reserve at 16 GB for a 64 GB heavy workload', () => {
  const result = calculateRecommendation(64, 'heavy');
  assert.deepEqual(
    { reserve: result.reserveGb, pool: result.poolGb, safe: result.safe, balanced: result.balanced, maximum: result.maximum },
    { reserve: 16, pool: 44, safe: 7, balanced: 9, maximum: 11 },
  );
});

test('accepts an explicit system reserve', () => {
  const result = calculateRecommendation(32, 'balanced', { reserveGb: 12 });
  assert.deepEqual(
    { reserve: result.reserveGb, pool: result.poolGb, safe: result.safe, balanced: result.balanced, maximum: result.maximum },
    { reserve: 12, pool: 18, safe: 5, balanced: 7, maximum: 9 },
  );
});

test('rejects unknown presets and invalid explicit reserves', () => {
  assert.throws(() => calculateRecommendation(32, 'unknown'), RangeError);
  assert.throws(() => calculateRecommendation(32, 'balanced', { reserveGb: -1 }), RangeError);
  assert.throws(() => calculateRecommendation(32, 'balanced', { reserveGb: 33 }), RangeError);
});
