<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NUB Alumni Connect

Next.js 16 App Router + MongoDB (native driver) alumni networking app. All code lives in `src/`. Plain JS (`js`/`jsx`), no TypeScript; path alias `@/*` -> `src/*`.

## Commands
- `npm run dev` / `npm run build` / `npm run start` — Next.js dev server
- `npm run socket-server` — standalone Socket.IO server on port 3001 (for WebRTC signaling + calls). Must run alongside Next.js for real-time features.
- `npm run lint` — ESLint via flat config `eslint.config.mjs`. **No** `next lint`, no test suite, no typecheck script.
- There is **no** combined server — the socket server (`socket-server.js`) is standalone and must be run separately.

## Data layer
- `getCollection(name)` / `findProfileByEmail(email)` from `src/lib/mongodb.js`. Use this for all app code — don't create additional MongoClient instances. DB name from `DB_NAME` env, defaults to `nub_alumni`. (The only exception is `src/lib/auth.js`, which has its own cached pool.)
- Client fetch: use `apiFetch(path, opts)` from `src/lib/api.js` (parses JSON, checks `res.ok`, retries 5xx). Don't use raw `fetch` from client components.
- API route pattern (`src/app/api/*`): try/catch around `getCollection`, serialize `_id` (`serializeId` or `.toString()`), `console.error` + `NextResponse.json({ message }, { status: 500 })` on failure.
- Collections in code: `user`, `session`, `account`, `verification`, `students`, `alumni_directory`, `blog_posts`, `blog_comments`, `jobs`, `follows`, `messages`, `notifications`, `calls`, `mentorships`, `contacts`, `notices`, `events`, `reports`.

## Auth
- Better Auth: server entry `src/lib/auth.js` (top-level await, **server-only** — never import from client); client entry `src/lib/auth-client.js` (`authClient.useSession()`). Catch-all: `src/app/api/auth/[...all]/route.js`.
- Users have a `role` field (default `"Student"`). Admin APIs: `src/app/api/admin/*`. Admin dashboard: `src/app/dashboard/admin/*`. Admin promotion via `/api/admin/init` and `/api/admin/seed`.

## Env
- Required: `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Also used: `NEXT_PUBLIC_IMGBB_API_KEY` (imgbb upload in `src/lib/upload.js`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_NAME` (optional, defaults to `nub_alumni`).
- Optional, **not in `.env.example`**: `OPENAI_API_KEY` (AI profile verification in `src/lib/verify.js` + chatbot in `src/app/api/chat/route.js`; without it they fall back to rule-based scoring), `CLOUDINARY_URL` + `CLOUDINARY_API_SECRET` (blog video-file uploads via `src/app/api/blog/video-sign/route.js`).
- Socket server: `NEXT_PUBLIC_SOCKET_URL`, `SOCKET_PORT`, `CORS_ORIGIN` (all in `.env.example`).
- `.env` is gitignored — never commit or log it.

## Quirks
- **Two MongoClient pools**: `src/lib/auth.js` creates its own `MongoClient` via `globalThis` (top-level await), separate from `mongodb.js`'s cached `connectToDatabase()`. Both target the same DB — don't merge them. Note: `auth.js` hardcodes `db("nub_alumni")` and ignores the `DB_NAME` env var that `mongodb.js` respects.
- React Compiler enabled (`reactCompiler: true`); `optimizePackageImports` covers `react-icons`/`lucide-react`.
- Dashboard route folders mix casing (e.g. `alumni/jobPost`, `alumni/mentorshipHub`) — case-sensitive on disk.
- `mintest.js` — throwaway minimal Socket.IO server on port 5099 for debugging socket connectivity; not part of the app.
- `socket-package.json` — standalone package manifest for deploying only `socket-server.js` (Node >= 18) to a separate host; the Next.js app and socket server are deployed independently.
- `src/lib/ringtone.js` — client-side WebRTC call audio (ringing, connect, decline sounds). Used by call UI components.
- `src/lib/useSocket.js` and `src/lib/useWebRTC.js` — client hooks for real-time features.
