# Dream-Team

A fantasy league platform for any sport or game. Creators define player pools and scoring rules; members build squads and compete in invite-only leagues.

This repository currently contains the frontend foundation for an Expo SDK 58 app. The root route displays a temporary theme preview for checkpoint review. Login/sign-up is the next checkpoint; no authentication service is connected.

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
bunx expo export --platform web
```

Shared visual tokens live in `src/constants/theme.ts`. Routes live in `src/app/`, screen bodies in `src/screens/`, and locally bundled fonts in `assets/fonts/`.

Read `memory.md` for product decisions, reference analysis, scope, and checkpoint status. Read `AGENTS.md` before making changes.
