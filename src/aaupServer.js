import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { sendMajorMatchEmail } from "./email.js";
import { createReport } from "./report.js";
import {
  BRANCH_OPTIONS_BY_SYSTEM,
  CERTIFICATE_SYSTEM_OPTIONS,
  CERTIFICATE_SYSTEMS,
} from "./utils.js";

// Keep these imports if Course Finder is enabled.
// import { registerCourseFinder } from "./courseFinderTool.js";
// import { registerSharedCourseDataTool } from "./sharedCourseDataTool.js";

const FORM_URI =
  "ui://aaup/major-match-form-v4.html";

const ARABIC_TEXT_PATTERN = /[\u0600-\u06ff]/;

function resolveToolLanguage(args = {}) {
  if (args.language === "ar") return "ar";
  if (args.language === "en") return "en";

  const combined = [
    args.certificateSystem,
    args.certificateType,
    args.certificateBranch,
    args.campusPreference,
    args.interests,
    args.careerGoals,
    args.budget,
  ].join(" ");

  return ARABIC_TEXT_PATTERN.test(combined)
    ? "ar"
    : "en";
}

const languageSchema = z
  .enum(["en", "ar"])
  .optional();

const percentageInputSchema = z.union([
  z.number().min(0).max(100),
  z.string().trim().min(1).max(20),
]);

const optionalPercentageInputSchema = z
  .union([
    z.number().min(0).max(100),
    z.string().trim().max(20),
  ])
  .optional();

const optionalShortTextSchema = z
  .string()
  .trim()
  .max(100)
  .optional();

const optionalLongTextSchema = z
  .string()
  .trim()
  .max(500)
  .optional();

