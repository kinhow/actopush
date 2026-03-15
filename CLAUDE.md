# OctoPush CRM - Project Instructions

## Plan Mode (MANDATORY)

**Always use plan mode before implementing any non-trivial task.** Call `EnterPlanMode` before writing or editing code. This ensures:

1. Codebase is explored and understood before changes are made
2. An implementation plan is presented for user approval
3. Ambiguities and architectural decisions are resolved upfront
4. No wasted effort from misaligned implementations

**Exceptions** (skip plan mode for these only):
- Single-line fixes (typos, obvious bugs, small tweaks)
- Tasks where the user gives very specific, line-by-line instructions
- Pure research/exploration questions

**Workflow:** `EnterPlanMode` → explore codebase → write plan → `ExitPlanMode` → wait for approval → implement

---

## Sub-Agents

This project has 5 role-based sub-agents in `.claude/agents/`. Use the Task tool to invoke them:

| Agent | File | When to Use |
|-------|------|-------------|
| **senior-frontend-dev** | `.claude/agents/senior-frontend-dev.md` | Building features, writing components, server actions, forms, UI work |
| **supabase-specialist** | `.claude/agents/supabase-specialist.md` | Database schema, migrations, RLS policies, auth config, edge functions |
| **code-reviewer** | `.claude/agents/code-reviewer.md` | After code changes — reviews quality, security, patterns, performance |
| **debugger** | `.claude/agents/debugger.md` | When something breaks — diagnoses errors, build failures, runtime issues |
| **senior-product-manager** | `.claude/agents/senior-product-manager.md` | Feature scoping, PRDs, user stories, prioritization, product strategy |
| **senior-ui-ux-designer** | `.claude/agents/senior-ui-ux-designer.md` | Screen design specs, UI/UX reviews, user flow design, accessibility audits, component architecture |

### How to invoke:
```
Task(subagent_type="senior-frontend-dev", prompt="Build a contact list page with...")
Task(subagent_type="supabase-specialist", prompt="Create migration for contacts table with RLS...")
Task(subagent_type="code-reviewer", prompt="Review the changes in src/features/auth/...")
Task(subagent_type="debugger", prompt="Getting hydration mismatch error on...")
Task(subagent_type="senior-product-manager", prompt="Write a PRD for contacts management feature...")
Task(subagent_type="senior-ui-ux-designer", prompt="Design the contacts list page with filters...")
```

---

## Tech Stack

- **Next.js 16.1.6** (App Router, Turbopack, React Compiler)
- **React 19.2.3** (Server Components, Server Actions, useActionState)
- **Mantine 8.3.14** (UI components, forms, hooks, theming)
- **Supabase** (@supabase/supabase-js 2.93.3, @supabase/ssr 0.8.0)
- **Tailwind CSS v4** (CSS-first config, PostCSS plugin)
- **Zod 4.3.6** (Schema validation, mantine-form-zod-resolver)
- **Biome 2.2.0** (Linter/formatter, replaces ESLint+Prettier)
- **@tabler/icons-react** (Icon library)

---

## Documentation & Best Practices

**Always follow the latest official documentation and current best practices.** Never rely on training knowledge alone for API signatures, hook behaviors, or config options — they change between major versions.

### Rules
- **Before implementing anything non-trivial**, fetch current docs via `mcp__context7__resolve-library-id` + `mcp__context7__query-docs` using the library IDs below
- Prefer **idiomatic patterns from official docs** over patterns seen elsewhere or from memory
- If the docs show a deprecated approach, **use the modern replacement** even if the old way still compiles
- When uncertain whether something reflects current best practice, **say so explicitly** — never silently guess

### Context7 Library IDs
When you need up-to-date docs, use `mcp__context7__query-docs` with these IDs:

| Library | Context7 ID |
|---------|-------------|
| Next.js | `/vercel/next.js/v16.1.6` |
| React | `/websites/react_dev` |
| Mantine | `/mantinedev/mantine/8.3.14` |
| Supabase | `/supabase/supabase` |
| Tailwind CSS | `/websites/tailwindcss` |
| Zod | `/colinhacks/zod/v4.0.1` |

### Version-Specific Patterns to Enforce

These are the most common sources of version drift — always apply the modern form:

**Next.js App Router**
- Never suggest Pages Router patterns (`getServerSideProps`, `getStaticProps`, `_app.tsx`)
- Layouts, loading, error, and not-found files go in `app/` — never `pages/`

**React 19**
- Use `useActionState` for form state — not `useState` + manual fetch
- Use `useFormStatus` for pending states inside forms
- Use `use()` for reading context/promises in render — not `useEffect` chains
- Avoid manual `useMemo`/`useCallback` — React Compiler handles memoization

**Mantine v8**
- APIs differ significantly from v6/v7 — always look up v8 docs before using a component
- Use `useForm` with `mantine-form-zod-resolver` for form validation, not standalone Zod + state

**Zod v4**
- `z.email()`, `z.url()`, `z.uuid()` are now **standalone functions**, not string methods
- ❌ `z.string().email()` → ✅ `z.email()`
- Check the v4 migration guide before using any Zod string refinement

**Tailwind CSS v4**
- CSS-first config — no `tailwind.config.js` unless explicitly required
- Use `@theme` in CSS for custom tokens, not `extend` in a JS config

**Supabase JS v2**
- Use `createClient` from `@supabase/ssr` for SSR — never `createPagesBrowserClient` or legacy helpers
- Always validate with `getUser()` server-side — never trust `getSession()` alone

---

## Coding Rules

### Architecture
- **Feature-based modules** under `src/features/` with: actions, components, constants, handlers, schemas, types, utils
- **Layout components** under `src/layouts/` for structural shells (sidebar, topbar, navigation)
- **Server Components by default** — only `"use client"` when hooks/interactivity needed
- **Server Actions** for all mutations — no API routes unless absolutely necessary
- **`@/` path alias** for all imports — never use relative `../../`

### React & Next.js
- Use `useActionState` (React 19) for form state, NOT `useState` + manual fetch
- Use `useFormStatus` for pending states inside forms
- No `useEffect` for data fetching — use async Server Components
- Wrap Supabase queries with `cache()` for deduplication
- React Compiler handles memoization — avoid manual `useMemo`/`useCallback`

### Styling
- **Mantine components first** — don't rebuild what Mantine provides
- **Tailwind utilities** for custom styling alongside Mantine
- **CSS layers order:** `theme, base, mantine, components, utilities`
- Dark/light mode via Mantine color scheme + CSS variables + Tailwind `dark:` variant
- Custom colors use `octopush-` prefix (octopush-red, octopush-cyan, etc.)

### Validation & Types
- **Zod schemas** for all validation (forms, server actions, env vars)
- **`mantine-form-zod-resolver`** to connect Zod with Mantine forms
- TypeScript strict mode — no `any`, always type function returns

### Supabase
- Server: `await createClient()` from `@/lib/supabase/server`
- Client: `createBrowserClient()` from `@/lib/supabase/client`
- Use `supabase.auth.getClaims()` in proxy/middleware for fast JWT validation
- Use `supabase.auth.getUser()` in server actions and server components (cached via `React.cache()`)
- Never use `getSession()` server-side
- RLS enforced — all queries go through authenticated client

### Code Quality
- Run `pnpm biome check --write` before committing
- Follow existing patterns in the codebase
- Keep components focused and small
- No over-engineering — solve the current problem, not hypothetical future ones