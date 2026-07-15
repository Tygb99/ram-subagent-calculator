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

The system reserve can be adjusted manually. Total RAM accepts 4 GB through 2 TB (2048 GB) in 4 GB steps. All calculations run locally in the browser.

## Limits

The safe values are planning estimates. The extreme value is a single-machine empirical extrapolation, not a guarantee. CPU cores, provider concurrency limits, process overhead, repository size, task duration, and dependencies can all change the result.

Do not use the extreme accumulated count as a simultaneous-concurrency recommendation. Swap can cause severe latency and storage wear, and logical agent threads are much lighter than active builds, browsers, inference jobs, or media processing.

Browser RAM detection is opt-in and approximate. Some browsers do not expose it, and Chromium-based browsers may deliberately reduce precision. Manual input is authoritative.

The header fetches the repository's public star count from Shields.io's cached JSON endpoint, avoiding GitHub's low unauthenticated browser rate limit. It falls back to the GitHub API if the cached endpoint is unavailable. If both sources fail, the calculator continues to work and only the count is omitted.

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

## Built with Codex and GPT-5.6

AgentFit was created during OpenAI Build Week with Codex using GPT-5.6. The primary build thread is Codex `/feedback` session `019f6419-a624-7cc1-a49c-049aa9419d74`.

### How we collaborated

- **Product direction came from the user.** The initial brief was to create a public GitHub project that recommends a subagent count from the user's RAM. The user then supplied a real 24 GB Mac observation and asked Codex to verify whether the accumulated count was 160, update the model, deploy it, and add the public star count.
- **Codex accelerated implementation.** GPT-5.6 helped turn the brief into a dependency-free HTML/CSS/JavaScript product, extract the calculation engine into a testable ES module, build the accessible responsive interface, write English and Korean documentation, configure GitHub Actions and Pages, and iterate on browser QA.
- **The key modeling decision was made collaboratively.** Inspection of the referenced Codex thread showed 160 unique direct child threads accumulated over roughly 21 hours, at most 24 overlapping lifetimes, a later cap of three active jobs, and 21.69 GB of peak swap on a 24 GB Mac. We therefore separated safe active concurrency from the empirical extreme accumulated count instead of presenting 160 as simultaneous capacity.
- **Codex handled verification and hardening.** The session used parallel review threads for visual QA, accessibility, responsive behavior, tests, repository review, deployment checks, and a production-only GitHub API rate-limit failure. The final star lookup uses Shields.io's cached JSON first, then the GitHub API as a fallback, and fails without affecting calculator results.
- **Human judgment stayed authoritative.** The user chose the problem, supplied the empirical benchmark and source thread, challenged the initial assumptions, confirmed the corrected 160-thread interpretation, and requested each public-facing revision. Codex proposed, implemented, tested, and deployed those decisions.

### Result

The final project is a working, public developer tool with transparent formulas, 20 automated tests, a no-build local run path, GitHub Pages deployment, and documented limits. GPT-5.6 and Codex were used for the majority of the architecture, implementation, review, debugging, and deployment work; the session ID above provides the build trace for judges.

## License

[MIT](LICENSE)




































