function createFormHtml() {
  const certificateOptionsJson = JSON.stringify(
    CERTIFICATE_SYSTEM_OPTIONS
  );
  const branchOptionsJson = JSON.stringify(
    BRANCH_OPTIONS_BY_SYSTEM
  );

  const translationsJson = JSON.stringify({
    en: {
      eyebrow: "AAUP · 2026/2027",
      title: "Find programs that fit you",
      intro:
        "Enter the required details below. Your result is an initial guide, not a final admission decision.",
      certificateSystem: "Certificate system",
      branchTawjihi: "Tawjihi branch",
      branchBagrut: "Bagrut classification",
      branchForeign: "Equivalent classification",
      branchTawjihiHint:
        "Required for Tawjihi applicants.",
      branchBagrutHint:
        "Choose the official classification when known.",
      branchForeignHint:
        "Choose the official equivalent classification when known.",
      averageTawjihi: "Tawjihi average",
      averageBagrut: "Bagrut average",
      averageForeign: "Official equivalent percentage",
      averagePlaceholder: "Example: 84",
      coreAverage: "Core-subject average",
      coreAveragePlaceholder: "Optional, such as 85",
      coreAverageHint:
        "Only needed for some alternative Dentistry, Pharmacy, and Engineering routes.",
      campus: "Preferred campus",
      either: "Either campus",
      jenin: "Jenin",
      ramallah: "Ramallah",
      optionalSummary: "Improve recommendations (optional)",
      interests: "Interests and career goals",
      interestsPlaceholder:
        "Example: AI, medicine, design, starting a business...",
      budget: "Maximum tuition per credit hour",
      budgetPlaceholder: "Example: 250 NIS",
      foreignNotice:
        "For foreign certificates, enter the official AAUP or Palestinian Ministry equivalent percentage when available. Final eligibility requires official review.",
      equivalencyConfirmed:
        "This percentage is an official equivalent percentage.",
      create: "Create report",
      creating: "Creating your report...",
      resultTitle: "Your report",
      emailTitle: "Send this report",
      email: "Email address",
      emailPlaceholder: "student@example.com",
      send: "Send report",
      sending: "Sending report...",
      invalidAverage:
        "Enter an average between 0 and 100.",
      invalidEmail: "Enter a valid email address.",
      noReport: "Create a report first.",
      reportError:
        "The report could not be created. Please try again.",
      emailError:
        "The report could not be sent. Please try again.",
      noReportReturned: "No report was returned.",
    },
    ar: {
      eyebrow: "الجامعة العربية الأمريكية · 2026/2027",
      title: "اعثر على التخصصات المناسبة لك",
      intro:
        "أدخل المعلومات الأساسية أدناه. النتيجة إرشادية أولية ولا تُعد قرار قبول نهائياً.",
      certificateSystem: "نظام الشهادة",
      branchTawjihi: "فرع الثانوية العامة",
      branchBagrut: "تصنيف شهادة البجروت",
      branchForeign: "التصنيف المعادل",
      branchTawjihiHint:
        "مطلوب لطلبة الثانوية العامة الفلسطينية.",
      branchBagrutHint:
        "اختر التصنيف الرسمي عند معرفته.",
      branchForeignHint:
        "اختر التصنيف المعادل الرسمي عند معرفته.",
      averageTawjihi: "معدل الثانوية العامة",
      averageBagrut: "معدل البجروت",
      averageForeign: "المعدل المعادل الرسمي",
      averagePlaceholder: "مثال: 84",
      coreAverage: "معدل المباحث الأساسية",
      coreAveragePlaceholder: "اختياري، مثل 85",
      coreAverageHint:
        "يُطلب فقط لبعض المسارات البديلة في طب الأسنان والصيدلة والهندسة.",
      campus: "الحرم الجامعي المفضل",
      either: "أي حرم جامعي",
      jenin: "جنين",
      ramallah: "رام الله",
      optionalSummary: "تحسين التوصيات (اختياري)",
      interests: "الاهتمامات والأهداف المهنية",
      interestsPlaceholder:
        "مثال: الذكاء الاصطناعي، الطب، التصميم، تأسيس مشروع...",
      budget: "الحد الأعلى لرسوم الساعة المعتمدة",
      budgetPlaceholder: "مثال: 250 شيكل",
      foreignNotice:
        "للشهادات الأجنبية، أدخل المعدل المعادل الرسمي من الجامعة أو وزارة التربية والتعليم العالي الفلسطينية عند توفره. تتطلب الأهلية النهائية مراجعة رسمية.",
      equivalencyConfirmed:
        "هذا المعدل هو معدل معادل رسمي.",
      create: "إنشاء التقرير",
      creating: "جارٍ إنشاء التقرير...",
      resultTitle: "تقريرك",
      emailTitle: "إرسال التقرير",
      email: "البريد الإلكتروني",
      emailPlaceholder: "student@example.com",
      send: "إرسال التقرير",
      sending: "جارٍ إرسال التقرير...",
      invalidAverage:
        "أدخل معدلاً بين 0 و100.",
      invalidEmail:
        "أدخل عنوان بريد إلكتروني صحيحاً.",
      noReport: "أنشئ التقرير أولاً.",
      reportError:
        "تعذر إنشاء التقرير. يرجى المحاولة مرة أخرى.",
      emailError:
        "تعذر إرسال التقرير. يرجى المحاولة مرة أخرى.",
      noReportReturned: "لم يتم إرجاع تقرير.",
    },
  });

  return `
<div
  id="majorMatchApp"
  class="major-match-app"
  lang="en"
  dir="ltr"
>
  <style>
    :root {
      color-scheme: light dark;
    }

    .major-match-app {
      --surface: #ffffff;
      --surface-soft: #f6f8fb;
      --text: #172033;
      --muted: #657184;
      --border: #dce2ea;
      --accent: #156da8;
      --accent-hover: #0f5d91;
      --accent-text: #ffffff;
      --focus: rgba(21, 109, 168, 0.22);
      box-sizing: border-box;
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      padding: 18px;
      color: var(--text);
      background: var(--surface);
      font-family: Arial, sans-serif;
    }

    @media (prefers-color-scheme: dark) {
      .major-match-app {
        --surface: #17191d;
        --surface-soft: #20242a;
        --text: #f4f6f8;
        --muted: #b7c0cb;
        --border: #39414b;
        --accent: #58abe8;
        --accent-hover: #78bcef;
        --accent-text: #091018;
        --focus: rgba(88, 171, 232, 0.22);
      }
    }

    .major-match-app,
    .major-match-app * {
      box-sizing: border-box;
    }

    .major-match-app .topbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .major-match-app .eyebrow {
      display: block;
      margin-bottom: 5px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .major-match-app h2,
    .major-match-app h3,
    .major-match-app p {
      margin-top: 0;
    }

    .major-match-app h2 {
      margin-bottom: 7px;
      font-size: 24px;
      line-height: 1.2;
    }

    .major-match-app h3 {
      margin-bottom: 12px;
      font-size: 17px;
    }

    .major-match-app .intro,
    .major-match-app .hint,
    .major-match-app .status {
      color: var(--muted);
    }

    .major-match-app .intro {
      margin-bottom: 0;
      line-height: 1.5;
    }

    .major-match-app .language-toggle {
      display: inline-flex;
      flex: 0 0 auto;
      gap: 3px;
      padding: 3px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface-soft);
    }

    .major-match-app .language-button {
      width: auto;
      min-width: 66px;
      margin: 0;
      padding: 7px 10px;
      border: 0;
      border-radius: 7px;
      color: var(--text);
      background: transparent;
      font-size: 13px;
      font-weight: 700;
    }

    .major-match-app .language-button.active {
      color: var(--accent-text);
      background: var(--accent);
    }

    .major-match-app .card {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
    }

    .major-match-app .field {
      margin-top: 14px;
    }

    .major-match-app .field:first-child {
      margin-top: 0;
    }

    .major-match-app .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
    }

    .major-match-app .field-grid .field {
      margin-top: 0;
    }

    .major-match-app label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 700;
    }

    .major-match-app input,
    .major-match-app select,
    .major-match-app textarea {
      width: 100%;
      min-height: 42px;
      padding: 10px 11px;
      border: 1px solid var(--border);
      border-radius: 8px;
      outline: none;
      color: var(--text);
      background: var(--surface);
      font: inherit;
    }

    .major-match-app textarea {
      min-height: 84px;
      resize: vertical;
    }

    .major-match-app input:focus,
    .major-match-app select:focus,
    .major-match-app textarea:focus,
    .major-match-app button:focus-visible,
    .major-match-app summary:focus-visible {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--focus);
    }

    .major-match-app .hint {
      margin-top: 5px;
      font-size: 12px;
      line-height: 1.45;
    }

    .major-match-app .notice {
      margin-top: 14px;
      padding: 11px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--muted);
      background: var(--surface-soft);
      font-size: 13px;
      line-height: 1.5;
    }

    .major-match-app details {
      margin-top: 16px;
      border-top: 1px solid var(--border);
      padding-top: 13px;
    }

    .major-match-app summary {
      cursor: pointer;
      color: var(--accent);
      font-weight: 700;
    }

    .major-match-app .checkbox-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 11px;
    }

    .major-match-app .checkbox-row input {
      width: auto;
      min-height: auto;
      margin-top: 2px;
    }

    .major-match-app .checkbox-row label {
      margin: 0;
      font-weight: 400;
      line-height: 1.45;
    }

    .major-match-app .primary-button {
      width: 100%;
      margin-top: 18px;
      padding: 11px 14px;
      border: 0;
      border-radius: 8px;
      cursor: pointer;
      color: var(--accent-text);
      background: var(--accent);
      font-weight: 700;
    }

    .major-match-app .primary-button:hover {
      background: var(--accent-hover);
    }

    .major-match-app button:disabled {
      cursor: wait;
      opacity: 0.65;
    }

    .major-match-app .result-card,
    .major-match-app .email-card {
      display: none;
      margin-top: 16px;
    }

    .major-match-app pre {
      overflow-wrap: anywhere;
      white-space: pre-wrap;
      margin: 0;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      background: var(--surface-soft);
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
    }

    .major-match-app .status {
      min-height: 20px;
      margin: 10px 0 0;
      font-size: 13px;
    }

    .major-match-app[dir="rtl"] {
      text-align: right;
    }

    .major-match-app[dir="rtl"] .eyebrow {
      letter-spacing: 0;
      text-transform: none;
    }

    @media (max-width: 520px) {
      .major-match-app {
        padding: 12px;
      }

      .major-match-app .topbar {
        flex-direction: column-reverse;
      }

      .major-match-app .field-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>

  <div class="topbar">
    <div>
      <span id="eyebrow" class="eyebrow"></span>
      <h2 id="formTitle"></h2>
      <p id="formIntro" class="intro"></p>
    </div>

    <div
      class="language-toggle"
      role="group"
      aria-label="Language / اللغة"
    >
      <button
        type="button"
        id="languageEnglish"
        class="language-button active"
        aria-pressed="true"
      >
        English
      </button>

      <button
        type="button"
        id="languageArabic"
        class="language-button"
        aria-pressed="false"
      >
        العربية
      </button>
    </div>
  </div>

  <div class="card">
    <div class="field">
      <label
        id="certificateSystemLabel"
        for="certificateSystem"
      ></label>
      <select id="certificateSystem"></select>
    </div>

    <div class="field">
      <label
        id="branchLabel"
        for="certificateBranch"
      ></label>
      <select id="certificateBranch"></select>
      <div id="branchHint" class="hint"></div>
    </div>

    <div class="field-grid">
      <div class="field">
        <label id="averageLabel" for="average"></label>
        <input
          id="average"
          type="number"
          min="0"
          max="100"
          step="0.01"
          inputmode="decimal"
        />
      </div>

      <div class="field">
        <label id="campusLabel" for="campusPreference"></label>
        <select id="campusPreference">
          <option value="Either"></option>
          <option value="Jenin"></option>
          <option value="Ramallah"></option>
        </select>
      </div>
    </div>

    <div id="coreSubjectSection" class="field">
      <label
        id="coreAverageLabel"
        for="coreSubjectAverage"
      ></label>
      <input
        id="coreSubjectAverage"
        type="number"
        min="0"
        max="100"
        step="0.01"
        inputmode="decimal"
      />
      <div id="coreAverageHint" class="hint"></div>
    </div>

    <div
      id="foreignCertificateNotice"
      class="notice"
      style="display: none;"
    ></div>

    <div
      id="equivalencySection"
      style="display: none;"
    >
      <div class="checkbox-row">
        <input
          id="equivalencyConfirmed"
          type="checkbox"
        />
        <label
          id="equivalencyConfirmedLabel"
          for="equivalencyConfirmed"
        ></label>
      </div>
    </div>

    <details id="optionalDetails">
      <summary id="optionalSummary"></summary>

      <div class="field">
        <label
          id="interestsLabel"
          for="interests"
        ></label>
        <textarea id="interests" maxlength="500"></textarea>
      </div>

      <div class="field">
        <label id="budgetLabel" for="budget"></label>
        <input
          id="budget"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
        />
      </div>
    </details>

    <button
      id="submit"
      type="button"
      class="primary-button"
    ></button>
  </div>

  <div id="resultCard" class="card result-card">
    <h3 id="resultTitle"></h3>
    <pre id="result"></pre>
  </div>

  <div id="emailCard" class="card email-card">
    <h3 id="emailTitle"></h3>

    <div class="field">
      <label id="emailLabel" for="email"></label>
      <input
        id="email"
        type="email"
        maxlength="254"
        autocomplete="email"
      />
    </div>

    <button
      id="sendEmail"
      type="button"
      class="primary-button"
    ></button>

    <p id="emailStatus" class="status" aria-live="polite"></p>
  </div>
</div>

<script>
  const certificateOptions = ${certificateOptionsJson};
  const branchOptionsBySystem = ${branchOptionsJson};
  const uiText = ${translationsJson};

  const foreignSystems = new Set([
    "IB",
    "IGCSE_GCSE_GCE",
    "SAT",
    "AP",
    "CLEP",
    "SaudiSecondary",
    "OtherForeignOrArabEquivalency"
  ]);

  const app = document.getElementById("majorMatchApp");
  const certificateSystem = document.getElementById("certificateSystem");
  const certificateBranch = document.getElementById("certificateBranch");
  const averageInput = document.getElementById("average");
  const campusPreference = document.getElementById("campusPreference");
  const coreSubjectSection = document.getElementById("coreSubjectSection");
  const foreignCertificateNotice = document.getElementById("foreignCertificateNotice");
  const equivalencySection = document.getElementById("equivalencySection");
  const resultCard = document.getElementById("resultCard");
  const resultBox = document.getElementById("result");
  const emailCard = document.getElementById("emailCard");
  const emailStatus = document.getElementById("emailStatus");
  const submitButton = document.getElementById("submit");
  const sendEmailButton = document.getElementById("sendEmail");
  const languageEnglish = document.getElementById("languageEnglish");
  const languageArabic = document.getElementById("languageArabic");

  let currentLanguage = "en";
  let latestReport = "";

  function localizedLabel(option) {
    return currentLanguage === "ar"
      ? option.labelAr
      : option.labelEn;
  }

  function renderCertificateOptions() {
    const selectedValue = certificateSystem.value || "Tawjihi";
    certificateSystem.innerHTML = "";

    for (const option of certificateOptions) {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = localizedLabel(option);
      certificateSystem.appendChild(element);
    }

    certificateSystem.value = selectedValue;
  }

  function currentBranchOptions(system) {
    if (system === "Tawjihi") {
      return branchOptionsBySystem.Tawjihi;
    }

    if (system === "Bagrut") {
      return branchOptionsBySystem.Bagrut;
    }

    return branchOptionsBySystem.foreign;
  }

  function renderBranchOptions() {
    const selectedValue = certificateBranch.value;
    const options = currentBranchOptions(certificateSystem.value);
    certificateBranch.innerHTML = "";

    for (const option of options) {
      const element = document.createElement("option");
      element.value = option.value;
      element.textContent = localizedLabel(option);
      certificateBranch.appendChild(element);
    }

    if (options.some(function (option) {
      return option.value === selectedValue;
    })) {
      certificateBranch.value = selectedValue;
    }
  }

  function updateCertificateFields() {
    const text = uiText[currentLanguage];
    const system = certificateSystem.value;
    const isForeign = foreignSystems.has(system);

    renderBranchOptions();

    if (system === "Tawjihi") {
      document.getElementById("branchLabel").textContent = text.branchTawjihi;
      document.getElementById("branchHint").textContent = text.branchTawjihiHint;
      document.getElementById("averageLabel").textContent = text.averageTawjihi;
      coreSubjectSection.style.display = "block";
    } else if (system === "Bagrut") {
      document.getElementById("branchLabel").textContent = text.branchBagrut;
      document.getElementById("branchHint").textContent = text.branchBagrutHint;
      document.getElementById("averageLabel").textContent = text.averageBagrut;
      coreSubjectSection.style.display = "none";
    } else {
      document.getElementById("branchLabel").textContent = text.branchForeign;
      document.getElementById("branchHint").textContent = text.branchForeignHint;
      document.getElementById("averageLabel").textContent = text.averageForeign;
      coreSubjectSection.style.display = "none";
    }

    foreignCertificateNotice.style.display = isForeign ? "block" : "none";
    equivalencySection.style.display = isForeign ? "block" : "none";
  }

  function applyLanguage(language) {
    currentLanguage = language === "ar" ? "ar" : "en";
    const text = uiText[currentLanguage];
    const isArabic = currentLanguage === "ar";

    app.lang = currentLanguage;
    app.dir = isArabic ? "rtl" : "ltr";
    resultBox.dir = isArabic ? "rtl" : "ltr";

    languageEnglish.classList.toggle("active", !isArabic);
    languageArabic.classList.toggle("active", isArabic);
    languageEnglish.setAttribute("aria-pressed", String(!isArabic));
    languageArabic.setAttribute("aria-pressed", String(isArabic));

    document.getElementById("eyebrow").textContent = text.eyebrow;
    document.getElementById("formTitle").textContent = text.title;
    document.getElementById("formIntro").textContent = text.intro;
    document.getElementById("certificateSystemLabel").textContent = text.certificateSystem;
    document.getElementById("coreAverageLabel").textContent = text.coreAverage;
    document.getElementById("coreAverageHint").textContent = text.coreAverageHint;
    document.getElementById("campusLabel").textContent = text.campus;
    document.getElementById("optionalSummary").textContent = text.optionalSummary;
    document.getElementById("interestsLabel").textContent = text.interests;
    document.getElementById("budgetLabel").textContent = text.budget;
    document.getElementById("equivalencyConfirmedLabel").textContent = text.equivalencyConfirmed;
    document.getElementById("resultTitle").textContent = text.resultTitle;
    document.getElementById("emailTitle").textContent = text.emailTitle;
    document.getElementById("emailLabel").textContent = text.email;

    averageInput.placeholder = text.averagePlaceholder;
    document.getElementById("coreSubjectAverage").placeholder = text.coreAveragePlaceholder;
    document.getElementById("interests").placeholder = text.interestsPlaceholder;
    document.getElementById("budget").placeholder = text.budgetPlaceholder;
    document.getElementById("email").placeholder = text.emailPlaceholder;

    submitButton.textContent = text.create;
    sendEmailButton.textContent = text.send;
    foreignCertificateNotice.textContent = text.foreignNotice;

    campusPreference.options[0].textContent = text.either;
    campusPreference.options[1].textContent = text.jenin;
    campusPreference.options[2].textContent = text.ramallah;

    renderCertificateOptions();
    updateCertificateFields();
  }

  certificateSystem.addEventListener("change", function () {
    updateCertificateFields();
  });

  languageEnglish.addEventListener("click", function () {
    applyLanguage("en");
  });

  languageArabic.addEventListener("click", function () {
    applyLanguage("ar");
  });

  submitButton.addEventListener("click", async function () {
    const text = uiText[currentLanguage];
    const average = Number(averageInput.value);

    if (
      averageInput.value.trim() === "" ||
      !Number.isFinite(average) ||
      average < 0 ||
      average > 100
    ) {
      resultCard.style.display = "block";
      resultBox.textContent = text.invalidAverage;
      averageInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = text.creating;
    resultCard.style.display = "block";
    resultBox.textContent = text.creating;
    emailCard.style.display = "none";
    emailStatus.textContent = "";

    const args = {
      language: currentLanguage,
      certificateSystem: certificateSystem.value,
      certificateBranch: certificateBranch.value,
      average: averageInput.value,
      coreSubjectAverage: document.getElementById("coreSubjectAverage").value,
      equivalencyConfirmed: document.getElementById("equivalencyConfirmed").checked,
      campusPreference: campusPreference.value,
      interests: document.getElementById("interests").value,
      careerGoals: "",
      budget: document.getElementById("budget").value,
      maxResults: 5
    };

    try {
      const result = await window.openai.callTool(
        "create_major_match_report",
        args
      );

      latestReport =
        result?.structuredContent?.report ||
        result?.content?.find(function (item) {
          return item.type === "text";
        })?.text ||
        text.noReportReturned;

      resultBox.textContent = latestReport;
      emailCard.style.display = "block";
    } catch (error) {
      latestReport = "";
      resultBox.textContent = text.reportError;
      console.error(error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = text.create;
    }
  });

  sendEmailButton.addEventListener("click", async function () {
    const text = uiText[currentLanguage];
    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim();

    if (!latestReport) {
      emailStatus.textContent = text.noReport;
      return;
    }

    if (!email || !emailInput.checkValidity()) {
      emailStatus.textContent = text.invalidEmail;
      emailInput.focus();
      return;
    }

    sendEmailButton.disabled = true;
    sendEmailButton.textContent = text.sending;
    emailStatus.textContent = text.sending;

    try {
      const result = await window.openai.callTool(
        "send_major_match_email",
        {
          email: email,
          report: latestReport,
          language: currentLanguage
        }
      );

      emailStatus.textContent =
        result?.structuredContent?.message ||
        result?.content?.find(function (item) {
          return item.type === "text";
        })?.text ||
        text.emailError;
    } catch (error) {
      emailStatus.textContent = text.emailError;
      console.error(error);
    } finally {
      sendEmailButton.disabled = false;
      sendEmailButton.textContent = text.send;
    }
  });

  const browserPrefersArabic =
    typeof navigator !== "undefined" &&
    String(navigator.language || "").toLowerCase().startsWith("ar");

  applyLanguage(browserPrefersArabic ? "ar" : "en");
</script>
`.trim();
}

