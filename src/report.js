import {
  clampInteger,
  detectBranch,
  detectCertificateSystem,
  isForeignCertificateSystem,
  loadAdmissionSystems,
  loadMajors,
  normalizeText,
  parseBoolean,
  parseNumber,
  TAWJIHI_BRANCHES,
} from "./utils.js";

const GENERIC_NOTE_PARTS = [
  "admission is not guaranteed",
  "initial eligibility checking only",
];

const ARABIC_TEXT_PATTERN = /[\u0600-\u06ff]/;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const DATA_MAX_AGE_DAYS = 90;

const SYSTEM_LABELS = {
  en: {
    Tawjihi: "Tawjihi",
    Bagrut: "Bagrut",
    IB: "International Baccalaureate (IB)",
    IGCSE_GCSE_GCE: "IGCSE / GCSE / GCE",
    SAT: "SAT",
    AP: "AP",
    CLEP: "CLEP",
    SaudiSecondary: "Saudi Secondary Certificate",
    OtherForeignOrArabEquivalency:
      "Other Arab or foreign certificate",
  },
  ar: {
    Tawjihi: "الثانوية العامة الفلسطينية (التوجيهي)",
    Bagrut: "شهادة البجروت",
    IB: "البكالوريا الدولية (IB)",
    IGCSE_GCSE_GCE:
      "النظام البريطاني IGCSE / GCSE / GCE",
    SAT: "شهادة SAT",
    AP: "شهادة AP",
    CLEP: "شهادة CLEP",
    SaudiSecondary: "شهادة الثانوية السعودية",
    OtherForeignOrArabEquivalency:
      "شهادة عربية أو أجنبية أخرى",
  },
};

const BRANCH_LABELS = {
  en: {
    Scientific: "Scientific",
    Industrial: "Industrial",
    "Information Technology": "Information Technology",
    Agricultural: "Agricultural",
    Literary: "Literary",
    Sharia: "Sharia",
  },
  ar: {
    Scientific: "العلمي",
    Industrial: "الصناعي",
    "Information Technology": "تكنولوجيا المعلومات",
    Agricultural: "الزراعي",
    Literary: "الأدبي",
    Sharia: "الشرعي",
  },
};

const CAMPUS_LABELS = {
  en: {
    Jenin: "Jenin",
    Ramallah: "Ramallah",
    Either: "Either campus",
  },
  ar: {
    Jenin: "جنين",
    Ramallah: "رام الله",
    Either: "أي حرم جامعي",
  },
};

const SUBJECT_LABELS_AR = {
  Mathematics: "الرياضيات",
  Physics: "الفيزياء",
  Chemistry: "الكيمياء",
  Biology: "الأحياء",
};

const NOTE_TRANSLATIONS_AR = {
  "Applicants to medical specializations are required to pass the health-sciences ability test and the personal interview.":
    "يشترط للمتقدمين للتخصصات الطبية اجتياز امتحان القدرات في العلوم الصحية والمقابلة الشخصية.",

  "Be medically fit and provide a stress-test report from a licensed health center.":
    "يشترط أن يكون المتقدم لائقاً صحياً وأن يقدم فحص جهد من مركز صحي مرخص.",

  "For Industrial-stream applicants, the selected university major must align with the field studied in secondary school.":
    "يشترط لطلبة الفرع الصناعي أن ينسجم التخصص الجامعي مع مجال الدراسة في المرحلة الثانوية.",

  "For Scientific-stream Tawjihi applicants, the official Arabic page allows 80% in Mathematics, Physics, and Chemistry with an overall average of at least 75%; the English page also lists Biology.":
    "للطلبة من الفرع العلمي: تذكر الصفحة العربية الرسمية إمكانية القبول عند الحصول على 80% في الرياضيات والفيزياء والكيمياء، وبمعدل عام لا يقل عن 75%، بينما تضيف الصفحة الإنجليزية مادة الأحياء؛ لذلك يجب تأكيد الشرط مع القبول والتسجيل.",

  "Pass the physical fitness examination.":
    "يشترط اجتياز امتحان اللياقة البدنية.",

  "Tawjihi alternative: 80% average in Mathematics, Physics, Chemistry, and Biology, with an overall average of at least 75%.":
    "مسار بديل للتوجيهي: معدل 80% في الرياضيات والفيزياء والكيمياء والأحياء، وبمعدل عام لا يقل عن 75%.",

  "Tawjihi alternative: 85% in Mathematics, Physics, Chemistry, and Biology, with an overall average of at least 80%.":
    "مسار بديل للتوجيهي: معدل 85% في الرياضيات والفيزياء والكيمياء والأحياء، وبمعدل عام لا يقل عن 80%.",

  "Tawjihi minimum is 70% for the Scientific branch and 80% for the Literary branch.":
    "الحد الأدنى للتوجيهي هو 70% للفرع العلمي و80% للفرع الأدبي.",
};

