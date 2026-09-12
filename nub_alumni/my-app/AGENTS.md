<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NUB Alumni Connect

Next.js 16 App Router + MongoDB (native driver) alumni networking app. All code lives in `src/`. Plain JS (`js`/`jsx`), no TypeScript; path alias `@/*` -> `src/*`.

## Commands

- `npm run dev` — Next.js dev server (Turbopack)
- `npm run build` / `npm run start` — production build and serve
- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`). **No** `next lint`.
- `npm run socket-server` — standalone Socket.IO signaling server (default port 3001, configurable via `SOCKET_PORT` in `.env`). Must run alongside Next.js for calls/messaging/online-users. Loads `.env` via `--env-file=.env`.
- There is **no test suite, no typecheck script, and no formatter config.**
- There is **no combined server** — the socket server is standalone and must be run separately.

### Capacitor (mobile)

- `npm run cap:sync` — sync web assets to native projects
- `npm run cap:android` / `npm run cap:ios` — open native IDE
- `npm run cap:run:android` / `npm run cap:run:ios` — run on device/emulator
- The Capacitor app (`com.nub.alumni`) loads from the deployed Vercel URL (`NEXT_PUBLIC_DEPLOYED_URL`), not a local static export. `build:capacitor` is a no-op echo.

## Data layer

- **Primary entry**: `getCollection(name)` / `findProfileByEmail(email)` from `src/lib/mongodb.js`. Use this for all app code — don't create additional `MongoClient` instances. DB name from `DB_NAME` env, defaults to `nub_alumni`.
- **Auth exception**: `src/lib/auth.js` creates its own `MongoClient` via `globalThis` (top-level await, server-only). It hardcodes `db("nub_alumni")` and **ignores the `DB_NAME` env var** that `mongodb.js` respects. Don't merge them.
- **Client fetch**: use `apiFetch(path, opts)` from `src/lib/api.js` (parses JSON, checks `res.ok`, retries 5xx). Don't use raw `fetch` from client components.
- **API route pattern** (`src/app/api/*`): try/catch around `getCollection`, serialize `_id` (`serializeId` or `.toString()`), `console.error` + `NextResponse.json({ message }, { status: 500 })` on failure.
- **Collections**: `user`, `session`, `account`, `verification`, `students`, `alumni_directory`, `blog_posts`, `blog_comments`, `jobs`, `follows`, `messages`, `notifications`, `calls`, `mentorships`, `contacts`, `notices`, `events`, `reports`.

## Auth

- Better Auth: server entry `src/lib/auth.js` (**server-only** — never import from client); client entry `src/lib/auth-client.js` (`authClient.useSession()`). Catch-all: `src/app/api/auth/[...all]/route.js`.
- Users have a `role` field (default `"Student"`). Admin APIs: `src/app/api/admin/*`. Admin dashboard: `src/app/dashboard/admin/*`. Admin promotion via `/api/admin/init` and `/api/admin/seed`.

## Env

- **Required**: `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `MONGODB_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **Also used**: `NEXT_PUBLIC_IMGBB_API_KEY` (imgbb upload in `src/lib/upload.js`), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DB_NAME` (optional, defaults to `nub_alumni`).
- **Optional, not in `.env.example`**: `OPENAI_API_KEY` (AI profile verification in `src/lib/verify.js` + chatbot in `src/app/api/chat/route.js`; without it they fall back to rule-based scoring), `CLOUDINARY_URL` + `CLOUDINARY_API_SECRET` (blog video-file uploads via `src/app/api/blog/video-sign/route.js`).
- **Socket server**: `NEXT_PUBLIC_SOCKET_URL`, `SOCKET_PORT`, `CORS_ORIGIN` (all in `.env.example`).
- **Firebase/PWA**: `NEXT_PUBLIC_FIREBASE_*` (client push config), `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (server-side admin SDK for push via `socket-push.js`). All in `.env.example`.
- **Capacitor**: `NEXT_PUBLIC_DEPLOYED_URL` — the Vercel URL the native app loads.
- `.env` is gitignored — **never commit or log it.**

## Architecture

- **Two server processes**: Next.js (port 3000) + Socket.IO (default port 3001, configurable via `SOCKET_PORT`). The socket server handles WebRTC signaling, real-time messaging, call state, online-user tracking, and push notifications.
- **PWA**: Service worker (`/sw.js`) configured via `@ducanh2912/next-pwa`. Components: `ServiceWorkerRegistration.jsx`, `PWAInstallPrompt.jsx`, `PushNotificationManager.jsx`.
- **Capacitor**: Native iOS/Android wrapper. Config in `capacitor.config.ts`. Components: `CapacitorInit.jsx`. Platform detection in `src/lib/platform.js`, `src/lib/capacitorCamera.js`, `src/lib/capacitorNetwork.js`, `src/lib/capacitorShare.js`, `src/lib/mobileMedia.js`.
- **React Compiler** enabled (`reactCompiler: true`); `optimizePackageImports` covers `react-icons`/`lucide-react`.

## Quirks

- Dashboard route folders **mix casing** on disk (e.g. `alumni/jobPost`, `alumni/mentorshipHub` are camelCase, while `students/text-box`, `students/my-mentorship` use kebab-case). Case-sensitive on disk — be precise when referencing paths. Note: README.md incorrectly references `alumni/Profile` (capital P) but the actual folder is `alumni/profile` (lowercase).
- `mintest.js` — throwaway minimal Socket.IO server on port 5099 for debugging socket connectivity; not part of the app.
- `socket-package.json` — standalone package manifest for deploying only `socket-server.js` (Node >= 18) to a separate host; the Next.js app and socket server are deployed independently.
- `socket-server.js` creates its own MongoDB indexes at startup (`messages`, `notifications`, `students`, `alumni_directory`).
- `src/lib/ringtone.js` — client-side WebRTC call audio (ringing, connect, decline sounds). Used by call UI components.
- `src/lib/useSocket.js` and `src/lib/useWebRTC.js` — client hooks for real-time features.
- `SocketReconnectHandler.jsx` — handles socket reconnection logic on the client.
