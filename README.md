# Dream-Team

A fantasy league platform for any sport or game. Creators define player pools and scoring rules; members build squads and compete in invite-only leagues.

This Expo SDK 58 app currently opens to the login/sign-up screen. It includes form validation, password visibility, a sport-neutral squad illustration, and Reanimated feedback. Authentication and Google sign-in show availability messages; no credentials are sent or stored persistently.

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

Axios handles requests; TanStack Query is provided at the root layout. The typed auth service in `src/features/auth/api.ts` follows the local Swagger contract for register, login, refresh, logout, and profile. Form wiring and secure session handling are the next checkpoint; the login screen still shows availability messages.

Copy `.env.example` to `.env.local` to configure `EXPO_PUBLIC_API_URL`, including the `/api` suffix. Development defaults to `http://localhost:3001/api`. Production requires an explicit URL. Reload the app after changing environment variables.

- Web/iOS simulator: `http://localhost:3001/api`.
- Android emulator: `http://10.0.2.2:3001/api`, or forward localhost using `adb -s <serial> reverse tcp:3001 tcp:3001`.
- Physical device: use the computer's LAN address with the API listening on that interface, or USB forwarding on Android.

Requests time out after 15 seconds. Errors retain HTTP status, validation messages, and Retry-After seconds without retaining Axios request configuration or credentials. Queries retry transient failures once; mutations do not retry automatically. Refresh calls must be serialized by the upcoming session layer, which must retain the replacement refresh credential.

The API supports email login and username registration (3–30 lowercase letters, numbers, or underscores), with registration passwords of 12–128 characters. It does not document phone login, Google sign-in, password reset, or a team-name field.