const REPORT_TEXT = {
  en: {
    title: "AAUP Student Major Match Report",
    profile: "Student Profile",
    certificateSystem: "Certificate system",
    branch: "Branch / classification",
    average: "Average",
    equivalentAverage: "Entered equivalent average",
    coreAverage: "Core-subject average",
    equivalencyConfirmed:
      "Equivalent percentage officially confirmed",
    campus: "Preferred campus",
    interests: "Interests",
    careerGoals: "Career goals",
    budget: "Budget preference",
    notProvided: "Not provided",
    notSpecified: "Not specified",
    yes: "Yes",
    no: "No",

    eligibleHeading:
      "Top Preliminarily Eligible Matches",
    eligibleHeadingUnranked:
      "Preliminarily Eligible Programs",

    reviewHeading:
      "Matches Requiring Official Certificate or Classification Review",

    closeHeading:
      "Close Options That Do Not Currently Meet a Published Requirement",

    notesHeading: "Important Notes",
    eligibleStatus: "Preliminarily eligible",
    reviewStatus: "Official review required",
    status: "Status",
    campusLabel: "Campus",
    college: "College",
    requirement: "Published requirement",
    tuition: "Tuition/hour",
    whyFit: "Why it fits",
    tracks: "Program tracks",
    conditions: "Additional conditions",
    reviewNotes: "Review notes",
    budgetNote: "Budget note",
    requirementIssue: "Requirement issue",
    afterScholarship: "after the listed scholarship",

    noEligible:
      "No programs could be marked preliminarily eligible from the published numeric and branch rules.",

    noReview:
      "No additional programs requiring review were found for this profile.",

    noClose:
      "No close-but-not-eligible options were found under the published numeric rules.",

    generalFit:
      "matches the academic filters; personal fit depends on the student's interests and goals",

    academicOnlyFit:
      "meets the academic filters; no personal-interest ranking was applied",

    titleOverlap:
      "the program title or college overlaps with the stated interests or career goals",

    budgetFits: (value) =>
      `fits the stated budget of about ${value} NIS per credit hour`,

    keywordMatch: (keyword) =>
      `matches the stated interest in ${keyword}`,

    tuitionAboveBudget: (tuition, budget) =>
      `tuition starts at ${tuition} per credit hour, above the provided budget of ${budget} NIS`,

    tawjihiMinimum: (minimum) =>
      `Tawjihi minimum: ${minimum}%`,

    bagrutMinimum: (minimum) =>
      `Bagrut minimum: ${minimum}%`,

    meetsMinimum: (system, minimum) =>
      `meets the published ${system} minimum of ${minimum}%`,

    foreignReviewRequirement:
      "AAUP does not publish a separate program-specific numeric minimum for this certificate system. The certificate must first be converted to an official equivalent percentage and reviewed by admissions.",

    foreignReviewReason:
      "official certificate equivalency and program-level review are required",

    missingMinimum:
      "No numeric minimum is available in the structured data for this certificate system.",

    missingMinimumReason:
      "the published numeric minimum could not be confirmed",

    standardAlternative: (
      minimum,
      overall,
      core,
      subjects
    ) =>
      `Standard Tawjihi minimum: ${minimum}%. An alternative route may apply with at least ${overall}% overall and ${core}% across ${subjects}.`,

    missingCoreReason:
      "the overall average may qualify through an alternative route, but the core-subject average was not provided",

    alternativeRoute: (
      overall,
      core,
      subjects
    ) =>
      `Alternative Tawjihi route: at least ${overall}% overall and ${core}% across ${subjects}.`,

    meetsAlternative:
      "meets the published alternative Tawjihi route",

    alternativeCoreRequired: (
      core,
      subjects
    ) =>
      `Alternative route requires at least ${core}% across ${subjects}.`,

    coreBelow: (actual, required) =>
      `core-subject average is ${actual}%, below the alternative requirement of ${required}%`,

    belowMinimum: (required, actual) =>
      `requires at least ${required}%, but the provided average is ${actual}%`,

    campusMismatch: (preference) =>
      `campus does not match the preference (${preference})`,

    branchMismatch:
      "certificate classification does not match the listed branch requirement",

    branchReview:
      "certificate branch/classification was not provided, so branch eligibility still needs review",

    equivalencyWarning:
      "the entered percentage has not been marked as an official AAUP or Palestinian Ministry equivalent",

    publishedCoreSubjects:
      "the published core subjects",

    invalidSystemTitle:
      "I could not identify the certificate system",

    invalidBranchTitle:
      "I could not identify the Tawjihi branch",

    invalidAverageTitle:
      "I could not read the student's average",

    invalidAverageRange:
      "The average must be between 0 and 100.",

    supportedSystems: "Supported systems",
    supportedBranches: "Supported Tawjihi branches",

    foreignAverageHelp:
      "For foreign certificates, use the official AAUP or Palestinian Ministry equivalent percentage when available.",

    branchHelp:
      "Bagrut and foreign-certificate applicants may use a Scientific or Literary classification, or leave the classification blank for an official-review report.",

    averageHelp:
      "Enter a percentage such as 84 or 84%. For a foreign certificate, enter the official equivalent percentage when it is available.",

    disclaimer:
      "This report does not guarantee admission and does not replace the AAUP Deanship of Admission and Registration.",

    noteDataset: (count, year) =>
      `The report checked ${count} bachelor offerings across the Jenin and Ramallah campuses for academic year ${year}.`,

    noteLastVerified: (date) =>
      `Admissions data last verified: ${date}.`,

    noteApplicationWindow: (
      open,
      close,
      classesBegin
    ) =>
      `Application cycle: applications open ${open}, close ${close}, and classes begin ${classesBegin}.`,

    noteOfficialSources: (sources) =>
      `Official AAUP admissions sources: ${sources}.`,

    noteRankingPersonalized:
      "Program order uses the stated interests and career goals. Tuition does not determine the academic-fit ranking.",

    noteRankingUnranked:
      "No interests or career goals were provided, so eligible programs are listed alphabetically rather than presented as best matches.",

    staleDataTitle:
      "AAUP admissions information requires an update",

    staleDataMessage:
      "This advisor has paused eligibility matching because its admissions dataset is outside the approved application cycle or has not been verified recently enough.",

    staleDataReasons: "Reason",

    staleDataNextStep:
      "Please use the official AAUP admissions pages or contact the Deanship of Admission and Registration until the dataset is reviewed.",

    noteEligibility:
      "“Preliminarily eligible” means the student appears to satisfy the published certificate-system minimum, branch/classification, and campus filters represented in the structured data.",

    noteAlternatives:
      "Dentistry, Pharmacy, and Scientific-stream Engineering may have alternative Tawjihi routes based on core-subject averages.",

    noteConditions:
      "Some programs require interviews, ability tests, physical-fitness tests, medical reports, or alignment between an Industrial secondary specialization and the selected university program.",

    noteForeignOne:
      "AAUP publishes conversion rules for this certificate family, but not a separate numeric minimum for every program.",

    noteForeignTwo:
      "Results under “Official review required” are recommendations, not confirmed eligibility.",

    noteForeignThree: (year) =>
      `Certificate conversion source year: ${year}.`,

    noteTuition:
      "Tuition values are starting rates and some are listed after scholarship; the final fee depends on the university's official calculation.",

    noteFinal:
      "Final eligibility and equivalency must be confirmed by the AAUP Deanship of Admission and Registration.",
  },

  ar: {
    title:
      "تقرير اختيار التخصص في الجامعة العربية الأمريكية",

    profile: "بيانات الطالب",
    certificateSystem: "نظام الشهادة",
    branch: "الفرع أو التصنيف",
    average: "المعدل",
    equivalentAverage: "المعدل المعادل المُدخل",
    coreAverage: "معدل المباحث الأساسية",

    equivalencyConfirmed:
      "هل تم تأكيد المعدل المعادل رسمياً",

    campus: "الحرم الجامعي المفضل",
    interests: "الاهتمامات",
    careerGoals: "الأهداف المهنية",
    budget: "الميزانية المفضلة",
    notProvided: "غير مزود",
    notSpecified: "غير محدد",
    yes: "نعم",
    no: "لا",

    eligibleHeading:
      "أفضل التخصصات التي يستوفي الطالب شروطها الأولية",

    eligibleHeadingUnranked:
      "التخصصات التي يستوفي الطالب شروطها الأولية",

    reviewHeading:
      "تخصصات تحتاج إلى مراجعة رسمية للشهادة أو التصنيف",

    closeHeading:
      "تخصصات قريبة لا يستوفي الطالب أحد شروطها المنشورة حالياً",

    notesHeading: "ملاحظات مهمة",
    eligibleStatus: "مؤهل مبدئياً",
    reviewStatus: "تحتاج إلى مراجعة رسمية",
    status: "الحالة",
    campusLabel: "الحرم الجامعي",
    college: "الكلية",
    requirement: "شرط القبول المنشور",
    tuition: "رسوم الساعة",
    whyFit: "سبب ملاءمة التخصص",
    tracks: "مسارات البرنامج",
    conditions: "شروط إضافية",
    reviewNotes: "ملاحظات للمراجعة",
    budgetNote: "ملاحظة حول الميزانية",
    requirementIssue: "الشرط غير المستوفى",
    afterScholarship: "بعد المنحة المذكورة",

    noEligible:
      "لم يتم العثور على تخصصات يمكن اعتبار الطالب مؤهلاً لها مبدئياً وفق الشروط الرقمية وشروط الفروع المنشورة.",

    noReview:
      "لم يتم العثور على تخصصات إضافية تحتاج إلى مراجعة رسمية لهذا الملف.",

    noClose:
      "لم يتم العثور على تخصصات قريبة لا تستوفي الشروط الرقمية المنشورة.",

    generalFit:
      "يستوفي المرشحات الأكاديمية الأساسية، وتبقى الملاءمة الشخصية مرتبطة باهتمامات الطالب وأهدافه",

    academicOnlyFit:
      "يستوفي المرشحات الأكاديمية، ولم يُطبّق ترتيب حسب الاهتمامات الشخصية",

    titleOverlap:
      "يتوافق اسم التخصص أو الكلية مع الاهتمامات أو الأهداف المهنية المذكورة",

    budgetFits: (value) =>
      `يناسب الميزانية المذكورة، وهي نحو ${value} شيكل للساعة المعتمدة`,

    keywordMatch: () =>
      "يتوافق مع الاهتمامات المذكورة",

    tuitionAboveBudget: (tuition, budget) =>
      `تبدأ الرسوم من ${tuition} للساعة المعتمدة، وهي أعلى من الميزانية المدخلة (${budget} شيكل)`,

    tawjihiMinimum: (minimum) =>
      `الحد الأدنى للتوجيهي: ${minimum}%`,

    bagrutMinimum: (minimum) =>
      `الحد الأدنى للبجروت: ${minimum}%`,

    meetsMinimum: (system, minimum) =>
      `يستوفي الحد الأدنى المنشور لنظام ${system} وهو ${minimum}%`,

    foreignReviewRequirement:
      "لا تنشر الجامعة حداً رقمياً منفصلاً لكل تخصص ضمن نظام الشهادة هذا. يجب أولاً احتساب المعدل المعادل رسمياً ومراجعة الطلب من عمادة القبول والتسجيل.",

    foreignReviewReason:
      "تحتاج الشهادة إلى معادلة رسمية ومراجعة شروط التخصص",

    missingMinimum:
      "لا يتوفر حد أدنى رقمي مؤكد لهذا النظام في البيانات المنظمة.",

    missingMinimumReason:
      "تعذر تأكيد الحد الأدنى الرقمي المنشور",

    standardAlternative: (
      minimum,
      overall,
      core,
      subjects
    ) =>
      `الحد القياسي للتوجيهي هو ${minimum}%. وقد ينطبق مسار بديل عند الحصول على معدل عام لا يقل عن ${overall}% ومعدل ${core}% في ${subjects}.`,

    missingCoreReason:
      "قد يسمح المعدل العام بالمسار البديل، لكن معدل المباحث الأساسية لم يُزود",

    alternativeRoute: (
      overall,
      core,
      subjects
    ) =>
      `المسار البديل للتوجيهي: معدل عام لا يقل عن ${overall}% ومعدل ${core}% في ${subjects}.`,

    meetsAlternative:
      "يستوفي المسار البديل المنشور للتوجيهي",

    alternativeCoreRequired: (
      core,
      subjects
    ) =>
      `يتطلب المسار البديل معدل ${core}% على الأقل في ${subjects}.`,

    coreBelow: (actual, required) =>
      `معدل المباحث الأساسية هو ${actual}%، وهو أقل من الحد المطلوب للمسار البديل (${required}%)`,

    belowMinimum: (required, actual) =>
      `يتطلب معدل ${required}% على الأقل، بينما المعدل المدخل هو ${actual}%`,

    campusMismatch: (preference) =>
      `الحرم الجامعي لا يطابق التفضيل المدخل (${preference})`,

    branchMismatch:
      "تصنيف الشهادة لا يطابق شرط الفرع المنشور للتخصص",

    branchReview:
      "لم يتم تزويد الفرع أو التصنيف، لذلك ما تزال أهلية الفرع بحاجة إلى مراجعة",

    equivalencyWarning:
      "لم تتم الإشارة إلى أن المعدل المدخل هو معدل معادل معتمد من الجامعة أو وزارة التربية والتعليم العالي الفلسطينية",

    publishedCoreSubjects:
      "المباحث الأساسية المنشورة",

    invalidSystemTitle:
      "تعذر التعرف على نظام الشهادة",

    invalidBranchTitle:
      "تعذر التعرف على فرع الثانوية العامة",

    invalidAverageTitle:
      "تعذر قراءة معدل الطالب",

    invalidAverageRange:
      "يجب أن يكون المعدل بين 0 و100.",

    supportedSystems:
      "أنظمة الشهادات المدعومة",

    supportedBranches:
      "فروع الثانوية العامة المدعومة",

    foreignAverageHelp:
      "للشهادات الأجنبية، استخدم المعدل المعادل الرسمي الصادر عن الجامعة أو وزارة التربية والتعليم العالي الفلسطينية عند توفره.",

    branchHelp:
      "يمكن لطلبة البجروت والشهادات الأجنبية استخدام التصنيف العلمي أو الأدبي، أو ترك التصنيف فارغاً للحصول على تقرير يحتاج إلى مراجعة رسمية.",

    averageHelp:
      "أدخل المعدل كنسبة مئوية مثل 84 أو 84%. وللشهادة الأجنبية أدخل المعدل المعادل الرسمي عند توفره.",

    disclaimer:
      "هذا التقرير لا يضمن القبول ولا يحل محل قرار عمادة القبول والتسجيل في الجامعة العربية الأمريكية.",

    noteDataset: (count, year) =>
      `فحص التقرير ${count} طرحاً لبرامج البكالوريوس في حرمي جنين ورام الله للعام الأكاديمي ${year}.`,

    noteLastVerified: (date) =>
      `آخر تحقق من بيانات القبول: ${date}.`,

    noteApplicationWindow: (
      open,
      close,
      classesBegin
    ) =>
      `دورة التقديم: يبدأ استقبال الطلبات في ${open}، وينتهي في ${close}، وتبدأ الدراسة في ${classesBegin}.`,

    noteOfficialSources: (sources) =>
      `مصادر القبول الرسمية في الجامعة: ${sources}.`,

    noteRankingPersonalized:
      "يعتمد ترتيب البرامج على الاهتمامات والأهداف المهنية المدخلة، ولا تحدد الرسوم ترتيب الملاءمة الأكاديمية.",

    noteRankingUnranked:
      "لم تُدخل اهتمامات أو أهداف مهنية، لذلك عُرضت التخصصات المؤهلة أبجدياً بدلاً من وصفها بأنها أفضل المطابقات.",

    staleDataTitle:
      "تحتاج معلومات القبول في الجامعة إلى تحديث",

    staleDataMessage:
      "أوقف المستشار مطابقة الأهلية لأن مجموعة بيانات القبول أصبحت خارج دورة التقديم المعتمدة أو لم يتم التحقق منها خلال المدة المحددة.",

    staleDataReasons: "السبب",

    staleDataNextStep:
      "يرجى استخدام صفحات القبول الرسمية في الجامعة أو التواصل مع عمادة القبول والتسجيل إلى أن تتم مراجعة البيانات.",

    noteEligibility:
      "تعني عبارة «مؤهل مبدئياً» أن الطالب يبدو مستوفياً للحد الأدنى المنشور لنظام الشهادة، وشرط الفرع أو التصنيف، والحرم الجامعي ضمن البيانات المنظمة.",

    noteAlternatives:
      "قد تتوفر مسارات توجيهي بديلة في طب الأسنان والصيدلة وبعض تخصصات الهندسة اعتماداً على معدل المباحث الأساسية.",

    noteConditions:
      "تتطلب بعض التخصصات مقابلات أو امتحانات قدرات أو اختبارات لياقة بدنية أو تقارير صحية، أو توافق تخصص الفرع الصناعي مع البرنامج الجامعي.",

    noteForeignOne:
      "تنشر الجامعة قواعد معادلة لهذا النوع من الشهادات، لكنها لا تنشر حداً رقمياً منفصلاً لكل تخصص.",

    noteForeignTwo:
      "النتائج المدرجة تحت «تحتاج إلى مراجعة رسمية» هي توصيات أولية وليست تأكيداً للقبول.",

    noteForeignThree: (year) =>
      `العام المرجعي لقواعد المعادلة: ${year}.`,

    noteTuition:
      "قيم الرسوم هي أسعار تبدأ من المبلغ المذكور، وبعضها بعد منحة؛ وتعتمد الرسوم النهائية على احتساب الجامعة الرسمي.",

    noteFinal:
      "يجب تأكيد الأهلية النهائية ومعادلة الشهادة مع عمادة القبول والتسجيل في الجامعة العربية الأمريكية.",
  },
};

