const STAR_SOURCES = [
  {
    url: 'https://img.shields.io/github/stars/Tygb99/ram-subagent-calculator.json',
    read: (data) => data.value,
  },
  {
    url: 'https://api.github.com/repos/Tygb99/ram-subagent-calculator',
    headers: { Accept: 'application/vnd.github+json' },
    read: (data) => data.stargazers_count,
  },
];

function parseStarCount(value) {
  if (Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value !== 'string') return null;

  const abbreviated = value.match(/^(\d+(?:\.\d+)?)([kmb])$/i);
  if (abbreviated) {
    const multiplier = { k: 1_000, m: 1_000_000, b: 1_000_000_000 }[abbreviated[2].toLowerCase()];
    const parsed = Math.round(Number(abbreviated[1]) * multiplier);
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  const isPlainNumber = /^\d+$/.test(value);
  const hasValidGrouping = /^\d{1,3}(?:,\d{3})+$/.test(value);
  if (!isPlainNumber && !hasValidGrouping) return null;

  const parsed = Number(value.replaceAll(',', ''));
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function readSourceWithTimeout(fetchRequest, source, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Star count request timed out.')), timeoutMs);
  });
  const request = (async () => {
    const options = source.headers ? { headers: source.headers } : undefined;
    const response = await fetchRequest(source.url, options);
    if (!response.ok) return null;

    return parseStarCount(source.read(await response.json()));
  })();

  try {
    return await Promise.race([request, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchGitHubStars(fetchRequest = fetch, timeoutMs = 3_000) {
  for (const source of STAR_SOURCES) {
    try {
      const stars = await readSourceWithTimeout(fetchRequest, source, timeoutMs);
      if (stars !== null) return stars;
    } catch {
      // Try the next public source.
    }
  }

  return null;
}
