# P0 validation record

Validated in the cloud execution workspace using Node 24.19.0, npm 11.9.0, playwright-core 1.58.2 and system Chromium. No production build is necessary: native browser modules are served directly.

## Executed automated checks

`npm test`: **13 passed, 0 failed, 0 skipped**.

- Full signal cycle, exclusive WALK and clearance intervals.
- All four vehicle classes stopping at red in all four directions.
- Committed traffic clears the junction.
- Deterministic timetable and exactly one controlled violation per cycle.
- Repeated successful cautious crossings at the beginning of WALK.
- Reproducible collision when leaving late without checking the runner.
- Movement permitted on pedestrian red.
- Solid building collision.
- Normalized diagonal movement and world limits.
- Vehicle following distance.
- Translation key parity, nonempty strings, exact completion copy and storage failure fallback.
- Clean retry state.
- Safe crossing after waiting for the observed violating scooter to pass.

`npm run test:browser`, while the development server was running: **10 passed**.

1. English start flow, running Canvas scene and normal traffic.
2. Traditional Chinese toggles live without resetting time; survives reload.
3. Cautious crossing reaches home; success copy switches in place.
4. Scooter passes its stop line during WALK with a visible warning.
5. Collision, failure translations and retry reset.
6. Real keyboard input moves the amber pedestrian into the road during red.
7. Animation loop sampled **61 frames over about one second** in headless Chromium.
8. No horizontal overflow at the compact 720-pixel viewport.
9. All 16 vehicle class/direction appearances rendered into a review sheet.
10. No browser runtime or console errors during the flows.

Browser automation uses explicit `?test` mode for simulation time advancement; ordinary play has no test hook. Real keyboard input is separately tested in normal animation mode. The sprite sheet is rendered in a temporary test document, not exposed as a gameplay menu. Screenshots are generated in ignored `artifacts/screenshots/` on each run. The reviewed captures in `docs/screenshots/` were copied from the validated application.

## Visual inspection

Actual Chromium screenshots were opened and inspected for English/Chinese layout, unobstructed road sightlines, the violation warning, shop signage, the four directional appearances and the home marker. Lane arrows and the pedestrian status icon were corrected following inspection. Vertical vehicles were refined into front/rear elevations rather than roof views. These are source-authored pixel sprites, not external image assets.

## Fixes found during verification

- The environment's default npm cache was unwritable; installs now explicitly use `/workspace/.cache/npm`.
- A bus originally stopped before the runner's route and prevented the violation. Its departure was adjusted and the actual violation is asserted.
- Partial directional input from browser scenario controls produced invalid coordinates. Input normalization now treats absent directions as false.
- An initial sprite-review harness replaced the live game's DOM and triggered a callback error. Review now uses a separate document; the final full browser run has no runtime errors.

## Limitations and assessment

The intended mechanical loop is demonstrated: lawful signals usually matter, ignoring a warned exception causes a repeatable failure, waiting for it permits a safe arrival, and illegal walking remains possible. There has been no human playtest; long-term engagement, difficulty and subjective art acceptance remain unproven.

Only Chromium and one desktop environment were exercised. The animation sample is a smoke check, not a performance guarantee. Touch controls and audio are not implemented. Decorative planters and street furniture have no colliders. The deterministic 30-second scenario is intentionally learnable, and one early illegal rush can succeed during a gap. Vehicles do not turn or change lanes. The missing GDD could introduce constraints that were not available for review.

The local server was started and tested in this instance. Installation/startup instructions are saved as a configuration draft; saving does not publish the environment. Fresh-task restoration is not verified, and the initial commit is local until explicitly pushed to GitHub through an authorized workflow.
