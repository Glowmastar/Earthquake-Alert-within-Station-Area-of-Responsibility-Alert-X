# AGENTS.md

## Work efficiently
- Prioritize correctness and requested scope over optimization for speed, tokens, or tool usage.
- Follow the requested scope. Inspect only files needed to understand and make the change; avoid broad repository scans.
- Check relevant project instructions, architecture, and existing conventions before editing.
- Use the lightest model and reasoning level that can reliably handle the task. Reserve deeper analysis for consequential design decisions, difficult debugging, and final review.
- Avoid repeated reads, unnecessary tool calls, unrelated refactoring, and blind retries. Diagnose failures before changing approach.
- For multi-file, architectural, or workflow changes, identify the affected components and make a short implementation plan before editing.

## Review and recommendations
- Ground findings in the app's code, configuration, and observable workflows. Distinguish implemented behavior from mock data, static screens, and unfinished connections.
- Check the relevant user journeys, roles and access, persistence, validation, and error states.
- Prioritize issues by impact and give specific, minimal fixes. Do not invent requirements or expand scope without evidence.

## Implementation and verification
- Reuse the current architecture and patterns. Make only changes needed for the authorized request.
- Do not rewrite, remove, rename, or refactor unrelated working code unless required by the requested change.
- Do not expose, hard-code, or commit real credentials, API keys, tokens, or secrets.
- Run the relevant tests, checks, or build, and inspect the affected workflow. Broaden verification only when a failure or concrete risk warrants it.
- Do not claim a change works unless it was verified; report anything that could not be tested.
- Resolve minor implementation choices using project conventions; ask only when a missing decision blocks safe or correct work.

## Reporting
- Keep progress updates brief.
- At completion, summarize the changes, key files, checks performed, and any unresolved issue that needs attention.