function detectReportLanguage(args) {
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

function t(language) {
  return REPORT_TEXT[language] ?? REPORT_TEXT.en;
}

function parseIsoDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatDate(value, language) {
  const date = parseIsoDate(value);

  if (!date) {
    return value || t(language).notSpecified;
  }

  return new Intl.DateTimeFormat(
    language === "ar" ? "ar-PS" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }
  ).format(date);
}

function officialSourceList(admissionSystems) {
  return Object.values(
    admissionSystems?.officialSources ?? {}
  ).filter(
    (source) =>
      typeof source === "string" && source
  );
}

function assessDatasetFreshness(
  admissionSystems,
  now = new Date()
) {
  const reasons = [];

  const lastVerified = parseIsoDate(
    admissionSystems?.lastVerifiedOn
  );

  const applicationsClose = parseIsoDate(
    admissionSystems?.applicationCycle
      ?.applicationsClose
  );

  const currentDate = new Date(now);

  if (Number.isNaN(currentDate.getTime())) {
    reasons.push("invalid-current-date");
  } else {
    currentDate.setUTCHours(0, 0, 0, 0);
  }

  if (!lastVerified) {
    reasons.push("missing-verification-date");
  } else if (
    !Number.isNaN(currentDate.getTime()) &&
    (currentDate - lastVerified) / DAY_IN_MS >
      DATA_MAX_AGE_DAYS
  ) {
    reasons.push("verification-too-old");
  }

  if (!applicationsClose) {
    reasons.push(
      "missing-application-close-date"
    );
  } else if (
    !Number.isNaN(currentDate.getTime()) &&
    currentDate > applicationsClose
  ) {
    reasons.push("application-cycle-ended");
  }

  return {
    isCurrent: reasons.length === 0,
    reasons,
  };
}

