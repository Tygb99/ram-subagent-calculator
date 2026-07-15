# AgentFit

[한국어](README.ko.md) · [Live calculator](https://tygb99.github.io/ram-subagent-calculator/)

AgentFit is a transparent, no-install web calculator that separates safe active concurrency from an empirical extreme count of accumulated coding subagents.

Enter total RAM and choose a workload to compare two different capacity models:

- **Safe active concurrency**: how many memory-consuming jobs can run at once without relying on swap.
- **Extreme accumulated count**: how many logical subagent threads could be created over time when swap and slowdown are accepted.

The active-concurrency model still shows three levels:

- **Safe**: 65% of the calculated maximum for long-running work.
- **Balanced**: 85% of the maximum and the default recommendation.
- **Maximum**: the memory-only upper bound, with almost no burst capacity.

## How it works

AgentFit first reserves memory for the operating system and other apps, then one main agent, before allocating the remaining pool to subagents.

```text
system reserve = clamp(total RAM × 25%, 3 GB, 16 GB)
subagent pool  = max(0, total RAM − system reserve − main agent RAM)
maximum        = floor(subagent pool ÷ per-agent RAM)
safe           = floor(maximum × 65%)
balanced       = floor(maximum × 85%)
```

The extreme estimate scales from one observed macOS run:

```text
extreme accumulated = floor(total RAM ÷ 24 GB × 160)
estimated swap      = total RAM ÷ 24 GB × 21.69 GB
combined memory     = total RAM + estimated swap
```

The source run used 24 GB of physical RAM, reached 21.69 GB of swap (about 45.7 GB combined), and accumulated 160 unique direct child threads over about 21 hours. It did **not** run 160 memory-heavy jobs simultaneously. Thread metadata showed at most 24 overlapping lifetimes, and the later workload was intentionally limited to three active jobs.

The safe and balanced values are kept at one when the calculated maximum is one.

| Workload | RAM per agent | Typical use |
| --- | ---: | --- |
| Light | 1 GB | Code search, small edits, short prompts |
| Balanced | 2 GB | General implementation and review |
| Heavy | 4 GB | Builds, browser automation, large contexts |

The system reserve can be adjusted manually. All calculations run locally in the browser.

## Limits

The safe values are planning estimates. The extreme value is a single-machine empirical extrapolation, not a guarantee. CPU cores, provider concurrency limits, process overhead, repository size, task duration, and dependencies can all change the result.

Do not use the extreme accumulated count as a simultaneous-concurrency recommendation. Swap can cause severe latency and storage wear, and logical agent threads are much lighter than active builds, browsers, inference jobs, or media processing.

Browser RAM detection is opt-in and approximate. Some browsers do not expose it, and Chromium-based browsers may deliberately reduce precision. Manual input is authoritative.

The header fetches the repository's public star count from the GitHub API. If that request is unavailable or rate-limited, the calculator continues to work and only the count is omitted.

## Run locally

No package installation or build step is required.

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Test

The calculation module uses Node's built-in test runner.

```bash
node --test tests/*.test.mjs
```

## Project files

- `calculator.mjs`: pure calculation and validation logic.
- `app.js`: browser interactions and result rendering.
- `github-stats.mjs`: resilient public GitHub star-count lookup.
- `index.html` and the CSS files: accessible static interface.
- `showcase.html`: component and state showcase.
- `tests/*.test.mjs`: formula, boundary, and GitHub-response tests.

## License

[MIT](LICENSE)
