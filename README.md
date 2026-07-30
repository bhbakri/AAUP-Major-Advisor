# AAUP Major Advisor

A bilingual English–Arabic major exploration application for prospective students of the Arab American University in Palestine (AAUP).

The application uses the Model Context Protocol (MCP) to connect with ChatGPT. It helps students explore bachelor’s programs based on their certificate system, academic average, branch or classification, campus preference, interests, career goals, and preferred tuition budget.

> This application provides preliminary guidance only. It does not guarantee admission and does not replace an official decision by the AAUP Deanship of Admission and Registration.

---

## Main Features

- English and Arabic support
- Right-to-left Arabic interface
- Visual major-selection form inside ChatGPT
- Text-based major advising through conversation
- Preliminary program eligibility checking
- Program recommendations based on student interests
- Jenin and Ramallah campus filtering
- Tuition-budget matching
- Support for multiple certificate systems
- Local read-only admissions data
- No student accounts required
- No database required
- No email collection or email-sending feature
- No GPU required

---

## Supported Certificate Systems

The application currently supports:

- Palestinian Tawjihi
- Bagrut
- International Baccalaureate (IB)
- IGCSE, GCSE, and GCE
- SAT
- Advanced Placement (AP)
- CLEP
- Saudi Secondary Certificate
- Other Arab or foreign certificates requiring equivalency review

For foreign or international certificates, the application may request an official equivalent percentage. Final equivalency and eligibility must still be confirmed by AAUP or the relevant Palestinian authority.

---

## How It Works

Students can use the application in one of two ways.

### Visual Form

The student completes a bilingual form containing fields such as:

- Certificate system
- Tawjihi branch or certificate classification
- Overall academic average
- Core-subject average, when applicable
- Preferred campus
- Interests and career goals
- Maximum preferred tuition per credit hour

The form calls the report-generation tool and displays the result inside ChatGPT.

### Chat-Based Advising

The student can answer the same questions conversationally. Once the required information is available, ChatGPT calls the report tool and returns a text report.

---

## Report Sections

A generated report may include the following sections:

### Preliminarily Eligible

Programs for which the student appears to meet the published numeric, branch, classification, and campus requirements represented in the application data.

### Official Review Required

Programs that cannot be confirmed automatically because the certificate requires official equivalency, the classification is missing, or a program-specific requirement needs review.

### Close Options

Programs for which the student is close to meeting a published academic requirement but does not currently satisfy it.

The report may also include:

- Published minimum averages
- Alternative Tawjihi routes
- Additional admission conditions
- Campus information
- Tuition per credit hour
- Program tracks
- Budget warnings
- Important admissions disclaimers

---

## MCP Tools

The server exposes two read-only MCP tools.

### `show_major_match_form`

Opens the bilingual visual major-selection form.

This tool is intended for students who request:

- A form
- A dropdown interface
- A visual major selector
- A self-service input experience

### `create_major_match_report`

Creates an English or Arabic preliminary major-match report using information supplied through the form or conversation.

The tool does not make an official admissions decision.

---

## MCP Endpoint

The application exposes one MCP endpoint:

```text
/mcp
```

After deployment, the complete connection URL will follow this format:

```text
https://your-domain.example/mcp
```

For a Render deployment, it will usually look similar to:

```text
https://your-service-name.onrender.com/mcp
```

---

## Technology Stack

### Backend

- Node.js
- Express
- Native Node.js HTTP server
- ES modules
- Streamable HTTP transport

### MCP and ChatGPT Integration

- `@modelcontextprotocol/sdk`
- `@modelcontextprotocol/ext-apps`
- MCP application resources
- Structured tool responses
- Zod input validation

### User Interface

- HTML
- CSS
- Vanilla JavaScript
- Responsive layout
- English and Arabic translations
- Right-to-left Arabic support
- Light and dark color support

### Data

- Local JSON files
- No database
- Read-only program and admissions data

---

## Project Structure

