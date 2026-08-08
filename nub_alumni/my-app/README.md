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

### Social

- **Follow System** — Follow/unfollow users, view followers and following lists with real-time counts
- **Private Messaging** — Direct messages between users with unread message summaries
- **Dashboard Profiles** — Create and edit detailed profiles with verification status

### Dashboard

- **Alumni Dashboard** — Profile management, job posting, job management, connections, messaging
- **Student Dashboard** — Profile creation, job browsing, connections, messaging

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
OPENAI_API_KEY=your-openai-api-key
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
│       ├── layout.jsx             # Dashboard wrapper
│       ├── page.jsx               # Dashboard home
│       ├── alumni/
│       │   ├── layout.jsx         # Alumni sidebar layout
│       │   ├── overview/page.jsx  # Alumni overview
│       │   ├── Profile/page.jsx   # Alumni profile (create/edit/view)
│       │   ├── editprofile/page.jsx
│       │   ├── jobPost/page.jsx   # Post a job
│       │   ├── manage-job/page.jsx # Manage posted jobs
│       │   ├── my-connection/page.jsx
│       │   └── text/page.jsx      # Messaging
│       └── students/
│           ├── overview/page.jsx  # Student overview
│           ├── create-profile/page.jsx # Student profile
│           ├── job-portal/page.jsx
│           ├── my-connection/page.jsx
│           └── text-box/page.jsx  # Messaging
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
│   └── DashboardSplash.jsx        # Dashboard loading state
├── lib/
│   ├── api.js                     # apiFetch wrapper (checks res.ok)
│   ├── auth.js                    # Server-side auth config
│   ├── auth-client.js             # Client-side auth config
│   ├── mongodb.js                 # MongoDB connection
│   └── verify.js                  # AI profile analysis (shared)
└── app/api/
    ├── auth/[...all]/route.js     # Better Auth catch-all
    ├── verify-profile/route.js    # Profile verification endpoint
    ├── alumni-directory/          # Alumni CRUD + check
    ├── students/                  # Student CRUD + check
    ├── student-directory/         # Public student directory
    ├── jobs/                      # Jobs CRUD + verification
    ├── follow/                    # Follow/unfollow + stats
    ├── messages/                  # Send, conversation, unread
    ├── chat/route.js              # AI chatbot streaming endpoint
    └── contact/route.js           # Contact form submission
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
| POST | `/api/verify-profile` | AI verify a profile |

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

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contact` | Submit contact form |
| POST | `/api/chat` | AI chatbot (streaming) |

---

## MongoDB Collections

| Collection | Description |
|------------|-------------|
| `alumni_directory` | Alumni profiles (degree, batch, company, etc.) |
| `students` | Student profiles (department, batch, etc.) |
| `jobs` | Job postings with verification data |
| `user` | Better Auth user accounts |
| `session` | Better Auth sessions |
| `account` | Better Auth linked accounts |
| `verification` | Better Auth email verifications |
| `follow` | User follow relationships |
| `messages` | Direct messages between users |

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
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## License

Academic project for Northern University Bangladesh (NUB).
