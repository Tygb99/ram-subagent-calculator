import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchGitHubStars } from '../github-stats.mjs';

test('returns the public repository star count', async () => {
  const calls = [];
  const fetchStub = async (url) => {
    calls.push(url);
    return {
      ok: true,
      json: async () => ({ value: '42' }),
    };
  };

  assert.equal(await fetchGitHubStars(fetchStub), 42);
  assert.equal(calls.length, 1);
});

test('falls back to GitHub when the cached badge API is unavailable', async () => {
  const calls = [];
  const fetchStub = async (url) => {
    calls.push(url);
    if (url.startsWith('https://img.shields.io/')) return { ok: false };

    return {
      ok: true,
      json: async () => ({ stargazers_count: 1234 }),
    };
  };

  assert.equal(await fetchGitHubStars(fetchStub), 1234);
  assert.equal(calls.length, 2);
});

test('parses formatted and abbreviated badge values', async () => {
  const cases = [
    ['1,234', 1_234],
    ['1.2k', 1_200],
    ['2.5m', 2_500_000],
    ['3b', 3_000_000_000],
  ];

  for (const [value, expected] of cases) {
    const fetchStub = async () => ({
      ok: true,
      json: async () => ({ value }),
    });
    assert.equal(await fetchGitHubStars(fetchStub), expected);
  }
});

test('uses the fallback after a badge API network error', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('offline');

    return {
      ok: true,
      json: async () => ({ stargazers_count: 7 }),
    };
  };

  assert.equal(await fetchGitHubStars(fetchStub), 7);
});

test('uses the fallback after a badge API timeout', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    if (calls === 1) return new Promise(() => {});

    return {
      ok: true,
      json: async () => ({ stargazers_count: 5 }),
    };
  };

  assert.equal(await fetchGitHubStars(fetchStub, 1), 5);
});

test('uses the fallback when badge JSON parsing stalls', async () => {
  let calls = 0;
  const fetchStub = async () => {
    calls += 1;
    if (calls === 1) {
      return {
        ok: true,
        json: async () => new Promise(() => {}),
      };
    }

    return {
      ok: true,
      json: async () => ({ stargazers_count: 6 }),
    };
  };

  assert.equal(await fetchGitHubStars(fetchStub, 1), 6);
});

test('rejects unsafe and malformed public counts', async () => {
  const invalidValues = [
    Number.MAX_SAFE_INTEGER + 1,
    1e100,
    '1,,2',
    '12,34',
    '1,23,456',
  ];

  for (const value of invalidValues) {
    let calls = 0;
    const fetchStub = async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => calls === 1 ? { value } : { stargazers_count: value },
      };
    };
    assert.equal(await fetchGitHubStars(fetchStub), null);
  }
});

test('returns null when every public response is unavailable or invalid', async () => {
  let invalidCalls = 0;
  const unavailable = async () => ({ ok: false });
  const invalid = async () => {
    invalidCalls += 1;
    return {
      ok: true,
      json: async () => invalidCalls === 1 ? { value: 'popular' } : { stargazers_count: '42 stars' },
    };
  };
  const failed = async () => { throw new TypeError('offline'); };

  assert.equal(await fetchGitHubStars(unavailable), null);
  assert.equal(await fetchGitHubStars(invalid), null);
  assert.equal(await fetchGitHubStars(failed), null);
});
