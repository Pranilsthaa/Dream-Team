# Dream-Team project memory

Updated: 2026-11-17 (Asia/Kathmandu).

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


### API logger

- Added `src/lib/api/logger.ts` and called its request/response/error functions from the shared Axios interceptors. Every current API method uses this client; no screen-by-screen logging is needed. Logging runs in all builds as requested.
- Request logs include ID, method, actual Axios URL, query params, and body if present. Success logs include ID/status/duration without response bodies. Errors log raw backend response data before ApiError normalization, plus status/code/Retry-After/duration. Intentional cancellations use CANCELED informational logs.
- Copies recursively redact sensitive keys and known request secrets (including echoed error messages), bearer/JWT/opaque refresh credentials, and URL credentials/query secrets. Serialized JSON request bodies are parsed for redaction. Logger metadata is keyed by request configuration in a WeakMap, so it is released with the request. Raw Axios errors/configs are never logged; logging failure does not replace the response/error.
- Verified using controlled Axios adapters: query params and backend validation details were logged, successful and failed calls were correlated, nested secrets/echoed credentials were absent, the original request data stayed intact, and backend 500 still became the expected ApiError. No device actions or real API mutations were needed.
- Preserved existing user edits to login-screen.tsx. No dependencies, app.json, or native configuration changes.

API logger validation: controlled Axios adapter verification passed for parameters/body logging, success/error output, echoed-secret redaction, unchanged request payloads, and preserved ApiError normalization. Lint (zero warnings), TypeScript, git diff whitespace checks, and iOS/Android/web exports passed. Existing user edits to login-screen.tsx were preserved.


### Zustand auth state migration (2026-11-17)

- User requested replacing auth-provider's direct useSyncExternalStore integration with Zustand. Installed zustand 5.1.0 using `bunx expo install`.
- Each SessionController now creates a Zustand vanilla store for public SessionSnapshot state. Removed the custom snapshot property, listener Set, subscribe/getSnapshot methods, and publish helper. Controller updates state through store.setState and reads it through store.getState. Private access/refresh credentials and serialized session operations remain separate.
- AuthProvider context holds the stable controller instance rather than a changing object containing session data. useAuth() uses Zustand useStore(controller.store) and preserves `{controller, session}` for existing screens/hooks.
- Startup restoration and cleanup remain in the provider effect. A Zustand subscription receives next/previous states directly and cancels/removes queries when user identity changes. Effect cleanup unsubscribes. Stores remain scoped to each provider/controller, avoiding a server-global session store.
- No direct useSyncExternalStore calls or custom listener/snapshot plumbing remain in app source. Native SecureStore persistence, token rotation, refresh serialization, API mutations, forms, protected routes, and logger are preserved. No native/app.json changes.
- Controlled API/storage verification passed: signed-out restoration, login state notifications, subscription cleanup, instance isolation, saved-session restoration, logout/credential clearing, and exactly one shared refresh for concurrent 401s. No backend account mutations or device access were needed.

Zustand migration validation: lint (zero warnings), TypeScript, git diff whitespace checks, and iOS/Android/web bundle exports passed. Controlled store/session checks passed. Device interactions were not rechecked.


### Session restoration retry minimum duration

- User requested preventing flicker when SessionGate's Try again action finishes quickly. The button now calls `controller.restore(1000)`.
- restore accepts an optional minimumDurationMs (default 0), starts its timer alongside storage/network work, and delays publishing terminal signed-in/signed-out/restore-error state until that timer completes. rotate accepts the same completion promise so successful refresh, expired credentials, and rejected refreshes cannot publish early and unmount the gate.
- Startup restoration and ordinary background refresh retain their existing immediate behavior. Requests taking over one second do not receive an additional second of delay. Preserved the user's existing formatting/UI edits in session-gate.tsx and unrelated account-screen.tsx changes.
- Verified fast success, fast failure, no saved credential, slow failure, and immediate startup behavior with controlled API/storage implementations. Lint, TypeScript, and git diff whitespace checks passed. No device actions, app.json edits, or new dependencies.


### Shared authenticated API recovery