function registerMajorMatchForm(server) {
  registerAppResource(
    server,
    "AAUP Major Match Form",
    FORM_URI,
    {
      description:
        "Bilingual AAUP major-matching form for the 2026/2027 admission cycle.",
    },
    async () => ({
      contents: [
        {
          uri: FORM_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: createFormHtml(),
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
          },
        },
      ],
    })
  );
}

function registerShowFormTool(server) {
  server.registerTool(
    "show_major_match_form",
    {
      title: "Show AAUP Major Match Form",

      description:
        "Opens the bilingual AAUP major-matching form. Use this only after the student chooses the form or explicitly asks for a form, dropdown, or visual interface.",

      inputSchema: {},

      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },

      _meta: {
        ui: {
          resourceUri: FORM_URI,
          visibility: ["model", "app"],
        },

        "openai/outputTemplate": FORM_URI,

        "openai/toolInvocation/invoking":
          "Opening form...",

        "openai/toolInvocation/invoked":
          "Form opened.",
      },
    },

    async () => ({
      structuredContent: {},

      content: [
        {
          type: "text",
          text:
            "Use the bilingual form below to create an initial AAUP major-match report.",
        },
      ],
    })
  );
}

function registerEmailTool(server) {
  server.registerTool(
    "send_major_match_email",
    {
      title: "Send Major Match Report Email",
      description:
        "Sends an already-created AAUP major-match report to the email address supplied by the student. Call only after explicit confirmation.",
      inputSchema: {
        email: z
          .string()
          .trim()
          .email()
          .max(254)
          .describe(
            "Email address to receive the report"
          ),
        report: z
          .string()
          .trim()
          .min(1)
          .max(100_000)
          .describe(
            "The completed report text returned by create_major_match_report"
          ),
        language: languageSchema.describe(
          "Email language: en for English or ar for Arabic"
        ),
      },
      annotations: {
        readOnlyHint: false,
        openWorldHint: true,
        destructiveHint: true,
      },
      _meta: {
        ui: {
          visibility: ["model", "app"],
        },
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking":
          "Sending report...",
        "openai/toolInvocation/invoked":
          "Email request completed.",
      },
    },
    async (args) => {
      const result =
        await sendMajorMatchEmail(args);

      return {
        structuredContent: result,
        content: [
          {
            type: "text",
            text: result.message,
          },
        ],
      };
    }
  );
}

