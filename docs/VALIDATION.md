# v1.0 release validation

Prepared with Node 24.19.0, npm 11.9.0, playwright-core 1.58.2, Chromium 154.0.8037.57 and Firefox ESR 153.5.0 on Linux. Node 24 is pinned in `.nvmrc`. No production bundling is required.

## Model checks

`npm test`: **21 passed, 0 failed, 0 skipped**.

The P0.1 invariants remain: signal phases/clearance, four classes stopping at red in four directions, committed vehicles clearing, deterministic traffic, early cautious crossing, late collision, walking on red, solid buildings, diagonal speed/world bounds, following gap, localization/storage fallback, exact outcomes, retry reset, waiting for the violator, unchanged feet box and visible steady approach without predictive resources.

v1.0 adds:

- Ten cycles with bounded traffic/spawn records and a visible violation in each cycle.
- Repeated-cycle checks against new red-light entries by lawful vehicles.
- Collision detection during a stalled animation frame.
- Correct Taiwanese right-hand driving on both axes.
- No overlap between lawful vehicle bodies through three cycles of the fixed timetable.

The lane correction intentionally moves the runner to the southern/eastbound lane; the reproducible late-departure fixture is now 21.7 seconds. Safe early and post-runner crossings remain verified.

## Chromium

`npm run test:browser`: **13 checks passed**.

Covers the actual 1920 × 1432 Canvas, dominant desktop/720px layouts, visible player on opening, immediate/persistent language switching, safe arrival and exact completion copy, unannounced violation, both exact death headlines, single-line Chinese typography, retry via Enter, safe waiting, identical normal/runner art, player-last layering, unchanged hitbox, real key movement after a UI button, window-blur pause/focus resume, animation-loop smoke and no browser script/console/request errors. The measured one-second animation sample was around 61 frames; this is not a hardware benchmark.

## Firefox

`npm run test:firefox`: **7 checks passed**, using native WebDriver BiDi and a real Firefox ESR 153.5 process.

Covers release loading/rendering, immediate and persistent languages, collision and exact localized deaths, retry/safe waiting/bilingual arrival, real keyboard events after UI focus, layout/no predictive panel and no script/console errors. Captures wait for CSS animations and paint frames; the settled death overlay was visually inspected.

The prepared Firefox package came from Debian's security repository. InRelease signatures were checked against the installed Debian archive keyring; the Packages index and `.deb` were checked against their signed SHA-256 records before extraction under `/workspace/.cache/plh-firefox/`. No package signature or TLS verification was disabled. The isolated headless browser uses CI-compatible sandbox/cache settings; these are test-process settings, not game behavior.

## Visual review

Actual Chromium and Firefox captures were opened and inspected. Checks included road direction/arrows/stop lines, clear crosswalks and approaching traffic, player contrast, residential/garden destination, fine material detail, all 16 directional vehicle appearances, English/Chinese glyphs and full-contrast death/arrival screens. Review found two capture issues—cropping the new double-resolution sprite sheet and capturing Firefox before the death fade finished—which were corrected in the harness.

The supplied reference collage was accessible for this release. Its shading, atmospheric palette and texture density influenced the art pass. Composition/sprite simplicity still falls below the richly illustrated references; no parity claim is made. Current images are in `docs/screenshots/v1/`; older P0/P0.1 images are historical.

## CI and public verification

The Pages workflow installs locked tools and browser runtimes, runs model/Chromium/Firefox checks, stages only `index.html` and `src/`, and deploys after checks pass. It uses Ubuntu 24.04 and the Node 24 pin.

`BASE_URL` supports project-subpath/public Chromium checks. When this cloud's Chromium store cannot trust its HTTPS proxy, `PLH_USE_PLATFORM_CA=1` retrieves actual public responses through Playwright's TLS-verifying Node client using the platform CA. Certificate verification remains enabled. Public verification and final deployment outcome are reported after the workflow completes; this record's local counts do not by themselves prove deployment.

## Limits

Human enjoyment, first-glance recognition speed and perceived fairness were not measured in human playtests. The deterministic scenario remains learnable, including an early illegal crossing opportunity. Only the tested desktop engines are certified here; Safari, mobile/touch, audio and nonvisual spatial navigation are not certified or implemented. Branded Chrome/Edge installations were not separately exercised. No extra cities, secret vehicles, progression, campaign or major mechanic was added.
