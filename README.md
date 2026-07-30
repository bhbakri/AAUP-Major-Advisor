# AAUP AI Advising & Shared Course Finder

A prototype university advising platform for the **Arab American University in Palestine (AAUP)**. The project combines two related systems:

1. **AAUP Major Advisor** — checks initial major eligibility and creates major-match reports.
2. **AAUP Shared Course Finder** — helps students track completed courses, join study groups, and compare the courses group members still need.

Both systems are hosted in the same Node.js project, but they are exposed as **separate ChatGPT MCP apps** so they can be shared with different audiences.

> **Project status:** Functional prototype using mock data and in-memory storage. It is suitable for demonstrations, testing, and continued development, but it is not yet production-ready.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Current ChatGPT App Split](#current-chatgpt-app-split)
- [Main Features](#main-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Data Model](#data-model)
- [Demo Accounts and Passwords](#demo-accounts-and-passwords)
- [Shared Course Finder Logic](#shared-course-finder-logic)
- [HTTP API](#http-api)
- [MCP Tools](#mcp-tools)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Render Deployment](#render-deployment)
- [Connecting the Apps to ChatGPT](#connecting-the-apps-to-chatgpt)
- [Authentication and Security](#authentication-and-security)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)

---

## Project Overview

The project began as an AAUP major-matching tool and later expanded into a student course-group system.

The two features share one deployment and one codebase, but each feature has its own MCP server and ChatGPT app endpoint.

### Major Advisor

The Major Advisor accepts the student information supported by the current form and report logic, such as:

- Tawjihi certificate or branch
- Student average
- Relevant eligibility information
- Student interests or keywords, when supported by the current flow

It checks the available program data and produces an initial advising report.

The current major data structure can include fields such as:

```js
{
  id: "JEN-MED-001",
  programArabic: "بكالوريوس دكتور في الطب",
  programEnglish: "Doctor of Medicine",
  degreeLevel: "Bachelor",
  collegeArabic: "الطب",
  collegeEnglish: "Medicine",
  campus: "Jenin",
  eligibleBranches: ["Scientific"],
  minimumAverage: 90,
  tuitionPerHourNIS: 500,
  keywords: [
    "medicine",
    "doctor",
    "health",
    "biology",
    "chemistry"
  ],
  specialNotes: [
    "Admission is not guaranteed.",
    "Applicants should confirm current admission requirements."
  ]
}
```

The report is intended for **initial guidance only**. It does not guarantee official admission.

### Shared Course Finder

The Shared Course Finder allows students to:

- Sign in or create a temporary demo account
- Select completed courses
- View courses for their major
- Create public or password-protected groups
- Join more than one group
- Leave groups
- Delete groups they created
- Compare remaining course requirements among group members
- See courses everyone in a group still needs
- See courses needed by most group members

Administrators can:

- View every registered student
- View student IDs and email addresses
- View completed course counts
- View calculated completed credit hours
- View all groups, including password-protected groups
- View group members and course analysis
- Create groups for a selected major
- Delete groups created by the administrator

---

## Current ChatGPT App Split

The project exposes two independent MCP endpoints.

| ChatGPT app | MCP endpoint | Purpose |
|---|---|---|
| **AAUP Major Advisor** | `/mcp/major-advisor` | Major eligibility, advising reports, and report email |
| **AAUP Course Finder** | `/mcp/course-finder` | Course Finder interface and shared-course data |

Production URLs on the current Render deployment:

```text
https://test-aau2.onrender.com/mcp/major-advisor
```

```text
https://test-aau2.onrender.com/mcp/course-finder
```

The standalone Course Finder website is available at:

```text
https://test-aau2.onrender.com/CourseFinder.html
```

The older combined endpoint:

```text
https://test-aau2.onrender.com/mcp
```

is no longer the intended endpoint after splitting the project into two ChatGPT apps.

---

## Main Features

### AAUP Major Advisor

- Visual major-matching form
- Tawjihi branch or certificate selection
- Initial eligibility checks
- Major-match report generation
- Arabic and English program information
- Program notes and warnings
- Optional report email through Resend
- Separate MCP endpoint from the Course Finder

### AAUP Shared Course Finder

- Student sign-in by student ID or email
- Temporary registration
- Bearer-token session authentication
- Course completion tracking
- Dynamic credit-hour calculation
- Public groups
- Password-protected groups
- Multiple group membership
- Group creator permissions
- Shared-course analysis
- “Needed by most students” analysis
- Responsive desktop and mobile layout
- Light and dark mode support
- Limited mobile widget height when rendered inside ChatGPT

### Administration

- Reusable `role: "admin"` account tag
- Admin-only dashboard route
- View all registered students
- View all course groups
- View locked groups without entering their password
- View student IDs, email addresses, majors, completed courses, and credit hours
- Create groups for any supported major
- Admin role can be assigned to other accounts later

---

## Architecture

```text
                         ┌──────────────────────────────┐
                         │          ChatGPT             │
                         └──────────────┬───────────────┘
                                        │
                     ┌──────────────────┴──────────────────┐
                     │                                     │
        @AAUP Major Advisor                    @AAUP Course Finder
                     │                                     │
          /mcp/major-advisor                    /mcp/course-finder
                     │                                     │
        createMajorAdvisorServer()              createCourseFinderServer()
                     │                                     │
     Major form / report / email tools       Course Finder UI / data tools
                     │                                     │
                     └──────────────────┬──────────────────┘
                                        │
                         Node.js + Express server
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              │                                                   │
     Major/program data                              Shared Course API
                                                      /api/shared-courses
                                                                  │
                                         students / courses / groups
```

The Course Finder HTML communicates with the Express API using `fetch()`.

The MCP servers are created separately, allowing each ChatGPT app to expose a different tool list.

---

## Project Structure

The project currently follows this general structure:

```text
project-root/
├── data/
│   ├── courseData.js
│   ├── mockStudents.js
│   └── mockGroups.js
│
├── public/
│   └── CourseFinder.html
│
├── src/
│   ├── aaupServer.js
│   ├── courseFinderServer.js
│   ├── courseFinderTool.js
│   ├── sharedCourseDataTool.js
│   ├── sharedCourses.js
│   ├── report.js
│   ├── email.js
│   └── utils.js
│
├── server.js
├── package.json
└── package-lock.json
```

### Important files

#### `server.js`

- Creates the Express and HTTP servers
- Serves files from `public/`
- Registers the Shared Course Finder API
- Handles CORS
- Routes MCP requests to the correct MCP server
- Exposes:
  - `/mcp/major-advisor`
  - `/mcp/course-finder`

#### `src/aaupServer.js`

Creates the Major Advisor MCP server and registers:

```js
registerMajorMatchForm(server);
registerShowFormTool(server);
registerReportTool(server);
registerEmailTool(server);
```

#### `src/courseFinderServer.js`

Creates the Course Finder MCP server and registers:

```js
registerCourseFinder(server);
registerSharedCourseDataTool(server);
```

#### `src/courseFinderTool.js`

- Registers the Course Finder HTML resource
- Registers the `show_course_finder` tool
- Reads `public/CourseFinder.html`
- Defines the widget URI
- Defines the widget Content Security Policy

#### `src/sharedCourses.js`

Contains the main Course Finder backend logic:

- Authentication
- Sessions
- Roles
- Credit-hour calculations
- Student APIs
- Course APIs
- Group APIs
- Group membership
- Group analysis
- Admin dashboard data
- Full read-only data snapshot for the MCP data tool

#### `data/courseData.js`

Contains the degree-plan course data.

The current cleaned **Artificial Intelligence and Robotics** plan contains **37 named courses**.

The cleaned version excludes placeholder requirements such as:

- University Elective
- Major Elective
- Free Elective
- Community Service

It keeps named requirements such as:

- Beginning English
- Internship
- Capstone Project Research
- Capstone Project: Cognitive Robotics

#### `data/mockStudents.js`

Creates approximately 50 temporary student accounts.

The students are distributed across academic years and receive realistic completed-course arrays based on year level.

#### `data/mockGroups.js`

Contains approximately 20 temporary study groups with:

- Group ID
- Name
- Major
- Creator
- Member IDs
- Optional password

---

## Technology Stack

### Backend

- Node.js
- Express
- Native Node.js HTTP server
- ES modules
- Node.js `crypto`
  - `randomBytes`
  - `scryptSync`
  - `timingSafeEqual`

### MCP and ChatGPT

- `@modelcontextprotocol/sdk`
- `@modelcontextprotocol/ext-apps`
- Streamable HTTP MCP transport
- ChatGPT widget resources
- Structured MCP tool output
- Zod schemas

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Responsive layout
- Light/dark color variables
- Session storage for the browser token

### Email

- Resend integration for major-match report email

### Hosting

- Render
- Current runtime: Node.js 22
- Current public base URL:

```text
https://test-aau2.onrender.com
```

---

## Data Model

### User

```js
{
  id: "USER-001",
  studentId: "2026001",
  email: "lina@demo.edu",
  name: "Lina Hassan",
  major: "Artificial Intelligence and Robotics",
  role: "student",
  yearLevel: 1,
  password: {
    salt: "...",
    hash: "..."
  },
  completedCourses: [
    "100411010",
    "290311110"
  ],
  groupIds: [
    "GROUP-AI-1"
  ]
}
```

### Admin

```js
{
  id: "ADMIN-001",
  studentId: "1",
  email: "Admin",
  name: "Admin",
  major: "All",
  role: "admin",
  password: {
    salt: "...",
    hash: "..."
  },
  completedCourses: [],
  groupIds: []
}
```

Any future account can become an administrator by receiving:

```js
role: "admin"
```

Regular registration always assigns:

```js
role: "student"
```

This prevents users from making themselves administrators through the registration form.

### Course

```js
{
  code: "290312230",
  name: "Machine Learning",
  credits: 3,
  year: 3,
  semester: 1
}
```

### Group

The source mock data contains member IDs and plain temporary passwords:

```js
{
  id: "GROUP-AI-2",
  name: "Robotics Study Group",
  major: "Artificial Intelligence and Robotics",
  creatorUserId: "USER-001",
  memberIds: [
    "USER-001",
    "USER-007",
    "USER-008",
    "USER-009"
  ],
  password: "robotics"
}
```

When the server starts, group passwords are converted to salted password records:

```js
{
  salt: "...",
  hash: "..."
}
```

The API only exposes whether the group is locked:

```js
locked: true
```

It does not return the stored password hash.

---

## Demo Accounts and Passwords

### Administrator

```text
Name: Admin
Student ID: 1
Email: Admin
Password: 123456
Role: admin
Major: All
```

### Student examples

```text
Name: Lina Hassan
Student ID: 2026001
Email: lina@demo.edu
Password: demo123
```

```text
Name: Omar Khalil
Student ID: 2026002
Email: omar@demo.edu
Password: demo123
```

All generated mock students currently use:

```text
Password: demo123
```

### Locked group passwords

| Group | Password |
|---|---|
| Robotics Study Group | `robotics` |
| Programming Fundamentals Friends | `coding` |
| AI Python Partners | `python` |
| Linear Algebra Partners | `matrix` |
| Computer Vision Team | `vision` |
| Deep Learning Lab Group | `deepai` |
| Autonomous Vehicles Team | `vehicles` |
| Capstone Research Team | `capstone` |
| Graduation and Career Group | `careers` |

These credentials are for temporary demonstration use only.

---

## Shared Course Finder Logic

### Remaining courses

A student’s remaining courses are:

```text
All courses in the student’s major
minus
the student’s completed course codes
```

### Completed credit hours

Credit hours are calculated dynamically from `degreePlans`.

The backend:

1. Finds the student’s major.
2. Maps course codes to course objects.
3. Removes duplicate completed-course codes.
4. Adds the `credits` value for each valid completed course.

The admin account returns zero completed credit hours because it is not a student account.

### Courses everyone still needs

A course is included in `sharedCourses` when every group member still needs it.

```text
needCount(course) === numberOfMembers
```

### Courses needed by most members

A course is included in `mostNeededCourses` when:

```text
needCount(course) > numberOfMembers / 2
```

and:

```text
needCount(course) < numberOfMembers
```

The second condition prevents a course from appearing in both:

- “Courses everyone still needs”
- “Courses needed by most members”

---

## HTTP API

Base path:

```text
/api/shared-courses
```

### Public routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/majors` | Lists supported majors |
| `POST` | `/auth/register` | Creates a temporary student account |
| `POST` | `/auth/login` | Signs in by student ID or email |

### Authenticated routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/auth/me` | Returns the signed-in user |
| `POST` | `/auth/logout` | Ends the current session |
| `GET` | `/courses` | Lists courses for the signed-in student’s major |
| `PUT` | `/me/completed-courses` | Replaces the student’s completed-course list |
| `GET` | `/groups` | Lists groups available to the user |
| `POST` | `/groups` | Creates a group |
| `POST` | `/groups/:groupId/join` | Joins a group |
| `POST` | `/groups/:groupId/leave` | Leaves a group |
| `DELETE` | `/groups/:groupId` | Deletes a group created by the current user |
| `GET` | `/groups/:groupId/analysis` | Returns members and shared-course analysis |

### Admin-only route

| Method | Route | Description |
|---|---|---|
| `GET` | `/admin/dashboard` | Returns all non-admin students and all group analyses |

### Authentication header

Authenticated API calls send:

```http
Authorization: Bearer <session-token>
```

The token is created on login or registration and stored in the browser’s `sessionStorage`.

---

## MCP Tools

## Major Advisor MCP server

Endpoint:

```text
/mcp/major-advisor
```

### `show_major_match_form`

Opens the visual major-match form.

Use this when the user asks for:

- A form
- A dropdown
- A visual major-selection interface

### `create_major_match_report`

Creates an initial advising report using the student information supplied through chat or the form.

### `send_major_match_email`

Emails an existing major-match report after an email address is provided.

### Major form resource

`registerMajorMatchForm(server)` registers the HTML resource used by the visual form. It is a resource registration function rather than a separate user-facing action.

---

## Course Finder MCP server

Endpoint:

```text
/mcp/course-finder
```

### `show_course_finder`

Opens the Shared Course Finder interface inside ChatGPT.

The widget supports:

- Sign in
- Registration
- Group creation
- Group joining
- Course selection
- Admin dashboard
- Mobile rendering
- Dark mode

### `get_all_shared_course_data`

Returns a read-only snapshot of current non-secret application data, including:

- Accounts
- Student IDs
- Email addresses
- Roles
- Completed courses
- Credit hours
- Majors
- Degree-plan courses
- Groups
- Group creators
- Group members
- Shared courses
- Most-needed courses
- Summary counts

It intentionally does not return:

- Plain account passwords
- Password hashes
- Password salts
- Active session tokens

> This tool still exposes personally identifying demo fields to the ChatGPT model. It should be protected or divided into narrower tools before real student data is introduced.

---

## Local Setup

### Requirements

- Node.js 22 or newer
- npm
- A Resend account only if email functionality is being tested

### Install

Clone the repository and enter the project folder:

```bash
git clone <repository-url>
cd <repository-folder>
```

Install dependencies:

```bash
npm install
```

The project should include packages similar to:

```text
express
zod
@modelcontextprotocol/sdk
@modelcontextprotocol/ext-apps
resend
```

---

## Environment Variables

### Server port

Optional:

```env
PORT=8787
```

The application defaults to port `8787` when `PORT` is not set.

### Email

The major-report email feature requires a Resend API key and a valid sender identity.

The exact variable names must match the names referenced inside `src/email.js`.

A typical configuration is:

```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=AAUP Advisor <verified-sender@example.com>
```

Do not commit real API keys to GitHub.

For Render, place secrets in:

```text
Render Dashboard
→ Service
→ Environment
```

---

## Running the Project

Start the server directly:

```bash
node server.js
```

A recommended `package.json` script is:

```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

Then run:

```bash
npm start
```

Local URLs:

```text
Course Finder:
http://localhost:8787/CourseFinder.html
```

```text
Major Advisor MCP:
http://localhost:8787/mcp/major-advisor
```

```text
Course Finder MCP:
http://localhost:8787/mcp/course-finder
```

The root status page is:

```text
http://localhost:8787/
```

---

## Render Deployment

Recommended Render settings:

```text
Runtime: Node
Build Command: npm install
Start Command: node server.js
```

The server listens on:

```js
process.env.PORT ?? 8787
```

and binds to:

```text
0.0.0.0
```

This allows Render to provide the public HTTPS address.

After pushing changes:

```bash
git add .
git commit -m "Update AAUP advising project"
git push
```

Wait for the Render deployment log to show that the service started successfully.

Expected URLs:

```text
https://test-aau2.onrender.com/
```

```text
https://test-aau2.onrender.com/CourseFinder.html
```

```text
https://test-aau2.onrender.com/mcp/major-advisor
```

```text
https://test-aau2.onrender.com/mcp/course-finder
```

---

## Connecting the Apps to ChatGPT

Create two separate custom MCP apps.

### App 1: AAUP Major Advisor

```text
Name:
AAUP Major Advisor
```

```text
MCP URL:
https://test-aau2.onrender.com/mcp/major-advisor
```

Expected user-facing actions:

```text
show_major_match_form
create_major_match_report
send_major_match_email
```

### App 2: AAUP Course Finder

```text
Name:
AAUP Course Finder
```

```text
MCP URL:
https://test-aau2.onrender.com/mcp/course-finder
```

Expected user-facing actions:

```text
show_course_finder
get_all_shared_course_data
```

After changing:

- Tool names
- Tool descriptions
- Tool schemas
- Server instructions
- Widget resources

refresh or recreate the app’s tool metadata in ChatGPT.

### Widget cache

When ChatGPT continues showing an old Course Finder interface, increment the widget URI in `src/courseFinderTool.js`.

Example:

```js
const COURSE_FINDER_URI =
  "ui://widget/course-finder-v5.html";
```

Changing the version helps ChatGPT load the updated HTML resource.

---

## Authentication and Security

### Current Course Finder authentication

The current demo implements browser/API authentication:

1. The user submits a student ID or email and password.
2. The server verifies the salted scrypt password record.
3. The server creates a random session token.
4. The browser stores the token in `sessionStorage`.
5. Authenticated requests send the token as a Bearer token.
6. `requireAuthentication` verifies the token.
7. `requireAdmin` checks:

```js
user.role === "admin"
```

### What the current login protects

It protects the Express API routes used by the Course Finder HTML.

For example:

```text
/api/shared-courses/admin/dashboard
```

requires both authentication and the admin role.

### What it does not automatically protect

A browser login does not automatically protect MCP tools called directly by ChatGPT.

For example, if `get_all_shared_course_data` does not require MCP-level authorization, a user with access to the Course Finder ChatGPT app can ask ChatGPT to call it directly.

### Recommended production approach

Use OAuth 2.1 with:

- Authorization Code flow
- PKCE
- AAUP identity provider or another trusted identity system
- Access tokens
- Roles
- Scopes
- Server-side permission checks on every MCP tool call

Possible scopes:

```text
courses.read
groups.read
profile.read
admin.students.read
admin.groups.read
admin.roles.write
```

OAuth proves the user’s identity.

Roles and scopes decide what the user is allowed to do.

The MCP server must enforce those permissions for every protected action.

### Recommended app separation

A future production setup could use:

```text
@AAUP Major Advisor
@AAUP Course Finder
@AAUP Course Administration
```

The administration app could expose only admin tools and require admin OAuth scopes.

### Important privacy rule

Data returned in MCP `content` or `structuredContent` is available to ChatGPT and may appear in the conversation.

Real student records should not be exposed through a broad unrestricted data tool.

---

## Known Limitations

### In-memory storage

The following are stored in server memory:

- Registered users
- Sessions
- Newly created groups
- Completed-course updates
- Group membership changes

They reset when Render:

- Restarts
- Redeploys
- Moves the service
- Recreates the process

### Mock data

The current project uses:

- Approximately 50 fictional student accounts
- Approximately 20 fictional groups
- Temporary passwords
- One primary degree plan

The names and records are mock data and should not be treated as real AAUP student records.

### No persistent database

There is currently no:

- PostgreSQL database
- MySQL database
- Durable session store
- Migration system
- Backup system

### Limited major coverage

The Shared Course Finder currently focuses on:

```text
Artificial Intelligence and Robotics
```

The backend is designed around `degreePlans`, so additional majors can be added later.

### Open CORS

The prototype currently permits broad cross-origin access so the ChatGPT widget can communicate with the Render API.

Production CORS should be restricted to trusted origins.

### No OAuth

The current ChatGPT MCP apps do not yet use full end-user OAuth authorization.

### Broad MCP data tool

`get_all_shared_course_data` returns a large application snapshot.

It is convenient for a demo but should eventually be split into tools such as:

```text
list_students
get_student
list_groups
get_group_analysis
list_courses
```

### No rate limiting

The current API does not include:

- Rate limiting
- Lockout after repeated login failures
- Abuse prevention
- Audit logging

---

## Troubleshooting

### Admin dashboard says “The request could not be completed”

Confirm that `src/sharedCourses.js` creates the runtime `groups` array after importing `mockGroups`.

```js
const groups =
  mockGroups.map((group) => {
    return {
      id: group.id,
      name: group.name,
      major: group.major,
      creatorUserId:
        group.creatorUserId,

      password:
        group.password
          ? createPasswordRecord(
              group.password
            )
          : null
    };
  });
```

Importing `mockGroups` alone is not enough. The rest of the backend expects a variable named `groups`.

### `mockStudents.js` cannot find `mockGroups.js`

Both files should be in the same folder:

```text
data/mockStudents.js
data/mockGroups.js
```

Use:

```js
import { mockGroups } from "./mockGroups.js";
```

### `sharedCourses.js` cannot find the data files

Because `sharedCourses.js` is inside `src/`, imports should use:

```js
import { degreePlans } from "../data/courseData.js";
import { mockStudents } from "../data/mockStudents.js";
import { mockGroups } from "../data/mockGroups.js";
```

### Module not found for `@modelcontextprotocol/ext-apps`

Run:

```bash
npm install @modelcontextprotocol/ext-apps
```

Commit both:

```text
package.json
package-lock.json
```

### Old `/mcp` URL returns 404

After splitting the apps, use:

```text
/mcp/major-advisor
```

or:

```text
/mcp/course-finder
```

### ChatGPT shows an old Course Finder design

Increment the widget resource URI:

```js
"ui://widget/course-finder-v6.html"
```

Then redeploy and refresh the ChatGPT app’s tool metadata.

### Course Finder works standalone but not in ChatGPT

Check the widget CSP in `courseFinderTool.js`.

It should permit the Render API domain, including:

```text
https://test-aau2.onrender.com
```

### Email sends fail

Check:

- Resend API key
- Verified sender identity
- Environment variables on Render
- The recipient rules for the current Resend account
- Render logs from `src/email.js`

---

## Future Improvements

### Persistence

- Move users, courses, groups, and memberships to PostgreSQL or MySQL
- Store sessions in a durable database or Redis
- Add database migrations
- Add automatic backups

### Authentication

- Add AAUP single sign-on
- Add OAuth 2.1 for ChatGPT MCP tools
- Add role-based scopes
- Add session expiration
- Add password reset
- Add account verification

### MCP tools

Replace the broad snapshot tool with focused tools:

```text
list_students
get_student
list_groups
get_group_analysis
list_courses
get_my_profile
get_my_groups
```

Add separate write tools only when server-side authorization is ready:

```text
create_group
join_group
leave_group
delete_group
update_completed_courses
assign_user_role
```

### Course Finder UI

- Search courses
- Filter by year and semester
- Group courses by academic year
- Add pagination or search to the admin student table
- Add group search
- Add sorting
- Add loading indicators to individual buttons
- Add accessible confirmation dialogs
- Add Arabic localization

### Advising

- Add more AAUP majors
- Import official program and admission data
- Add campus filtering
- Add current tuition data
- Add official admission notes
- Add advisor review
- Add Arabic report generation

### Administration

- Promote or demote users through an authorized admin tool
- Add group moderation
- Add account disabling
- Add audit logs
- Add activity history
- Add data export

### Security

- Restrict CORS
- Add rate limiting
- Add request validation
- Add security headers
- Add monitoring
- Add error reporting
- Remove demo credentials before production
- Prevent broad model access to student records

---

## Disclaimer

This repository is a temporary prototype for demonstration and development.

- Mock student names and records are fictional.
- Admission results are not official.
- The system does not guarantee acceptance into any program.
- Current data should be verified with AAUP admissions and academic advising.
- Real student information should not be introduced until persistent storage, OAuth, authorization, and privacy controls are implemented.