```text
AAUP-Major-Advisor/
├── data/
│   ├── majors.json
│   └── admissionSystems.json
│
├── src/
│   ├── aaupServer.js
│   ├── report.js
│   └── utils.js
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

### Important Files

#### `server.js`

The main application entry point.

It:

- Creates the Express server
- Creates the Node.js HTTP server
- Exposes the `/mcp` endpoint
- Handles MCP CORS requests
- Creates a Major Advisor MCP server for each request
- Uses the port supplied through the `PORT` environment variable
- Binds to `0.0.0.0` for hosted deployments

#### `src/aaupServer.js`

Creates the MCP server and registers:

- The bilingual form resource
- `show_major_match_form`
- `create_major_match_report`

It also contains:

- Form HTML
- Form CSS
- Form JavaScript
- English and Arabic interface text
- MCP tool schemas
- Major Advisor behavior instructions

#### `src/report.js`

Contains the major-matching and report-generation logic.

It:

- Detects the selected certificate system
- Validates academic averages
- Evaluates published program requirements
- Checks campus compatibility
- Handles alternative Tawjihi routes
- Scores programs based on interests and budget
- Separates eligible, review-required, and close options
- Generates English or Arabic reports

#### `src/utils.js`

Contains shared data and parsing utilities.

It:

- Loads the JSON data files
- Caches program data in memory
- Detects certificate systems
- Detects Tawjihi branches
- Supports Arabic and English aliases
- Converts Arabic numerals
- Parses percentages, numbers, and Boolean values
- Provides bilingual labels

#### `data/majors.json`

Contains the structured AAUP bachelor-program information used by the report generator.

Program entries may include:

- Program names in Arabic and English
- College names
- Campus
- Eligible branches
- Tawjihi minimum averages
- Bagrut minimum averages
- Tuition per credit hour
- Program tracks
- Interest keywords
- Alternative admission routes
- Additional admission requirements
- Special notes

#### `data/admissionSystems.json`

Contains general information about the supported certificate systems and academic year.

---

## Data Storage

The application does not currently require a database.

Program and admissions information is stored in local JSON files and loaded into memory while the server is running.

The application does not currently store:

- Student accounts
- Passwords
- Generated reports
- Academic profiles
- Chat conversations
- Email addresses
- Uploaded documents
- Payment information

A database may be added in the future if the project introduces features such as saved reports, student accounts, administrative data editing, or usage history.

---

## Requirements

- Node.js 22
- npm
- A public HTTPS server for ChatGPT integration

No GPU is required.

---

## Local Setup

Clone the repository:

```bash
git clone https://github.com/bhbakri/AAUP-Major-Advisor.git
```

Enter the project directory:

```bash
cd AAUP-Major-Advisor
```

Install dependencies:

```bash
npm install
```

Run the application:

```bash
npm start
```

The default local port is `8787`.

Open the status page:

```text
http://localhost:8787/
```

The local MCP endpoint is:

```text
http://localhost:8787/mcp
```

Opening `/mcp` directly in a normal browser may not display a regular webpage because the endpoint expects MCP requests.

---

## Available Scripts

Start the server:

```bash
npm start
```

Start the same server using the development script:

```bash
npm run dev
```

Run the configured project test command:

```bash
npm test
```

---

## Environment Variables

### `PORT`

The HTTP port used by the server.

Example:

```text
PORT=8787
```

Hosting platforms such as Render usually provide this variable automatically.

### `OPENAI_APPS_CHALLENGE`

Optional domain-verification token used during the public application publishing process.

Example:

```text
OPENAI_APPS_CHALLENGE=verification-token
```

Do not commit environment variables or secrets to GitHub.

---

## Render Deployment

Create a new Render **Web Service** and connect this repository.

Recommended configuration:

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

The server automatically uses Render’s `PORT` environment variable.

After deployment, verify the status page:

```text
https://your-service-name.onrender.com/
```

The MCP connection URL will be:

```text
https://your-service-name.onrender.com/mcp
```

For production use, an always-on hosting plan or a university-managed server is preferred to reduce cold starts and improve availability.

---

## University Server Deployment

The application can run directly as a Node.js service or be placed inside a Docker container.

Suggested starting specifications:

```text
Operating system: Linux
Node.js: Version 22
CPU: 1 vCPU
RAM: 1 GB
Storage: 2–5 GB
GPU: Not required
Database: Not required
Network: Public HTTPS access
```

The application is lightweight because it performs local data loading, validation, filtering, scoring, and report formatting. A larger server may be used during high-traffic admission or registration periods.

A university deployment should provide:

- A public domain or subdomain
- A valid HTTPS certificate
- Inbound HTTPS access to the MCP endpoint
- Secure environment-variable management
- Logging and monitoring
- Dependency updates
- Rate limiting
- Appropriate request timeouts

---

## Connecting to ChatGPT

After deployment:

1. Copy the public MCP endpoint.

   ```text
   https://your-domain.example/mcp
   ```

2. Add the MCP server as the application connection.

3. Confirm that ChatGPT discovers:

   ```text
   show_major_match_form
   create_major_match_report
   ```

4. Test the form workflow.

5. Test an English text report.

6. Test an Arabic text report.

7. Confirm that unrelated Course Finder or email tools do not appear.

When the form resource changes, update its versioned resource URI and refresh the ChatGPT connection to prevent an older form from remaining cached.

---

## Example Requests

### English

```text
Help me choose an AAUP major.
```

```text
I have Scientific Tawjihi with an average of 84. I prefer the Jenin campus and I am interested in artificial intelligence.
```

```text
Show me the major-selection form.
```

### Arabic

```text
ساعدني في اختيار تخصص مناسب في الجامعة العربية الأمريكية.
```

```text
أنا من الفرع العلمي ومعدلي 84 وأفضل حرم جنين وأهتم بالذكاء الاصطناعي.
```

```text
أرغب باستخدام نموذج اختيار التخصص.
```

---

## Security and Privacy

The application is designed to collect only the information needed to generate a preliminary major-match report.

Students should not enter:

- Passwords
- National identification numbers
- Passport numbers
- Payment-card details
- Precise home addresses
- Medical records
- Student portal credentials

Security recommendations for production include:

- HTTPS only
- Rate limiting
- Server-side input validation
- Safe error handling
- Dependency auditing
- Log rotation
- Request-size limits
- Request timeouts
- Avoiding academic or personal input in logs
- Restricting administrative access to the hosting environment

The application should not log the complete report input object because it may contain a student’s academic average, interests, goals, and budget preference.

---

## Admissions Disclaimer

This application is an informational advising tool.

A result marked as **preliminarily eligible** means that the student appears to satisfy the published numeric, branch or classification, and campus requirements represented in the application data.

It does not mean that:

- Admission is guaranteed
- The student has received an offer
- Every university condition has been evaluated
- Certificate equivalency has been approved
- Interviews or ability tests have been passed
- Tuition or scholarships have been finalized

Final admission, equivalency, program availability, tuition, scholarships, and additional conditions must be confirmed by the AAUP Deanship of Admission and Registration.

---

## Known Limitations

- Admission requirements may change after the data is published.
- The application relies on the information contained in its local JSON files.
- Foreign certificates may require official equivalency before eligibility can be confirmed.
- Some programs require interviews, tests, medical documents, fitness tests, or other conditions.
- Interest matching is based on keywords and program information.
- The application does not replace human academic advising.
- The application does not currently include student accounts or saved reports.
- The application does not automatically update its admissions data from the AAUP website.
- Tuition values and scholarships must be verified officially.

---

## Updating Admissions Data

To update program information:

1. Edit:

   ```text
   data/majors.json
   ```

2. Update the academic-year or certificate information in:

   ```text
   data/admissionSystems.json
   ```

3. Validate that both files contain valid JSON.

4. Restart the server.

5. Test representative certificate systems and averages.

6. Commit the changes with a message describing the admissions-data update.

Because the files are cached after their first load, the running server should be restarted after data changes.

---

## Recommended Testing

Before deployment or publishing, test at least:

1. Scientific Tawjihi in English
2. Scientific Tawjihi in Arabic
3. Literary Tawjihi
4. Bagrut with a known classification
5. Foreign certificate with confirmed equivalency
6. Foreign certificate without confirmed equivalency
7. Missing Tawjihi branch
8. Missing academic average
9. Average below zero
10. Average above 100
11. Jenin campus preference
12. Ramallah campus preference
13. Either-campus preference
14. Alternative Tawjihi route with a core-subject average
15. Alternative route without a core-subject average
16. Budget below the listed tuition
17. Form loading in light mode
18. Form loading in dark mode
19. Arabic right-to-left form layout
20. Server behavior when a JSON data file is unavailable

---

## Future Improvements

Possible future improvements include:

- Official AAUP-managed hosting
- AAUP-approved branding
- Automated admissions-data updates
- Administrative program-data management
- Automated tests
- Load testing
- Monitoring and alerts
- Privacy, terms, and support pages
- University single sign-on
- Saved reports with appropriate consent
- Additional certificate-equivalency guidance
- Analytics using anonymous aggregated data
- Docker deployment
- Continuous integration and deployment

---

## Project Status

The application is a functional Major Advisor MCP project intended for continued testing, review, and deployment preparation.

It is currently:

- Major Advisor only
- Bilingual
- Database-free
- Email-free
- Read-only
- Designed for preliminary advising rather than official admissions decisions

Before an official public launch, the project should receive university approval, legal and privacy review, production hosting, security testing, and confirmation that the admissions data is current.

---

## Author

Bassem Bakri

Developed as part of a 2026 internship project involving AI-assisted student advising for the Arab American University in Palestine.

---

## License

This repository is currently marked as unlicensed.

No permission to copy, distribute, modify, or commercially use the source code is granted unless a separate license or written authorization is provided.