function freshnessReasonLabel(
  reason,
  language
) {
  const labels = {
    en: {
      "invalid-current-date":
        "the server could not determine the current date",

      "missing-verification-date":
        "the dataset has no verification date",

      "verification-too-old":
        `the dataset was last verified more than ${DATA_MAX_AGE_DAYS} days ago`,

      "missing-application-close-date":
        "the application closing date is missing",

      "application-cycle-ended":
        "the recorded application cycle has ended",
    },

    ar: {
      "invalid-current-date":
        "تعذر على الخادم تحديد التاريخ الحالي",

      "missing-verification-date":
        "لا تحتوي مجموعة البيانات على تاريخ تحقق",

      "verification-too-old":
        `مرّ أكثر من ${DATA_MAX_AGE_DAYS} يوماً على آخر تحقق من البيانات`,

      "missing-application-close-date":
        "تاريخ انتهاء التقديم غير موجود",

      "application-cycle-ended":
        "انتهت دورة التقديم المسجلة",
    },
  };

  return labels[language]?.[reason] ?? reason;
}

function buildStaleDataReport(
  admissionSystems,
  language,
  freshness
) {
  const text = t(language);

  const cycle =
    admissionSystems?.applicationCycle ?? {};

  const sources =
    officialSourceList(admissionSystems);

  const reasonText = freshness.reasons
    .map((reason) =>
      freshnessReasonLabel(reason, language)
    )
    .join(language === "ar" ? "؛ " : "; ");

  const sourceText = sources.length
    ? text.noteOfficialSources(
        sources.join(" | ")
      )
    : "";

  return `${text.staleDataTitle}

${text.staleDataMessage}

${text.staleDataReasons}: ${reasonText}.
${text.noteLastVerified(
  formatDate(
    admissionSystems?.lastVerifiedOn,
    language
  )
)}
${text.noteApplicationWindow(
  formatDate(
    cycle.applicationsOpen,
    language
  ),
  formatDate(
    cycle.applicationsClose,
    language
  ),
  formatDate(
    cycle.classesBegin,
    language
  )
)}
${sourceText}

${text.staleDataNextStep}

${text.disclaimer}`.trim();
}