- User identified that refresh handled only profile and requested central handling with edge cases. Added `src/lib/api/authentication.ts`; shared `apiClient` now prepares bearer credentials and recovers a 401 for any protected endpoint. `publicApiClient` remains the transport for auth endpoints and explicitly anonymous resources. No new dependencies/native/app.json changes.
- AuthProvider binds the current session for the mounted app and releases only its own binding on cleanup. The singleton protected client is unbound during server rendering. Requests without a bound/signed-in session fail before dispatch. Auth transport uses a separate client to avoid refresh interceptor recursion/deadlocks. Removed profile's separate refresh/retry implementation; profile now calls the same protected client.
- Controller exposes authorization/recoverAuthorization/expireAuthorization/isAuthorizationCurrent. Token preparation and reactive refresh each share pending promises, including failure, across concurrent callers. Session epoch distinguishes logins/account replacements/logout; version distinguishes rotations even when JWT strings are identical. Logout invalidates old requests immediately and uses the latest rotated refresh credential after queued work finishes.
- A protected request retries at most once after HTTP 401. Same-session rejected retry clears that session; delayed responses from an older epoch/version cannot clear a newer session. Canceled waiters reject promptly without canceling shared refresh. Success responses from a replaced/signed-out session are rejected. JSON body/query/signal are preserved on replay; stream bodies are not replayed. No network/timeout/403/429/5xx replay of the original request. Invalid refresh clears state; transient refresh failure retains credentials.
- Authenticated origin/path guard prevents sending bearer credentials beyond the configured API. Login/register/refresh/logout paths explicitly bypass auth recovery, even when accessed through the protected client. Existing API logging runs for initial and retried attempts and each backend failure before normalization.
- Controlled Axios adapter checks passed: 12 simultaneous 401s with exactly one refresh; single retry and final sign-out; shared failed refresh; transient failure retention; aborted waiters; logout during refresh; stale successful response after logout; 403 bypass; cross-origin block; auth endpoint bypass; proactive refresh sharing on success/503/429; old 401 after same-user login; identical JWT strings across rotation; original POST body and query preserved. No mobile UI assumptions or device actions involved.
- Use apiClient for future protected services (e.g. players). Use publicApiClient if a public endpoint should work anonymously. Backend must reject unauthorized mutations before side effects for safe 401 replay. A lost refresh response after server consumption may require a new sign-in because this backend documents no refresh grace/recovery mechanism.

Shared auth recovery validation: controlled adapter/session checks above passed; lint (zero warnings), TypeScript, git diff whitespace checks, and Android/iOS/web bundle exports passed. Existing development-only response/error logging preference is preserved. No live account creation, backend mutations, or device actions were performed for this change.

Button press feedback update: ActionButton now uses a stationary bottom depth layer and a face that moves down 3 points on press, covering the bottom edge. Reanimated transitions only translateY over 120ms; reduced motion applies the pressed position immediately. Removed press scale/opacity changes; disabled styling uses colors. Static container spacing preserves layout and the touch target. Existing user edits in action-button.tsx were preserved. Lint, typecheck, and whitespace checks passed; device appearance was not rechecked.


## Post-login reference UI checkpoints (2026-11-17)

Reference: `/Users/bright/Java/after-login.html`. Treat the HTML as visual/content reference; product direction remains multi-sport Dream-Team. User requested placeholder data, simple UI replication, @expo/ui bottom sheets, and checkpoints with review pauses. No API integration for league/squad/match content in this work.

Reference contains Home, Squad, Matches, and Leagues tabs; avatar/greeting/notifications header; league picker; striped league stats hero; scoring rules; quick actions; live-match and leaderboard cards; squad pitch and captain/vice selectors; match filters; league list/invite codes; creation/join forms; and notification/scoring/player/admin sheets.

Checkpoint 1: post-login shell and Home implementation. Added protected `(main)` route group (default Home) alongside the existing account route. Header/avatar opens account; bell opens Updates sheet. Bottom tabs use Expo Router JS tabs and existing forest/lime/cream theme, local Barlow fonts, and SVG line icons. Home replicates league chips, striped league summary, rank/points/round stats, static mock deadline, scoring rules, quick actions, live card, and three nearby leaderboard rows. Three sample leagues and scoring presets come from the supplied HTML.

Sheets use universal `Host`, `BottomSheet`, and `RNHostView` imports from @expo/ui, already installed at SDK 58. Scoring and Updates sheets use native dismissal/drag behavior and theme colors. No new motion library or custom sheet animation. New icon rendering uses existing expo-image SVG support; no icon package added.

Squad, Matches, and Leagues currently contain deliberately basic placeholder previews so the tabs and Home shortcuts have destinations. Home Create/Join/Add players shortcuts navigate to Leagues; full forms/actions are deferred. No edits to app.json, native projects, existing auth/session handling, or account/profile behavior. Mock data has no persistence.

Next checkpoint (after review): full Squad pitch and player breakdown/captain selection, plus Matches cards and filters. Final checkpoint: Leagues join/create forms using React Hook Form, invite/admin actions, remaining sheets, and interaction polish. Preserve simple local placeholder state; no backend services for these screens yet.

