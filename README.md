# NUB Alumni Connect

**Connecting Current Students and Alumni of Northern University Bangladesh**

## 📌 Project Objective

NUB Alumni Connect is a web-based platform that helps current students and alumni build professional relationships, find mentors, share opportunities, communicate, and strengthen the NUB community.

---

## 🧭 Layout & Page Structure

### Header / Navbar

| Page | Route | Access |
|---|---|---|
| Home / Feed (Community feed wall) | `/` | Public |
| Alumni Directory (Search & filter graduates) | `/alumni` | Public |
| Contact Us | `/contact` | Public |
| Job Board (Browse active job/internship listings) | `/jobs` | Private |
| Notice Board (University events and announcements) | `/notices` | Private |

**Conditional Ending:**
- **Logged Out:** Login / Signup buttons
- **Logged In:** User Avatar Dropdown → My Profile, Dashboard, Logout

### Footer

---

## 🧑‍💻 Dashboard Layout — Student / Alumni / Admin

### 🔹 Student Dashboard Sidebar
Focused on skill-building, tracking job search pipelines, and managing conversations.

| # | Feature | Route | Description |
|---|---|---|---|
| 1 | Overview | `/dashboard` | Main metric cards — total jobs applied to, active chat threads, unread notices |
| 2 | Messenger Chat | `/dashboard/messages` | Full-screen messenger panel to chat in real-time with alumni mentors or classmates |
| 3 | My Applications | `/dashboard/applications` | Progress table tracking submitted job/internship resumes with live status updates |
| 4 | Resume Review | `/dashboard/resume-review` | Workspace to upload CV files and read evaluations, annotations, and ratings from alumni |
| 5 | Skill Exchange | `/dashboard/skills` | Post skills you can help with or request support from other peers in specific domains |
| 6 | Profile Settings | `/dashboard/profile` | Update student card details, GitHub link, tech stack, and manage personal posts |

### 🔹 Alumni Dashboard Sidebar
Tailored for graduates managing recruitment posts, reviewing resumes, and sharing insights.

| # | Feature | Route | Description |
|---|---|---|---|
| 1 | Alumni Analytics | `/dashboard` | High-level metrics — views on posted jobs and total resumes reviewed |
| 2 | Messenger Hub | `/dashboard/messages` | Messenger-style window to connect directly with students seeking tips or referrals |
| 3 | Manage & Post Jobs | `/dashboard/manage-jobs` | Form to post new openings and an applicant tracker to review student resumes |
| 4 | Resume Critiques | `/dashboard/resume-critiques` | List of student-submitted CVs awaiting feedback, ratings, and suggestions |
| 5 | My Success Stories | `/dashboard/my-stories` | Drafting studio to write and edit career journey articles for the homepage |
| 6 | Profile Settings | `/dashboard/profile` | Update current company name, designation, graduation year, and account preferences |

### 🔹 Admin Dashboard Sidebar
Designed strictly for platform metrics, user verification, system-wide moderation, and university announcements.

| # | Feature | Route | Description |
|---|---|---|---|
| 1 | System Overview | `/dashboard` | Comprehensive charts — overall user growth, total job posts, system health |
| 2 | Manage Users | `/dashboard/admin/users` | User database management table to verify newly registered alumni and manage roles |
| 3 | Reported Content | `/dashboard/admin/reported` | Moderation workspace showing flagged posts, comments, or jobs with Delete/Ignore actions |
| 4 | Notice & Events Manager | `/dashboard/admin/notices` | Authoring engine to publish official NUB notices and schedule campus events |
| 5 | Forum Moderation | `/dashboard/admin/forums` | Add, rename, or structure discussion categories (Programming, Higher Studies, etc.) |
| 6 | Admin Settings | `/dashboard/admin/profile` | Update admin details, view audit logs of team changes, modify site settings |

---

## 🔐 Authentication Features

### Sign Up
- Student Registration
- Alumni Registration
- Upload Profile Picture

### Sign In
- Email & Password Login
- Remember Me
- Forgot Password

