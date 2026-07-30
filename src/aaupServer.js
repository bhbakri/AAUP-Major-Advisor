import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

import { createReport } from "./report.js";
import {
  BRANCH_OPTIONS_BY_SYSTEM,
  CERTIFICATE_SYSTEM_OPTIONS,
  CERTIFICATE_SYSTEMS,
} from "./utils.js";

const FORM_URI =
  "ui://aaup/major-match-form-v5.html";

const ARABIC_TEXT_PATTERN =
  /[\u0600-\u06ff]/;

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

function resolveToolLanguage(args = {}) {
  if (args.language === "ar") {
    return "ar";
  }

  if (args.language === "en") {
    return "en";
  }

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

function createFormHtml() {
  const certificateOptionsJson =
    JSON.stringify(
      CERTIFICATE_SYSTEM_OPTIONS
    );

  const branchOptionsJson =
    JSON.stringify(
      BRANCH_OPTIONS_BY_SYSTEM
    );

  const translationsJson = JSON.stringify({
    en: {
      eyebrow: "AAUP · 2026/2027",
      title: "Find programs that fit you",
      intro:
        "Enter the required details below. Your result is an initial guide, not a final admission decision.",
      certificateSystem:
        "Certificate system",
      branchTawjihi:
        "Tawjihi branch",
      branchBagrut:
        "Bagrut classification",
      branchForeign:
        "Equivalent classification",
      branchTawjihiHint:
        "Required for Tawjihi applicants.",
      branchBagrutHint:
        "Choose the official classification when known.",
      branchForeignHint:
        "Choose the official equivalent classification when known.",
      averageTawjihi:
        "Tawjihi average",
      averageBagrut:
        "Bagrut average",
      averageForeign:
        "Official equivalent percentage",
      averagePlaceholder:
        "Example: 84",
      coreAverage:
        "Core-subject average",
      coreAveragePlaceholder:
        "Optional, such as 85",
      coreAverageHint:
        "Only needed for some alternative Dentistry, Pharmacy, and Engineering routes.",
      campus:
        "Preferred campus",
      either:
        "Either campus",
      jenin:
        "Jenin",
      ramallah:
        "Ramallah",
      optionalSummary:
        "Improve recommendations (optional)",
      interests:
        "Interests and career goals",
      interestsPlaceholder:
        "Example: AI, medicine, design, starting a business...",
      budget:
        "Maximum tuition per credit hour",
      budgetPlaceholder:
        "Example: 250 NIS",
      foreignNotice:
        "For foreign certificates, enter the official AAUP or Palestinian Ministry equivalent percentage when available. Final eligibility requires official review.",
      equivalencyConfirmed:
        "This percentage is an official equivalent percentage.",
      create:
        "Create report",
      creating:
        "Creating your report...",
      resultTitle:
        "Your report",
      invalidAverage:
        "Enter an average between 0 and 100.",
      reportError:
        "The report could not be created. Please try again.",
      noReportReturned:
        "No report was returned.",
    },

    ar: {
      eyebrow:
        "الجامعة العربية الأمريكية · 2026/2027",
      title:
        "اعثر على التخصصات المناسبة لك",
      intro:
        "أدخل المعلومات الأساسية أدناه. النتيجة إرشادية أولية ولا تُعد قرار قبول نهائياً.",
      certificateSystem:
        "نظام الشهادة",
      branchTawjihi:
        "فرع الثانوية العامة",
      branchBagrut:
        "تصنيف شهادة البجروت",
      branchForeign:
        "التصنيف المعادل",
      branchTawjihiHint:
        "مطلوب لطلبة الثانوية العامة الفلسطينية.",
      branchBagrutHint:
        "اختر التصنيف الرسمي عند معرفته.",
      branchForeignHint:
        "اختر التصنيف المعادل الرسمي عند معرفته.",
      averageTawjihi:
        "معدل الثانوية العامة",
      averageBagrut:
        "معدل البجروت",
      averageForeign:
        "المعدل المعادل الرسمي",
      averagePlaceholder:
        "مثال: 84",
      coreAverage:
        "معدل المباحث الأساسية",
      coreAveragePlaceholder:
        "اختياري، مثل 85",
      coreAverageHint:
        "يُطلب فقط لبعض المسارات البديلة في طب الأسنان والصيدلة والهندسة.",
      campus:
        "الحرم الجامعي المفضل",
      either:
        "أي حرم جامعي",
      jenin:
        "جنين",
      ramallah:
        "رام الله",
      optionalSummary:
        "تحسين التوصيات (اختياري)",
      interests:
        "الاهتمامات والأهداف المهنية",
      interestsPlaceholder:
        "مثال: الذكاء الاصطناعي، الطب، التصميم، تأسيس مشروع...",
      budget:
        "الحد الأعلى لرسوم الساعة المعتمدة",
      budgetPlaceholder:
        "مثال: 250 شيكل",
      foreignNotice:
        "للشهادات الأجنبية، أدخل المعدل المعادل الرسمي من الجامعة أو وزارة التربية والتعليم العالي الفلسطينية عند توفره. تتطلب الأهلية النهائية مراجعة رسمية.",
      equivalencyConfirmed:
        "هذا المعدل هو معدل معادل رسمي.",
      create:
        "إنشاء التقرير",
      creating:
        "جارٍ إنشاء التقرير...",
      resultTitle:
        "تقريرك",
      invalidAverage:
        "أدخل معدلاً بين 0 و100.",
      reportError:
        "تعذر إنشاء التقرير. يرجى المحاولة مرة أخرى.",
      noReportReturned:
        "لم يتم إرجاع تقرير.",
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
    .major-match-app .hint {
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
      cursor: pointer;
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
      padding-top: 13px;
      border-top: 1px solid var(--border);
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

    .major-match-app .result-card {
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
      <span
        id="eyebrow"
        class="eyebrow"
      ></span>

      <h2 id="formTitle"></h2>

      <p
        id="formIntro"
        class="intro"
      ></p>
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

      <select
        id="certificateSystem"
      ></select>
    </div>

    <div class="field">
      <label
        id="branchLabel"
        for="certificateBranch"
      ></label>

      <select
        id="certificateBranch"
      ></select>

      <div
        id="branchHint"
        class="hint"
      ></div>
    </div>

    <div class="field-grid">
      <div class="field">
        <label
          id="averageLabel"
          for="average"
        ></label>

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
        <label
          id="campusLabel"
          for="campusPreference"
        ></label>

        <select id="campusPreference">
          <option value="Either"></option>
          <option value="Jenin"></option>
          <option value="Ramallah"></option>
        </select>
      </div>
    </div>

    <div
      id="coreSubjectSection"
      class="field"
    >
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

      <div
        id="coreAverageHint"
        class="hint"
      ></div>
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
      <summary
        id="optionalSummary"
      ></summary>

      <div class="field">
        <label
          id="interestsLabel"
          for="interests"
        ></label>

        <textarea
          id="interests"
          maxlength="500"
        ></textarea>
      </div>

      <div class="field">
        <label
          id="budgetLabel"
          for="budget"
        ></label>

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

  <div
    id="resultCard"
    class="card result-card"
  >
    <h3 id="resultTitle"></h3>
    <pre id="result"></pre>
  </div>
</div>

<script>
  const certificateOptions =
    ${certificateOptionsJson};

  const branchOptionsBySystem =
    ${branchOptionsJson};

  const uiText =
    ${translationsJson};

  const foreignSystems =
    new Set([
      "IB",
      "IGCSE_GCSE_GCE",
      "SAT",
      "AP",
      "CLEP",
      "SaudiSecondary",
      "OtherForeignOrArabEquivalency"
    ]);

  const byId = function (id) {
    return document.getElementById(id);
  };

  const app =
    byId("majorMatchApp");

  const certificateSystem =
    byId("certificateSystem");

  const certificateBranch =
    byId("certificateBranch");

  const averageInput =
    byId("average");

  const campusPreference =
    byId("campusPreference");

  const coreSubjectSection =
    byId("coreSubjectSection");

  const foreignCertificateNotice =
    byId("foreignCertificateNotice");

  const equivalencySection =
    byId("equivalencySection");

  const resultCard =
    byId("resultCard");

  const resultBox =
    byId("result");

  const submitButton =
    byId("submit");

  const languageEnglish =
    byId("languageEnglish");

  const languageArabic =
    byId("languageArabic");

  let currentLanguage = "en";

  function localizedLabel(option) {
    return currentLanguage === "ar"
      ? option.labelAr
      : option.labelEn;
  }

  function renderCertificateOptions() {
    const selectedValue =
      certificateSystem.value ||
      "Tawjihi";

    certificateSystem.innerHTML = "";

    for (
      const option
      of certificateOptions
    ) {
      const element =
        document.createElement(
          "option"
        );

      element.value =
        option.value;

      element.textContent =
        localizedLabel(option);

      certificateSystem.appendChild(
        element
      );
    }

    certificateSystem.value =
      selectedValue;
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
    const selectedValue =
      certificateBranch.value;

    const options =
      currentBranchOptions(
        certificateSystem.value
      );

    certificateBranch.innerHTML = "";

    for (const option of options) {
      const element =
        document.createElement(
          "option"
        );

      element.value =
        option.value;

      element.textContent =
        localizedLabel(option);

      certificateBranch.appendChild(
        element
      );
    }

    const selectedStillExists =
      options.some(
        function (option) {
          return (
            option.value ===
            selectedValue
          );
        }
      );

    if (selectedStillExists) {
      certificateBranch.value =
        selectedValue;
    }
  }

  function updateCertificateFields() {
    const text =
      uiText[currentLanguage];

    const system =
      certificateSystem.value;

    const isForeign =
      foreignSystems.has(system);

    renderBranchOptions();

    if (system === "Tawjihi") {
      byId(
        "branchLabel"
      ).textContent =
        text.branchTawjihi;

      byId(
        "branchHint"
      ).textContent =
        text.branchTawjihiHint;

      byId(
        "averageLabel"
      ).textContent =
        text.averageTawjihi;

      coreSubjectSection.style.display =
        "block";
    } else if (system === "Bagrut") {
      byId(
        "branchLabel"
      ).textContent =
        text.branchBagrut;

      byId(
        "branchHint"
      ).textContent =
        text.branchBagrutHint;

      byId(
        "averageLabel"
      ).textContent =
        text.averageBagrut;

      coreSubjectSection.style.display =
        "none";
    } else {
      byId(
        "branchLabel"
      ).textContent =
        text.branchForeign;

      byId(
        "branchHint"
      ).textContent =
        text.branchForeignHint;

      byId(
        "averageLabel"
      ).textContent =
        text.averageForeign;

      coreSubjectSection.style.display =
        "none";
    }

    foreignCertificateNotice
      .style
      .display =
        isForeign
          ? "block"
          : "none";

    equivalencySection
      .style
      .display =
        isForeign
          ? "block"
          : "none";
  }

  function applyLanguage(language) {
    currentLanguage =
      language === "ar"
        ? "ar"
        : "en";

    const text =
      uiText[currentLanguage];

    const isArabic =
      currentLanguage === "ar";

    app.lang =
      currentLanguage;

    app.dir =
      isArabic
        ? "rtl"
        : "ltr";

    resultBox.dir =
      isArabic
        ? "rtl"
        : "ltr";

    languageEnglish
      .classList
      .toggle(
        "active",
        !isArabic
      );

    languageArabic
      .classList
      .toggle(
        "active",
        isArabic
      );

    languageEnglish
      .setAttribute(
        "aria-pressed",
        String(!isArabic)
      );

    languageArabic
      .setAttribute(
        "aria-pressed",
        String(isArabic)
      );

    byId("eyebrow").textContent =
      text.eyebrow;

    byId("formTitle").textContent =
      text.title;

    byId("formIntro").textContent =
      text.intro;

    byId(
      "certificateSystemLabel"
    ).textContent =
      text.certificateSystem;

    byId(
      "coreAverageLabel"
    ).textContent =
      text.coreAverage;

    byId(
      "coreAverageHint"
    ).textContent =
      text.coreAverageHint;

    byId(
      "campusLabel"
    ).textContent =
      text.campus;

    byId(
      "optionalSummary"
    ).textContent =
      text.optionalSummary;

    byId(
      "interestsLabel"
    ).textContent =
      text.interests;

    byId(
      "budgetLabel"
    ).textContent =
      text.budget;

    byId(
      "equivalencyConfirmedLabel"
    ).textContent =
      text.equivalencyConfirmed;

    byId(
      "resultTitle"
    ).textContent =
      text.resultTitle;

    averageInput.placeholder =
      text.averagePlaceholder;

    byId(
      "coreSubjectAverage"
    ).placeholder =
      text.coreAveragePlaceholder;

    byId(
      "interests"
    ).placeholder =
      text.interestsPlaceholder;

    byId(
      "budget"
    ).placeholder =
      text.budgetPlaceholder;

    submitButton.textContent =
      text.create;

    foreignCertificateNotice
      .textContent =
        text.foreignNotice;

    campusPreference
      .options[0]
      .textContent =
        text.either;

    campusPreference
      .options[1]
      .textContent =
        text.jenin;

    campusPreference
      .options[2]
      .textContent =
        text.ramallah;

    renderCertificateOptions();
    updateCertificateFields();
  }

  certificateSystem
    .addEventListener(
      "change",
      function () {
        updateCertificateFields();
      }
    );

  languageEnglish
    .addEventListener(
      "click",
      function () {
        applyLanguage("en");
      }
    );

  languageArabic
    .addEventListener(
      "click",
      function () {
        applyLanguage("ar");
      }
    );

  submitButton
    .addEventListener(
      "click",
      async function () {
        const text =
          uiText[currentLanguage];

        const average =
          Number(
            averageInput.value
          );

        const invalidAverage =
          averageInput
            .value
            .trim() === "" ||
          !Number.isFinite(
            average
          ) ||
          average < 0 ||
          average > 100;

        if (invalidAverage) {
          resultCard.style.display =
            "block";

          resultBox.textContent =
            text.invalidAverage;

          averageInput.focus();
          return;
        }

        submitButton.disabled =
          true;

        submitButton.textContent =
          text.creating;

        resultCard.style.display =
          "block";

        resultBox.textContent =
          text.creating;

        const args = {
          language:
            currentLanguage,

          certificateSystem:
            certificateSystem.value,

          certificateBranch:
            certificateBranch.value,

          average:
            averageInput.value,

          coreSubjectAverage:
            byId(
              "coreSubjectAverage"
            ).value,

          equivalencyConfirmed:
            byId(
              "equivalencyConfirmed"
            ).checked,

          campusPreference:
            campusPreference.value,

          interests:
            byId(
              "interests"
            ).value,

          careerGoals:
            "",

          budget:
            byId(
              "budget"
            ).value,

          maxResults:
            5
        };

        try {
          const result =
            await window.openai.callTool(
              "create_major_match_report",
              args
            );

          const textContent =
            result?.content?.find(
              function (item) {
                return (
                  item.type ===
                  "text"
                );
              }
            )?.text;

          const report =
            result
              ?.structuredContent
              ?.report ||
            textContent ||
            text.noReportReturned;

          resultBox.textContent =
            report;
        } catch (error) {
          resultBox.textContent =
            text.reportError;

          console.error(error);
        } finally {
          submitButton.disabled =
            false;

          submitButton.textContent =
            text.create;
        }
      }
    );

  const browserPrefersArabic =
    typeof navigator !== "undefined" &&
    String(
      navigator.language || ""
    )
      .toLowerCase()
      .startsWith("ar");

  applyLanguage(
    browserPrefersArabic
      ? "ar"
      : "en"
  );
</script>
`.trim();
}

function registerMajorMatchForm(
  server
) {
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
          uri:
            FORM_URI,

          mimeType:
            RESOURCE_MIME_TYPE,

          text:
            createFormHtml(),

          _meta: {
            ui: {
              prefersBorder:
                true,

              csp: {
                connectDomains:
                  [],

                resourceDomains:
                  [],
              },
            },
          },
        },
      ],
    })
  );
}

function registerShowFormTool(
  server
) {
  server.registerTool(
    "show_major_match_form",
    {
      title:
        "Show AAUP Major Match Form",

      description:
        "Opens the bilingual AAUP major-matching form. Use this only after the student chooses the form or explicitly asks for a form, dropdown, or visual interface.",

      inputSchema: {},

      annotations: {
        readOnlyHint:
          true,

        openWorldHint:
          false,

        destructiveHint:
          false,
      },

      _meta: {
        ui: {
          resourceUri:
            FORM_URI,

          visibility: [
            "model",
            "app",
          ],
        },

        "openai/outputTemplate":
          FORM_URI,

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
          type:
            "text",

          text:
            "Use the bilingual form below to create an initial AAUP major-match report.",
        },
      ],
    })
  );
}

function registerReportTool(
  server
) {
  server.registerTool(
    "create_major_match_report",
    {
      title:
        "Create AAUP Major Match Report",

      description:
        "Creates an English or Arabic preliminary report from the full 2026/2027 AAUP bachelor-program dataset.",

      inputSchema: {
        language:
          languageSchema.describe(
            "Report language. Infer ar for Arabic conversations and en for English unless the student explicitly chooses another language."
          ),

        certificateSystem:
          z
            .enum(
              CERTIFICATE_SYSTEMS
            )
            .optional()
            .describe(
              "Certificate system"
            ),

        certificateBranch:
          optionalShortTextSchema.describe(
            "Tawjihi branch or Scientific/Literary classification"
          ),

        certificateType:
          optionalShortTextSchema.describe(
            "Backward-compatible field that may contain the old Tawjihi branch or a certificate-system name"
          ),

        average:
          percentageInputSchema.describe(
            "Student percentage from 0 to 100"
          ),

        coreSubjectAverage:
          optionalPercentageInputSchema.describe(
            "Optional core-subject average for alternative Tawjihi admission routes"
          ),

        equivalencyConfirmed:
          z
            .boolean()
            .optional()
            .describe(
              "Whether a foreign-certificate equivalent percentage is officially confirmed"
            ),

        campusPreference:
          optionalShortTextSchema.describe(
            "Jenin, Ramallah, or Either"
          ),

        interests:
          optionalLongTextSchema.describe(
            "Student interests and preferred subject areas"
          ),

        careerGoals:
          optionalLongTextSchema.describe(
            "Student career goals"
          ),

        budget:
          z
            .union([
              z
                .number()
                .nonnegative(),

              z
                .string()
                .trim()
                .max(50),
            ])
            .optional()
            .describe(
              "Maximum preferred tuition per credit hour"
            ),

        maxResults:
          z
            .union([
              z
                .number()
                .int()
                .min(1)
                .max(10),

              z
                .string()
                .trim()
                .max(10),
            ])
            .optional()
            .describe(
              "Maximum number of results per section, from 1 to 10"
            ),
      },

      annotations: {
        readOnlyHint:
          true,

        openWorldHint:
          false,

        destructiveHint:
          false,
      },

      _meta: {
        ui: {
          visibility: [
            "app",
            "model",
          ],
        },

        "openai/widgetAccessible":
          true,

        "openai/toolInvocation/invoking":
          "Creating report...",

        "openai/toolInvocation/invoked":
          "Report created.",
      },
    },

    async (args) => {
      const language =
        resolveToolLanguage(args);

      try {
        const report =
          createReport(args);

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
      } catch (error) {
        console.error(
          "Major report generation failed:",
          error instanceof Error
            ? error.message
            : "Unknown error"
        );

        const message =
          language === "ar"
            ? "تعذر إنشاء التقرير حالياً. يرجى المحاولة مرة أخرى لاحقاً."
            : "The report could not be created right now. Please try again later.";

        return {
          isError: true,

          structuredContent: {
            report: "",
            language,
          },

          content: [
            {
              type: "text",
              text: message,
            },
          ],
        };
      }
    }
  );
}

export function createMajorAdvisorServer() {
  const server = new McpServer(
    {
      name:
        "aaup-major-match",

      version:
        "0.4.1",
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
        "Do not claim that a preliminary match guarantees admission. " +
        "Do not call multiple tools at the same time.",
    }
  );

  registerMajorMatchForm(
    server
  );

  registerShowFormTool(
    server
  );

  registerReportTool(
    server
  );

  return server;
}