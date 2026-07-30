import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateAdmissionsData,
} from "./dataValidation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIRECTORY = join(__dirname, "..", "data");

const MAJORS_FILE = join(DATA_DIRECTORY, "majors.json");
const ADMISSION_SYSTEMS_FILE = join(
  DATA_DIRECTORY,
  "admissionSystems.json"
);

let majorsCache = null;
let admissionSystemsCache = null;

export const SUPPORTED_LANGUAGES = ["en", "ar"];

export const TAWJIHI_BRANCHES = [
  "Scientific",
  "Industrial",
  "Information Technology",
  "Agricultural",
  "Literary",
  "Sharia",
];

export const CERTIFICATE_SYSTEMS = [
  "Tawjihi",
  "Bagrut",
  "IB",
  "IGCSE_GCSE_GCE",
  "SAT",
  "AP",
  "CLEP",
  "SaudiSecondary",
  "OtherForeignOrArabEquivalency",
];

export const CERTIFICATE_SYSTEM_OPTIONS = [
  {
    value: "Tawjihi",
    labelEn: "Tawjihi",
    labelAr: "الثانوية العامة الفلسطينية (التوجيهي)",
  },
  {
    value: "Bagrut",
    labelEn: "Bagrut",
    labelAr: "شهادة البجروت",
  },
  {
    value: "IB",
    labelEn: "International Baccalaureate (IB)",
    labelAr: "البكالوريا الدولية (IB)",
  },
  {
    value: "IGCSE_GCSE_GCE",
    labelEn: "IGCSE / GCSE / GCE",
    labelAr: "النظام البريطاني IGCSE / GCSE / GCE",
  },
  {
    value: "SAT",
    labelEn: "SAT",
    labelAr: "شهادة SAT",
  },
  {
    value: "AP",
    labelEn: "AP",
    labelAr: "شهادة AP",
  },
  {
    value: "CLEP",
    labelEn: "CLEP",
    labelAr: "شهادة CLEP",
  },
  {
    value: "SaudiSecondary",
    labelEn: "Saudi Secondary Certificate",
    labelAr: "شهادة الثانوية السعودية",
  },
  {
    value: "OtherForeignOrArabEquivalency",
    labelEn: "Other Arab or foreign certificate",
    labelAr: "شهادة عربية أو أجنبية أخرى",
  },
];

const TAWJIHI_BRANCH_LABELS = {
  Scientific: {
    labelEn: "Scientific",
    labelAr: "العلمي",
  },
  Industrial: {
    labelEn: "Industrial",
    labelAr: "الصناعي",
  },
  "Information Technology": {
    labelEn: "Information Technology",
    labelAr: "تكنولوجيا المعلومات",
  },
  Agricultural: {
    labelEn: "Agricultural",
    labelAr: "الزراعي",
  },
  Literary: {
    labelEn: "Literary",
    labelAr: "الأدبي",
  },
  Sharia: {
    labelEn: "Sharia",
    labelAr: "الشرعي",
  },
};

export const BRANCH_OPTIONS_BY_SYSTEM = {
  Tawjihi: TAWJIHI_BRANCHES.map((branch) => ({
    value: branch,
    ...TAWJIHI_BRANCH_LABELS[branch],
  })),
  Bagrut: [
    {
      value: "Scientific",
      labelEn: "Scientific classification",
      labelAr: "التصنيف العلمي",
    },
    {
      value: "Literary",
      labelEn: "Literary classification",
      labelAr: "التصنيف الأدبي",
    },
    {
      value: "",
      labelEn: "Not sure / needs official review",
      labelAr: "غير متأكد / يحتاج إلى مراجعة رسمية",
    },
  ],
  foreign: [
    {
      value: "Scientific",
      labelEn: "Scientific-equivalent classification",
      labelAr: "تصنيف معادل للفرع العلمي",
    },
    {
      value: "Literary",
      labelEn: "Literary-equivalent classification",
      labelAr: "تصنيف معادل للفرع الأدبي",
    },
    {
      value: "",
      labelEn: "Not sure / not yet classified",
      labelAr: "غير متأكد / لم يتم التصنيف بعد",
    },
  ],
};

const CERTIFICATE_SYSTEM_ALIASES = {
  Tawjihi: [
    "tawjihi",
    "general secondary certificate",
    "palestinian secondary certificate",
    "توجيهي",
    "الثانوية العامة",
  ],
  Bagrut: [
    "bagrut",
    "bagrut certificate",
    "taodat bagrut",
    "bejerut",
    "بجروت",
    "بيجروت",
    "בגרות",
    "תעודת בגרות",
  ],
  IB: [
    "ib",
    "ib diploma",
    "international baccalaureate",
    "البكالوريا الدولية",
  ],
  IGCSE_GCSE_GCE: [
    "igcse",
    "gcse",
    "gce",
    "british system",
    "british certificate",
    "النظام البريطاني",
  ],
  SAT: ["sat"],
  AP: ["ap", "advanced placement"],
  CLEP: ["clep"],
  SaudiSecondary: [
    "saudi secondary",
    "saudi secondary certificate",
    "saudi certificate",
    "الثانوية السعودية",
  ],
  OtherForeignOrArabEquivalency: [
    "foreign certificate",
    "international certificate",
    "arab certificate",
    "other certificate",
    "شهادة اجنبية",
    "شهادة أجنبية",
    "شهادة عربية",
  ],
};

