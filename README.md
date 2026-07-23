Project Title
NUB Alumni Connect
Connecting Current Students and Alumni of Northern University Bangladesh
Project Objective
NUB Alumni Connect is a web-based platform that helps current students and alumni build professional relationships, find mentors, share opportunities, communicate, and strengthen the NUB community.


Layout & Page Structure
Header / Navbar
Home / Feed (Community feed wall)-->public
Alumni Directory (Search and filter graduates)-->public
Contact us → public
Job Board (Browse active job/internship listings)-->private
Notice Board (University events and announcements)-->private

Conditional Ending:
Logged Out: Login / Signup buttons.
Logged In: User Avatar Dropdown (Links to My Profile, Dashboard, and Logout).

Footer

Dashboard Layout — Student +Alumni + Admin


Student Dashboard Sidebar
Focused on skill-building, tracking job search pipelines, and managing conversations.
1.Overview:/dashboard.
Main metric cards showing total jobs applied to, active chat threads, and unread notices.
2.Messenger Chat:/dashboard/messages.
Full-screen messenger panel to chat in real-time with alumni mentors or classmates.
3.My Applications:/dashboard/applications.
A progress table tracking submitted job/internship resumes with live status updates.
4.Resume Review:/dashboard/resume-review.
Workspace to upload CV files and read written evaluations, annotations, and ratings left by alumni.
5.Skill Exchange:/dashboard/skills.
Post skills you can help with or request support from other peers in specific domains.
6.Profile Settings:/dashboard/profile.
Update your student card details, add your GitHub link, tech stack, and manage your personal posts.

🔹 Alumni Dashboard Sidebar
Tailored for graduates managing recruitment posts, reviewing resumes, and sharing insights.
1.Alumni Analytics:/dashboard.
High-level metrics tracking views on your posted jobs and total resumes you've reviewed.
2.Messenger Hub:/dashboard/messages.
A Messenger-style window to connect directly with students seeking industry tips or referrals.
3.Manage & Post Jobs:/dashboard/manage-jobs.
Form to post new openings and an applicant tracker to review student resumes.
4.Resume Critiques:/dashboard/resume-critiques.
List of student-submitted CVs awaiting your feedback, ratings, and industry suggestions.
5.My Success Stories:/dashboard/my-stories.
Drafting studio to write and edit your career journey articles highlighted on the homepage.
6.Profile Settings:/dashboard/profile.
Update your current company name, designation, graduation year, and account preferences.
Admin Dashboard Sidebar:
Designed strictly for platform metrics, user verification, system-wide moderation, and university announcements.
1.System Overview:/dashboard.
Comprehensive charts displaying overall user growth, total job posts, and system health.
2.Manage Users:/dashboard/admin/users.
User database management table to verify newly registered alumni and manage user roles.
3.Reported Content:/dashboard/admin/reported.
A moderation workspace showing flagged posts, comments, or jobs with instant Delete or Ignore actions.
4.Notice & Events Manager:/dashboard/admin/notices.
Authoring engine to blast out official NUB university notices and schedule campus events.
5.Forum Moderation:/dashboard/admin/forums.
Add, rename, or structure discussion categories like Programming, Higher Studies, etc.
6.Admin Settings:/dashboard/admin/profile.
Update admin details, view audit logs of your team's changes, and modify general site settings.


Authentication Features
Sign Up
Student Registration
Alumni Registration
Upload Profile Picture
Sign In
Email & Password Login
Remember Me
Forgot Password
Security
Role-Based Access Control (RBAC)
Session Management
Password Hashing
Register Page
Name
Email
Photo URL
Contain selective option.
→Student
→Alumni
Password
Google Login button
Link that redirects to the Login page

Password Validation Rules:
Must have an uppercase letter
Must have a lowercase letter
Length must be at least 6 characters

⚠️  Show all error and success messages using toast/sweet alert. Do NOT use browser default alert().


💡 Do NOT implement email verification or forgot password — it inconveniences the examiner. You may add these after receiving results.


Login Page
Email
Password
Google Login
A link that redirects to the Register page


Attractive Features
1. Alumni Directory
Students can search alumni by:
Name
Department
Batch
Graduation Year
Company
Designation
Location

2. Find Your Friend
Students and alumni can:
Search classmates
Search batchmates
Send connection requests
View mutual connections

3. Alumni Mentorship Program
Students can:
Request mentorship
Book mentoring sessions
Ask career questions
Alumni can:
Accept mentees
Schedule meetings

4. Job & Internship Portal
Alumni can post:
Jobs
Internships
Freelancing opportunities
Students can:
Apply
Save jobs
Track applications

5. Alumni Success Stories
Alumni can share:
Career journey
Achievements
Experiences
Students can learn from successful graduates.

6. Event Management
Admin can create:
Reunions
Seminars
Workshops
Career Fairs
Users can:
Register
Receive reminders

7. Community Feed
Similar to Facebook/LinkedIn.
Users can:
Create posts
Like
Comment
Share achievements

8. Private Messaging
Student ↔ Alumni Chat
Real-time notifications
Inbox system

9. Discussion Forum
Categories:
Career Advice
Programming
Higher Studies
Research
Entrepreneurship

10. Alumni Donation & Scholarship
Alumni can:
Donate
Sponsor scholarships
Students can:
Apply for scholarships

11. Skill Exchange
Users can offer:
Programming
Graphic Design
Digital Marketing
Research Help

12. Notice Board
Admin can publish:
University Notices
Events
Opportunities

13. Achievement Showcase
Students and alumni can showcase:
Projects
Research Papers
Certifications
Awards

14. Resume Review System
Students upload CV.
Alumni provide:
Suggestions
Ratings
Feedback
