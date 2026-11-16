# Dream-Team project memory

Updated: 2026-11-16 (Asia/Kathmandu).

## Product

Dream-Team lets people create their own fantasy leagues for any sport or game: cricket, football, esports, or a local tournament. A creator defines the league, player pool, teams, optional player prices/budget, and scoring rules. Tournament results and player statistics are recorded; league-specific rules calculate fantasy points automatically. Members join by invite code, select squads and a captain, and compete on a league leaderboard. Avoid assuming eleven players or cricket-specific positions.

## Confirmed scope and workflow

- Replace the Expo starter app while preserving Git history, AGENTS.md, installed skills, and existing user changes to skills-lock.json and skill folders.
- Keep the name Dream-Team.
- The user confirmed the app is now prebuilt. Do not modify `app.json`; make needed native configuration changes in existing native projects. Do not run prebuild or regenerate native directories unless explicitly requested. At this update, `android/` exists and `ios/` is absent; do not generate the missing platform automatically.
- The initial UI checkpoints were frontend only. The user has now authorized API authentication using Axios and TanStack Query, after first porting the provided hash loader. League management, stats entry, and scoring remain future work.
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


## Auth integration checkpoints (current work)

User request: use Axios + TanStack Query for the auth section and integrate the API documented at `http://localhost:3001/api/docs`. First port the supplied web HashLoader to React Native. Pause for user review after each checkpoint. This sequence takes priority over the earlier pending UI verification checkpoint.

1. Hash loader: implemented in `src/components/hash-loader.tsx`, with named/default `HashLoader` export and typed `HashLoaderProps`. Reanimated CSS keyframes render the four box-shadow bars as native views, preserving the 165-degree rotation, 0/35/70/100-percent keyframes, CSS ease curve, horizontal 0.75 opacity, and 2000ms/speedMultiplier duration. Numeric `size` uses native layout points; native `style` replaces cssOverride. Defaults match source: loading=true, color=#000000, size=50, speedMultiplier=1. Invalid nonpositive/nonfinite size or speed uses the default. loading=false unmounts the animation. Reduced motion renders a stationary hash. Accessibility exposes an indeterminate busy progress bar.
2. Pending review of loader: inspect the documented API contract, install Expo-compatible Axios and TanStack Query dependencies, and establish the API client/query infrastructure based on the actual auth contract.
3. Pending review of API infrastructure: integrate auth forms and session handling, use HashLoader for loading states, and verify supported authentication flows. Do not invent OAuth or recovery endpoints; inspect API support first.

Loader review route: `/loader-preview`, development only (redirects to `/` in production). Controls cover visibility, color, 0.5×/1×/2× speed, and 24/50/80-point sizes. No auth integration or app.json changes in this checkpoint. Native visual fidelity and motion feel remain unverified.

Hash-loader checkpoint validation: `bun run lint`, `bun run typecheck`, `git diff --check`, and `CI=1 bunx expo export --platform all` passed. iOS/Android/web bundle compilation is verified; runtime appearance and motion on a device have not been verified. Paused for loader review before API client setup. No app.json changes or new dependencies.

Hash-loader alignment correction: replaced percentage translations and repeated translate transforms with explicit `left`/`top` coordinates calculated as `(size - barDimension) / 2 + signedOffset` at every keyframe. Both opposing pairs retain the same midpoint as their widths/heights change. Only childless, absolutely positioned bars animate layout properties. Timing, opacity, rotation, and reduced-motion rendering remain unchanged.


### API foundation checkpoint

- User confirmed the hash loader's alignment works and requested deletion of its preview screens. Deleted `src/app/loader-preview.tsx` and `src/screens/dev/loader-preview-screen.tsx`; retained the shared loader. Removed preview instructions from README.
- Installed Axios 1.21.1 and TanStack React Query 5.107.1 through `bunx expo install`.
- Added shared Axios client, 15-second timeout, environment base URL, cancellation passthrough, and normalized ApiError (status, kind, validation messages, Retry-After). Error objects do not retain Axios configuration or request credentials. Production has no implicit local URL; configuration errors occur on request, not app startup.
- `.env.example` documents base URL including `/api`, Android localhost forwarding/emulator alias, and LAN addresses for physical devices. No `.env.local` was overwritten or created. Default development URL is localhost:3001/api; physical-device connectivity has not yet been verified.
- Added exact typed request/response models and `createAuthApi`/`authApi` methods for register, login, refresh, logout, and profile. The profile method accepts AbortSignal and an explicit bearer token. Password bytes are preserved. Email/username are trimmed and lowercased. Payloads exclude unexpected fields.
- Added root QueryProvider with one QueryClient per provider and native AppState focus integration. Query data stays fresh for 30 seconds; queries retry network/timeouts/5xx once. Mutations never automatically retry and inactive mutation entries have gcTime=0. No query cache persistence or credential persistence.
- Live API contract: POST `/api/auth/register` requires username (3–30 lowercase alphanumeric/underscore), email (max 254), password (12–128, untrimmed). POST `/api/auth/login` uses email + password (1–128). Both return user, tokenType, accessToken, expiresIn, refreshToken, refreshExpiresAt. POST `/api/auth/refresh` consumes a single-use 101-character opaque refreshToken and rotates credentials; serialize refreshes and store the latest token. POST `/api/auth/logout` uses the latest refreshToken and returns 204; it revokes the current session. GET `/api/auth/me` requires bearer accessToken and returns {user}. Access tokens last up to 15 minutes; sessions have an absolute seven-day deadline. Endpoints are rate limited; 429 may include Retry-After.
- No phone login, Google OAuth, password-reset, or team-name API is documented. Next UI integration must adapt to supported fields and keep unavailable actions honest.
- Live Axios checks against local API: invalid register/login/refresh/logout returned 400 and invalid profile token returned 401; all errors normalized to ApiError. No account or valid session created. Native/UI behavior not verified.
- Next checkpoint after review: auth hooks + session coordination/persistence + connect login/sign-up UI + protected signed-in destination and logout, use HashLoader for pending states, handle token rotation and expired sessions, and verify end-to-end behavior. Avoid caching raw credentials and reset auth mutation state after completion. Preserve user keyboard-controller changes and prebuilt setup; never edit app.json or regenerate native projects.

