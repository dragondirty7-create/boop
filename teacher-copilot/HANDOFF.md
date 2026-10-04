# Teacher Copilot v1 slice — implementation handoff

Status: adult-review prototype, **not market-ready**. Built October 3, 2026.

## Result and scope

Open `/teacher-copilot/` through a static HTTP server. Four teacher jobs are reachable: plan a session, adapt its access choices, get one facilitation move, and reflect on musical action. Download a complete UTF-8 Markdown session plan or print/save PDF. Reflection defaults to “Not recorded” in exports until the teacher explicitly submits it. Regenerating a plan clears the previous session’s reflection; access changes preserve it. Clear & reset removes the in-tab draft.

This is a bounded, source-derived template prototype. It has no LLM connection, learner accounts, identifiers, free text, audio, uploads, recordings, progress database, analytics, persistence, payments, or staffed support. The adult acknowledgment in BOOP is not repurposed as authentication. No autonomous teaching, safety monitoring, filtering service, notifications, verified parent controls, learning-gain claims, or tested accessibility claims are represented as implemented.

## Why this codebase

Connected GitHub inventory showed BOOP as the only small music-education application repository; no separate Teacher Copilot implementation surfaced. BOOP is a static site with Vercel/Netlify configuration, a large inline learner DAW, and two Cosmo routes. The existing teacher desk administers the DAW and does not plan sessions. Reuse: its static delivery conventions, Node ESM setting, and hear/copy/change/make activity concepts. The new route does not import the learner index, persist its state, call Cosmo, or inherit its recording features.

Also inspected the EEC sample-lesson signup site and worker starter under `/workspace/sites/eec-sample-lesson-signup` and `/workspace/scratch/a73b5f4ef450/eec-worker-stage`. The signup site is a leads/database workflow; the worker starter adds server infrastructure without reusable teacher planning. Drive’s beginner first-lesson plan supplies rhythm echo, role reversal, instrument exploration, and the off-screen challenge. Shared Agent Notes and the living EEC handoff were read; the newer portfolio’s teacher-first boundary takes precedence over older child-facing plans. No competing active Teacher Copilot implementation was identified in those notes.

## Source and content decisions

