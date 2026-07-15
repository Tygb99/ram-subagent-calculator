# AgentFit

[한국어](README.ko.md) · [Live calculator](https://tygb99.github.io/ram-subagent-calculator/)

AgentFit is a transparent, no-install web calculator for estimating how many coding subagents can run concurrently within a computer's RAM budget.

Enter total RAM, choose a workload, and compare three values:

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

The safe and balanced values are kept at one when the calculated maximum is one.

| Workload | RAM per agent | Typical use |
| --- | ---: | --- |
| Light | 1 GB | Code search, small edits, short prompts |
| Balanced | 2 GB | General implementation and review |
| Heavy | 4 GB | Builds, browser automation, large contexts |

The system reserve can be adjusted manually. All calculations run locally in the browser.

## Limits

This is a planning estimate, not a benchmark. RAM is only one constraint. CPU cores, provider concurrency limits, process overhead, repository size, and dependencies between tasks can lower the practical number of concurrent agents.

Browser RAM detection is opt-in and approximate. Some browsers do not expose it, and Chromium-based browsers may deliberately reduce precision. Manual input is authoritative.

## Run locally

No package installation or build step is required.

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`.

## Test

The calculation module uses Node's built-in test runner.

```bash
node --test tests/calculator.test.mjs
```

## Project files

- `calculator.mjs`: pure calculation and validation logic.
- `app.js`: browser interactions and result rendering.
- `index.html` and the CSS files: accessible static interface.
- `showcase.html`: component and state showcase.
- `tests/calculator.test.mjs`: boundary and formula tests.

## License

[MIT](LICENSE)