function systemLabel(system, language) {
  return (
    SYSTEM_LABELS[language]?.[system] ??
    SYSTEM_LABELS.en[system] ??
    system
  );
}

function branchLabel(branch, language) {
  if (!branch) {
    return t(language).notProvided;
  }

  return (
    BRANCH_LABELS[language]?.[branch] ??
    BRANCH_LABELS.en[branch] ??
    branch
  );
}

function campusLabel(campus, language) {
  return (
    CAMPUS_LABELS[language]?.[campus] ??
    campus
  );
}

function campusMatches(
  majorCampus,
  campusPreference
) {
  const preference =
    normalizeText(campusPreference);

  if (
    !preference ||
    [
      "either",
      "any",
      "both",
      "either campus",
      "no preference",
      "لا يهم",
      "كلاهما",
      "اي حرم جامعي",
      "أي حرم جامعي",
    ].includes(preference)
  ) {
    return true;
  }

  const aliases = {
    Jenin: [
      "jenin",
      "جنين",
    ],

    Ramallah: [
      "ramallah",
      "ram Allah",
      "رام الله",
      "رامالله",
    ],
  };

  return (
    aliases[majorCampus] ?? [majorCampus]
  ).some((alias) =>
    preference.includes(
      normalizeText(alias)
    )
  );
}

function isAllBranchesMajor(major) {
  if (
    major.eligibleBranchesMode === "all"
  ) {
    return true;
  }

  return (
    major.eligibleBranches ?? []
  ).some((branch) => {
    const normalized =
      normalizeText(branch);

    return (
      normalized === "all" ||
      normalized === "all branches" ||
      normalized.includes("كافة")
    );
  });
}

function branchMatches(
  major,
  detectedBranch,
  certificateSystem
) {
  if (isAllBranchesMajor(major)) {
    return true;
  }

  if (!detectedBranch) {
    return null;
  }

  const eligible = new Set(
    (major.eligibleBranches ?? []).map(
      normalizeText
    )
  );

  if (
    certificateSystem === "Tawjihi"
  ) {
    return eligible.has(
      normalizeText(detectedBranch)
    );
  }

  if (
    detectedBranch === "Scientific"
  ) {
    return true;
  }

  if (
    detectedBranch === "Literary"
  ) {
    return (
      eligible.has(
        normalizeText("Literary")
      ) ||
      eligible.has(
        normalizeText("Sharia")
      )
    );
  }

  return eligible.has(
    normalizeText(detectedBranch)
  );
}

function getTawjihiMinimum(
  major,
  detectedBranch
) {
  const byBranch =
    major.minimumAverageTawjihiByBranch;

  if (
    byBranch &&
    detectedBranch &&
    Number.isFinite(
      byBranch[detectedBranch]
    )
  ) {
    return byBranch[detectedBranch];
  }

  return Number.isFinite(
    major.minimumAverageTawjihi
  )
    ? major.minimumAverageTawjihi
    : null;
}

function getPublishedMinimum(
  major,
  certificateSystem,
  detectedBranch
) {
  if (
    certificateSystem === "Tawjihi"
  ) {
    return getTawjihiMinimum(
      major,
      detectedBranch
    );
  }

  if (
    certificateSystem === "Bagrut"
  ) {
    return Number.isFinite(
      major.minimumAverageBagrut
    )
      ? major.minimumAverageBagrut
      : null;
  }

  return null;
}

function getAlternativeTawjihiRoute(
  major,
  detectedBranch
) {
  const requirement =
    major.alternativeTawjihiRequirement;

  if (!requirement) {
    return null;
  }

  if (
    Number.isFinite(
      requirement
        .alternativeMinimumOverallAverage
    )
  ) {
    return requirement;
  }

  const branchRequirement =
    requirement[detectedBranch];

  if (
    branchRequirement &&
    Number.isFinite(
      branchRequirement
        .alternativeMinimumOverallAverage
    )
  ) {
    return branchRequirement;
  }

  return null;
}

function formatCoreSubjects(
  route,
  language
) {
  const subjects =
    language === "ar"
      ? route.coreSubjectsArabicWebsite ??
        route.coreSubjects ??
        route.coreSubjectsEnglishWebsite ??
        []
      : route.coreSubjectsEnglishWebsite ??
        route.coreSubjects ??
        route.coreSubjectsArabicWebsite ??
        [];

  if (!subjects.length) {
    return t(
      language
    ).publishedCoreSubjects;
  }

  if (language === "ar") {
    return subjects
      .map(
        (subject) =>
          SUBJECT_LABELS_AR[subject] ??
          subject
      )
      .join("، ");
  }

  return subjects.join(", ");
}