Expo SDK 58 removes initialRouteName from Tabs props; use `(main)/_layout.tsx` unstable_settings instead. Refreshed ignored generated route declarations with the installed Expo CLI setupTypedRoutes generator. A temporary offline dev-server attempt was stopped because port 8099 was already in use; no existing server was stopped.

Post-login checkpoint 1 validation: lint (zero warnings), typecheck after Expo route declaration regeneration, git diff whitespace checks, and iOS/Android/web bundle exports passed. Device appearance and native sheet interactions were not verified. Paused for user review before checkpoint 2.

Dashboard login-routing correction: user reported an unmatched route immediately after successful login. Added explicit SDK 58 Stack.Protected redirectTo destinations in the root layout: the signed-out-only index route redirects to /home once signed in; the signed-in-only dashboard/account group redirects to / when signed out. This avoids relying on the root default anchor after the login route becomes unavailable. Lint, typecheck, and whitespace checks passed. Device transition has not been rechecked; checkpoint 2 remains pending.

### Post-login checkpoint 2 — UI and API integration

User expanded this checkpoint to integrate the ready league/tournament API and use the installed lucide-react-native package. This supersedes the earlier placeholder-only plan. Read the live Swagger initializer at http://127.0.0.1:3001/api/docs and inspected its schemas. Applied Expo data-fetching and Expo UI skills, retaining the user's Axios preference. Preserved the user's staged Lucide/SVG dependency changes.

- Replaced dashboard SVG icons with named Lucide imports. Header uses the signed-in username and avatar initial.
- Added typed league/tournament services through apiClient, preserving shared bearer/401 recovery, cancellation, timeout, and logging. Paginated queries include user/league keys. Zustand holds the selected league; all dashboard league chips now use server leagues.
- Leagues displays owned/staff leagues and tournament editions. React Hook Form sheets create/edit league name/location and create/edit draft tournament name/season. Saves refresh lists; failures retain the draft; pending state blocks duplicate submission. Owner controls are shown conservatively because the list response does not expose staff roles. Staff administration and admin-specific controls remain deferred.
- The current backend only creates cricket leagues; no sport selector invents unsupported values. Tournament timezone defaults to the server setting on creation. Editing name/season preserves existing timezone/dates. Scheduling fields remain future work.
- Squad now has the striped pitch, jersey tiles, sample point breakdowns, captain/vice selection with distinct roles, budget summary, and local save notice. Preview choices are per league and last only while the screen remains mounted. No squad API is documented, so nothing is falsely submitted to the server.
- Matches calls the public global fixtures API and provides All/Live/Upcoming/Completed filters, team cards, date/venue/status, pull-to-refresh, and loading/error/empty states. Locked fixtures appear under Upcoming. Fixtures are explicitly global because no league/tournament fixture endpoint exists.
- Home uses live league names; unavailable rank/round totals show dashes. Scoring, match, leaderboard, and notifications remain labeled previews. Join-code and add-player actions show availability sheets; those endpoints are not documented.
- Sheets continue using @expo/ui. No app.json, auth/session, native project, or prebuild changes. Deleted obsolete overview preview screen.

Validation: lint, typecheck, git diff whitespace checks, and Android/iOS/web exports passed. Read-only live GET /api/matches succeeded with an empty data array. League/tournament write contracts were checked against Swagger; authenticated create/edit round trips and native UI/keyboard/sheet behavior were not exercised. No accounts, leagues, or tournaments were created for verification. Existing device-access denial remains in force. Pause for user review after this checkpoint; remaining work includes invite joining, player management, squad persistence/scoring, staff administration, and richer tournament scheduling as supported by future scope/API.

Dashboard touch-blocking investigation before checkpoint 3: user confirmed Android blocks input immediately after login. The initial change from box-none to none directly on Expo UI Host did not work. Traced installed native source: HostView extends ExpoComposeView, which extends ExpoView/Android LinearLayout; none implements ReactPointerEventsView. React Native TouchTargetHelper defaults such views to AUTO, so the full-screen last sibling captures the JS touch target even when the sheet renders null. Moved pointerEvents onto a non-collapsible React Native View around Host; ReactViewGroup implements the native interface and enforces NONE in hit-testing, interception, and onTouchEvent. Native sheet content lives in a separate dialog window, so its input and dismissal lifecycle remain intact. Web retains box-none. No conditional sheet unmounting, z-index changes, or navigation edits. Lint, typecheck, and whitespace checks passed; the root cause and fix are source-verified, but device behavior remains unverified because prior device access was declined and no ARTEMIS tools are available.

### Shared True Sheet migration

User explicitly requested bun add @lodev09/react-native-true-sheet and one shared sheet component instead of Expo UI. Installed version 4.1.0 (supports RN >=0.82 and the existing new architecture) and its documented web peers @radix-ui/react-dialog and @radix-ui/react-presence. This user choice supersedes the Expo UI skill's default bottom-sheet preference.

