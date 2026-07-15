const REPOSITORY_API = 'https://api.github.com/repos/Tygb99/ram-subagent-calculator';

export async function fetchGitHubStars(fetchRequest = fetch) {
  try {
    const response = await fetchRequest(REPOSITORY_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok) return null;

    const data = await response.json();
    return Number.isInteger(data.stargazers_count) && data.stargazers_count >= 0
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}
