# Pedestrian’s Living Hell v1.0.0

A finished compact, bilingual desktop crossing game, released from the existing P0.1 foundation.

**Play:** https://jaychtw.github.io/pedestrian-living-hell/?v=1.0.0

## Final pass

- Doubled the backing resolution in each axis to 1920 × 1432, with half-unit pixel detail and sharper Chinese lettering.
- Refined material shading, foliage and skyline, separated residential/storefront architecture, and made the original home target read as a garden entrance.
- Rebalanced player/vehicle proportions and clarified left/right sedan profiles, retaining conservative collision bounds and player visibility.
- Corrected horizontal lane orientation for consistent Taiwanese right-hand driving, including arrows, stop bars and vehicle signals. Tuned the fixed lawful timetable to avoid crossing vehicle bodies.
- Fixed movement after UI button focus and paused play on window focus loss. Browser shortcut modifiers remain available.
- Bounded long-running spawn records, added multi-cycle and stalled-frame collision checks, and preserved the unannounced, visible, avoidable violation.
- Kept immediate/persistent English and Traditional Chinese, exact dramatic death headlines and exact successful arrival messages.
- Pinned the Node development line, versioned browser asset URLs, and gated Pages deployment on logic plus Chromium/Firefox gameplay checks.

## Verification

Local release checks passed: **21 model tests, 13 Chromium browser checks and 7 Firefox checks**. Actual captures were reviewed for gameplay, both languages, death/arrival, focus behavior, legible sprites, correct lanes and high-resolution rendering. The Firefox capture waits for the death fade to finish; screenshots represent the settled presentation.

The Pages workflow runs the same categories before deployment. Public-site verification and final workflow status are reported with the release; passing local checks alone does not establish publication.

## Known limits

This remains a small authored scene, with simpler sprites and less visual richness than the supplied reference collage. The fixed traffic schedule can be learned and permits a quick illegal crossing in some gaps. Human playtesting remains necessary to judge enjoyment and perceived fairness. Safari, touch, audio, progression and additional content are outside the release. Chrome/Edge were covered at the Chromium-engine level, not as separately installed branded browsers.

No next feature phase is planned or started by this release.