function evaluateAverage({
  major,
  certificateSystem,
  detectedBranch,
  averageNumber,
  coreSubjectAverageNumber,
  language,
}) {
  const text = t(language);

  const requiredMinimum =
    getPublishedMinimum(
      major,
      certificateSystem,
      detectedBranch
    );

  if (
    isForeignCertificateSystem(
      certificateSystem
    )
  ) {
    return {
      status: "review",
      requiredMinimum: null,
      requirementText:
        text.foreignReviewRequirement,
      reason:
        text.foreignReviewReason,
    };
  }

  if (requiredMinimum === null) {
    return {
      status: "review",
      requiredMinimum: null,
      requirementText:
        text.missingMinimum,
      reason:
        text.missingMinimumReason,
    };
  }

  if (
    averageNumber >= requiredMinimum
  ) {
    return {
      status: "eligible",
      requiredMinimum,

      requirementText:
        certificateSystem === "Tawjihi"
          ? text.tawjihiMinimum(
              requiredMinimum
            )
          : text.bagrutMinimum(
              requiredMinimum
            ),

      reason: text.meetsMinimum(
        systemLabel(
          certificateSystem,
          language
        ),
        requiredMinimum
      ),
    };
  }

  if (
    certificateSystem === "Tawjihi"
  ) {
    const alternative =
      getAlternativeTawjihiRoute(
        major,
        detectedBranch
      );

    if (
      alternative &&
      averageNumber >=
        alternative
          .alternativeMinimumOverallAverage
    ) {
      const requiredCoreAverage =
        alternative
          .alternativeMinimumCoreSubjectAverage;

      const subjects =
        formatCoreSubjects(
          alternative,
          language
        );

      if (
        coreSubjectAverageNumber === null
      ) {
        return {
          status: "review",
          requiredMinimum,

          requirementText:
            text.standardAlternative(
              requiredMinimum,
              alternative
                .alternativeMinimumOverallAverage,
              requiredCoreAverage,
              subjects
            ),

          reason:
            text.missingCoreReason,
        };
      }

      if (
        coreSubjectAverageNumber >=
        requiredCoreAverage
      ) {
        return {
          status: "eligible",
          requiredMinimum,
          usedAlternativeRoute: true,

          requirementText:
            text.alternativeRoute(
              alternative
                .alternativeMinimumOverallAverage,
              requiredCoreAverage,
              subjects
            ),

          reason:
            text.meetsAlternative,
        };
      }

      return {
        status: "notEligible",
        requiredMinimum,

        requirementText:
          text.alternativeCoreRequired(
            requiredCoreAverage,
            subjects
          ),

        reason: text.coreBelow(
          coreSubjectAverageNumber,
          requiredCoreAverage
        ),
      };
    }
  }

  return {
    status: "notEligible",
    requiredMinimum,

    requirementText:
      certificateSystem === "Tawjihi"
        ? text.tawjihiMinimum(
            requiredMinimum
          )
        : text.bagrutMinimum(
            requiredMinimum
          ),

    reason: text.belowMinimum(
      requiredMinimum,
      averageNumber
    ),
  };
}

function evaluateMajor({
  major,
  certificateSystem,
  detectedBranch,
  averageNumber,
  coreSubjectAverageNumber,
  campusPreference,
  equivalencyConfirmed,
  language,
}) {
  const text = t(language);

  const campusOk = campusMatches(
    major.campus,
    campusPreference
  );

  if (!campusOk) {
    return {
      status: "notEligible",

      requiredMinimum:
        getPublishedMinimum(
          major,
          certificateSystem,
          detectedBranch
        ),

      reasons: [
        text.campusMismatch(
          campusPreference
        ),
      ],

      warnings: [],
    };
  }

  const branchOk = branchMatches(
    major,
    detectedBranch,
    certificateSystem
  );

  if (branchOk === false) {
    return {
      status: "notEligible",

      requiredMinimum:
        getPublishedMinimum(
          major,
          certificateSystem,
          detectedBranch
        ),

      reasons: [
        text.branchMismatch,
      ],

      warnings: [],
    };
  }

  const averageEvaluation =
    evaluateAverage({
      major,
      certificateSystem,
      detectedBranch,
      averageNumber,
      coreSubjectAverageNumber,
      language,
    });

  const reasons = [
    averageEvaluation.reason,
  ];

  const warnings = [];

  if (branchOk === null) {
    warnings.push(
      text.branchReview
    );
  }

  if (
    isForeignCertificateSystem(
      certificateSystem
    ) &&
    equivalencyConfirmed !== true
  ) {
    warnings.push(
      text.equivalencyWarning
    );
  }

  if (
    averageEvaluation.status ===
    "notEligible"
  ) {
    return {
      ...averageEvaluation,
      status: "notEligible",
      reasons,
      warnings,
    };
  }

  if (
    averageEvaluation.status ===
      "review" ||
    branchOk === null
  ) {
    return {
      ...averageEvaluation,
      status: "review",
      reasons,
      warnings,
    };
  }

  return {
    ...averageEvaluation,
    status: "eligible",
    reasons,
    warnings,
  };
}

function calculateFitScore(
  major,
  interests,
  careerGoals,
  budgetNumber,
  language
) {
  const text = t(language);

  const searchText = normalizeText(
    `${interests ?? ""} ${
      careerGoals ?? ""
    }`
  );

  const reasons = [];
  let score = 0;

  for (
    const keyword of
    major.keywords ?? []
  ) {
    const normalizedKeyword =
      normalizeText(keyword);

    if (
      normalizedKeyword &&
      searchText.includes(
        normalizedKeyword
      )
    ) {
      score += 2;

      reasons.push(
        text.keywordMatch(keyword)
      );
    }
  }

  const programText = normalizeText(
    [
      major.programEnglish,
      major.programArabic,
      major.collegeEnglish,
      major.collegeArabic,
      ...(major.programTracks ?? []),
    ].join(" ")
  );

  const overlappingTerms = [
    ...new Set(
      searchText
        .split(" ")
        .filter(
          (term) =>
            term.length >= 3
        )
        .filter((term) =>
          programText.includes(term)
        )
    ),
  ];

  if (
    overlappingTerms.length > 0
  ) {
    score += Math.min(
      3,
      overlappingTerms.length
    );

    reasons.push(
      text.titleOverlap
    );
  }

  /*
   * Budget is displayed as helpful
   * information, but it does not
   * increase the ranking score.
   */
  if (
    budgetNumber !== null &&
    Number.isFinite(
      major.tuitionPerHourNIS
    ) &&
    major.tuitionPerHourNIS <=
      budgetNumber
  ) {
    reasons.push(
      text.budgetFits(
        budgetNumber
      )
    );
  }

  if (score === 0) {
    reasons.unshift(
      searchText
        ? text.generalFit
        : text.academicOnlyFit
    );
  }

  return {
    score,
    reasons: [
      ...new Set(reasons),
    ],
  };
}

function cleanSpecialNotes(
  major,
  language
) {
  const notes = [
    ...(
      major.otherAdmissionRequirements ??
      []
    ),
    ...(major.specialNotes ?? []),
  ].filter((note) => {
    const normalized =
      normalizeText(note);

    return !GENERIC_NOTE_PARTS.some(
      (part) =>
        normalized.includes(part)
    );
  });

  if (language !== "ar") {
    return notes;
  }

  /*
   * Preserve the exact English note
   * when an Arabic translation has
   * not yet been added.
   */
  return [
    ...new Set(
      notes.map(
        (note) =>
          NOTE_TRANSLATIONS_AR[note] ??
          `شرط إضافي منشور بالنص الإنجليزي: ${note}`
      )
    ),
  ];
}