const BRANCH_KEYWORDS = {
  Scientific: [
    "scientific",
    "scientific stream",
    "science stream",
    "علمي",
  ],
  Industrial: [
    "industrial",
    "industrial stream",
    "صناعي",
  ],
  "Information Technology": [
    "information technology",
    "information technology stream",
    "technology stream",
    "it stream",
    "تكنولوجيا المعلومات",
  ],
  Agricultural: [
    "agricultural",
    "agriculture",
    "agricultural stream",
    "زراعي",
  ],
  Literary: [
    "literary",
    "literary stream",
    "arts stream",
    "أدبي",
    "ادبي",
  ],
  Sharia: [
    "sharia",
    "sharia stream",
    "شرعي",
  ],
};

function readJsonFile(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch (error) {
    throw new Error(
      `Could not load ${label} from ${path}: ${error.message}`
    );
  }
}

function loadValidatedData() {
  if (
    majorsCache &&
    admissionSystemsCache
  ) {
    return;
  }

  const rawMajors =
    readJsonFile(
      MAJORS_FILE,
      "AAUP majors data"
    );

  const rawAdmissionSystems =
    readJsonFile(
      ADMISSION_SYSTEMS_FILE,
      "AAUP admission systems data"
    );

  const validated =
    validateAdmissionsData(
      rawMajors,
      rawAdmissionSystems
    );

  majorsCache =
    validated.majors;

  admissionSystemsCache =
    validated.admissionSystems;
}

export function loadMajors() {
  loadValidatedData();

  return majorsCache;
}

export function loadAdmissionSystems() {
  loadValidatedData();

  return admissionSystemsCache;
}

export function clearDataCache() {
  majorsCache = null;
  admissionSystemsCache = null;
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[._/\\-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeDigits(value) {
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";

  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) =>
      String(arabicIndic.indexOf(digit))
    )
    .replace(/[۰-۹]/g, (digit) =>
      String(easternArabicIndic.indexOf(digit))
    )
    .replaceAll("٬", "")
    .replaceAll(",", "")
    .replaceAll("٫", ".");
}

export function parseNumber(value) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const match = normalizeDigits(value).match(
    /-?\d+(?:\.\d+)?/
  );

  return match ? Number(match[0]) : null;
}

export function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeText(value);

  if (
    ["true", "yes", "1", "نعم"].includes(
      normalized
    )
  ) {
    return true;
  }

  if (
    ["false", "no", "0", "لا"].includes(
      normalized
    )
  ) {
    return false;
  }

  return null;
}

function containsAlias(value, alias) {
  const normalizedAlias = normalizeText(alias);

  if (!normalizedAlias) {
    return false;
  }

  if (normalizedAlias.length <= 3) {
    return value
      .split(" ")
      .includes(normalizedAlias);
  }

  return value.includes(normalizedAlias);
}

export function detectCertificateSystem(input) {
  const value = normalizeText(input);

  if (!value) {
    return null;
  }

  if (CERTIFICATE_SYSTEMS.includes(input)) {
    return input;
  }

  for (const system of CERTIFICATE_SYSTEMS) {
    const aliases =
      CERTIFICATE_SYSTEM_ALIASES[system] ?? [];

    if (
      aliases.some((alias) =>
        containsAlias(value, alias)
      )
    ) {
      return system;
    }
  }

  return null;
}

export function detectBranch(input) {
  const value = normalizeText(input);

  if (!value) {
    return null;
  }

  if (TAWJIHI_BRANCHES.includes(input)) {
    return input;
  }

  for (const [branch, keywords] of Object.entries(
    BRANCH_KEYWORDS
  )) {
    if (
      keywords.some((keyword) =>
        containsAlias(value, keyword)
      )
    ) {
      return branch;
    }
  }

  return null;
}

export function isForeignCertificateSystem(
  system
) {
  return !["Tawjihi", "Bagrut"].includes(
    system
  );
}

export function getCertificateSystemLabel(
  system,
  language = "en"
) {
  const option = CERTIFICATE_SYSTEM_OPTIONS.find(
    (item) => item.value === system
  );

  if (!option) {
    return system;
  }

  return language === "ar"
    ? option.labelAr
    : option.labelEn;
}

export function getBranchLabel(
  branch,
  language = "en"
) {
  const labels = TAWJIHI_BRANCH_LABELS[branch];

  if (!labels) {
    return branch;
  }

  return language === "ar"
    ? labels.labelAr
    : labels.labelEn;
}

export function clampInteger(
  value,
  minimum,
  maximum,
  fallback
) {
  const parsed = parseNumber(value);

  if (parsed === null) {
    return fallback;
  }

  return Math.min(
    maximum,
    Math.max(minimum, Math.trunc(parsed))
  );
}