### Security
- Role-Based Access Control (RBAC)
- Session Management
- Password Hashing

### Register Page Fields
- Name
- Email
- Photo URL
- Role selector → **Student** / **Alumni**
- Password
- Google Login button
- Link to Login page

**Password Validation Rules:**
- Must contain an uppercase letter
- Must contain a lowercase letter
- Minimum length: 6 characters

> ⚠️ Show all error and success messages using toast/sweet alert. Do **NOT** use the browser's default `alert()`.

> 💡 Do **NOT** implement email verification or forgot password — it inconveniences the examiner. These may be added after receiving results.

### Login Page Fields
- Email
- Password
- Google Login
- Link to Register page

---

## ✨ Attractive Features

1. **Alumni Directory** — Search alumni by Name, Department, Batch, Graduation Year, Company, Designation, Location
2. **Find Your Friend** — Search classmates/batchmates, send connection requests, view mutual connections
3. **Alumni Mentorship Program** — Students request mentorship, book sessions, ask career questions; alumni accept mentees and schedule meetings
4. **Job & Internship Portal** — Alumni post jobs/internships/freelancing opportunities; students apply, save jobs, and track applications
5. **Alumni Success Stories** — Alumni share career journeys, achievements, and experiences
6. **Event Management** — Admin creates reunions, seminars, workshops, career fairs; users register and receive reminders
7. **Community Feed** — Facebook/LinkedIn-style feed: create posts, like, comment, share achievements
8. **Private Messaging** — Student ↔ Alumni chat, real-time notifications, inbox system
9. **Discussion Forum** — Categories: Career Advice, Programming, Higher Studies, Research, Entrepreneurship
10. **Alumni Donation & Scholarship** — Alumni donate/sponsor scholarships; students apply for scholarships
11. **Skill Exchange** — Offer help in Programming, Graphic Design, Digital Marketing, Research
12. **Notice Board** — Admin publishes university notices, events, and opportunities
13. **Achievement Showcase** — Students and alumni showcase projects, research papers, certifications, awards
14. **Resume Review System** — Students upload CVs; alumni provide suggestions, ratings, and feedback

---

## 🧑‍🤝‍🧑 User Roles

| Role | Access Level |
|---|---|
| **Student** | Access to student dashboard, job board, mentorship requests, resume review, skill exchange |
| **Alumni** | Access to alumni dashboard, job posting, mentorship management, resume critiques, success stories |
| **Admin** | Full platform access — user management, moderation, notices, forum structure, system analytics |

---

## 🛠️ Tech Stack

> This section is a suggested starting point — update it to match the stack you actually use for this project.

- **Frontend:** Next.js (React)
- **Styling:** Tailwind CSS
- **UI Components:** HeroUI
- **Backend:** Node.js / Express
- **Database:** MongoDB
- **Authentication:** Better Auth (Email/Password + Google Login), Role-Based Access Control
- **Forms:** React Hook Form
- **Notifications:** Toast / SweetAlert2

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd nub-alumni-connect

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Environment Variables

```
MONGODB_URI=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_IMAGE_UPLOAD_API=
```

---

## 📂 Suggested Folder Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.js                # Home / Feed
│   │   ├── alumni/                # Alumni Directory
│   │   └── contact/
│   ├── (private)/
│   │   ├── jobs/                  # Job Board
│   │   └── notices/               # Notice Board
│   ├── dashboard/
│   │   ├── page.js                # Overview (role-based)
│   │   ├── messages/
│   │   ├── applications/
│   │   ├── resume-review/
│   │   ├── skills/
│   │   ├── manage-jobs/
│   │   ├── resume-critiques/
│   │   ├── my-stories/
│   │   ├── profile/
│   │   └── admin/
│   │       ├── users/
│   │       ├── reported/
│   │       ├── notices/
│   │       ├── forums/
│   │       └── profile/
│   ├── login/
│   └── register/
├── components/
├── lib/
└── models/
```

---

## 📄 License

This project is developed for academic purposes at Northern University Bangladesh (NUB).