function registerReportTool(server) {
  server.registerTool(
    "create_major_match_report",
    {
      title: "Create AAUP Major Match Report",
      description:
        "Creates an English or Arabic preliminary report from the full 2026/2027 AAUP bachelor-program dataset.",
      inputSchema: {
        language: languageSchema.describe(
          "Report language. Infer ar for Arabic conversations and en for English unless the student explicitly chooses another language."
        ),
        certificateSystem: z
          .enum(CERTIFICATE_SYSTEMS)
          .optional()
          .describe("Certificate system"),
        certificateBranch: optionalShortTextSchema.describe(
          "Tawjihi branch or Scientific/Literary classification"
        ),
        certificateType: optionalShortTextSchema.describe(
          "Backward-compatible field that may contain the old Tawjihi branch or a certificate-system name"
        ),
        average: percentageInputSchema.describe(
          "Student percentage from 0 to 100"
        ),
        coreSubjectAverage:
          optionalPercentageInputSchema.describe(
            "Optional core-subject average for alternative Tawjihi admission routes"
          ),
        equivalencyConfirmed: z
          .boolean()
          .optional()
          .describe(
            "Whether a foreign-certificate equivalent percentage is officially confirmed"
          ),
        campusPreference: optionalShortTextSchema.describe(
          "Jenin, Ramallah, or Either"
        ),
        interests: optionalLongTextSchema.describe(
          "Student interests and preferred subject areas"
        ),
        careerGoals: optionalLongTextSchema.describe(
          "Student career goals"
        ),
        budget: z
          .union([
            z.number().nonnegative(),
            z.string().trim().max(50),
          ])
          .optional()
          .describe(
            "Maximum preferred tuition per credit hour"
          ),
        maxResults: z
          .union([
            z.number().int().min(1).max(10),
            z.string().trim().max(10),
          ])
          .optional()
          .describe(
            "Maximum number of results per section, from 1 to 10"
          ),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        ui: {
          visibility: ["app", "model"],
        },
        "openai/widgetAccessible": true,
        "openai/toolInvocation/invoking":
          "Creating report...",
        "openai/toolInvocation/invoked":
          "Report created.",
      },
    },
    async (args) => {
      const report = createReport(args);
      const language = resolveToolLanguage(args);

      return {
        structuredContent: {
          report,
          language,
        },
        content: [
          {
            type: "text",
            text: report,
          },
        ],
      };
    }
  );
}

