# P0 approach and decisions

## Authority and missing input

The repository was empty and the requested remote `main` did not exist at the start of this task. The user then supplied two files: the Codex Mission and Pilot P0 implementation brief, authorizing a new playable implementation. Those requirements govern this work. The referenced GDD v0.1 was not provided; no compliance claim is made for its unprovided requirements. No conflict between the two supplied briefs required blocking implementation.

## Implementation approach

Use native Canvas 2D for an authored 960 × 640 intersection. Plain ES modules keep installation small and avoid a bundler or runtime framework. One scene, one character, one destination and four vehicle classes cover the pilot scope. A minimal Node static server handles development only. No 3D or external services are used.

The model owns geometry, a 30-second signal clock, deterministic lane traffic, feet-based collisions and success/failure. The renderer owns all pixel art, including horizontal side profiles and vertical front/rear appearances. The entry module maps keyboard state onto the model and connects HTML interface elements. Central dictionaries contain player-facing narrative, instructions and environmental signage; static Taiwanese shop names intentionally remain Traditional Chinese in either language.

Use an exclusive pedestrian phase and explicit clearance intervals to keep the crossing understandable. Ten lawful departures and one deliberately warned scooter runner form a repeatable scenario. The runner has a fixed approach and never teleports or changes speed unexpectedly. It begins offscreen, but the side-panel warning starts immediately and the full approach is visible for several seconds before reaching the crossing. Retry resets the same timeline. No turning, lane changes or advanced vehicle AI.

## Main technical and design risks

- **Timing and queues:** a slow lawful bus could accidentally obstruct the runner, removing the key hazard. The tested timetable lets it commit before red. Stop-line tests cover all four classes/directions, and the scenario test verifies an actual violation during WALK.
- **Collision fairness:** vehicle and character art extend beyond ground contact. Small inset vehicle bounds and the pedestrian's feet reduce misleading near misses. Substeps prevent fast traffic from jumping over the player.
- **Bilingual layout and storage:** Chinese changes line breaks and sign widths. Both languages are captured in Chromium; storage failure safely falls back to English, and language switching preserves gameplay.
- **Scope and visual clarity:** static scenery is cached and short buildings leave sightlines open. Authored pixel primitives are layered into recognizable façades, scooters, buses and street details; no procedural city or asset pipeline is introduced.
- **Experience versus proof:** deterministic tests prove possible outcomes and reproducible hazards, not player enjoyment. Human playtesting remains the next design gate.

## Environment and repository boundary

The initial onboarding restriction against source edits was superseded by the user's explicit implementation mission. Only this previously empty checkout was populated. No push or publication is performed automatically. Reusable dependency installation and startup instructions are saved separately in environment configuration. Live server processes must restart in future tasks. Each cloud task is already isolated; use the existing checkout, and create no Git worktree unless explicitly requested.
