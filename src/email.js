import { Resend } from "resend";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REPORT_LENGTH = 100_000;

const EMAIL_TEXT = {
  en: {
    heading: "Your AAUP Major Match Report",
    subject: "Your AAUP Major Match Report — 2026/2027",
    disclaimer:
      "This advising report provides an initial match only. It does not guarantee admission and does not replace an official decision from the AAUP Deanship of Admission and Registration.",
    invalidEmail: "Please enter a valid email address.",
    noReport: "No report was provided to send.",
    reportTooLong: "The report is too long to send by email.",
    missingKey:
      "Email is not configured. Missing RESEND_API_KEY.",
    serviceError:
      "The email service returned an error while sending the report.",
    generalError:
      "Something went wrong while sending the email.",
    success: (email) => `Report email sent to ${email}.`,
  },
  ar: {
    heading:
      "تقرير اختيار التخصص في الجامعة العربية الأمريكية",
    subject:
      "تقرير اختيار التخصص في الجامعة العربية الأمريكية — 2026/2027",
    disclaimer:
      "يوفر هذا التقرير مطابقة أولية فقط، ولا يضمن القبول ولا يحل محل القرار الرسمي الصادر عن عمادة القبول والتسجيل في الجامعة العربية الأمريكية.",
    invalidEmail:
      "يرجى إدخال عنوان بريد إلكتروني صحيح.",
    noReport: "لم يتم توفير تقرير لإرساله.",
    reportTooLong:
      "التقرير طويل جداً ولا يمكن إرساله عبر البريد الإلكتروني.",
    missingKey:
      "خدمة البريد الإلكتروني غير مهيأة. مفتاح RESEND_API_KEY غير موجود.",
    serviceError:
      "أعادت خدمة البريد الإلكتروني خطأ أثناء إرسال التقرير.",
    generalError:
      "حدث خطأ أثناء إرسال البريد الإلكتروني.",
    success: (email) =>
      `تم إرسال التقرير إلى ${email}.`,
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function reportToHtml(report, language) {
  const text = EMAIL_TEXT[language] ?? EMAIL_TEXT.en;
  const direction = language === "ar" ? "rtl" : "ltr";
  const alignment = language === "ar" ? "right" : "left";

  return `
    <div dir="${direction}" lang="${language}" style="font-family: Arial, sans-serif; line-height: 1.65; color: #1f2937; text-align: ${alignment};">
      <h2 style="margin-bottom: 12px;">${escapeHtml(
        text.heading
      )}</h2>

      <div style="white-space: pre-wrap; font-family: Arial, sans-serif; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">${escapeHtml(
        report
      )}</div>

      <hr style="margin: 22px 0; border: 0; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 13px; color: #666;">
        ${escapeHtml(text.disclaimer)}
      </p>
    </div>
  `;
}

export async function sendMajorMatchEmail({
  email,
  report,
  language = "en",
}) {
  const selectedLanguage =
    language === "ar" ? "ar" : "en";
  const text = EMAIL_TEXT[selectedLanguage];
  const cleanEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  const cleanReport = String(report ?? "").trim();

  if (
    cleanEmail.length > 254 ||
    !EMAIL_PATTERN.test(cleanEmail)
  ) {
    return {
      success: false,
      message: text.invalidEmail,
    };
  }

  if (!cleanReport) {
    return {
      success: false,
      message: text.noReport,
    };
  }

  if (cleanReport.length > MAX_REPORT_LENGTH) {
    return {
      success: false,
      message: text.reportTooLong,
    };
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      message: text.missingKey,
    };
  }

  const resend = new Resend(
    process.env.RESEND_API_KEY
  );

  const fromAddress =
    process.env.EMAIL_FROM ||
    "AAUP Major Match <onboarding@resend.dev>";

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [cleanEmail],
      subject: text.subject,
      html: reportToHtml(
        cleanReport,
        selectedLanguage
      ),
      text: cleanReport,
    });

    if (error) {
      console.error("Resend returned an error", {
        name: error.name,
        message: error.message,
      });

      return {
        success: false,
        message: text.serviceError,
      };
    }

    return {
      success: true,
      message: text.success(cleanEmail),
      emailId: data?.id ?? null,
    };
  } catch (error) {
    console.error("Email send failed", {
      name: error?.name,
      message: error?.message,
    });

    return {
      success: false,
      message: text.generalError,
    };
  }
}