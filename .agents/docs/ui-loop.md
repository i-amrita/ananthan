# UI loop

Any change that renders pixels goes through the generator and evaluator loop. This includes routes, components, styles, and tokens. It does not include pure logic, data loaders, or wire types. The procedure is the same as the global UI policy (`UILOOP.md`). This doc adds the project specifics. The runnable procedure is in `.agents/skills/ui-loop/SKILL.md`.

## Prerequisites

Stop and report the gap if any of these are missing. Do not improvise a substitute.

- A screen spec in `.agents/screens/`, for example `mobile-vertical.md` or `projects-overlay.md`.
- The reference docs the spec cites.
- The rubric for the checkpoint.
- A baseline screenshot, where one exists.
- A reachable app URL. Use the URL printed by `pnpm dev` (http://localhost:4321) or `pnpm preview` (http://localhost:4322).

## Viewports and themes

Every checkpoint is captured at three widths: 375 (iPhone SE, 375 x 812), 768 (tablet, 768 x 1024), and 1280 (desktop). Each width is captured in light and dark. Force the theme with `?theme=light` or `?theme=dark` so the capture does not depend on the OS setting.

## The loop

Generate, capture evidence, evaluate in isolation, record the verdict, then fix.

1. Generate: change the code for one screen or checkpoint.
2. Capture: take screenshots at each viewport and theme with the `playwright-cli` skill. Save the console log, the axe report, and the e2e result. Keep output terse.
3. Evaluate: a fresh evaluator reads the evidence and returns a verdict. See the isolation rules below.
4. Verdict: PASS or FAIL, using the schema below.
5. Fix: work the highest-severity finding first, then loop.

The cap is 3 iterations per run. After the third, stop, write the ledger, and report the unresolved findings to the human. Do not start a fourth pass.

## Isolation

The evaluator receives the screenshots, the screen spec, the reference docs, the rubric, the console log, the axe report, and the e2e result.

The evaluator never receives the generator's diff, the generator's rationale, or the previous verdict text. The evaluator runs as a fresh subagent on a different model family from the generator. The generator must never approve its own work.

## Verdict schema

```
verdict: PASS | FAIL
findings:
  - severity: P0 | P1 | P2
    area: <string>
    expected: <cites spec line or reference doc>
    observed: <cites evidence path, for example a screenshot or log line>
    fix: <string>
```

There is no numeric score and no prose verdict outside this schema.

## Hard gates

Check these first. Any red result is an automatic FAIL with no judgment call.

- Console errors: 0.
- Console warnings: 0.
- Network responses with 5xx: 0.
- axe critical or serious violations: 0.
- No layout collapse at 375, 768, or 1280.
- The e2e checkpoint for the screen is green.

Only if all gates pass does the evaluator read the rubric.

## Anti-oscillation

Keep a ledger for each run, with one entry per iteration: the findings closed and the findings opened. If a finding comes back after it was marked fixed, end the run and escalate. Do not retry past that point.

## Write-back

An approved iteration updates the screen spec and the baseline screenshot in the same commit as the code. A pass that leaves either one stale is not a pass.

## References

A reference doc must contain a pattern description grounded in more than one product, an `## Applies to` section naming the checkpoints it governs, and citations to local screenshots by path. Do not derive a whole scale or rule from one product's implementation. A single source is an anecdote, not a reference.

## Anti-patterns

- No self-approval in the generator's context.
- No evaluation without a screenshot.
- No "looks good" as a verdict.
- Do not hand the rubric to the generator as a checklist to optimize against.
- Do not loop when a baseline screenshot would have caught the drift for free.

## Known gaps

Baseline screenshots live at `.agents/screens/baselines/<screen>/<WxH>-<theme>-<state>.png`. The location is recorded in each screen spec (see `.agents/screens/overlay-drawer.md`). Reference docs live at `.agents/screens/references.md` with captures under `.agents/screens/references/`.