export function createMajorAdvisorServer() {
  const server = new McpServer(
    {
      name: "aaup-major-match",
      version: "0.4.0",
    },
    {
      instructions:
        "Help students explore AAUP bachelor programs for academic year 2026/2027. " +
        "When a student generally asks for help choosing a major or checking eligibility and has not selected an interaction method, first ask whether they prefer to fill out a form or answer through chat and receive a text report. " +
        "Do not open the form automatically unless the student explicitly chooses the form or asks for a form, dropdown, or visual interface. " +
        "If the student chooses chat, collect the required information conversationally and call create_major_match_report once enough information is available. The text report still works without opening the form. " +
        "Determine the report language from the language the student is using. Use Arabic for Arabic conversations and English for English conversations. An explicit language choice overrides automatic language selection. Always pass language as ar or en to create_major_match_report. " +
        "If the student chooses the form, call show_major_match_form. The form has an English and Arabic language toggle. " +
        "For Tawjihi, collect the branch and overall average. Ask for the core-subject average only if the student may need an alternative Dentistry, Pharmacy, or Scientific-stream Engineering route. " +
        "For Bagrut, collect the percentage and Scientific or Literary classification when known. " +
        "For IB, IGCSE, GCSE, GCE, SAT, AP, CLEP, Saudi, or another foreign certificate, ask for the official AAUP or Palestinian Ministry equivalent percentage when available and explain that final eligibility requires official review. " +
        "Use send_major_match_email only after a report exists, the student provides an email address, and the student explicitly confirms that they want the report emailed. Pass the same report language to the email tool. " +
        "Do not claim that a preliminary match guarantees admission. " +
        "Do not call multiple tools at the same time.",
    }
  );

  registerMajorMatchForm(server);
  registerShowFormTool(server);
  registerReportTool(server);
  registerEmailTool(server);

  // Uncomment these only when those tools are enabled.
  // registerCourseFinder(server);
  // registerSharedCourseDataTool(server);

  return server;
}