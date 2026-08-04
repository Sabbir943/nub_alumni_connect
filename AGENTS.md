<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NUB Alumni Connect (my-app)

Next.js 16 App Router + MongoDB (native driver) alumni networking app. All code lives in `src/`. Plain JS (`js`/`jsx`), no TypeScript; path alias `@/*` -> `src/*`.

## Commands
- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint` invokes ESLint directly (flat config `eslint.config.mjs`). There is **no** `next lint` script, no test suite, and no typecheck script.

## Data layer
- Use `getCollection(name)` / `findProfileByEmail(email)` from `src/lib/mongodb.js` in route handlers; never create a second MongoClient. DB name comes from `DB_NAME` env, defaults to `nub_alumni`.
- API route pattern (`src/app/api/*`): try/catch around `getCollection`, serialize `_id` (`serializeId` or `.toString()`), `console.error` + `NextResponse.json({ message }, { status: 500 })` on failure. Note the `follows` and `notifications` collections were added after the README's collection table was written.
- Client fetch: use `apiFetch(path, opts)` from `src/lib/api.js` — it parses JSON, checks `res.ok`, and retries 5xx. Don't call API routes with raw `fetch` from client components.

## Auth
- Better Auth: server entry is `src/lib/auth.js` (top-level await, server-only — never import from client code); client entry is `src/lib/auth-client.js` (`authClient.useSession()`). Catch-all route: `src/app/api/auth/[...all]/route.js`.
- Users have an extra `role` field (default `"Student"`). Admin UI/APIs (`src/app/api/admin/*`, `src/app/dashboard/admin/*`) exist; admin users are promoted via `ADMIN_EMAIL`/`ADMIN_PASSWORD` env through `/api/admin/init` and `/api/admin/seed`.

## Env
- Required: `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Also read by code (in `.env.example`, omitted from README): `NEXT_PUBLIC_IMGBB_API_KEY` (imgbb image upload in `src/lib/upload.js`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, optional `DB_NAME`.
- A local `.env` exists and is gitignored — never commit or log it.

## Quirks
- React Compiler is enabled (`reactCompiler: true`); `optimizePackageImports` covers `react-icons`/`lucide-react`.
- `README.md` is stale: its project structure and API/MongoDB tables omit admin, notices, events, and notification routes/collections that exist in code. Trust the code, not the README.
- Dashboard route folders mix casing (e.g. `alumni/Profile`), which is case-sensitive on this platform.