Created src/components/bottom-sheet.tsx with the controlled open/onClose interface, title, optional description, and children. It owns the forest theme, native grabber, content-sized/full detents, scrollable ref for keyboard support, and Close action. Present/dismiss calls are serialized and use the latest requested state; native user dismissals call onClose without treating an old programmatic dismissal as a request to close a newly reopened sheet. True Sheet supplies native animation; no custom motion added.

Migrated notifications, Home actions/scoring, player detail/captain actions, and league/tournament editor sheets to this component. Deleted reference-sheet.tsx and all application imports of @expo/ui; its installed dependency remains available for future non-sheet UI. Removed the former full-screen Host and pointer-event layers. Added TrueSheetProvider at the root for the web renderer, which is a pass-through on native. Updated README.

No app.json or native project changes; existing Android new architecture/autolinking is already enabled, and iOS is absent. A new native Android build is required before using True Sheet. An attempted Gradle build was blocked by sandbox cache access; the escalation request was declined by the user, so compilation/install/device checks were not retried. Lint, typecheck, and whitespace checks passed. Final bundle/autolinking results follow below.

True Sheet migration final verification: Android/iOS/web exports passed after adding the documented web peers and provider. Expo's Android react-native-config autolinking command also completed successfully with True Sheet included. Native compilation and device interaction remain unverified. Paused before the next product checkpoint.

### Match management checkpoint 1 — demo and API review (2026-11-18)

Reviewed `admin-match-management-demo.html` as a UX reference and fetched `http://127.0.0.1:3001/api/docs-json` as the API contract. The demo covers a filterable match centre, lineup and toss setup, ball-by-ball scoring with extras/wickets and undo, innings transitions, scorecards, and a fantasy points preview. Its seeded records, scoring calculations, and publish toast are prototype behavior. Production should use the backend for scorecard state, cricket validation, and official results. Cricket is the first supported scoring format.

The API supports league teams and players, tournament enrollment and registration, fixture scheduling and schedule publication, lineups and overs, innings and delivery recording, undo, scorecard corrections, official result publication, and public results/standings/player reports. It has no dedicated toss field or fantasy-points publication API. Use the toss choice to select the first batting side during setup, and label official scorecard publication separately from fantasy points. The backend returns versioned staff scorecards. Serialize writes per fixture, refresh on a conflict or ambiguous response, and require explicit review before retrying a delivery.

Recommended access model: use league-scoped owner/admin/scorer permissions for the management workspace. The global auth `user`/`admin` role is distinct from these permissions. The existing league list confirms ownership or active staff membership but does not distinguish admin from scorer. Compare `ownerId` for owners and add a server-provided current-user membership role or capabilities before exposing elevated controls to non-owner staff. The owner-only staff list cannot supply this for all users. Keep the current fantasy dashboard as the default for users without managed leagues. For users with both activities, allow a switch back to the fantasy dashboard. The server remains authoritative for reads and mutations.

Proposed review checkpoints after discovery:

1. Management entry and role routing, league/tournament selection, and Match Centre backed by the tournament schedule.
2. Team/player catalogue and tournament registration, then fixture creation, editing, schedule publication, and lineup setup. Show controls according to league permissions and fixture status.
3. Live scoring, innings transitions, undo, scorecard reads, reconnect and conflict handling.
4. Official result publication, corrections, results, standings, and player reports. Connect fantasy points when a server contract becomes available.

Pause after each checkpoint. Discovery used read-only access and made no app code changes or API writes.

### Match management checkpoint 2 — workspace entry and live fixture list

The signed-out route now redirects to `/workspace` after authentication. It uses the existing authenticated league list, whose contract includes owned leagues and active staff memberships. A nonempty list opens `/manage-matches`. An empty list opens the fantasy dashboard. If access cannot be resolved, users can retry or open fantasy. The manager rechecks league access on entry and redirects users with no managed leagues to fantasy. Eligible users can switch modes from either workspace. Global account role does not grant league access.

Match Centre reads the paginated staff schedule for the selected league and tournament through Axios and TanStack Query. It shows fixture dates in the tournament timezone, schedule publication status, fixture statuses, and filters over loaded pages. League owners are identified by owner ID and other eligible users are labeled league staff. The API still needs a current-user role or capability field to distinguish admins from scorers for elevated actions. Fixture editing, roster/setup tools, and scoring belong to the following checkpoints.

Lint, TypeScript, whitespace checks, and Android/iOS/web bundle exports passed. Device navigation and authenticated staff schedule reads remain unverified. Pause for review before roster and fixture setup.
