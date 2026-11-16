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