function formatTuition(
  major,
  language
) {
  const text = t(language);

  const scholarshipText =
    major.tuitionAfterScholarship
      ? ` ${text.afterScholarship}`
      : "";

  const currency =
    language === "ar"
      ? "شيكل"
      : "NIS";

  return `${major.tuitionPerHourNIS} ${currency}${scholarshipText}`;
}

function programName(
  major,
  language
) {
  return language === "ar"
    ? `${major.programArabic} / ${major.programEnglish}`
    : `${major.programEnglish} / ${major.programArabic}`;
}

function collegeName(
  major,
  language
) {
  return language === "ar"
    ? major.collegeArabic
    : major.collegeEnglish;
}

function formatMajor(
  major,
  index,
  budgetNumber,
  statusLabel,
  language
) {
  const text = t(language);

  const tuition =
    formatTuition(
      major,
      language
    );

  const budgetNote =
    budgetNumber !== null &&
    major.tuitionPerHourNIS >
      budgetNumber
      ? `\n   ${
          text.budgetNote
        }: ${text.tuitionAboveBudget(
          tuition,
          budgetNumber
        )}.`
      : "";

  const tracks =
    major.programTracks?.length
      ? `\n   ${
          text.tracks
        }: ${major.programTracks.join(
          language === "ar"
            ? "، "
            : ", "
        )}`
      : "";

  const conditions =
    cleanSpecialNotes(
      major,
      language
    );

  const conditionsText =
    conditions.length
      ? `\n   ${
          text.conditions
        }: ${conditions.join(
          language === "ar"
            ? "؛ "
            : "; "
        )}`
      : "";

  const warningsText =
    major.eligibility.warnings.length
      ? `\n   ${
          text.reviewNotes
        }: ${major.eligibility.warnings.join(
          language === "ar"
            ? "؛ "
            : "; "
        )}`
      : "";

  return `${index}. ${programName(
    major,
    language
  )}
   ${text.status}: ${statusLabel}
   ${text.campusLabel}: ${campusLabel(
     major.campus,
     language
   )}
   ${text.college}: ${collegeName(
     major,
     language
   )}
   ${text.requirement}: ${
     major.eligibility.requirementText
   }
   ${text.tuition}: ${tuition}
   ${text.whyFit}: ${major.fitReasons.join(
     language === "ar"
       ? "؛ "
       : "; "
   )}.${tracks}${conditionsText}${warningsText}${budgetNote}`;
}

function formatCloseOption(
  major,
  index,
  language
) {
  const text = t(language);

  return `${index}. ${programName(
    major,
    language
  )}
   ${text.campusLabel}: ${campusLabel(
     major.campus,
     language
   )}
   ${text.requirementIssue}: ${
     major.eligibility.reasons.join(
       language === "ar"
         ? "؛ "
         : "; "
     )
   }`;
}

function explainInvalidSystem(
  value,
  language
) {
  const text = t(language);

  const systems = Object.values(
    SYSTEM_LABELS[language]
  ).map(
    (label) => `- ${label}`
  );

  return `${text.title}

${text.invalidSystemTitle}: "${
    value ?? ""
  }".

${text.supportedSystems}:
${systems.join("\n")}

${text.foreignAverageHelp}

${text.disclaimer}`;
}

function explainInvalidBranch(
  value,
  language
) {
  const text = t(language);

  const branches =
    TAWJIHI_BRANCHES.map(
      (branch) =>
        `- ${branchLabel(
          branch,
          language
        )}`
    );

  return `${text.title}

${text.invalidBranchTitle}: "${
    value ?? ""
  }".

${text.supportedBranches}:
${branches.join("\n")}

${text.branchHelp}

${text.disclaimer}`;
}

function explainInvalidAverage(
  average,
  language,
  outOfRange = false
) {
  const text = t(language);

  const explanation =
    outOfRange
      ? text.invalidAverageRange
      : text.averageHelp;

  return `${text.title}

${text.invalidAverageTitle}: "${
    average ?? ""
  }".

${explanation}

${text.disclaimer}`;
}

function resolveCertificateSystem(
  args
) {
  const directSystem =
    detectCertificateSystem(
      args.certificateSystem
    ) ||
    detectCertificateSystem(
      args.certificateType
    );

  if (directSystem) {
    return directSystem;
  }

  if (
    detectBranch(
      args.certificateType
    )
  ) {
    return "Tawjihi";
  }

  return null;
}

