# P0.1 approach and boundaries

The original empty repository was populated for P0 and deployed at `f964a46`. This P0.1 task is an explicitly authorized corrective revision of that implementation. The supplied mission, P0 brief and P0.1 brief govern the work. GDD v0.1, the two referenced images and the original five playtest questions were not attached; unprovided requirements and artistic reference parity remain unverified.

Keep the minimal architecture: native Canvas 2D, plain ES modules, separate model/render/input/localization, no runtime packages or backend service. One intersection, one pedestrian, four vehicle classes, one controlled violation and the same success/retry loop.

The model's 960 × 640 world, solid building geometry and feet hitbox remain unchanged. The renderer composites a decorative 76-pixel skyline above that world onto a 960 × 716 canvas. All sprites, signs and scenery remain authored 2D drawing. Backgrounds are cached by language; the player draws after traffic to preserve visibility. No 3D or external asset pipeline.

Remove advance hazard knowledge from the UI and renderer. The model alone knows the violator flag for traffic behavior; identical flags at identical positions must render identical pixels. A slower earlier approach gives time to observe motion without a future-behavior announcement. A deterministic timetable and substep physics preserve reproducibility and collision fairness.

Central dictionaries contain both languages, including the exact new death headlines. The reduced HUD exposes signal state and goal only. Pre-play instructions identify the player and controls; death/success dialogs retain labels, keyboard retry and selected-language text. Reduced-motion styling disables the death fade when requested.

Risks are addressed by targeted checks: unchanged feet collisions despite a larger sprite; player-last compositing; translation parity and persistence; full-width Chinese death typography; safe/unsafe runner scenarios; and actual browser captures at desktop and 720px. Automated readiness is distinct from first-time human recognition and subjective art acceptance.

Reuse the existing checkout in each already-isolated cloud task; do not create a Git worktree unless explicitly requested. Dependencies may persist, but live server processes must restart. Only the authorized P0.1 correction is implemented; stop here without adding new gameplay systems, cities or progression.
