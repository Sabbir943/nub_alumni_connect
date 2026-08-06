# NUB Alumni Connect

**Connecting Current Students and Alumni of Northern University Bangladesh**

A full-stack web platform for professional networking, mentorship, job discovery, and community building between NUB students and graduates.

---

## Features

### Core

- **Alumni Directory** — Search and filter graduates by name, department, batch, graduation year, company, designation, and location
- **Student Directory** — Browse current students with department and batch filtering
- **Job Portal** — Alumni post jobs/internships; students browse, verify, and apply
- **Notice Board** — University announcements, events, and opportunities
- **Contact Form** — Reach out to the platform team

### AI-Powered

- **AI Profile Verification** — OpenAI GPT-4o-mini analyzes alumni and student profiles, assigning a trust score (0-100) with verification badges
- **AI Job Verification** — Validates job posting links (HTTP HEAD checks), scores quality (completeness, quality, consistency, freshness), and flags suspicious content
- **AI Chatbot** — Floating chat widget on all pages with NUB-focused system prompt and rule-based fallback when OpenAI is unavailable

### Communication

- **Audio Calls** — Peer-to-peer WebRTC audio calls with ringing, connect, decline, and end sound effects
- **Video Calls** — Peer-to-peer WebRTC video calls with local/remote streams, picture-in-picture local video, toggle audio/video
- **Private Messaging** — Direct messages between users with image sharing and unread message summaries
- **Notifications** — Real-time notifications for follows, messages, admin notices, and calls with mark-as-read

### Social

- **Follow System** — Follow/unfollow users, view followers and following lists with real-time counts
- **Mentorship System** — Students request mentorship from alumni; alumni accept, decline, or mark complete. Request video calls with active mentors

### Dashboard

- **Alumni Dashboard** — Profile management, job posting, job management, connections, messaging, mentorship hub
- **Student Dashboard** — Profile creation, job browsing, connections, messaging, mentorship tracking
- **Admin Dashboard** — User management, reported content, notices CRUD, events/reunion management

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| React | React 19.2.4 |
| Styling | Tailwind CSS 4 |
| UI Components | HeroUI 3.2.1 |
| Animations | Framer Motion 12.42.2 |
| Icons | Lucide React, React Icons |
| Database | MongoDB 7.4.0 (native driver) |
| Authentication | Better Auth 1.6.23 (Email/Password + Google OAuth) |
| Forms | React Hook Form 7.80.0 |
| AI | OpenAI GPT-4o-mini |
| Real-time | WebRTC (peer-to-peer), Socket.IO (signaling) |
| Image Hosting | IMGBB API |
| Compiler | React Compiler (enabled) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database (local or Atlas)
- OpenAI API key (optional — AI features fall back to rule-based scoring)

### Installation

