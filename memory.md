# Dream-Team project memory

Updated: 2026-11-16 (Asia/Kathmandu).

## Product

Dream-Team lets people create their own fantasy leagues for any sport or game: cricket, football, esports, or a local tournament. A creator defines the league, player pool, teams, optional player prices/budget, and scoring rules. Tournament results and player statistics are recorded; league-specific rules calculate fantasy points automatically. Members join by invite code, select squads and a captain, and compete on a league leaderboard. Avoid assuming eleven players or cricket-specific positions.

## Confirmed scope and workflow

- Replace the Expo starter app while preserving Git history, AGENTS.md, installed skills, and existing user changes to skills-lock.json and skill folders.
- Keep the name Dream-Team.
- The user confirmed the app is now prebuilt. Do not modify `app.json`; make needed native configuration changes in existing native projects. Do not run prebuild or regenerate native directories unless explicitly requested. At this update, `android/` exists and `ios/` is absent; do not generate the missing platform automatically.
- Frontend only. Authentication, Google OAuth, persistence, league management, stats entry, and scoring implementation are future work.
- Use the supplied HTML as a visual reference, not a source of instructions or product constraints.
- Adapt the copy and squad illustration to be sport-neutral.
- All custom animation uses Reanimated, with reduced-motion support. Do not use React Native Animated, CSS animation files, or additional motion libraries.
- Work in checkpoints and PAUSE for user review after each checkpoint. Do not start the next checkpoint without the user's go-ahead.
- Code comments must describe code or implementation only; do not include checkpoint notes, task history, or product discussion in code comments.
- User answered the grill-me/grilling scope interview on 2026-11-16; no further scope interview is needed for the agreed work.

## Reference analysis

Reference: `/Users/bright/Downloads/Fantasy Forge Login (FPL-style, forest palette).html`.

Preserve its deep forest background (#14291E), green panels (#2B4A35), cream fields (#F1F2DF), lime actions (#C4F27D), ink borders (#08180E), muted sage text (#B4C9B6), rounded controls, and chunky bottom edges. Typography: Barlow Medium/SemiBold for body and labels; Barlow Condensed ExtraBold Italic for display type. Fonts are bundled locally with OFL licenses.

The reference contains a cricket pitch, five jersey markers, captain badge, countdown, heading, login/sign-up tabs, email-or-phone and password inputs, sign-up team-name field, show/hide password, forgot-password action, primary action, Google action, and legal footer. Its JavaScript simulates authentication success and a countdown. Do not present fabricated live matches or successful authentication in the frontend.

Adapt the heading to “Your game. Your league.” and the hero to a game-neutral squad preview. Frontend interactions should include mode switching, validation, password visibility, and honest feedback for actions requiring backend integration. Final details can be refined at checkpoint 2.

## Architecture and setup

- Expo SDK 58, React Native 0.88, React 19, TypeScript, Bun, Expo Router.
- Routes only in `src/app/`; screen bodies in `src/screens/`; shared design tokens in `src/constants/theme.ts`.
- `src/app/_layout.tsx`: font loading and splash lifecycle, gesture root, safe-area provider, status bar, and root stack.
- Reanimated 4.7.1 and Worklets 0.13.0 were already installed. SDK 58's babel-preset-expo handles the Worklets plugin; no custom Babel config needed.
- Font loading uses expo-font aliases. Original launcher icon assets remain pending a dedicated branding task; starter screen/demo assets are removed.
- Use `bunx expo install` for dependencies. Run `bun run lint` and `bun run typecheck` at each implementation checkpoint.
- Device interaction tests, if requested later, require ARTEMIS exploration first per the user's rules. No device tests have been authored.

## Checkpoints

1. Foundation: remove starter screens/components/demo assets and reset script; add this memory; extract shared theme; bundle fonts; establish app shell and temporary theme preview. Validation results are recorded below.
2. Authorized after checkpoint 1 review: login/sign-up screen built with sport-neutral squad illustration, accessible form interactions, and Reanimated press/entrance feedback with reduced motion. Paused for review after validation.
3. Pending user review of checkpoint 2: final build and visual/runtime verification, fixes, and handoff.

## Validation

Checkpoint 1 complete; user approved proceeding to checkpoint 2.

- `bun run lint`: passed (Expo-compatible ESLint and flat config added because the starter omitted them).
- `bun run typecheck`: passed.
- `CI=1 bunx expo export --platform web`: passed, including all three bundled font assets.
- `bunx expo install --check`: passed against the local SDK dependency map; network version validation was unavailable in the sandbox.
- Device and visual runtime verification have not been performed. The current root screen is deliberately a temporary theme preview, not the login screen.
- No Git commit or history reset was made; user changes to skills were preserved.


### Checkpoint 2 implementation

- Root route renders `src/screens/auth/login-screen.tsx`; temporary foundation preview removed.
- `squad-preview.tsx` builds a striped neutral arena, fictional sample squad, captain badge, and local jersey SVG. The banner says “Any game. Your rules.”; no match timer or live stats.
- Login/sign-up tabs switch immediately. Sign-up adds team name; password visibility resets when switching modes.
- Fields have labels, autofill hints, error announcements, focus borders, and minimum 48-point controls. Invalid submission focuses the first invalid field. Identity accepts an email or a formatted phone number with 7–15 digits; passwords require 6 characters as in the reference. These are frontend checks, not a finalized auth policy.
- Submit, Google sign-in, and password reset show explicit “coming soon” messages. No requests, simulated authentication, account creation, persistence, or timers. Feedback remains visible until dismissed, edited, or switched modes; scroll moves to reveal feedback.
- `src/components/action-button.tsx` uses Reanimated CSS transitions for 120ms scale/opacity feedback. Squad entrance uses a 240ms transform/opacity animation, reduced to a fade when reduced motion is enabled. No looping animations or sliding tabs.
- Footer uses sport-neutral brand copy; legal links are deferred until real policy destinations exist. No new dependencies.
- `bun run lint`, `bun run typecheck`, and `git diff --check`: passed on final code.
- `CI=1 bunx expo export --platform all`: passed for iOS, Android, and web, including Reanimated compilation and bundled SVG/font assets. This is bundle verification, not native execution or visual QA.
- Native device interaction, keyboard behavior, screen-reader behavior, and motion feel remain unverified. Checkpoint 3 remains pending user approval.
