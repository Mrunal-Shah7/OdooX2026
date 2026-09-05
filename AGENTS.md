# AGENTS.md — PeoplePay360

## Before writing code
- Read `PRD.md`, `TRD.md` and `openapi.yaml` in full before the first edit of a session.
- Read `DESIGN.md` and `design.html` before touching anything under `web/src`.
- Re-read the TRD section for your module before starting a new page or endpoint.

## Binding contracts
- `openapi.yaml` is the API contract. Paths, methods, parameters, status codes and schema shapes come from it exactly.
- When a zod schema and `openapi.yaml` disagree, `openapi.yaml` is correct. Fix the zod schema.
- Never hand-edit `shared/api-types.ts`. Regenerate it from `openapi.yaml`.
- Use only the enum values listed in TRD section 3. Never invent a variant.
- Use only the error codes in TRD section 7. Never invent a code.
- Every response uses the envelopes in TRD section 6. No bare arrays, no bare objects.
- Field names are `camelCase` everywhere: database, JSON, TypeScript.

## Styling
- Never hand-write a colour, spacing value, radius, font size, shadow or z-index. Use the token.
- No raw hex, no `rgb()`, no arbitrary Tailwind values such as `bg-[#ffffff]` or `p-[13px]`.
- If a value you need has no token, stop and ask. Do not add one yourself.
- Match the layout, component structure and content order in `design.html`.
- Numbers, codes, dates, times and money use the mono family. Language uses the body family.
- Every numeric table column is right-aligned.

## Dependencies
- Never run `npm install`. The complete allowlist is TRD section 1.
- Never add a package, a polyfill, a utility library or a CLI tool.
- Prefer Node and browser built-ins over any package.
- If something appears impossible without a new dependency, stop and ask.

## File ownership
- Edit only files inside the module you are working on, per TRD section 4.
- Never edit a file listed in TRD section 11 unless you own it.
- Never edit `server/prisma/schema.prisma`, `shared/constants.ts`, `web/src/tokens.css`, `web/src/routes.tsx`, `web/src/lib/apiClient.ts`, `web/src/components/ui/*` or `server/src/middleware/*` unless you own that file.
- If your module needs a change in a shared file, stop and ask.
- Never rename a file, route, table, column, module or operationId.

## Implementation rules
- Write the smallest implementation that satisfies the requirement.
- No abstraction until a third caller exists. No generic helpers, no plugin layers, no base classes, no config-driven indirection.
- No feature that is not in the PRD. Check the Out of Scope list before building anything you were not asked for.
- All business logic lives in `services/`. Routes parse, validate, delegate and shape the response.
- Only files under `server/src/db/` and `services/` issue Prisma queries.
- Validate at trust boundaries only: request bodies, params and query strings, with zod. No defensive checks between your own functions.
- Do not add try/catch around code that cannot throw. The error middleware handles unhandled errors.
- Do not log except on an actual error path.
- Money never touches `number`. Decimal in the database, `Decimal` in services, string over the wire.
- Calendar dates are `YYYY-MM-DD` strings end to end. No `Date` object crosses the API boundary for a calendar date.
- No `any`. No `as` casts to silence the compiler.
- No default exports except React page components.
- Every list endpoint is paginated from the first commit.
- Every list page implements loading, empty and error states.
- Every state transition follows TRD section 3. Reject anything else with `CONFLICT`.

## Data
- Seed data comes from TRD section 13. Do not invent employees, structures or rules.
- Never hardcode a dashboard figure, a chart value or a payslip amount.
- Never write a migration that drops or renames an existing column.

## When the artifacts are ambiguous
- Stop and ask. Do not guess, do not pick the more likely reading, do not implement both.
- Do not resolve a contradiction between two artifacts by editing one of them.
- Do not mark work complete with a `TODO`, a stub, a mock or hardcoded data standing in for real logic.