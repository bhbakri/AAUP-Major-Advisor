# AAUP Major Advisor

A bilingual English–Arabic MCP application that helps prospective AAUP students explore bachelor’s programs based on their certificate system, branch or classification, academic average, campus preference, interests, and tuition budget.

> This application provides preliminary guidance only. It does not guarantee admission or replace an official decision by the AAUP Deanship of Admission and Registration.

## Features

- English and Arabic support
- Right-to-left Arabic interface
- Visual major-selection form inside ChatGPT
- Chat-based major advising
- Preliminary eligibility checking
- Jenin and Ramallah campus filtering
- Interest and career-goal matching
- Tuition-budget comparison
- Support for Tawjihi, Bagrut, and foreign certificate systems
- No database, email service, student account, or GPU required

## MCP Tools

### `show_major_match_form`

Opens the bilingual visual major-selection form.

### `create_major_match_report`

Creates an English or Arabic preliminary major recommendation based on the student’s information.

Both tools are read-only and do not make official admission decisions.

## MCP Endpoint

```text
/mcp
```

After deployment:

```text
https://your-domain.example/mcp
```

## Project Structure

```text
AAUP-Major-Advisor/
├── data/
│   ├── admissionSystems.json
│   └── majors.json
├── src/
│   ├── ui/
│   │   └── majorMatchForm.html
│   ├── aaupServer.js
│   ├── majorMatchForm.js
│   ├── majorMatchLanguage.js
│   ├── majorMatchTools.js
│   ├── report.js
│   └── utils.js
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

## File Overview

- `server.js` — runs the Express server and exposes `/mcp`
- `src/aaupServer.js` — creates the MCP server and registers the tools
- `src/majorMatchForm.js` — loads and registers the visual form
- `src/majorMatchLanguage.js` — contains English and Arabic interface text
- `src/majorMatchTools.js` — contains tool schemas and report-tool handling
- `src/ui/majorMatchForm.html` — contains the form HTML, CSS, and JavaScript
- `src/report.js` — contains eligibility and recommendation logic
- `src/utils.js` — loads data and parses certificate systems, branches, and numbers
- `data/majors.json` — contains bachelor-program data
- `data/admissionSystems.json` — contains certificate-system and academic-year data

## Technology Stack

- Node.js
- Express
- Model Context Protocol
- `@modelcontextprotocol/sdk`
- `@modelcontextprotocol/ext-apps`
- Zod
- HTML, CSS, and vanilla JavaScript
- Local JSON data

## Local Setup

Clone the repository:

```bash
git clone https://github.com/bhbakri/AAUP-Major-Advisor.git
cd AAUP-Major-Advisor
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The default local addresses are:

```text
Status page: http://localhost:8787/
MCP endpoint: http://localhost:8787/mcp
```

Opening `/mcp` directly in a browser may not display a normal webpage because it expects MCP requests.

## Render Deployment

Create a Render **Web Service** with:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

Render automatically provides the `PORT` environment variable.

The deployed MCP URL will look like:

```text
https://your-service-name.onrender.com/mcp
```

## Server Requirements

Recommended starting configuration:

```text
Operating system: Linux
Node.js: Version 22
CPU: 1 vCPU
RAM: 1 GB
Storage: 2–5 GB
GPU: Not required
Database: Not required
Public HTTPS: Required
```

## Data and Privacy

The application uses local JSON files and does not currently store:

- Student accounts
- Passwords
- Generated reports
- Email addresses
- Chat conversations
- Uploaded documents
- Payment information

Students should not enter sensitive information such as passwords, identification numbers, payment details, or medical records.

## Updating Admissions Data

Update:

```text
data/majors.json
data/admissionSystems.json
```

Then restart the server so the updated data is loaded.

## Important Limitations

- Admission requirements may change.
- Foreign certificates may require official equivalency.
- Some programs require interviews, tests, medical documents, or other conditions.
- Tuition and scholarship information must be confirmed officially.
- The application does not replace AAUP admissions staff or academic advisors.

## Publishing Preparation

Before an official public launch, the project should have:

- AAUP approval and branding authorization
- Stable HTTPS hosting
- Current admissions data
- Privacy policy
- Terms of use
- Support contact
- Rate limiting
- Monitoring and security testing
- Publisher and domain verification

## Author

AAUP