export function createReport(
  args = {},
  now = new Date()
) {
  const language =
    detectReportLanguage(args);

  const text = t(language);
  const majors = loadMajors();

  const admissionSystems =
    loadAdmissionSystems();

  const freshness =
    assessDatasetFreshness(
      admissionSystems,
      now
    );

  /*
   * Stop eligibility matching when
   * the admissions information is
   * expired or too old.
   */
  if (!freshness.isCurrent) {
    return buildStaleDataReport(
      admissionSystems,
      language,
      freshness
    );
  }

  const certificateSystem =
    resolveCertificateSystem(args);

  if (!certificateSystem) {
    return explainInvalidSystem(
      args.certificateSystem ??
        args.certificateType,
      language
    );
  }

  const rawBranch =
    args.certificateBranch ??
    args.bagrutClassification ??
    args.certificateType;

  const detectedBranch =
    detectBranch(rawBranch);

  if (
    certificateSystem ===
      "Tawjihi" &&
    !detectedBranch
  ) {
    return explainInvalidBranch(
      rawBranch,
      language
    );
  }

  const averageNumber =
    parseNumber(args.average);

  if (averageNumber === null) {
    return explainInvalidAverage(
      args.average,
      language
    );
  }

  if (
    averageNumber < 0 ||
    averageNumber > 100
  ) {
    return explainInvalidAverage(
      args.average,
      language,
      true
    );
  }

  const parsedCoreSubjectAverage =
    parseNumber(
      args.coreSubjectAverage
    );

  const coreSubjectAverageNumber =
    parsedCoreSubjectAverage !==
      null &&
    parsedCoreSubjectAverage >= 0 &&
    parsedCoreSubjectAverage <= 100
      ? parsedCoreSubjectAverage
      : null;

  const parsedBudget =
    parseNumber(args.budget);

  const budgetNumber =
    parsedBudget !== null &&
    parsedBudget >= 0
      ? parsedBudget
      : null;

  const resultLimit =
    clampInteger(
      args.maxResults,
      1,
      10,
      5
    );

  const equivalencyConfirmed =
    parseBoolean(
      args.equivalencyConfirmed
    );

  const hasPersonalFitInput =
    Boolean(
      normalizeText(
        `${args.interests ?? ""} ${
          args.careerGoals ?? ""
        }`
      )
    );

  const eligible = [];
  const reviewRequired = [];
  const notEligible = [];

  for (const major of majors) {
    const eligibility =
      evaluateMajor({
        major,
        certificateSystem,
        detectedBranch,
        averageNumber,
        coreSubjectAverageNumber,
        campusPreference:
          args.campusPreference,
        equivalencyConfirmed,
        language,
      });

    const fit =
      calculateFitScore(
        major,
        args.interests,
        args.careerGoals,
        budgetNumber,
        language
      );

    const result = {
      ...major,
      eligibility,
      fitScore: fit.score,
      fitReasons: fit.reasons,
    };

    if (
      eligibility.status ===
      "eligible"
    ) {
      eligible.push(result);
    } else if (
      eligibility.status ===
      "review"
    ) {
      reviewRequired.push(result);
    } else {
      notEligible.push(result);
    }
  }

  const sortAlphabetically = (
    a,
    b
  ) =>
    a.programEnglish.localeCompare(
      b.programEnglish
    );

  /*
   * Only rank programs by fit when
   * the student supplied interests
   * or career goals.
   *
   * Tuition is never used as a
   * hidden ranking tie-breaker.
   */
  const sortMatches =
    hasPersonalFitInput
      ? (a, b) =>
          b.fitScore -
            a.fitScore ||
          sortAlphabetically(a, b)
      : sortAlphabetically;

  eligible.sort(sortMatches);
  reviewRequired.sort(sortMatches);

  const eligibleSection =
    eligible.length
      ? eligible
          .slice(0, resultLimit)
          .map((major, index) =>
            formatMajor(
              major,
              index + 1,
              budgetNumber,
              text.eligibleStatus,
              language
            )
          )
          .join("\n\n")
      : text.noEligible;

  const reviewSection =
    reviewRequired.length
      ? reviewRequired
          .slice(0, resultLimit)
          .map((major, index) =>
            formatMajor(
              major,
              index + 1,
              budgetNumber,
              text.reviewStatus,
              language
            )
          )
          .join("\n\n")
      : text.noReview;

  const closeOptions =
    notEligible
      .filter((major) => {
        const required =
          major.eligibility
            .requiredMinimum;

        if (
          !Number.isFinite(required)
        ) {
          return false;
        }

        const gap =
          required -
          averageNumber;

        return (
          campusMatches(
            major.campus,
            args.campusPreference
          ) &&
          branchMatches(
            major,
            detectedBranch,
            certificateSystem
          ) !== false &&
          gap > 0 &&
          gap <= 10
        );
      })
      .sort((a, b) => {
        const gapA =
          a.eligibility
            .requiredMinimum -
          averageNumber;

        const gapB =
          b.eligibility
            .requiredMinimum -
          averageNumber;

        return (
          gapA - gapB ||
          sortMatches(a, b)
        );
      })
      .slice(0, 3);

  const closeOptionsSection =
    closeOptions.length
      ? closeOptions
          .map((major, index) =>
            formatCloseOption(
              major,
              index + 1,
              language
            )
          )
          .join("\n\n")
      : text.noClose;

  const averageLabel =
    isForeignCertificateSystem(
      certificateSystem
    )
      ? text.equivalentAverage
      : text.average;

  const equivalencyLabel =
    equivalencyConfirmed === null
      ? text.notSpecified
      : equivalencyConfirmed
        ? text.yes
        : text.no;

  const preferredCampus =
    args.campusPreference &&
    normalizeText(
      args.campusPreference
    ) !== "either"
      ? campusLabel(
          args.campusPreference,
          language
        )
      : CAMPUS_LABELS[language]
          .Either;

  const foreignNotes =
    isForeignCertificateSystem(
      certificateSystem
    )
      ? [
          text.noteForeignOne,
          text.noteForeignTwo,
          text.noteForeignThree(
            admissionSystems
              .academicYear
          ),
        ]
      : [];

  const cycle =
    admissionSystems
      .applicationCycle ?? {};

  const sources =
    officialSourceList(
      admissionSystems
    );

  const eligibleHeading =
    hasPersonalFitInput
      ? text.eligibleHeading
      : text.eligibleHeadingUnranked;

  const notes = [
    text.noteDataset(
      majors.length,
      admissionSystems.academicYear
    ),

    text.noteLastVerified(
      formatDate(
        admissionSystems
          .lastVerifiedOn,
        language
      )
    ),

    text.noteApplicationWindow(
      formatDate(
        cycle.applicationsOpen,
        language
      ),
      formatDate(
        cycle.applicationsClose,
        language
      ),
      formatDate(
        cycle.classesBegin,
        language
      )
    ),

    ...(sources.length
      ? [
          text.noteOfficialSources(
            sources.join(" | ")
          ),
        ]
      : []),

    hasPersonalFitInput
      ? text.noteRankingPersonalized
      : text.noteRankingUnranked,

    text.noteEligibility,
    text.noteAlternatives,
    text.noteConditions,
    ...foreignNotes,
    text.noteTuition,
    text.noteFinal,
  ];

  return `${text.title}

${text.profile}:
- ${text.certificateSystem}: ${systemLabel(
    certificateSystem,
    language
  )}
- ${text.branch}: ${branchLabel(
    detectedBranch,
    language
  )}
- ${averageLabel}: ${averageNumber}%
- ${text.coreAverage}: ${
    coreSubjectAverageNumber === null
      ? text.notProvided
      : `${coreSubjectAverageNumber}%`
  }
- ${text.equivalencyConfirmed}: ${equivalencyLabel}
- ${text.campus}: ${preferredCampus}
- ${text.interests}: ${
    args.interests ||
    text.notProvided
  }
- ${text.careerGoals}: ${
    args.careerGoals ||
    text.notProvided
  }
- ${text.budget}: ${
    args.budget ||
    text.notProvided
  }

${eligibleHeading}:
${eligibleSection}

${text.reviewHeading}:
${reviewSection}

${text.closeHeading}:
${closeOptionsSection}

${text.notesHeading}:
${notes
  .map(
    (note) => `- ${note}`
  )
  .join("\n")}`.trim();
}