Canonical scope: [EEC Product Portfolio — Project 01](https://docs.google.com/document/d/1P9mj_Q18vRQ94bNE_-VXbUGvuH4yKyWrkgqSlse21so/edit), fetched October 3 PDT / October 4 UTC. Supporting sources are registered in `content.js` and every export. Only pedagogy, session timing, game concepts, and access principles were reused from the older Teacher Agent plan; its child architecture and legal assertions were not promoted into this product.

- Five parts: Launch, Play, Learn, Make, Land. Every plan reaches an original musical phrase and an optional share; stopping remains valid.
- Age bands: 5–7 and 8–10. Presets 12/15/17 and 21/25/29 keep each stage inside the supporting source’s stage ranges. The source’s headline 18-minute Littles cap exceeds the sum of its listed stage maxima (17); the 20-minute Explorers floor is below the listed stage minima sum (21). The prototype uses internally consistent sums rather than silently changing a stage range. Resolve those edges during EEC review.
- 70/30 is an intended balance of review/new musical attempts, **not** a timed allocation or an observed outcome. Teachers choose separate familiar and new focuses and weave review into Make. No automated compliance or learning measurement is claimed.
- Access settings cover sound, language, response time, notation, movement, theme, and visual density. They change exported teacher instructions, not device sound limits or a learner UI. The plan supports body/voice, hand percussion, keyboard, and guitar/ukulele; groups are one-to-one, small, or class.
- Reflection uses bounded, general musical observation choices; no individual record or diagnostic interpretation. No creation or support is marked observed automatically.
- Safety concern selection shows a human handoff and states no danger assessment or alerts exist. Arbitrary strings/instructions cannot reach the planner or export via supported inputs.
- Knowledge version `eec-teacher-copilot-0.1.0` is marked **Draft — EEC human review pending**. Source extraction and engineering checks are not human pedagogy approval.

## Run and review

```sh
python -m http.server 8765 --bind 127.0.0.1
# Open http://127.0.0.1:8765/teacher-copilot/
npm run test:teacher
npm run check:teacher
git diff --check
```

No install/build is required for the static slice. BOOP had no existing build/lint/type/test scripts or CI workflow; the change adds isolated Node tests and syntax/static checks. These checks do not validate the unrelated DAW or its model routes.

Validation actually completed:

- `npm run test:teacher`: 7 passing tests, including all 648 band/time/goal/review/material/group combinations and all access values.
- `npm run check:teacher`: syntax, asset, no-network/no-storage/no-media isolation checks passed.
- `git diff --check`: passed; hosting JSON/TOML parse checks passed.
- `tests/teacher-copilot-ui.mjs` with scratch-installed jsdom 26.1.0: passed actual DOM events for planning, seven adaptations, safety handoff, reflection, Blob download content, print-document content, new-plan reflection clearing, and reset. Both storage surfaces remained empty.
- Independent read-only implementation review found no material defect. Engineering checks are not approval of pedagogy or access effectiveness.
- **Real browser verification blocked**: agent-browser daemon exited on startup; its Chrome install failed with an issuer certificate error. The available Playwright installer returned invalid/truncated browser archives. No rendered desktop/mobile visual check, native download, keyboard navigation check, or actual printed PDF has been verified. DOM tests are not a visual browser pass.

Optional DOM test reproduction (does not add a dependency to the shipped app):

```sh
npm install --prefix /tmp/eec-dom-tools --no-package-lock --ignore-scripts jsdom@26.1.0
EEC_DOM_MODULE=/tmp/eec-dom-tools/node_modules/jsdom/lib/api.js node tests/teacher-copilot-ui.mjs
```

`SAMPLE_SESSION.md` is a complete exported 25-minute small-group keyboard pitch session with quiet, seated, untimed and icon access choices. Its reflection is explicitly unrecorded. CI runs the dependency-free core/static checks; DOM and real-browser checks are separate.

Route-specific Vercel/Netlify headers deny microphone/camera/geolocation and outbound connections, alongside the HTML CSP. Header behavior on a deployed host is unverified because this PR is not a deployment.

Manual/browser acceptance: build an Explorers pitch session with keyboard and class format; change seven access settings; inspect the safety handoff; submit a de-identified reflection; download Markdown and confirm all five stages, timing, sources, access choices and reflection; use Print / Save PDF; reset and reload to confirm no stored work; check mobile layout and keyboard access.

## Open launch gates — do not sell as ready

| Gate from Project 01 | Current evidence / next required work |
| --- | --- |
| Reviewed EEC content system | Draft subset, versioned and traceable. EEC must name reviewer/owner and approve musical accuracy, timing, age appropriateness, game coverage, adaptations and refusal/handoff language. |
| Internal quality review | Automated input/export/isolation checks plus engineering review. Human pedagogy, musical accuracy, access alternatives and safe-handoff review remain pending. No LLM prompt-injection surface is connected; future model integration needs a separate review. |
| Responsible-adult pilot | No real-session pilot evidence. Observe planning and facilitation, usability/edit burden, creation opportunities, and safe handoffs using de-identified feedback. |
| Data flow and claims legal review | Not completed. Current flow is structured browser memory → teacher download/print, with static host request logs outside the app. Review hosting logs, exported-document handling, intended adult use and claims before launch. |
| Product operations | No staffed support, content update owner, triage, incident/refund/sunsetting process, uptime commitment or onboarding program. Assign people and verify the actual support path. |
| Package and sell | Subscription/school licensing remains a hypothesis. Price, payment/access, buyer validation, approved sample lesson set, pilot training and evidence-backed claims are untested. |

Next recommended action: EEC pedagogy/access review of this small slice, then a bounded adult pilot. Keep learner features and a generative backend outside this PR. Do not merge/deploy merely to satisfy launch gates; publication and market launch are separate decisions.