API foundation validation: final `bun run lint` passed with zero warnings; `bun run typecheck`, `git diff --check`, and `CI=1 bunx expo export --platform all` passed. Preview routes are absent from the exported route manifest. No app.json or native project changes. Paused for checkpoint review before auth UI/session integration.


### Auth UI and session checkpoint

- User approved continuing from the API foundation. Connected sign-up/login to TanStack mutations and the Axios API through `SessionController`. The form now uses username (3–30 letters/numbers/underscores), email, registration password 12–128, and login password 1–128. Password bytes are preserved; username/email are normalized by the API adapter.
- Submit and logout have immediate in-flight guards, disabled controls, and HashLoader pending states. Failed submits preserve the draft; successful sign-in clears the password and changes route. Auth mutations reset after completion and do not return tokens to the query cache. HTTP 429 honors Retry-After using a deadline and disables repeat submission during the cooldown.
- `SessionController` serializes sign-in, refresh, storage updates, and logout. Concurrent 401 profile responses compare the session object they used, so only the first rotates; the others reuse replacement credentials. Profile retries a 401 once after refresh; a second 401 clears the session. It proactively refreshes within 30 seconds of access expiry and checks the absolute session deadline. Network failures retain credentials; invalid/expired credentials clear them.
- Native refresh credential + absolute deadline are stored using expo-secure-store 58.0.3, scoped to the API base URL. Access tokens and user data are not persisted. Corrupt/inapplicable stored data is discarded before requests. A failed credential save attempts server revocation and local clearing, then fails sign-in visibly.
- Browser storage adapter keeps credentials only in memory (lost on page reload); no Web Storage persistence. Browser persistence would require a separate backend cookie/session design.
- Root AuthProvider restores before rendering routes. Restore errors show a retry/clear-saved-sign-in gate. Clearing local state does not claim remote revocation. User changes/sign-out cancel and remove queries from the prior session. Expo Router Stack.Protected gates login and account; no manual navigation before hydration.
- `/account` is the protected signed-in destination. It shows the public profile, profile fetching/error/retry state, and logout. Known profile data stays visible when refresh fails. API logout uses the latest refresh credential; failure remains visible and retryable. Google sign-in and reset-password remain explicitly unavailable since there are no corresponding API endpoints.
- New native SecureStore dependency requires an Android rebuild before runtime use. Updated existing `android/app/src/main/AndroidManifest.xml` backup-rule references directly to SecureStore's bundled XML resources. This directory is Git-ignored, so the local native edits are not visible in git diff and must be retained with the prebuilt project. Installer automatically added a plugin to app.json; that automatic edit was immediately removed, leaving app.json unchanged. No prebuild run and no iOS project generated.
- Native device inspection was declined; do not retry device access without user authorization. No device UI or encrypted persistence verification was performed.
- Live API verification through the actual SessionController with in-memory storage passed: registration -> two concurrent profile 401 responses -> exactly one refresh -> restored session -> logout -> revoked refresh 401 -> wrong password 401 -> login -> final logout. Created one verification account `codex_auth_mwj5663i`; credentials were generated in memory, never printed/stored, and all sessions logged out. The account remains because no deletion API is available.
- Final code checks and platform bundle export results follow below. Pause for review after this checkpoint.

Auth checkpoint final validation: lint (zero warnings), TypeScript, git diff whitespace checks, and iOS/Android/web bundle exports all passed. Live API checks passed as described above. Native compilation, installation, device UI, and SecureStore persistence remain unverified; a native rebuild is required for the new module. app.json has no diff. Paused for user review.


### React Hook Form migration

- User reported the preceding auth work complete, then requested React Hook Form for all forms. Installed react-hook-form 7.92.0 through `bunx expo install`.
- Audited all app inputs; the only current forms are login/sign-up in `src/screens/auth/login-screen.tsx`. Both now use typed `useForm<AuthFormValues>` with controlled native fields through `AuthField`/`useController`. No field values, validation errors, or input refs are held in manual screen state.
- Added `src/features/auth/form.ts` for blank defaults and mode-aware validation matching the API: sign-up username 3–30 alphanumeric/underscore after normalization, email validation/max 254, registration password 12–128, login password 1–128; password whitespace/case remain unchanged.
- React Hook Form owns field errors and root.server API errors; `isSubmitting` combines with mutation state for pending/disabled UI. Invalid submission uses setFocus in visual field order; keyboard next actions use setFocus. Native field refs, onChangeText, and onBlur are wired to useController.
- Mode switching preserves values while resetting form state/errors, including registration-only username validation. Failed API calls retain the draft. Successful sign-in resets the password; mutation reset and immediate duplicate-submit guards remain. Forgot-password email validation uses trigger. Rate-limit cooldown, password visibility, and availability notices remain presentation state.
- Added a persistent Forms rule in AGENTS.md requiring React Hook Form for every future form, with Controller/useController for native fields. Updated README with the convention. No app.json, native setup, authentication service, or session-controller changes.
- Device actions were not requested or performed for this migration; earlier device-access denial remains in force.

React Hook Form checkpoint validation: installed react-hook-form 7.92.0 through Expo CLI; lint (zero warnings), typecheck, git diff whitespace checks, and iOS/Android/web bundle exports passed. Device interactions were not rechecked.
