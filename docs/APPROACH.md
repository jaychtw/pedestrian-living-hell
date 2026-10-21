# v1.0 architecture and art decisions

The final production pass revises P0.1 under the supplied v1.0 instructions. The attached four-city pixel-art collage was visible and inspected. Its qualities—layered warm cloud highlights, cool atmospheric distance, varied foliage and fine architectural texture—inform this release. Its literal landmarks and perspective are not imported into the fictional Taiwanese top-down crossing. The original GDD was never attached; no claim is made about unprovided requirements.

The highest-impact audit findings were repeated flat façades, undersized vehicle silhouettes, a disconnected destination marker, keyboard movement blocked by UI focus, inconsistent driving side between road axes, and unbounded spawn-history growth. These were addressed without adding a gameplay system or map.

The model keeps a 960 × 640 world with one intersection and the original home target. A 76-unit decorative skyline is composited above it. The renderer uses a 1920 × 1432 backing surface: coordinates remain logical world units, and half-unit detail now uses a real device pixel. Static world/sky canvases are cached and copied; animation adds vehicles/signals/player. This avoids re-uploading ImageData every frame and preserves measured desktop smoothness. Native 2D drawing is the only rendering architecture.

Façade types are separated into shops, residential frontage and low blocks. The destination is a garden entry rather than a painted toy house. Texture/shading is stronger on façades and foliage, subdued on roads, and absent as predictive vehicle decoration. Larger directional vehicle art and a slightly refined player silhouette share a common outline/light direction. The feet box remains 12 × 11, and the player draws last.

Both axes now follow Taiwanese right-hand traffic. The single repeating timetable was retuned for lawful vehicles to clear each other; repeated-cycle overlap and red-entry checks protect that correction. One steady-speed scooter ignores red, with over four seconds of visible approach. The model alone knows that flag; normal and violating sprites at the same position render identically. There is no advance warning panel, sudden lane change or teleporting hazard.

Input respects modifier shortcuts and supports movement after UI focus. Hidden/unfocused windows pause the clock and clear held keys. Result presentation keeps localized exact strings, keyboard retry, accessible names/focus and reduced-motion behavior. English/Traditional Chinese resources remain centralized, with safe storage fallback.

Testing uses Node for model invariants, Playwright Chromium for full flows/layout/rendering, and native Firefox WebDriver BiDi for a second desktop engine. The Firefox binary prepared in the cloud was verified through signed Debian security metadata and package SHA-256; it was extracted outside the repository. Temporary browser profiles/caches are isolated and removed. Browser trust checks remain enabled; the optional public-site Node transport uses the platform CA rather than ignoring HTTPS errors.

The existing main-branch GitHub Pages workflow publishes only the static game after release checks. Each cloud task is already isolated; reuse the checkout rather than creating a Git worktree unless explicitly requested. Files/dependencies may persist in a development snapshot; live services must restart.

The release stops at v1.0. Artistic limitations and human playtest uncertainty are acknowledged rather than driving indefinite refinement or additional content.
