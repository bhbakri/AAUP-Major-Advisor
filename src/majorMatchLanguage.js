const ARABIC_TEXT_PATTERN = /[\u0600-\u06ff]/;

export const FORM_TRANSLATIONS = {
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
    create: "Ask advisor",
    creating: "Consulting the advisor...",
    resultTitle: "Advisor recommendations",
    invalidAverage: "Enter an average between 0 and 100.",
    reportError:
      "The advisor could not create recommendations right now. Please try again.",
    noReportReturned: "No recommendations were returned.",
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
    equivalencyConfirmed: "هذا المعدل هو معدل معادل رسمي.",
    create: "اسأل المستشار",
    creating: "جارٍ استشارة المستشار...",
    resultTitle: "توصيات المستشار",
    invalidAverage: "أدخل معدلاً بين 0 و100.",
    reportError:
      "تعذر على المستشار إعداد التوصيات حالياً. يرجى المحاولة مرة أخرى.",
    noReportReturned: "لم يتم إرجاع توصيات.",
  },
};

export function resolveToolLanguage(args = {}) {
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
