# P0.1 validation

Node 24.19.0, npm 11.9.0, playwright-core 1.58.2 and system Chromium. Native browser modules require no production build.

## Executed checks

`npm test`: **16 passed, 0 failed, 0 skipped**. The original 13 logic checks remain, with the intentionally changed violation timing updated. Three checks were added for unchanged feet collision boundaries after art enlargement, four-plus seconds of visible constant-speed approach, and exact localized death headlines with predictive warning resources absent.

The suite covers signal phases/clearance; all four classes stopping at red in all four directions; committed traffic clearing; reproducibility; early cautious crossing; late collision; illegal walking; solid buildings; diagonal speed/world bounds; following distance; translation parity/storage fallback; clean retry; and waiting for the runner before crossing.

`npm run test:browser`, with the server running: **12 checks passed**:

1. English opening and normal traffic; the desktop opening card leaves the player visible.
2. Immediate Chinese switching without reset and language persistence on reload.
3. Reachable home and exact bilingual completion messages.
4. Red-light runner crosses during WALK with no predictive panel or sidebar.
5. Exact English/Chinese death headlines, selected-language copy, large single-line Chinese headline and visible keyboard retry.
6. Waiting for the unannounced scooter to pass allows a safe crossing.
7. Normal/violating scooters produce identical rendered pixels at the same position; the player renders above an overlapping bus; feet bounds are unchanged.
8. Real keyboard movement on pedestrian red in ordinary animation mode.
9. At least 30 animation frames over a one-second sample; observed approximately 61 on this instance. This is a smoke check, not a hardware benchmark.
10. No horizontal overflow at 1280, 1024 and 720 pixels; the canvas remains the dominant element.
11. All 16 directional vehicle appearances render in a review sheet.
12. No browser runtime, console or failed-request errors.

Only intentionally superseded browser expectations changed: the old longer copy, sidebar, advance scooter warning and understated failure headline. The remaining P0 flows are retained.

`BASE_URL` allows the same suite to exercise a project subpath or the GitHub Pages deployment. Screenshots are written to ignored `artifacts/screenshots/` or `SCREENSHOT_DIR`; reviewed captures were copied to `docs/screenshots/p01/`. Ordinary play has no test hook; deterministic browser scenarios explicitly use `?test`. Real input is separately checked without that hook.

## Visual inspection and corrections

Actual screenshots were opened at desktop display size and at 720px. Inspected the brighter active street, opening card, both death screens, Chinese glyphs, character contrast and sprite directions. An initial Chinese death heading left its final character on a separate line; font sizing was changed to follow the canvas width, and a single-line-height assertion now prevents that regression. The opening card was moved left on desktop so it does not cover the player.

No reference images were attached, so comparison with them remains unavailable. [The review](P01-REVIEW.md) assesses composition, sprite quality and Taiwanese identity separately and records shortcomings against the five concerns in the brief. No claim is made that brighter colours alone satisfy the art direction.

## Limits

Human playtesting has not been performed. Recognition time, subjective art acceptance, dramatic impact, fairness perception and engagement cannot be proved by these checks. Only Chromium was run; Firefox/Safari, touch and audio are outside this correction. The single fixed scenario remains intentionally repeatable. Decorative furniture remains non-solid. No new map or gameplay system was added.

The repository's existing GitHub Actions workflow deploys pushes to `main`; current deployment status is available in Actions. Local validation and deployment success are distinct, and this record describes the local checks above.
