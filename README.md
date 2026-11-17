# Dream-Team

A fantasy league platform for any sport or game. Creators define player pools and scoring rules; members build squads and compete in invite-only leagues.

This Expo SDK 58 app supports email login, username/email registration, session restoration, and logout against the local API. Signed-in users land on a protected account screen. Pending states use the Reanimated hash loader; Google sign-in and password reset remain unavailable until the API supports them.

## Development

```sh
bun install
bun start
```

Use `bun run ios`, `bun run android`, or `bun run web` for the relevant target.

## Checks

```sh
bun run lint
bun run typecheck
bunx expo export --platform all
```

Shared visual tokens live in `src/constants/theme.ts`. Routes live in `src/app/`, screen bodies in `src/screens/`, and locally bundled fonts in `assets/fonts/`.

Read `memory.md` for product decisions, reference analysis, scope, and checkpoint status. Read `AGENTS.md` before making changes.


## Hash loader

```tsx
import { HashLoader } from '@/components/hash-loader';

<HashLoader loading={isPending} color="#C4F27D" size={32} speedMultiplier={1} />
```

`size` is a number in native layout points; pass native layout overrides through `style`. Reduced motion displays a stationary hash.


## API client

Axios handles requests; TanStack Query is provided at the root layout. The typed auth service in `src/features/auth/api.ts` follows the local Swagger contract for register, login, refresh, logout, and profile. TanStack mutations connect the forms to a serialized session controller; the profile query calls the authenticated profile endpoint and retries an unauthorized request once after rotating credentials.

Copy `.env.example` to `.env.local` to configure `EXPO_PUBLIC_API_URL`, including the `/api` suffix. Development defaults to `http://localhost:3001/api`. Production requires an explicit URL. Reload the app after changing environment variables.

- Web/iOS simulator: `http://localhost:3001/api`.
- Android emulator: `http://10.0.2.2:3001/api`, or forward localhost using `adb -s <serial> reverse tcp:3001 tcp:3001`.
- Physical device: use the computer's LAN address with the API listening on that interface, or USB forwarding on Android.

Requests time out after 15 seconds. Errors retain HTTP status, validation messages, and Retry-After seconds without retaining Axios request configuration or credentials. Queries retry transient failures once; mutations do not retry automatically. The session controller serializes refresh and logout calls and saves each replacement refresh credential before publishing the session. Completed auth mutation state is reset to release credential variables.

The API supports email login and username registration (3–30 lowercase letters, numbers, or underscores), with registration passwords of 12–128 characters. It does not document phone login, Google sign-in, password reset, or a team-name field.


## Authentication and native setup

Native refresh credentials are encrypted with Expo SecureStore and scoped to the configured API URL. Access tokens and public profiles stay in memory. Native startup restores a saved session by rotating its refresh credential; network failure preserves it and offers retry. A revoked or expired session returns to sign-in. Browser credentials remain in memory and are lost on a full page reload; no tokens are written to localStorage or sessionStorage.

SecureStore is a new native dependency, so rebuild the existing Android app with `bun run android` before using authentication. The existing Android manifest now references `@xml/secure_store_backup_rules` and `@xml/secure_store_data_extraction_rules` from SecureStore to exclude encrypted preferences from backup. The native directory is currently Git-ignored, so these native edits need to be retained alongside the prebuilt project. No native directories were regenerated and app.json is unchanged. The iOS project is currently absent and was not generated.

Successful login or registration opens `/account`. The screen displays the profile, preserves known profile data during refresh errors, offers retry, and logs out using the latest refresh credential. If remote logout fails, the screen reports the error and allows another attempt. During restoration, “Clear saved sign-in” removes the local credential; it does not claim to revoke an unreachable server session.

Verification covered the live API through the session controller with in-memory storage: registration, concurrent 401 recovery using one shared refresh, restoration, wrong-password rejection, logout, and rejection of a revoked credential. One local verification account (`codex_auth_mwj5663i`) remains; its sessions were logged out. Native encrypted persistence, device UI, navigation, and motion have not been exercised on a device.


## Forms

Use React Hook Form for all forms. The login/sign-up screen uses typed `useForm` state, an API-aligned resolver in `src/features/auth/form.ts`, and `useController` bindings in `AuthField`. Native inputs forward changes, blur, and refs through React Hook Form; validation errors and API submission errors are managed by the form. Keyboard next actions and invalid-submit focus use `setFocus`.

Mode changes preserve entered values while resetting validation/submission state. Failed API submissions retain the draft; successful sign-in resets the password. Pending submissions block repeat requests and retain the hash loading indicator. Keep presentation state such as password visibility, notices for unavailable actions, and rate-limit timing separate from field state.


## API logging

The shared Axios client automatically uses `src/lib/api/logger.ts` for every request in all builds. Console entries use `[API #id] REQUEST`, `RESPONSE`, and `ERROR` (or `CANCELED`) to correlate calls. Requests include method, URL, query parameters, and body when supplied. Completion entries include HTTP status and duration. Errors include the backend response body before ApiError normalization, status/code, Retry-After, and duration; network errors are also logged.

Passwords, passphrases, tokens, API keys, cookies, authorization values, URL credentials, and known request secrets echoed in error messages are redacted. Successful response bodies and raw Axios error/config objects are not logged. Logging does not mutate request data or change response/error handling. Logs go to the JavaScript console; no external logging service or file storage is configured.


## Auth state

Zustand owns the public session state (`status`, `user`, and `message`) through a vanilla store on each SessionController instance. AuthProvider creates one instance for its subtree and restores the saved session on mount. `useAuth()` reads the session with Zustand's `useStore` and retains the existing `{ controller, session }` interface. A store subscription cancels and removes old queries when the signed-in user changes.

Refresh credentials still use native SecureStore; access tokens remain private to the controller. Zustand does not persist credentials or replace the serialized refresh/logout logic.
