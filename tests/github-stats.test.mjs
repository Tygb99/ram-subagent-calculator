import test from 'node:test';
import assert from 'node:assert/strict';

import { fetchGitHubStars } from '../github-stats.mjs';

test('returns the public repository star count', async () => {
  const fetchStub = async () => ({
    ok: true,
    json: async () => ({ stargazers_count: 42 }),
  });

  assert.equal(await fetchGitHubStars(fetchStub), 42);
});

test('returns null when the GitHub response is unavailable or invalid', async () => {
  const unavailable = async () => ({ ok: false });
  const invalid = async () => ({ ok: true, json: async () => ({ stargazers_count: '42' }) });
  const failed = async () => { throw new TypeError('offline'); };

  assert.equal(await fetchGitHubStars(unavailable), null);
  assert.equal(await fetchGitHubStars(invalid), null);
  assert.equal(await fetchGitHubStars(failed), null);
});