```bash
git clone https://github.com/Sabbir943/nub_alumni_connect.git
cd nub_alumni_connect/my-app
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/nub_alumni
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_IMGBB_API_KEY=your-imgbb-api-key
ADMIN_EMAIL=admin@nub.edu.bd
ADMIN_PASSWORD=your-admin-password
DB_NAME=nub_alumni
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── layout.js                  # Root layout (includes AIChatbot)
│   ├── page.js                    # Homepage
│   ├── not-found.js               # 404 page
│   ├── globals.css                # Global styles
│   ├── signin/page.jsx            # Sign in
│   ├── signup/page.jsx            # Sign up
│   ├── alumni-directory/page.jsx  # Alumni directory
│   ├── student-directory/page.jsx # Student directory
│   ├── job-portal/
│   │   ├── page.jsx               # Job listings
│   │   └── [id]/page.jsx          # Job detail + verification
│   ├── notice/page.jsx            # Notice board
│   ├── contact-us/page.jsx        # Contact form
│   └── dashboard/
│       ├── layout.jsx             # Dashboard wrapper (CallProvider)
│       ├── page.jsx               # Dashboard home
│       ├── alumni/
│       │   ├── overview/page.jsx  # Stats, quick actions
│       │   ├── Profile/page.jsx   # Create/edit profile
│       │   ├── editprofile/page.jsx
│       │   ├── jobPost/page.jsx   # Post a job
│       │   ├── manage-job/page.jsx # Manage posted jobs
│       │   ├── my-connection/page.jsx
│       │   ├── notifications/page.jsx
│       │   ├── mentorshipHub/page.jsx # Mentorship management
│       │   └── text/page.jsx      # Messaging + calls
│       ├── students/
│       │   ├── overview/page.jsx
│       │   ├── create-profile/page.jsx
│       │   ├── job-portal/page.jsx
│       │   ├── my-connection/page.jsx
│       │   ├── my-mentorship/page.jsx
│       │   ├── notifications/page.jsx
│       │   └── text-box/page.jsx  # Messaging + calls
│       └── admin/
│           ├── page.jsx           # Admin stats
│           ├── users/page.jsx     # User management
│           ├── reports/page.jsx   # Reported content
│           ├── notices/page.jsx   # Notices CRUD
│           └── reunion/page.jsx   # Events CRUD
├── component/
│   ├── Navbar.jsx                 # Navigation with mobile menu
│   ├── Footer.jsx                 # Site footer
│   ├── Banner.jsx                 # Homepage hero banner
│   ├── AIChatbot.jsx              # Floating AI chat widget
│   ├── BrowseAlumni.jsx           # Alumni directory cards + modal
│   ├── BrowseStudents.jsx         # Student directory cards + modal
│   ├── FeaturedAlumni.jsx         # Homepage featured section
│   ├── ImpactSection.jsx          # Homepage impact stats
│   ├── HighlightReviews.jsx       # Homepage reviews
│   ├── LatestJobOpenings.jsx      # Homepage job previews
│   ├── DashboardLayout.jsx        # Dashboard sidebar layout
│   ├── DashboardSplash.jsx        # Dashboard loading state
│   ├── CallContext.jsx             # Global call state + WebRTC
│   ├── CallOverlay.jsx            # Call UI (video/audio)
│   └── GlobalIncomingCall.jsx     # Incoming call popup
├── lib/
│   ├── api.js                     # apiFetch wrapper (checks res.ok)
│   ├── auth.js                    # Server-side auth config
│   ├── auth-client.js             # Client-side auth config
│   ├── mongodb.js                 # MongoDB connection
│   ├── verify.js                  # AI profile analysis
│   ├── upload.js                  # IMGBB image upload
│   ├── ringtone.js                # Web Audio call sounds
│   ├── useSocket.js               # Socket.IO hook (unused)
│   └── useWebRTC.js               # WebRTC hook (unused)
└── app/api/
    ├── auth/[...all]/route.js     # Better Auth catch-all
    ├── verify-profile/route.js    # AI profile verification
    ├── chat/route.js              # AI chatbot streaming
    ├── contact/route.js           # Contact form
    ├── alumni-directory/          # Alumni CRUD + check
    ├── students/                  # Student CRUD + check
    ├── student-directory/         # Public student directory
    ├── jobs/                      # Jobs CRUD + verification
    ├── follow/                    # Follow/unfollow + stats
    ├── messages/                  # Send, conversation, unread
    ├── calls/                     # Call signaling + state
    ├── notifications/             # Notifications + mark-read
    ├── mentorships/               # Mentorship requests
    └── admin/                     # Admin: init, seed, stats, users, notices, events, reports
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| * | `/api/auth/*` | Better Auth catch-all (sign in, sign up, session, Google OAuth) |

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/alumni-directory` | List/create alumni profiles |
| GET/PATCH | `/api/alumni-directory/[email]` | Get/update specific alumni |
| GET | `/api/alumni-directory/check/[email]` | Check if alumni exists |
| GET/POST | `/api/students` | List/create student profiles |
| GET/PATCH | `/api/students/[email]` | Get/update specific student |
| GET | `/api/students/check/[email]` | Check if student exists |
| GET | `/api/student-directory` | Public student directory |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/jobs` | List/create job postings |
| GET/PATCH/DELETE | `/api/jobs/[id]` | Get/update/delete a job |
| GET | `/api/jobs/verify/[id]` | AI verify a job posting |

### Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follow` | Follow a user |
| GET | `/api/follow/status` | Check follow status |
| GET | `/api/follow/followers/[email]` | Get user's followers |
| GET | `/api/follow/following/[email]` | Get who user follows |
| GET | `/api/follow/stats/[email]` | Get follow counts |

### Messaging
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/send` | Send a message |
| GET | `/api/messages/conversation` | Get conversation between users |
| GET | `/api/messages/unread-summary/[email]` | Get unread message counts |

### Calls
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calls` | Initiate a call |
| GET | `/api/calls?email=xxx` | Poll for incoming/active calls |
| GET | `/api/calls/[id]` | Get call details + signaling data |
| PATCH | `/api/calls/[id]` | Update call (answer, decline, end, offer, answer-sdp, ice-candidate) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/[email]` | Get notifications (optional `?unread=true`) |
| POST | `/api/notifications/mark-read/[id]` | Mark notification as read |
| GET/POST | `/api/notifications/call` | Call notification endpoints |

### Mentorships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/mentorships` | List/create mentorship requests |
| PATCH | `/api/mentorships/[id]` | Update mentorship status |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/init` | Initialize admin user |
| POST | `/api/admin/seed` | Seed demo data |
| GET | `/api/admin/stats` | Platform statistics |
| GET/PATCH/DELETE | `/api/admin/users` | User management |
| GET/POST | `/api/admin/notices` | Notices CRUD |
| PATCH/DELETE | `/api/admin/notices/[id]` | Update/delete notice |
| GET/POST | `/api/admin/events` | Events CRUD |
| PATCH/DELETE | `/api/admin/events/[id]` | Update/delete event |
| GET/POST | `/api/admin/reports` | Reports CRUD |
| PATCH/DELETE | `/api/admin/reports/[id]` | Update/delete report |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| POST | `/api/chat` | AI chatbot (streaming) |
| POST | `/api/verify-profile` | AI verify a profile |

---

## MongoDB Collections

| Collection | Description |
|------------|-------------|
| `user` | Better Auth user accounts (with role field) |
| `session` | Better Auth sessions |
| `account` | Better Auth linked accounts |
| `verification` | Better Auth email verifications |
| `alumni_directory` | Alumni profiles (degree, batch, company, etc.) |
| `students` | Student profiles (department, batch, etc.) |
| `jobs` | Job postings with verification data |
| `follows` | User follow relationships |
| `messages` | Direct messages between users |
| `notifications` | Follow, message, admin, and call notifications |
| `calls` | WebRTC call records with signaling data |
| `mentorships` | Mentorship requests between students and alumni |
| `contacts` | Contact form submissions |
| `notices` | Admin notices (priority-based) |
| `events` | Reunion and event records |
| `reports` | User-reported content |

---

## AI Features

### Profile Verification
- Analyzes profile completeness, consistency, and quality
- Returns a trust score (0-100) with verification level (high/medium/low)
- Flags missing fields, suspicious patterns, and inconsistencies
- Badge displayed on directory cards and detail modals

### Job Verification
- Link validation via HTTP HEAD requests
- Quality scoring: completeness (0-25), quality (0-25), consistency (0-25), freshness (0-25)
- Flags suspicious job postings (urgency language, unrealistic salaries, etc.)
- Deadline countdown with visual progress indicator on job cards

### AI Chatbot
- Floating widget on all pages with streaming responses
- NUB-focused system prompt for alumni network questions
- Rule-based fallback when OpenAI API is unavailable
- Suggested quick questions for common queries

---

## Scripts

```bash
npm run dev             # Start development server
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run socket-server   # Start Socket.IO server on port 3001
```

---

## License

Academic project for Northern University Bangladesh (NUB).
